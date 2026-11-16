#!/usr/bin/env bash
# ===========================================================================
# 生成 Pixel Streaming 离线运行时 (Linux / macOS / CI)
# 支持:
#   - 根目录布局 (PixelStreamingInfrastructure) 与 WebServers/ 嵌套布局
#   - UE 5.5 / 5.6 / 5.7 / 5.8 / master (Wilbur) 与 UE 5.3 / 5.4 (Cirrus)
#   - 国内镜像 (--mirror cn 使用 npmmirror.com, 无需 VPN)
#   - 编译完成后自动运行 UE 规范端到端 Healthcheck
# ===========================================================================
set -euo pipefail

OFFLINE_DIR="$(cd -P -- "$(dirname -- "$0")" && pwd -P)"
ROOT="$(dirname "$OFFLINE_DIR")"

if [ -d "$ROOT/SignallingWebServer" ]; then
    WEB="$ROOT"
elif [ -d "$ROOT/WebServers/SignallingWebServer" ]; then
    WEB="$ROOT/WebServers"
else
    echo "[ERROR] SignallingWebServer not found under $ROOT or $ROOT/WebServers" >&2
    exit 1
fi
SWS="$WEB/SignallingWebServer"

MIRROR="official"
BUILD_FRONTEND=0
while (($#)); do
    case "$1" in
        --mirror|-Mirror)
            MIRROR="${2:-official}"
            shift 2
            ;;
        --build-frontend|-BuildFrontend)
            BUILD_FRONTEND=1
            shift
            ;;
        *)
            shift
            ;;
    esac
done

if [ "$MIRROR" = "cn" ]; then
    export npm_config_registry="https://registry.npmmirror.com/"
else
    export npm_config_registry="https://registry.npmjs.org/"
fi
export npm_config_update_notifier="false"
export npm_config_fund="false"
export npm_config_audit="false"

IS_CIRRUS=0
if [ -f "$SWS/cirrus.js" ] && [ ! -f "$WEB/Common/package.json" ]; then
    IS_CIRRUS=1
    WWW_DIR="$SWS/Public"
else
    WWW_DIR="$SWS/www"
fi

echo "==> 准备 Pixel Streaming 离线运行时 (Mirror=$MIRROR, Cirrus=$IS_CIRRUS)"

if [ "$IS_CIRRUS" -eq 1 ]; then
    if [ ! -f "$WWW_DIR/player.html" ] || [ "$BUILD_FRONTEND" -eq 1 ]; then
        echo "==> 编译 Cirrus 前端 (Public/)"
        LIB_NAME=$(node -p "require('$WEB/Frontend/library/package.json').name")
        UILIB_NAME=$(node -p "require('$WEB/Frontend/ui-library/package.json').name")
        (cd "$WEB/Frontend/library" && npm install --ignore-scripts && npm run build)
        (
            cd "$WEB/Frontend/ui-library"
            npm install --ignore-scripts
            mkdir -p "node_modules/$(dirname "$LIB_NAME")"
            rm -rf "node_modules/$LIB_NAME"
            ln -s "$WEB/Frontend/library" "node_modules/$LIB_NAME"
            npm run build
        )
        (
            cd "$WEB/Frontend/implementations/typescript"
            npm install --ignore-scripts
            mkdir -p "node_modules/$(dirname "$LIB_NAME")"
            rm -rf "node_modules/$LIB_NAME" "node_modules/$UILIB_NAME"
            ln -s "$WEB/Frontend/library" "node_modules/$LIB_NAME"
            ln -s "$WEB/Frontend/ui-library" "node_modules/$UILIB_NAME"
            npm run build
        )
    fi
    echo "==> 安装 Cirrus SignallingWebServer 运行期依赖"
    (cd "$SWS" && npm install --omit=dev --ignore-scripts --install-links)
else
    if [ ! -d "$WEB/node_modules" ]; then
        echo "==> 安装工作区依赖"
        (cd "$WEB" && npm install --ignore-scripts)
    fi
    echo "==> 编译 Common / Signalling / SignallingWebServer"
    (cd "$WEB/Common" && npm run build)
    (cd "$WEB/Signalling" && npm run build)
    (cd "$SWS" && npm run build)

    if [ ! -f "$WWW_DIR/player.html" ] || [ "$BUILD_FRONTEND" -eq 1 ]; then
        echo "==> 编译 Frontend 静态文件 ($WWW_DIR)"
        (cd "$WEB/Frontend/library" && npm run build)
        (cd "$WEB/Frontend/ui-library" && npm run build)
        (cd "$WEB/Frontend/implementations/typescript" && WEBPACK_OUTPUT_PATH="$WWW_DIR" npm run build)
    fi

    echo "==> 生成无符号链接的独立 SignallingWebServer/node_modules"
    TMP_DIR="$(mktemp -d)"
    trap 'rm -rf "$TMP_DIR"' EXIT
    mkdir -p "$TMP_DIR/pkgs" "$TMP_DIR/rt"
    cp "$WEB/Common/.npmignore" "$TMP_DIR/common.npmignore" 2>/dev/null || true
    cp "$WEB/Signalling/.npmignore" "$TMP_DIR/signalling.npmignore" 2>/dev/null || true
    printf "src/\nnode_modules/\ndocs/\n*.tsbuildinfo\n" > "$WEB/Common/.npmignore"
    printf "src/\nnode_modules/\ndocs/\n*.tsbuildinfo\n" > "$WEB/Signalling/.npmignore"
    (cd "$WEB" && npm pack --workspace=Common --workspace=Signalling --pack-destination "$TMP_DIR/pkgs" >/dev/null)
    if [ -f "$TMP_DIR/common.npmignore" ]; then cp "$TMP_DIR/common.npmignore" "$WEB/Common/.npmignore"; else rm -f "$WEB/Common/.npmignore"; fi
    if [ -f "$TMP_DIR/signalling.npmignore" ]; then cp "$TMP_DIR/signalling.npmignore" "$WEB/Signalling/.npmignore"; else rm -f "$WEB/Signalling/.npmignore"; fi

    node - "$WEB" "$SWS" "$TMP_DIR" <<'EOF'
const fs = require('fs');
const path = require('path');
const [web, sws, tmp] = process.argv.slice(2);
const commonPkg = JSON.parse(fs.readFileSync(path.join(web, 'Common/package.json'), 'utf8'));
const sigPkg = JSON.parse(fs.readFileSync(path.join(web, 'Signalling/package.json'), 'utf8'));
const swsPkg = JSON.parse(fs.readFileSync(path.join(sws, 'package.json'), 'utf8'));
const tgzFiles = fs.readdirSync(path.join(tmp, 'pkgs'));
const commonTgz = tgzFiles.find((f) => f.startsWith('epicgames-ps-lib-pixelstreamingcommon-'));
const sigTgz = tgzFiles.find((f) => f.startsWith('epicgames-ps-lib-pixelstreamingsignalling-'));
const deps = {
    [commonPkg.name]: `file:../pkgs/${commonTgz}`,
    [sigPkg.name]: `file:../pkgs/${sigTgz}`,
};
for (const [pkgDir, pkg] of [
    [sws, swsPkg],
    [path.join(web, 'Signalling'), sigPkg],
    [path.join(web, 'Common'), commonPkg],
]) {
    for (const [k, v] of Object.entries(pkg.dependencies || {})) {
        if (k.startsWith('@epicgames-ps/') || k.startsWith('@types/') || deps[k]) continue;
        const reqMajor = (String(v).match(/(\d+)/) || [])[1];
        const candidates = [
            path.join(pkgDir, 'node_modules', k, 'package.json'),
            path.join(sws, 'node_modules', k, 'package.json'),
            path.join(web, 'node_modules', k, 'package.json'),
        ];
        let chosen = null;
        for (const p of candidates) {
            if (!fs.existsSync(p)) continue;
            const ver = JSON.parse(fs.readFileSync(p, 'utf8')).version;
            if (!reqMajor || ver.startsWith(`${reqMajor}.`)) {
                chosen = ver;
                break;
            }
        }
        deps[k] = chosen || v;
    }
}
fs.writeFileSync(
    path.join(tmp, 'rt/package.json'),
    JSON.stringify({ name: 'ps2-signalling-runtime', private: true, dependencies: deps }, null, 2)
);
EOF
    (cd "$TMP_DIR/rt" && npm install --omit=dev --ignore-scripts --no-audit --no-fund --install-links >/dev/null)
    rm -rf "$SWS/node_modules"
    cp -R "$TMP_DIR/rt/node_modules" "$SWS/node_modules"
fi

echo "==> 清理 HTML 中的 Google Fonts 外链并同步默认首页"
node - "$WWW_DIR" "$WEB" "$OFFLINE_DIR" "$SWS" "$IS_CIRRUS" <<'EOF'
const fs = require('fs');
const path = require('path');
const [wwwDir, webDir, offlineDir, swsDir, isCirrusStr] = process.argv.slice(2);
const dirs = [
    wwwDir,
    path.join(webDir, 'Frontend/implementations/typescript/src'),
    path.join(webDir, 'Frontend/implementations/react/src'),
];
for (const d of dirs) {
    if (!fs.existsSync(d)) continue;
    for (const f of fs.readdirSync(d).filter((n) => n.endsWith('.html'))) {
        const full = path.join(d, f);
        const text = fs.readFileSync(full, 'utf8');
        const next = text
            .replace(/[ \t]*<link[^>]*fonts\.(googleapis|gstatic)\.com[^>]*>[ \t]*(\r?\n)?/gi, '')
            .replace(/font-family:(\s*)'?Montserrat'?(\s*);/g, "font-family:$1'Montserrat', Arial, sans-serif$2;");
        if (next !== text) fs.writeFileSync(full, next, 'utf8');
    }
}
fs.mkdirSync(wwwDir, { recursive: true });
fs.copyFileSync(path.join(offlineDir, 'web/index.html'), path.join(wwwDir, 'index.html'));

const swsPkg = JSON.parse(fs.readFileSync(path.join(swsDir, 'package.json'), 'utf8'));
const isCirrus = isCirrusStr === '1';
const info = {
    preparedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
    architecture: isCirrus ? 'cirrus' : 'wilbur',
    psInfraVersion: fs.existsSync(path.join(webDir, 'RELEASE_VERSION'))
        ? fs.readFileSync(path.join(webDir, 'RELEASE_VERSION'), 'utf8').trim()
        : 'unknown',
    nodeVersion: process.version,
    wilburVersion: swsPkg.version,
    signallingLib: isCirrus
        ? 'n/a'
        : JSON.parse(fs.readFileSync(path.join(webDir, 'Signalling/package.json'), 'utf8')).version,
    commonLib: isCirrus
        ? 'n/a'
        : JSON.parse(fs.readFileSync(path.join(webDir, 'Common/package.json'), 'utf8')).version,
    turnserver: false,
    npmRegistry: process.env.npm_config_registry || 'https://registry.npmjs.org/',
};
fs.writeFileSync(path.join(offlineDir, 'runtime-info.json'), JSON.stringify(info, null, 2));
EOF

echo "==> 执行 UE 规范端到端 Healthcheck"
node "$OFFLINE_DIR/ps2-offline.js" healthcheck
