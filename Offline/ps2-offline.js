// Pixel Streaming 离线(内网/国内无VPN)启动器与健康检查工具
//
// 支持两种目录布局:
//   1. 官方 PixelStreamingInfrastructure 根目录布局 (SignallingWebServer/ 在仓库根目录)
//   2. 打包目录 Samples/PixelStreaming2 或 Samples/PixelStreaming 布局 (WebServers/SignallingWebServer/)
//
// 支持多版本 Unreal Engine:
//   - UE 5.5 / 5.6 / 5.7 / 5.8 / master (Wilbur 架构: SignallingWebServer/dist/index.js + www/)
//   - UE 5.3 / 5.4 (Cirrus 架构: SignallingWebServer/cirrus.js + Public/)
//
// 子命令:
//   start        启动信令服务器, 并按 PixelStreaming.ini 顺带启动打包好的 UE 程序
//   server       只启动信令服务器
//   stop         停止本机由这些脚本启动的信令服务器 / TURN / UE 程序
//   check        自检: 运行时文件、离线合规(无外链字体)、网卡地址、端口占用、/api/status、UE 程序位置
//   healthcheck  UE 规范端到端健康检查: 静态检查 + 启动信令服务器并验证 REST API (/api/status) 与网页响应
//   firewall     添加 Windows 防火墙入站放行规则(需要管理员)
//
// 整个启动过程不访问外网: 不查询公网 IP、不下载、不编译、不连公网 STUN/TURN。
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const net = require('net');
const http = require('http');
const crypto = require('crypto');
const { spawn, spawnSync } = require('child_process');

const IS_WIN = process.platform === 'win32';
const OFFLINE_DIR = __dirname;
const ROOT = path.dirname(OFFLINE_DIR);

// 自动识别根目录布局 vs WebServers/ 子目录布局
function resolveInfraDir(rootDir) {
    if (fs.existsSync(path.join(rootDir, 'SignallingWebServer'))) {
        return rootDir;
    }
    const nested = path.join(rootDir, 'WebServers');
    if (fs.existsSync(path.join(nested, 'SignallingWebServer'))) {
        return nested;
    }
    return rootDir;
}

const INFRA_DIR = resolveInfraDir(ROOT);
const SWS_DIR = path.join(INFRA_DIR, 'SignallingWebServer');

// 自动识别 Wilbur (UE 5.5+) 与 Cirrus (UE 5.3/5.4)
function detectServerProfile(swsDir, infraDir) {
    const wilburDist = path.join(swsDir, 'dist', 'index.js');
    const wilburSrc = path.join(swsDir, 'src', 'index.ts');
    const cirrusJs = path.join(swsDir, 'cirrus.js');
    let pkgName = '';
    let pkgVersion = 'unknown';
    let ueVersion = 'unknown';

    const swsPkgPath = path.join(swsDir, 'package.json');
    if (fs.existsSync(swsPkgPath)) {
        try {
            const pkg = JSON.parse(fs.readFileSync(swsPkgPath, 'utf8'));
            pkgName = pkg.name || '';
            pkgVersion = pkg.version || 'unknown';
            const deps = Object.keys(pkg.dependencies || {});
            const psDep = deps.find((d) => /^@epicgames-ps\/lib-pixelstreamingsignalling-ue/i.test(d));
            if (psDep) {
                const m = /-(ue\d+\.\d+)$/i.exec(psDep);
                if (m) ueVersion = m[1].toUpperCase();
            }
        } catch {
            // ignore
        }
    }

    if (ueVersion === 'unknown') {
        const dlVerFile = path.join(infraDir, 'DOWNLOAD_VERSION');
        if (fs.existsSync(dlVerFile)) {
            const text = fs.readFileSync(dlVerFile, 'utf8').trim();
            const m = /^(UE\d+\.\d+)/i.exec(text);
            if (m) ueVersion = m[1].toUpperCase();
        }
    }

    const isCirrus =
        !fs.existsSync(wilburDist) &&
        !fs.existsSync(wilburSrc) &&
        pkgName !== '@epicgames-ps/wilbur' &&
        fs.existsSync(cirrusJs);

    if (isCirrus) {
        if (ueVersion === 'unknown') {
            try {
                const src = fs.readFileSync(cirrusJs, 'utf8');
                const m = /Unreal Engine\s+(\d+\.\d+)/i.exec(src);
                if (m) ueVersion = `UE${m[1]}`;
            } catch {
                // ignore
            }
        }
        return {
            kind: 'cirrus',
            ueVersion,
            serverVersion: pkgVersion,
            entryJs: cirrusJs,
            wwwDir: path.join(swsDir, 'Public'),
            apiDocFile: null,
        };
    }

    return {
        kind: 'wilbur',
        ueVersion,
        serverVersion: pkgVersion,
        entryJs: wilburDist,
        wwwDir: path.join(swsDir, 'www'),
        apiDocFile: path.join(swsDir, 'apidoc', 'api-definition-base.yml'),
    };
}

const PROFILE = detectServerProfile(SWS_DIR, INFRA_DIR);
const WILBUR_JS = PROFILE.entryJs;
const WWW_DIR = PROFILE.wwwDir;
const INI_FILE = path.join(ROOT, 'PixelStreaming.ini');
const LOG_DIR = path.join(ROOT, 'Logs');
const STATE_DIR = path.join(OFFLINE_DIR, '.state');
const STATE_FILE = path.join(STATE_DIR, 'running.json');
const STOP_FILE = path.join(STATE_DIR, 'stop.request');
const CIRRUS_CFG_FILE = path.join(STATE_DIR, 'cirrus-config.json');
const TURN_EXE = IS_WIN
    ? path.join(OFFLINE_DIR, 'coturn', 'turnserver.exe')
    : path.join(OFFLINE_DIR, 'coturn', 'bin', 'turnserver');
const HOME_TEMPLATE = path.join(OFFLINE_DIR, 'web', 'index.html');
const HOME_PAGE = path.join(WWW_DIR, 'index.html');
const RUNTIME_INFO = path.join(OFFLINE_DIR, 'runtime-info.json');

// 打包后的布局: <包>/<项目>.exe 与 <包>/<项目>/Samples/PixelStreaming2 (或 Samples/PixelStreaming)
const PROJECT_DIR = path.resolve(ROOT, '..', '..');
const PACKAGE_DIR = path.dirname(PROJECT_DIR);
const PROJECT_NAME = path.basename(PROJECT_DIR);

// Windows 上被 Ctrl+C 结束的进程退出码 (STATUS_CONTROL_C_EXIT)
const EXIT_CTRL_C = 0xc000013a;

class UserError extends Error {}

const paint = (code) => (text) => (process.stdout.isTTY ? `\x1b[${code}m${text}\x1b[0m` : text);
const red = paint('91');
const green = paint('92');
const yellow = paint('93');
const cyan = paint('96');

const log = (text) => console.log(`[像素流] ${text}`);
const warn = (text) => console.log(yellow(`[像素流] ${text}`));
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ---------------------------------------------------------------------------
// 配置
// ---------------------------------------------------------------------------

function readTextAuto(file) {
    const buf = fs.readFileSync(file);
    if (buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) return buf.subarray(3).toString('utf8');
    if (buf[0] === 0xff && buf[1] === 0xfe) return buf.subarray(2).toString('utf16le');
    const utf8 = buf.toString('utf8');
    if (!utf8.includes('\uFFFD')) return utf8;
    try {
        return new TextDecoder('gbk').decode(buf);
    } catch {
        return utf8;
    }
}

function parseIni(text) {
    const values = {};
    let section = '';
    for (const raw of text.split(/\r?\n/)) {
        const line = raw.trim();
        if (!line || line.startsWith(';') || line.startsWith('#')) continue;
        const header = /^\[(.+)\]$/.exec(line);
        if (header) {
            section = header[1].trim().toLowerCase();
            continue;
        }
        const eq = line.indexOf('=');
        if (eq < 0) continue;
        let value = line.slice(eq + 1).trim();
        if (value.length >= 2 && value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        values[`${section}.${line.slice(0, eq).trim().toLowerCase()}`] = value;
    }
    return values;
}

function loadConfig() {
    const ini = fs.existsSync(INI_FILE) ? parseIni(readTextAuto(INI_FILE)) : {};
    const get = (section, key, fallback) => {
        const value = ini[`${section}.${key}`.toLowerCase()];
        return value === undefined || value === '' ? fallback : value;
    };
    const int = (section, key, fallback, min, max) => {
        const text = String(get(section, key, fallback));
        const value = Number(text);
        if (!/^\d+$/.test(text) || value < min || value > max) {
            throw new UserError(`PixelStreaming.ini 的 [${section}] ${key}=${text} 不对, 应为 ${min}-${max} 的整数。`);
        }
        return value;
    };
    const bool = (section, key, fallback) => {
        const text = String(get(section, key, fallback)).toLowerCase();
        if (['1', 'true', 'yes', 'on'].includes(text)) return true;
        if (['0', 'false', 'no', 'off'].includes(text)) return false;
        throw new UserError(`PixelStreaming.ini 的 [${section}] ${key}=${text} 不对, 应为 1 或 0。`);
    };
    const oneOf = (section, key, fallback, choices) => {
        const text = String(get(section, key, fallback)).toLowerCase();
        if (!choices.includes(text)) {
            throw new UserError(`PixelStreaming.ini 的 [${section}] ${key}=${text} 不对, 可选: ${choices.join(' / ')}。`);
        }
        return text;
    };

    const cfg = {
        signallingEnabled: bool('Signalling', 'Enabled', '1'),
        playerPort: int('Signalling', 'PlayerPort', '80', 1, 65535),
        streamerPort: int('Signalling', 'StreamerPort', '8888', 1, 65535),
        hostAddress: get('Signalling', 'HostAddress', ''),
        consoleMessages: oneOf('Signalling', 'ConsoleMessages', 'basic', ['none', 'basic', 'verbose', 'formatted']),
        maxPlayers: int('Signalling', 'MaxPlayers', '0', 0, 1000),
        restApi: bool('Signalling', 'RestApi', '1'),
        launchGame: bool('Game', 'LaunchGame', '1'),
        gameExe: get('Game', 'GameExe', ''),
        signallingAddress: get('Game', 'SignallingAddress', '127.0.0.1'),
        windowMode: oneOf('Game', 'WindowMode', 'normal', ['normal', 'offscreen', 'windowed', 'fullscreen']),
        resX: int('Game', 'ResX', '1920', 0, 16384),
        resY: int('Game', 'ResY', '1080', 0, 16384),
        webrtcMinPort: int('Game', 'WebRTCMinPort', '0', 0, 65535),
        webrtcMaxPort: int('Game', 'WebRTCMaxPort', '0', 0, 65535),
        extraArgs: get('Game', 'ExtraArgs', ''),
        stopGameOnExit: bool('Game', 'StopGameOnExit', '1'),
        turnMode: oneOf('Turn', 'Mode', 'off', ['off', 'local', 'external']),
        turnServer: get('Turn', 'Server', ''),
        turnPort: int('Turn', 'Port', '3478', 1, 65535),
        turnUser: get('Turn', 'User', ''),
        turnPassword: get('Turn', 'Password', ''),
        forceRelay: bool('Turn', 'ForceRelay', '0'),
    };

    if (cfg.playerPort === cfg.streamerPort) {
        throw new UserError('PlayerPort 和 StreamerPort 不能相同。');
    }
    if (cfg.turnMode === 'local' && [cfg.playerPort, cfg.streamerPort].includes(cfg.turnPort)) {
        throw new UserError('[Turn] Port 不能和信令服务器的端口相同。');
    }
    if (Boolean(cfg.webrtcMinPort) !== Boolean(cfg.webrtcMaxPort) || cfg.webrtcMinPort > cfg.webrtcMaxPort) {
        throw new UserError('[Game] WebRTCMinPort / WebRTCMaxPort 要么都留空, 要么都填且 Min <= Max。');
    }
    if (cfg.hostAddress && !net.isIPv4(cfg.hostAddress)) {
        throw new UserError(`[Signalling] HostAddress=${cfg.hostAddress} 不是 IPv4 地址。`);
    }
    if (!/^[A-Za-z0-9.\-]+$/.test(cfg.signallingAddress)) {
        throw new UserError(`[Game] SignallingAddress=${cfg.signallingAddress} 不对, 填信令电脑的 IP, 例如 192.168.1.40。`);
    }
    return cfg;
}

// ---------------------------------------------------------------------------
// 网络与 HTTP 健康探测
// ---------------------------------------------------------------------------

const VIRTUAL_NIC =
    /vEthernet|Hyper-V|VMware|VirtualBox|VBox|Loopback|Pseudo|TAP|TUN|Wintun|WireGuard|ZeroTier|Tailscale|Docker|WSL|Npcap|Bluetooth|Clash|mihomo|Meta|VPN|Teredo|isatap|Radmin|Hamachi|Sangfor|EasyConnect/i;

function ipToInt(ip) {
    return ip.split('.').reduce((acc, octet) => acc * 256 + Number(octet), 0);
}

function inCidr(ip, base, bits) {
    const size = 2 ** (32 - bits);
    return Math.floor(ipToInt(ip) / size) === Math.floor(ipToInt(base) / size);
}

function listIPv4() {
    const found = [];
    const ifaces = os.networkInterfaces();
    for (const name of Object.keys(ifaces)) {
        for (const addr of ifaces[name] || []) {
            if ((addr.family !== 'IPv4' && addr.family !== 4) || addr.internal) continue;
            const ip = addr.address;
            let kind = 'lan';
            if (inCidr(ip, '169.254.0.0', 16)) kind = 'linklocal';
            else if (inCidr(ip, '198.18.0.0', 15) || inCidr(ip, '100.64.0.0', 10) || VIRTUAL_NIC.test(name)) kind = 'virtual';
            else if (!inCidr(ip, '10.0.0.0', 8) && !inCidr(ip, '172.16.0.0', 12) && !inCidr(ip, '192.168.0.0', 16)) kind = 'other';
            found.push({ name, address: ip, kind });
        }
    }
    const rank = { lan: 0, other: 1, virtual: 2, linklocal: 3 };
    return found.sort((a, b) => rank[a.kind] - rank[b.kind]);
}

function pickHost(cfg, addresses) {
    if (cfg.hostAddress) return cfg.hostAddress;
    return addresses.length ? addresses[0].address : '127.0.0.1';
}

function httpUrl(host, port) {
    return port === 80 ? `http://${host}/` : `http://${host}:${port}/`;
}

function probePort(port) {
    return new Promise((resolve) => {
        const server = net.createServer();
        server.once('error', (err) => resolve(err.code || 'ERROR'));
        server.listen(port, () => server.close(() => resolve(null)));
    });
}

function findFreePort(host = '127.0.0.1') {
    return new Promise((resolve, reject) => {
        const server = net.createServer();
        server.once('error', reject);
        server.listen(0, host, () => {
            const addr = server.address();
            const port = addr && typeof addr === 'object' ? addr.port : 0;
            server.close(() => resolve(port));
        });
    });
}

function tcpReachable(port, host = '127.0.0.1', timeoutMs = 800) {
    return new Promise((resolve) => {
        const socket = net.connect({ port, host });
        const done = (ok) => {
            socket.destroy();
            resolve(ok);
        };
        socket.setTimeout(timeoutMs, () => done(false));
        socket.once('connect', () => done(true));
        socket.once('error', () => done(false));
    });
}

function httpGet(port, urlPath, host = '127.0.0.1', timeoutMs = 2500) {
    return new Promise((resolve) => {
        const req = http.get({ host, port, path: urlPath, timeout: timeoutMs }, (res) => {
            const chunks = [];
            res.on('data', (c) => chunks.push(c));
            res.on('end', () => {
                resolve({
                    ok: res.statusCode >= 200 && res.statusCode < 300,
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: Buffer.concat(chunks).toString('utf8'),
                });
            });
        });
        req.on('timeout', () => {
            req.destroy();
            resolve({ ok: false, statusCode: 0, headers: {}, body: '', error: 'timeout' });
        });
        req.on('error', (err) => {
            resolve({ ok: false, statusCode: 0, headers: {}, body: '', error: err.message });
        });
    });
}

async function queryStatusEndpoint(port, host = '127.0.0.1', timeoutMs = 2500) {
    const res = await httpGet(port, '/api/status', host, timeoutMs);
    if (!res.ok) return null;
    try {
        const data = JSON.parse(res.body);
        if (
            data &&
            typeof data.uptime === 'number' &&
            typeof data.streamer_count === 'number' &&
            typeof data.player_count === 'number'
        ) {
            return data;
        }
    } catch {
        // ignore invalid json
    }
    return null;
}

function run(cmd, args, extra = {}) {
    return spawnSync(cmd, args, { encoding: 'utf8', windowsHide: true, ...extra });
}

function imageNameOf(pid) {
    if (!pid) return null;
    if (!IS_WIN) {
        const r = run('ps', ['-p', String(pid), '-o', 'comm=']);
        return r.status === 0 && r.stdout ? r.stdout.trim() : null;
    }
    const r = run('tasklist', ['/FI', `PID eq ${pid}`, '/FO', 'CSV', '/NH']);
    const m = r.stdout && /^"([^"]+)","(\d+)"/m.exec(r.stdout);
    return m && Number(m[2]) === pid ? m[1] : null;
}

function portOwner(port) {
    if (!IS_WIN) return null;
    const r = run('netstat', ['-ano']);
    if (!r.stdout) return null;
    for (const line of r.stdout.split(/\r?\n/)) {
        const cols = line.trim().split(/\s+/);
        if (cols.length < 5 || !/^TCP$/i.test(cols[0])) continue;
        if (!cols[1].endsWith(`:${port}`) || !/:0$/.test(cols[2])) continue;
        const pid = Number(cols[cols.length - 1]);
        if (pid >= 0) return { pid, image: pid === 0 ? '?' : imageNameOf(pid) || '?' };
    }
    return null;
}

function describePortProblem(port, code, label) {
    if (code === 'EADDRINUSE') {
        const owner = portOwner(port);
        let who = owner ? `, 占用者: ${owner.image} (PID ${owner.pid})` : '';
        if (owner && owner.pid === 4) who += ' —— 通常是 IIS / Web 部署 / SQL Server Reporting 等系统 HTTP 服务';
        return `${label} 端口 ${port} 已被占用${who}。`;
    }
    if (code === 'EACCES') {
        if (!IS_WIN && port < 1024) {
            return `${label} 端口 ${port} 需要 root 权限才能监听(或将 PlayerPort 改为 8080 等 >=1024 的端口)。`;
        }
        return (
            `${label} 端口 ${port} 被系统保留(Hyper-V / WinNAT 动态排除端口)。` +
            '查看保留范围: netsh int ipv4 show excludedportrange protocol=tcp'
        );
    }
    return `${label} 端口 ${port} 无法监听: ${code}`;
}

// ---------------------------------------------------------------------------
// 进程 / 状态
// ---------------------------------------------------------------------------

function readState() {
    try {
        return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    } catch {
        return null;
    }
}

function writeState(state) {
    try {
        fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
        fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
    } catch (err) {
        warn(`写不了状态文件(不影响运行, 只是 Stop 脚本找不到进程): ${err.message}`);
    }
}

function removeFile(file) {
    try {
        fs.unlinkSync(file);
    } catch {
        // 已经没有了
    }
}

function clearState() {
    removeFile(STATE_FILE);
}

function isRunningAs(pid, image) {
    if (!pid) return false;
    const name = imageNameOf(pid);
    return Boolean(name) && name.toLowerCase() === image.toLowerCase();
}

function killTree(pid) {
    if (!pid) return;
    if (IS_WIN) {
        run('taskkill', ['/PID', String(pid), '/T', '/F']);
    } else {
        try {
            process.kill(pid, 'SIGTERM');
        } catch {
            // ignore
        }
    }
}

function killImage(image) {
    if (!image) return false;
    if (IS_WIN) {
        return run('taskkill', ['/IM', image, '/T', '/F']).status === 0;
    }
    return run('pkill', ['-f', image]).status === 0;
}

function isImageRunning(image) {
    if (!image) return false;
    if (IS_WIN) {
        const r = run('tasklist', ['/FI', `IMAGENAME eq ${image}`, '/FO', 'CSV', '/NH']);
        return Boolean(r.stdout) && r.stdout.toLowerCase().includes(`"${image.toLowerCase()}"`);
    }
    return run('pgrep', ['-f', image]).status === 0;
}

function runningGameImage() {
    return gameImageNames().find(isImageRunning) || null;
}

function launchGame(cfg, exe, state) {
    const args = buildGameArgs(cfg);
    log(`启动 UE: ${exe} ${args.join(' ')}`);
    const game = spawn(exe, args, { cwd: path.dirname(exe), detached: true, stdio: 'ignore' });
    game.on('error', (err) => warn(`UE 程序启动失败: ${err.message}`));
    game.unref();
    state.gamePid = game.pid;
    state.gameImage = path.basename(exe);
    state.gameImages = [...new Set([path.basename(exe), ...gameImageNames()])];
    return game;
}

function gameBinaries() {
    const winDir = path.join(PROJECT_DIR, 'Binaries', 'Win64');
    const linuxDir = path.join(PROJECT_DIR, 'Binaries', 'Linux');
    const found = [];
    try {
        for (const f of fs.readdirSync(winDir)) {
            if (/\.exe$/i.test(f)) found.push(path.join(winDir, f));
        }
    } catch {
        // ignore
    }
    if (!IS_WIN) {
        try {
            for (const f of fs.readdirSync(linuxDir)) {
                const full = path.join(linuxDir, f);
                if (fs.statSync(full).isFile()) found.push(full);
            }
        } catch {
            // ignore
        }
    }
    return found;
}

function gameImageNames() {
    const names = gameBinaries().map((f) => path.basename(f));
    if (names.length && fs.existsSync(path.join(PACKAGE_DIR, `${PROJECT_NAME}.exe`))) {
        names.push(`${PROJECT_NAME}.exe`);
    }
    return [...new Set(names)];
}

function resolveGameExe(cfg) {
    if (cfg.gameExe) {
        const exe = path.isAbsolute(cfg.gameExe) ? cfg.gameExe : path.resolve(ROOT, cfg.gameExe);
        if (!fs.existsSync(exe)) throw new UserError(`[Game] GameExe 指向的文件不存在: ${exe}`);
        return exe;
    }
    const bootstrap = path.join(PACKAGE_DIR, `${PROJECT_NAME}.exe`);
    if (fs.existsSync(bootstrap) && gameBinaries().length) return bootstrap;
    // 如果包根目录下的引导 .exe 名字与目录名不同, 自动寻找包根目录下的唯一 .exe
    if (gameBinaries().length) {
        try {
            const rootExes = fs
                .readdirSync(PACKAGE_DIR)
                .filter((f) => /\.exe$/i.test(f))
                .map((f) => path.join(PACKAGE_DIR, f));
            if (rootExes.length === 1) return rootExes[0];
        } catch {
            // ignore
        }
    }
    return null;
}

function splitArgs(text) {
    const out = [];
    let current = '';
    let inQuotes = false;
    let hasToken = false;
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (c === '\\' && text[i + 1] === '"') {
            current += '"';
            i++;
            hasToken = true;
        } else if (c === '"') {
            inQuotes = !inQuotes;
            hasToken = true;
        } else if (/\s/.test(c) && !inQuotes) {
            if (hasToken) out.push(current);
            current = '';
            hasToken = false;
        } else {
            current += c;
            hasToken = true;
        }
    }
    if (hasToken) out.push(current);
    return out;
}

function signallingUrlForGame(cfg) {
    return `ws://${cfg.signallingEnabled ? '127.0.0.1' : cfg.signallingAddress}:${cfg.streamerPort}`;
}

function buildGameArgs(cfg) {
    const args = [`-PixelStreamingURL=${signallingUrlForGame(cfg)}`];
    const res = cfg.resX && cfg.resY ? [`-ResX=${cfg.resX}`, `-ResY=${cfg.resY}`] : [];
    if (cfg.windowMode === 'offscreen') args.push('-RenderOffscreen', ...res, ...(res.length ? ['-ForceRes'] : []));
    else if (cfg.windowMode === 'windowed') args.push('-Windowed', ...res);
    else if (cfg.windowMode === 'fullscreen') args.push('-FullScreen', ...res);
    if (cfg.webrtcMinPort) {
        args.push(`-PixelStreamingWebRTCMinPort=${cfg.webrtcMinPort}`, `-PixelStreamingWebRTCMaxPort=${cfg.webrtcMaxPort}`);
    }
    const extra = splitArgs(cfg.extraArgs).map((a) => (/^-httpproxy=$/i.test(a) ? '-httpproxy=""' : a));
    if (!extra.some((a) => /^-httpproxy=/i.test(a))) args.push('-httpproxy=""');
    return args.concat(extra);
}

// ---------------------------------------------------------------------------
// ICE / TURN
// ---------------------------------------------------------------------------

function buildTurn(cfg, host) {
    if (cfg.turnMode === 'off') return null;
    if (cfg.turnMode === 'local') {
        if (!fs.existsSync(TURN_EXE)) {
            throw new UserError(
                `[Turn] Mode=local 需要 ${TURN_EXE}, 但当前离线运行时里没有。\n` +
                    '在有网的开发机重新运行 Offline\\Prepare-OfflineRuntime.bat(不要加 -NoTurn), 或把 Mode 改回 off。'
            );
        }
        return {
            local: true,
            host,
            port: cfg.turnPort,
            user: cfg.turnUser || 'ps2',
            password: cfg.turnPassword || crypto.randomBytes(12).toString('hex'),
            urls: [`turn:${host}:${cfg.turnPort}?transport=udp`, `turn:${host}:${cfg.turnPort}?transport=tcp`],
        };
    }
    if (!cfg.turnServer || !cfg.turnUser || !cfg.turnPassword) {
        throw new UserError('[Turn] Mode=external 需要同时填写 Server、User、Password(找网管要内网 TURN 服务器的地址和账号)。');
    }
    const urls = cfg.turnServer
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .flatMap((s) => (/^turns?:/i.test(s) ? [s] : [`turn:${s}?transport=udp`, `turn:${s}?transport=tcp`]));
    return { local: false, user: cfg.turnUser, password: cfg.turnPassword, urls };
}

function buildPeerOptions(cfg, turn) {
    const options = { iceServers: [] };
    if (turn) options.iceServers.push({ urls: turn.urls, username: turn.user, credential: turn.password });
    if (turn && cfg.forceRelay) options.iceTransportPolicy = 'relay';
    return options;
}

function startTurnServer(turn) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
    removeFile(path.join(LOG_DIR, 'turn.log'));
    const args = [
        '-n',
        '--listening-ip',
        turn.host,
        '--relay-ip',
        turn.host,
        '--listening-port',
        String(turn.port),
        '--realm',
        'PixelStreaming',
        '--lt-cred-mech',
        '--fingerprint',
        '--user',
        `${turn.user}:${turn.password}`,
        `--allowed-peer-ip=${turn.host}`,
        '--no-cli',
        '--no-tls',
        '--no-dtls',
        '--simple-log',
        '--no-stdout-log',
    ];
    return spawn(TURN_EXE, args, { cwd: LOG_DIR, stdio: 'ignore', windowsHide: true });
}

// ---------------------------------------------------------------------------
// 信令服务器 (自动兼容 Wilbur UE 5.5+ 与 Cirrus UE 5.3/5.4)
// ---------------------------------------------------------------------------

class SignallingServer {
    constructor(cfg, peerOptions, host = '127.0.0.1') {
        const homepage = fs.existsSync(HOME_PAGE) ? 'index.html' : 'player.html';
        if (PROFILE.kind === 'cirrus') {
            fs.mkdirSync(STATE_DIR, { recursive: true });
            const cirrusConfig = {
                UseFrontend: false,
                UseMatchmaker: false,
                UseHTTPS: false,
                LogToFile: true,
                LogVerbose: cfg.consoleMessages !== 'none',
                HomepageFile: homepage,
                EnableWebserver: true,
                PublicIp: host,
                HttpPort: cfg.playerPort,
                StreamerPort: cfg.streamerPort,
                SFUPort: 0,
                MaxPlayerCount: cfg.maxPlayers > 0 ? cfg.maxPlayers : -1,
                peerConnectionOptions: JSON.stringify(peerOptions),
            };
            fs.writeFileSync(CIRRUS_CFG_FILE, JSON.stringify(cirrusConfig, null, '\t'));
            this.args = [WILBUR_JS, '--configFile', CIRRUS_CFG_FILE];
        } else {
            this.args = [
                WILBUR_JS,
                '--no_config',
                '--serve',
                '--http_root',
                WWW_DIR,
                '--homepage',
                homepage,
                '--player_port',
                String(cfg.playerPort),
                '--streamer_port',
                String(cfg.streamerPort),
                '--sfu_port',
                '',
                '--max_players',
                String(cfg.maxPlayers),
                '--log_folder',
                path.join(LOG_DIR, 'signalling'),
                '--log_level_console',
                'info',
                '--log_level_file',
                'info',
                '--peer_options',
                JSON.stringify(peerOptions),
            ];
            if (cfg.restApi !== false) this.args.push('--rest_api');
            if (cfg.consoleMessages !== 'none') this.args.push('--console_messages', cfg.consoleMessages);
        }
        this.child = null;
        this.stopping = false;
        this.crashes = [];
        this.onFatal = null;
    }

    start(stdio = 'inherit') {
        this.child = spawn(process.execPath, this.args, { cwd: SWS_DIR, stdio });
        const child = this.child;
        child.on('exit', (code) => {
            if (this.child !== child) return;
            this.child = null;
            setTimeout(() => this.handleExit(code), 500);
        });
        child.on('error', (err) => warn(`信令服务器进程出错: ${err.message}`));
        return this;
    }

    handleExit(code) {
        if (this.stopping || code === EXIT_CTRL_C) return;
        const now = Date.now();
        this.crashes = this.crashes.filter((t) => now - t < 60000).concat(now);
        if (this.crashes.length > 5) {
            if (this.onFatal) {
                this.onFatal('信令服务器 1 分钟内反复退出, 已停止重启。请查看上面的错误信息和 Logs\\signalling。');
            }
            return;
        }
        warn(`信令服务器意外退出(退出码 ${code}), 3 秒后自动重启...`);
        setTimeout(() => {
            if (!this.stopping) this.start();
        }, 3000);
    }

    get pid() {
        return this.child ? this.child.pid : null;
    }

    stop() {
        this.stopping = true;
        if (this.child) killTree(this.child.pid);
    }
}

// ---------------------------------------------------------------------------
// 运行时检查与自检
// ---------------------------------------------------------------------------

function findExpressPkg() {
    const candidates = [
        path.join(SWS_DIR, 'node_modules', 'express', 'package.json'),
        path.join(INFRA_DIR, 'node_modules', 'express', 'package.json'),
    ];
    return candidates.find((p) => fs.existsSync(p)) || candidates[0];
}

function checkRuntime() {
    const required = [WILBUR_JS, findExpressPkg(), path.join(WWW_DIR, 'player.html')];
    if (PROFILE.kind === 'wilbur' && PROFILE.apiDocFile) {
        required.push(PROFILE.apiDocFile);
    }
    const missing = required.filter((f) => !fs.existsSync(f));
    if (missing.length) {
        throw new UserError(
            `离线运行时不完整, 缺少:\n  ${missing.join('\n  ')}\n` +
                '在能上网的开发机运行一次 Offline\\Prepare-OfflineRuntime.bat (或 Offline/Prepare-OfflineRuntime.sh), 然后把目录拷过来。'
        );
    }
}

function findExternalFontLinks() {
    const dirs = [
        WWW_DIR,
        path.join(INFRA_DIR, 'Frontend', 'implementations', 'typescript', 'src'),
        path.join(INFRA_DIR, 'Frontend', 'implementations', 'react', 'src'),
    ];
    const offending = [];
    for (const d of dirs) {
        if (!fs.existsSync(d)) continue;
        let files = [];
        try {
            files = fs.readdirSync(d).filter((f) => /\.html$/i.test(f));
        } catch {
            continue;
        }
        for (const f of files) {
            const full = path.join(d, f);
            try {
                const text = fs.readFileSync(full, 'utf8');
                if (/fonts\.(googleapis|gstatic)\.com/i.test(text)) {
                    offending.push(path.relative(ROOT, full));
                }
            } catch {
                // ignore
            }
        }
    }
    return offending;
}

function ensureHomepage() {
    try {
        if (!fs.existsSync(HOME_TEMPLATE)) return false;
        const want = fs.readFileSync(HOME_TEMPLATE);
        fs.mkdirSync(WWW_DIR, { recursive: true });
        if (!fs.existsSync(HOME_PAGE) || !fs.readFileSync(HOME_PAGE).equals(want)) {
            fs.writeFileSync(HOME_PAGE, want);
            log(`已更新网页首页 ${path.relative(ROOT, HOME_PAGE)}(默认悬停鼠标、触摸当鼠标)`);
        }
        return true;
    } catch (err) {
        warn(`没能写入网页首页 ${HOME_PAGE}: ${err.message}`);
        warn('浏览器里需要手动打开设置(齿轮), 把 Control Scheme 切成 Hovering Mouse, 否则点不中 UE 的按钮。');
        return false;
    }
}

function runtimeSummary() {
    const archLabel = `${PROFILE.kind === 'cirrus' ? 'Cirrus' : 'Wilbur'} (${PROFILE.ueVersion})`;
    try {
        const info = JSON.parse(fs.readFileSync(RUNTIME_INFO, 'utf8'));
        return `Node ${process.version}, ${archLabel} v${info.wilburVersion || PROFILE.serverVersion}, PS 基础设施 ${info.psInfraVersion}, 准备于 ${info.preparedAt}`;
    } catch {
        return `Node ${process.version}, ${archLabel} v${PROFILE.serverVersion}`;
    }
}

function runningLauncherPid() {
    const state = readState();
    return state && isRunningAs(state.launcherPid, path.basename(process.execPath)) ? state.launcherPid : null;
}

async function ensurePortsFree(cfg, turn) {
    const checks = [
        [cfg.playerPort, '网页/播放器(PlayerPort)'],
        [cfg.streamerPort, 'UE 连接(StreamerPort)'],
    ];
    if (turn && turn.local) checks.push([turn.port, 'TURN(Port)']);
    const problems = [];
    for (const [port, label] of checks) {
        const code = await probePort(port);
        if (code) problems.push(describePortProblem(port, code, label));
    }
    if (problems.length) {
        const pid = runningLauncherPid();
        if (pid) throw new UserError(`像素流已经在运行(启动器 PID ${pid})。要重启请先运行 Stop-PixelStreaming.bat。`);
        throw new UserError(`${problems.join('\n')}\n请在 PixelStreaming.ini 里换一个端口(UE 的连接地址会自动跟着改)。`);
    }
}

async function waitUntilListening(ports, timeoutMs, isDead) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        if (isDead()) return false;
        const results = await Promise.all(ports.map((p) => tcpReachable(p)));
        if (results.every(Boolean)) return true;
        await sleep(300);
    }
    return false;
}

function gameModeText(cfg) {
    switch (cfg.windowMode) {
        case 'offscreen':
            return '不显示窗口, 只推流';
        case 'windowed':
            return '窗口模式, 本机屏幕与网页画面同步';
        case 'fullscreen':
            return '全屏, 本机屏幕与网页画面同步';
        default:
            return '和平时一样正常显示, 本机屏幕与网页画面同步 (不要最小化 UE 窗口, 否则网页画面会停住)';
    }
}

function printBanner(cfg, host, addresses, gameInfo, turn, statusInfo) {
    const line = '='.repeat(66);
    const lanOthers = addresses.filter((a) => a.address !== host && a.kind === 'lan');
    const virtuals = addresses.filter((a) => a.address !== host && a.kind !== 'lan');
    console.log('');
    console.log(green(line));
    console.log(green(`  像素流 PixelStreaming (${PROFILE.ueVersion}) 已启动 —— 内网离线模式`));
    console.log(green(line));
    console.log(`  其他电脑 / Pad 浏览器打开 : ${cyan(httpUrl(host, cfg.playerPort))}`);
    for (const a of lanOthers) console.log(`                      或者 : ${httpUrl(a.address, cfg.playerPort)}  (${a.name})`);
    console.log(`  本机测试                 : ${httpUrl('127.0.0.1', cfg.playerPort)}`);
    if (cfg.restApi) {
        const statusUrl = `${httpUrl('127.0.0.1', cfg.playerPort).replace(/\/$/, '')}/api/status`;
        console.log(`  UE Healthcheck 状态接口  : ${statusUrl}${statusInfo ? ` (正常, v${statusInfo.version})` : ''}`);
    }
    console.log(`  UE 连接信令              : ws://127.0.0.1:${cfg.streamerPort}   (UE 在别的电脑时: ws://${host}:${cfg.streamerPort})`);
    if (!turn) console.log('  媒体连接                 : 内网直连, 不用外网 / VPN / 公网 IP / STUN');
    else if (turn.local) console.log(`  媒体连接                 : 本机 TURN 中继 ${host}:${turn.port}${cfg.forceRelay ? ' (强制中继)' : ''}`);
    else console.log(`  媒体连接                 : 内网 TURN ${turn.urls.join(', ')}${cfg.forceRelay ? ' (强制中继)' : ''}`);
    if (gameInfo) console.log(`  UE 程序                  : ${gameInfo}`);
    console.log('  网页里操作               : 鼠标直接点 UE 里的按钮; Pad 上单指点按 = 鼠标点击');
    if (virtuals.length) {
        console.log(`  其他网卡(一般用不上)     : ${virtuals.map((a) => `${a.address} ${a.name}`).join(';  ')}`);
    }
    console.log(green('-'.repeat(66)));
    console.log(`  关闭本窗口 = 停止像素流${gameInfo && cfg.stopGameOnExit ? '(连同 UE 程序)' : ''}`);
    console.log('  其他电脑打不开网页 -> 在本机右键 Open-Firewall.bat 以管理员身份运行一次');
    console.log('  网页打开了但没画面 -> 看 README-Intranet.txt 的排查步骤');
    console.log(`  日志: ${LOG_DIR}`);
    console.log(green(line));
    console.log('');
}

async function startGameOnly(cfg, withGame) {
    if (!withGame || !cfg.launchGame) {
        throw new UserError('PixelStreaming.ini 里 [Signalling] Enabled=0, 又不启动 UE, 没有可启动的东西。');
    }
    const exe = resolveGameExe(cfg);
    if (!exe) throw new UserError('没找到打包好的 UE 程序, 请在 PixelStreaming.ini 的 [Game] GameExe 里填路径。');
    const already = runningGameImage();
    if (already) throw new UserError(`UE 程序已经在运行(${already})。要重启请先运行 Stop-PixelStreaming.bat。`);
    const url = signallingUrlForGame(cfg);
    if (!(await tcpReachable(cfg.streamerPort, cfg.signallingAddress, 3000))) {
        warn(`现在连不上信令服务器 ${cfg.signallingAddress}:${cfg.streamerPort}(没启动 / 地址不对 / 防火墙拦了)。`);
        warn('UE 会自动重试, 信令服务器启动后就能连上。');
    }
    const state = { launcherPid: null, startedAt: new Date().toISOString() };
    launchGame(cfg, exe, state);
    writeState(state);
    await sleep(1500);
    console.log('');
    console.log(green(`UE 已启动, 连接信令服务器 ${url}`));
    console.log('浏览器打开信令电脑窗口里显示的地址即可。停止 UE: Stop-PixelStreaming.bat');
}

async function cmdStart(withGame) {
    console.log(cyan(`PixelStreaming 离线启动器 | ${runtimeSummary()}`));
    const cfg = loadConfig();
    if (!cfg.signallingEnabled) return startGameOnly(cfg, withGame);
    checkRuntime();
    const addresses = listIPv4();
    const host = pickHost(cfg, addresses);
    const turn = buildTurn(cfg, host);
    const gameExe = withGame && cfg.launchGame ? resolveGameExe(cfg) : null;
    await ensurePortsFree(cfg, turn);
    fs.mkdirSync(LOG_DIR, { recursive: true });
    removeFile(STOP_FILE);
    ensureHomepage();

    const state = { launcherPid: process.pid, startedAt: new Date().toISOString() };
    let turnProc = null;
    let gamePid = null;
    let gameImages = [];
    let shuttingDown = false;
    const server = new SignallingServer(cfg, buildPeerOptions(cfg, turn), host);

    const shutdown = (code, reason) => {
        if (shuttingDown) return;
        shuttingDown = true;
        if (reason) log(reason);
        if (gamePid && cfg.stopGameOnExit) {
            killTree(gamePid);
            gameImages.forEach(killImage);
        }
        server.stop();
        if (turnProc) killTree(turnProc.pid);
        clearState();
        process.exit(code);
    };
    process.on('SIGINT', () => shutdown(0, '收到 Ctrl+C, 正在停止...'));
    if (IS_WIN) process.on('SIGBREAK', () => shutdown(0, '正在停止...'));
    process.on('SIGHUP', () => shutdown(0, '窗口关闭, 正在停止...'));
    process.on('SIGTERM', () => shutdown(0, '收到 SIGTERM, 正在停止...'));
    process.on('uncaughtException', (err) => shutdown(1, red(`启动器出错: ${err && err.stack ? err.stack : err}`)));
    server.onFatal = (message) => shutdown(1, red(message));

    if (turn && turn.local) {
        turnProc = startTurnServer(turn);
        turnProc.on('exit', (code) => {
            if (!shuttingDown) warn(`TURN 服务器退出了(退出码 ${code}), 详见 Logs\\turn.log`);
        });
        state.turnPid = turnProc.pid;
    }

    log(`启动信令服务器: 网页端口 ${cfg.playerPort}, UE 端口 ${cfg.streamerPort}`);
    server.start();
    state.serverPid = server.pid;
    writeState(state);
    const up = await waitUntilListening([cfg.playerPort, cfg.streamerPort], 20000, () => !server.child);
    if (!up) {
        shutdown(1, red('信令服务器没能启动, 看上面的错误信息。'));
        return;
    }

    let statusInfo = null;
    if (cfg.restApi) {
        for (let i = 0; i < 10 && !statusInfo; i++) {
            statusInfo = await queryStatusEndpoint(cfg.playerPort);
            if (!statusInfo) await sleep(200);
        }
    }

    let gameInfo = null;
    if (withGame && cfg.launchGame) {
        const already = gameExe && runningGameImage();
        if (!gameExe) {
            gameInfo = yellow('没找到打包好的 UE 程序, 本次只启动了信令服务器');
        } else if (already) {
            gameInfo = yellow(`${already} 已经在运行, 没有再启动一个(它连的若是本机 ${cfg.streamerPort} 端口, 会自动连上)`);
        } else {
            gamePid = launchGame(cfg, gameExe, state).pid;
            gameImages = state.gameImages;
            gameInfo = `已启动 ${path.basename(gameExe)}, ${gameModeText(cfg)}, 加载完成后自动连上信令`;
        }
    } else if (withGame) {
        gameInfo = '按设置不自动启动 (LaunchGame=0)';
    }

    writeState(state);
    process.title = `像素流 PixelStreaming (${PROFILE.ueVersion}) - ${httpUrl(host, cfg.playerPort)} - 关闭窗口即停止`;
    printBanner(cfg, host, addresses, gameInfo, turn, statusInfo);

    setInterval(() => {
        if (shuttingDown) return;
        if (fs.existsSync(STOP_FILE)) {
            removeFile(STOP_FILE);
            shutdown(0, '收到 Stop-PixelStreaming 的停止请求, 正在停止...');
            return;
        }
        if (server.pid && server.pid !== state.serverPid) {
            state.serverPid = server.pid;
            writeState(state);
        }
    }, 1000);
}

async function cmdStop() {
    const state = readState();
    const stopped = [];
    const node = path.basename(process.execPath);
    if (state && isRunningAs(state.launcherPid, node)) {
        try {
            fs.mkdirSync(path.dirname(STOP_FILE), { recursive: true });
            fs.writeFileSync(STOP_FILE, String(Date.now()));
            for (let i = 0; i < 30 && isRunningAs(state.launcherPid, node); i++) await sleep(300);
        } catch {
            // 写不了请求文件就直接走强制结束
        }
        if (!isRunningAs(state.launcherPid, node)) stopped.push('像素流启动器(已正常退出)');
    }
    removeFile(STOP_FILE);
    if (state) {
        if (isRunningAs(state.gamePid, state.gameImage || '')) {
            killTree(state.gamePid);
            stopped.push(`UE 程序 (PID ${state.gamePid})`);
        }
        if (isRunningAs(state.turnPid, path.basename(TURN_EXE))) {
            killTree(state.turnPid);
            stopped.push('TURN 服务器');
        }
        if (isRunningAs(state.serverPid, node)) {
            killTree(state.serverPid);
            stopped.push('信令服务器');
        }
        if (isRunningAs(state.launcherPid, node)) {
            killTree(state.launcherPid);
            stopped.push('启动器');
        }
    }
    const images = new Set([...((state && state.gameImages) || []), ...gameImageNames()]);
    for (const image of images) {
        if (killImage(image)) stopped.push(image);
    }
    clearState();
    log(stopped.length ? `已停止: ${stopped.join(', ')}` : '没有发现在运行的像素流进程。');
}

async function cmdCheck() {
    let ok = true;
    const bad = (text) => {
        ok = false;
        console.log(red(`  [X] ${text}`));
    };
    const good = (text) => console.log(green(`  [OK] ${text}`));
    const note = (text) => console.log(`       ${text}`);

    console.log(cyan('PixelStreaming 离线运行时自检'));
    console.log(`  启动器目录: ${ROOT}`);
    console.log(`  基础设施目录: ${INFRA_DIR}`);
    console.log(`  ${runtimeSummary()}`);
    try {
        checkRuntime();
        good('信令服务器、运行期依赖、网页文件齐全');
        let homeOk = false;
        try {
            homeOk = fs.readFileSync(HOME_PAGE).equals(fs.readFileSync(HOME_TEMPLATE));
        } catch {
            homeOk = false;
        }
        if (homeOk) good('网页首页 index.html 已就位(默认悬停鼠标, UE 按钮可以点)');
        else note('网页首页 index.html 缺失或不是最新, 下次启动时会自动补上');
    } catch (err) {
        bad(err.message);
    }

    const fontOffenders = findExternalFontLinks();
    if (fontOffenders.length) {
        bad(`发现阻塞内网加载的 Google Fonts 外链: ${fontOffenders.join(', ')}`);
    } else {
        good('HTML 网页无 Google Fonts 外链(内网/无外网环境不会卡加载)');
    }

    let cfg = null;
    try {
        cfg = loadConfig();
        good(
            `PixelStreaming.ini 可以读取 (网页端口 ${cfg.playerPort}, UE 端口 ${cfg.streamerPort}, REST API ${cfg.restApi ? '开启' : '关闭'}, TURN ${cfg.turnMode})`
        );
    } catch (err) {
        bad(err.message);
    }

    const addresses = listIPv4();
    if (!addresses.length) note('未检测到非回环 IPv4 网卡地址(仅本机 127.0.0.1 可访问)');
    for (const a of addresses) {
        note(
            `网卡 ${a.name}: ${a.address}${
                a.kind === 'lan' ? '' : `  (${{ virtual: '虚拟/VPN', linklocal: '未获取到地址', other: '非私有地址' }[a.kind]})`
            }`
        );
    }

    if (cfg) {
        const state = readState();
        const running = state && isRunningAs(state.launcherPid, path.basename(process.execPath));
        if (running) {
            good(`像素流正在运行 (启动器 PID ${state.launcherPid})`);
            for (const port of [cfg.playerPort, cfg.streamerPort]) {
                if (await tcpReachable(port)) good(`端口 ${port} 正在监听`);
                else bad(`端口 ${port} 没有在监听`);
            }
            if (cfg.restApi) {
                const status = await queryStatusEndpoint(cfg.playerPort);
                if (status) {
                    good(
                        `UE Healthcheck (/api/status) 正常: version=${status.version}, uptime=${status.uptime}ms, streamers=${status.streamer_count}, players=${status.player_count}`
                    );
                } else {
                    bad(`UE Healthcheck (http://127.0.0.1:${cfg.playerPort}/api/status) 未响应或返回格式不正确`);
                }
            }
        } else {
            for (const [port, label] of [
                [cfg.playerPort, '网页/播放器(PlayerPort)'],
                [cfg.streamerPort, 'UE 连接(StreamerPort)'],
            ]) {
                const code = await probePort(port);
                if (code === 'EACCES' && !IS_WIN && port < 1024 && !isElevated()) {
                    note(`${label} 端口 ${port} 在 Linux 非 root 用户下不可直接监听(如需非 root 运行可将 PlayerPort 改为 8080)`);
                } else if (code) {
                    bad(describePortProblem(port, code, label));
                } else {
                    good(`${label} 端口 ${port} 可用`);
                }
            }
        }
        try {
            const exe = resolveGameExe(cfg);
            if (exe) good(`UE 程序: ${exe}`);
            else note('没找到打包好的 UE 程序(在基础设施仓库或工程目录里运行时是正常的)');
        } catch (err) {
            bad(err.message);
        }
        if (cfg.turnMode === 'local' && !fs.existsSync(TURN_EXE)) {
            bad(`[Turn] Mode=local 但没有 ${TURN_EXE}`);
        }
    }
    console.log('');
    console.log(ok ? green('自检通过。') : red('自检发现问题, 见上面标 [X] 的项。'));
    process.exitCode = ok ? 0 : 1;
}

// UE 规范的端到端 Healthcheck:
// 1. 静态检查运行时完整性、配置、无外链字体
// 2. 启动信令服务器 (--rest_api --serve), 请求 /api/status、/、/player.html 并验证 UE 连接端口
async function cmdHealthcheck() {
    let ok = true;
    const bad = (text) => {
        ok = false;
        console.log(red(`  [FAIL] ${text}`));
    };
    const good = (text) => console.log(green(`  [PASS] ${text}`));

    console.log(cyan(`PixelStreaming UE 规范 Healthcheck | ${runtimeSummary()}`));

    try {
        ensureHomepage();
        checkRuntime();
        good('离线运行时文件齐全 (信令入口、依赖、前端网页、OpenAPI 定义)');
    } catch (err) {
        bad(err.message);
        process.exitCode = 1;
        return;
    }

    const fontOffenders = findExternalFontLinks();
    if (fontOffenders.length) {
        bad(`HTML 含有外链字体: ${fontOffenders.join(', ')}`);
    } else {
        good('离线 HTML 合规: 无 fonts.googleapis.com / fonts.gstatic.com 外链');
    }

    let cfg = null;
    try {
        cfg = loadConfig();
        good('PixelStreaming.ini 配置解析通过');
    } catch (err) {
        bad(err.message);
        process.exitCode = 1;
        return;
    }

    const playerPort = await findFreePort();
    const streamerPort = await findFreePort();
    const testCfg = {
        ...cfg,
        playerPort,
        streamerPort,
        restApi: true,
        consoleMessages: 'none',
    };

    const server = new SignallingServer(testCfg, { iceServers: [] }, '127.0.0.1');
    try {
        fs.mkdirSync(LOG_DIR, { recursive: true });
        server.start('pipe');
        const up = await waitUntilListening([playerPort, streamerPort], 15000, () => !server.child);
        if (!up) {
            bad(`信令服务器未能在 15 秒内监听端口 (${playerPort}, ${streamerPort})`);
        } else {
            good(`信令服务器已监听 PlayerPort=${playerPort}, StreamerPort=${streamerPort}`);

            let status = null;
            for (let i = 0; i < 15 && !status; i++) {
                status = await queryStatusEndpoint(playerPort, '127.0.0.1', 2000);
                if (!status) await sleep(200);
            }
            if (!status) {
                bad(`GET http://127.0.0.1:${playerPort}/api/status 未返回符合 UE 规范的 JSON`);
            } else {
                good(
                    `GET /api/status 通过: version=${status.version}, uptime=${status.uptime}ms, streamer_count=${status.streamer_count}, player_count=${status.player_count}`
                );
            }

            if (PROFILE.kind === 'wilbur') {
                const cfgRes = await httpGet(playerPort, '/api/config');
                if (cfgRes.ok) good('GET /api/config 响应 200 OK');
                else bad(`GET /api/config 失败 (HTTP ${cfgRes.statusCode})`);
            }

            const rootRes = await httpGet(playerPort, '/');
            if (rootRes.ok && /HoveringMouse/i.test(rootRes.body)) {
                good('GET / 首页响应 200 OK 且包含内网默认控制参数跳转');
            } else {
                bad(`GET / 首页检查失败 (HTTP ${rootRes.statusCode})`);
            }

            const playerRes = await httpGet(playerPort, '/player.html');
            if (!playerRes.ok) {
                bad(`GET /player.html 失败 (HTTP ${playerRes.statusCode})`);
            } else if (/fonts\.(googleapis|gstatic)\.com/i.test(playerRes.body)) {
                bad('GET /player.html 响应内容仍包含 Google Fonts 外链');
            } else {
                good('GET /player.html 响应 200 OK 且无任何外网字体依赖');
            }
        }
    } finally {
        server.stop();
        await sleep(200);
    }

    console.log('');
    console.log(ok ? green('Healthcheck 全部通过。') : red('Healthcheck 未通过, 请检查上述 [FAIL] 项。'));
    process.exitCode = ok ? 0 : 1;
}

function isElevated() {
    if (!IS_WIN) return process.getuid && process.getuid() === 0;
    const r = run('whoami', ['/groups']);
    return r.status === 0 && /S-1-16-12288|S-1-16-16384/.test(r.stdout || '');
}

function cmdFirewall() {
    if (!IS_WIN) {
        throw new UserError('Open-Firewall 仅适用于 Windows 系统。Linux 请使用 ufw / firewalld 放行对应端口。');
    }
    if (!isElevated()) {
        throw new UserError('需要管理员权限: 右键 Open-Firewall.bat, 选"以管理员身份运行"。');
    }
    const cfg = loadConfig();
    const tag = `${PROJECT_NAME || 'UE'} PixelStreaming`;
    const range = cfg.webrtcMinPort ? `${cfg.webrtcMinPort}-${cfg.webrtcMaxPort}` : '';
    const rules = [
        { name: `${tag} - Signalling`, program: process.execPath, protocol: 'TCP', ports: `${cfg.playerPort},${cfg.streamerPort}` },
    ];
    for (const exe of gameBinaries()) {
        rules.push({ name: `${tag} - ${path.basename(exe)} UDP`, program: exe, protocol: 'UDP', ports: range });
        rules.push({ name: `${tag} - ${path.basename(exe)} TCP`, program: exe, protocol: 'TCP', ports: range });
    }
    if (fs.existsSync(TURN_EXE)) {
        rules.push({ name: `${tag} - TURN UDP`, program: TURN_EXE, protocol: 'UDP', ports: String(cfg.turnPort) });
        rules.push({ name: `${tag} - TURN TCP`, program: TURN_EXE, protocol: 'TCP', ports: String(cfg.turnPort) });
    }
    const netsh = (args) => run('netsh', args, { windowsVerbatimArguments: true });
    let failed = 0;
    for (const r of rules) {
        netsh(['advfirewall', 'firewall', 'delete', 'rule', `name="${r.name}"`]);
        const args = [
            'advfirewall',
            'firewall',
            'add',
            'rule',
            `name="${r.name}"`,
            'dir=in',
            'action=allow',
            `program="${r.program}"`,
            `protocol=${r.protocol}`,
            'profile=any',
            'enable=yes',
        ];
        if (r.ports) args.push(`localport=${r.ports}`);
        const res = netsh(args);
        if (res.status === 0) {
            console.log(green(`  [OK] ${r.name}${r.ports ? ` (${r.protocol} ${r.ports})` : ` (${r.protocol})`}`));
        } else {
            failed++;
            console.log(red(`  [X] ${r.name}: ${(res.stdout || res.stderr || '').trim()}`));
        }
    }
    if (!gameBinaries().length) warn('这里不是打包目录, 没有为 UE 程序加规则。在打包目录里的同名脚本上再运行一次。');
    console.log('');
    console.log('如果单位用组策略统一管理防火墙, 本机规则可能不生效, 需要网管放行上述程序和端口。');
    process.exitCode = failed ? 1 : 0;
}

function usage() {
    console.log('用法: node ps2-offline.js <start|server|stop|check|healthcheck|firewall>');
    console.log('  start        启动信令服务器 + UE 程序 (Start-PixelStreaming.bat / .sh)');
    console.log('  server       只启动信令服务器 (Start-SignallingServer.bat / .sh)');
    console.log('  stop         停止 (Stop-PixelStreaming.bat / .sh)');
    console.log('  check        自检 (Check-PixelStreaming.bat / .sh)');
    console.log('  healthcheck  UE 规范端到端健康检查 (启动临时信令并校验 /api/status 与前端页面)');
    console.log('  firewall     添加防火墙放行规则, 需要管理员 (Open-Firewall.bat)');
    console.log(`设置文件: ${INI_FILE}`);
}

async function main() {
    const command = (process.argv[2] || 'start').toLowerCase();
    switch (command) {
        case 'start':
            return cmdStart(true);
        case 'server':
            return cmdStart(false);
        case 'stop':
            return cmdStop();
        case 'check':
            return cmdCheck();
        case 'healthcheck':
            return cmdHealthcheck();
        case 'firewall':
            return cmdFirewall();
        default:
            usage();
            process.exitCode = command === 'help' || command === '--help' ? 0 : 2;
    }
}

main().catch((err) => {
    if (err instanceof UserError) {
        console.log(red(`[像素流] ${err.message}`));
    } else {
        console.log(red(`[像素流] 出错了: ${err && err.stack ? err.stack : err}`));
    }
    process.exit(1);
});
