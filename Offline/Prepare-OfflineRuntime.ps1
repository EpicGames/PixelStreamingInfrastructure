#Requires -Version 5.1
<#
.SYNOPSIS
  生成 Pixel Streaming 信令服务器的"离线运行时": 便携 Node + 已编译的信令服务器 + 运行期依赖 + 前端静态资源。

.DESCRIPTION
  兼容两种目录布局:
    1. PixelStreamingInfrastructure 仓库根目录布局 (SignallingWebServer 在根目录)
    2. Samples/PixelStreaming2 或 Samples/PixelStreaming 打包布局 (WebServers/SignallingWebServer)

  兼容多版本 Unreal Engine:
    - UE 5.5 / 5.6 / 5.7 / 5.8 / master (Wilbur 架构: Common + Signalling + SignallingWebServer)
    - UE 5.3 / 5.4 (Cirrus 架构: SignallingWebServer/cirrus.js + Public)

  步骤:
    1. 下载便携 Node(版本取 NODE_VERSION, Cirrus 分支默认 v18.20.4)并校验 SHA256
    2. 在临时目录安装依赖, 编译前端(若尚未生成 www/player.html 或 Public/player.html)与信令服务器
    3. 用 npm 生成只含运行期依赖、没有符号链接/目录联接的 node_modules
       (npm workspaces 默认用目录联接, 联接里存的是绝对路径, 拷到别的电脑就断)
    4. 替换进 SignallingWebServer 的 dist 和 node_modules
    5. 去掉自带网页里的 Google 字体外链(内网/国内无 VPN 环境里会卡住网页加载)
    6. 可选: 准备 coturn 便携版, 供"本机 TURN"模式使用
    7. 执行 UE 规范的端到端 Healthcheck (校验 /api/status 与离线网页)
  全部成功之后才替换现有运行时, 中途失败不会破坏已有的可用版本。

.PARAMETER Mirror
  official = nodejs.org + registry.npmjs.org(默认)
  cn       = npmmirror.com 国内镜像(国内无 VPN 环境推荐)
.PARAMETER NodeZip
  已下载好的 node-<版本>-win-x64.zip。指定后不再下载 Node。
.PARAMETER TurnZip
  已下载好的 Epic coturn Windows 包(turnserver.zip)。
.PARAMETER NoTurn
  不准备 coturn。PixelStreaming.ini 里的 [Turn] Mode=local 将不可用。
.PARAMETER BuildFrontend
  强制重新编译前端 (Frontend/library -> ui-library -> implementations/typescript)。
.PARAMETER KeepTemp
  保留临时构建目录, 排查问题时用。
#>
[CmdletBinding()]
param(
    [ValidateSet('official', 'cn')][string]$Mirror = 'official',
    [string]$NodeZip,
    [string]$TurnZip,
    [switch]$NoTurn,
    [switch]$BuildFrontend,
    [switch]$KeepTemp
)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$TurnUrl = 'https://github.com/EpicGamesExt/PixelStreamingInfrastructure/releases/download/v4.5.2-coturn-windows/turnserver.zip'

$OfflineDir = $PSScriptRoot
$Root = Split-Path -Parent $OfflineDir
if (Test-Path (Join-Path $Root 'SignallingWebServer')) {
    $Web = $Root
} elseif (Test-Path (Join-Path $Root 'WebServers\SignallingWebServer')) {
    $Web = Join-Path $Root 'WebServers'
} else {
    throw "在 $Root 或 $Root\WebServers 下均未找到 SignallingWebServer 目录。"
}
$Sws = Join-Path $Web 'SignallingWebServer'
$Tar = Join-Path $env:SystemRoot 'System32\tar.exe'
$Utf8NoBom = New-Object System.Text.UTF8Encoding $false

function Write-Step([string]$Text) { Write-Host ''; Write-Host "==> $Text" -ForegroundColor Cyan }
function Fail([string]$Text) { throw $Text }

function Invoke-Native([string]$WorkDir, [string]$Exe, [string[]]$Arguments) {
    Push-Location $WorkDir
    $saved = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        & $Exe @Arguments
        $code = $LASTEXITCODE
    } finally {
        $ErrorActionPreference = $saved
        Pop-Location
    }
    if ($code -ne 0) { Fail "命令失败(退出码 $code): $Exe $($Arguments -join ' ')" }
}

function Invoke-Robocopy([string]$From, [string]$To, [string[]]$Extra) {
    $saved = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        & robocopy.exe $From $To @Extra /NFL /NDL /NJH /NJS /NP /R:2 /W:2 | Out-Null
        $code = $LASTEXITCODE
    } finally {
        $ErrorActionPreference = $saved
    }
    if ($code -ge 8) { Fail "robocopy 失败(退出码 $code): $From -> $To" }
}

function Get-FileText([string]$Path) { [IO.File]::ReadAllText($Path) }
function Set-FileText([string]$Path, [string]$Text) { [IO.File]::WriteAllText($Path, $Text, $Utf8NoBom) }

function Get-InstalledVersion([string[]]$SearchRoots, [string]$Package) {
    foreach ($r in $SearchRoots) {
        $pj = Join-Path $r ("node_modules\" + ($Package -replace '/', '\') + "\package.json")
        if (Test-Path $pj) { return (Get-FileText $pj | ConvertFrom-Json).version }
    }
    Fail "构建目录里找不到依赖 $Package"
}

function Invoke-Download([string]$Url, [string]$OutFile) {
    Write-Host "    下载 $Url"
    Invoke-WebRequest -Uri $Url -OutFile $OutFile -UseBasicParsing
}

# ---------------------------------------------------------------------------
Write-Step '检查目录与 UE 架构版本'
$IsCirrus = (Test-Path "$Sws\cirrus.js") -and -not (Test-Path "$Web\Common\package.json")
$WwwDir = if ($IsCirrus) { Join-Path $Sws 'Public' } else { Join-Path $Sws 'www' }

if ($IsCirrus) {
    foreach ($p in @("$Sws\package.json", "$Sws\cirrus.js")) {
        if (-not (Test-Path $p)) { Fail "缺少 $p" }
    }
} else {
    foreach ($p in @("$Web\package-lock.json", "$Web\Common\package.json", "$Web\Signalling\package.json", "$Sws\package.json")) {
        if (-not (Test-Path $p)) { Fail "缺少 $p" }
    }
}
if (-not (Test-Path $Tar)) { Fail "找不到 $Tar (需要 Windows 10 1803 或更新版本)" }

$NodeVersion = if (Test-Path "$Web\NODE_VERSION") { (Get-FileText "$Web\NODE_VERSION").Trim() } else { 'v18.20.4' }
if ($NodeVersion -notmatch '^v\d+\.\d+\.\d+$') { Fail "NODE_VERSION 内容不对: '$NodeVersion'" }
$NodeName = "node-$NodeVersion-win-x64"
$PsInfraVersion = if (Test-Path "$Web\DOWNLOAD_VERSION") {
    (Get-FileText "$Web\DOWNLOAD_VERSION").Trim()
} elseif (Test-Path "$Web\RELEASE_VERSION") {
    (Get-FileText "$Web\RELEASE_VERSION").Trim()
} else {
    'unknown'
}

if ($Mirror -eq 'cn') {
    $NodeBase = "https://npmmirror.com/mirrors/node/$NodeVersion"
    $env:npm_config_registry = 'https://registry.npmmirror.com/'
} else {
    $NodeBase = "https://nodejs.org/dist/$NodeVersion"
    $env:npm_config_registry = 'https://registry.npmjs.org/'
}
$env:npm_config_update_notifier = 'false'
$env:npm_config_fund = 'false'
$env:npm_config_audit = 'false'

$Tmp = Join-Path ([IO.Path]::GetTempPath()) ('ps2-offline-' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
New-Item -ItemType Directory -Force -Path $Tmp | Out-Null
Write-Host "    架构模式      : $(if ($IsCirrus) { 'Cirrus (UE 5.3/5.4)' } else { 'Wilbur (UE 5.5+)' })"
Write-Host "    PS 基础设施版本: $PsInfraVersion"
Write-Host "    Node 版本     : $NodeVersion"
Write-Host "    npm 源        : $env:npm_config_registry"
Write-Host "    临时目录      : $Tmp"

try {
    # -----------------------------------------------------------------------
    Write-Step "准备便携 Node $NodeVersion"
    $dl = Join-Path $Tmp 'dl'
    New-Item -ItemType Directory -Force -Path $dl | Out-Null
    if ($NodeZip) {
        if (-not (Test-Path $NodeZip)) { Fail "找不到 -NodeZip 指定的文件: $NodeZip" }
        $zip = (Resolve-Path $NodeZip).Path
    } else {
        $zip = Join-Path $dl "$NodeName.zip"
        Invoke-Download "$NodeBase/$NodeName.zip" $zip
    }
    $sums = Join-Path $dl 'SHASUMS256.txt'
    try {
        Invoke-Download "$NodeBase/SHASUMS256.txt" $sums
        $line = Select-String -Path $sums -SimpleMatch "$NodeName.zip" | Select-Object -First 1
        if (-not $line) { Fail "SHASUMS256.txt 里没有 $NodeName.zip" }
        $expected = ($line.Line -split '\s+')[0].ToLower()
        $actual = (Get-FileHash -Algorithm SHA256 $zip).Hash.ToLower()
        if ($expected -ne $actual) { Fail "Node 压缩包 SHA256 不匹配`n期望 $expected`n实际 $actual" }
        Write-Host "    SHA256 校验通过: $actual"
    } catch {
        if (-not $NodeZip) { throw }
        Write-Warning "拿不到官方校验和, 跳过校验(使用本地 -NodeZip): $($_.Exception.Message)"
    }
    Invoke-Native $Tmp $Tar @('-xf', $zip, '-C', $Tmp)
    $NodeDir = Join-Path $Tmp $NodeName
    $NodeExe = Join-Path $NodeDir 'node.exe'
    $NpmCli = Join-Path $NodeDir 'node_modules\npm\bin\npm-cli.js'
    if (-not (Test-Path $NodeExe) -or -not (Test-Path $NpmCli)) { Fail "Node 压缩包内容不完整: $zip" }

    function Invoke-Npm([string]$Dir, [string[]]$NpmArgs) { Invoke-Native $Dir $NodeExe (@($NpmCli) + $NpmArgs) }

    $NeedFrontend = $BuildFrontend -or -not (Test-Path (Join-Path $WwwDir 'player.html'))

    if ($IsCirrus) {
        # -------------------------------------------------------------------
        Write-Step '准备 Cirrus (UE 5.3 / 5.4) 运行时与前端'
        if ($NeedFrontend -and (Test-Path "$Web\Frontend\implementations\typescript")) {
            Write-Step '编译 Cirrus 前端到 SignallingWebServer\Public'
            $libName = (Get-FileText "$Web\Frontend\library\package.json" | ConvertFrom-Json).name -replace '/', '\'
            $uiLibName = (Get-FileText "$Web\Frontend\ui-library\package.json" | ConvertFrom-Json).name -replace '/', '\'
            Invoke-Npm "$Web\Frontend\library" @('install', '--ignore-scripts', '--no-audit', '--no-fund')
            Invoke-Npm "$Web\Frontend\library" @('run', 'build')
            Invoke-Npm "$Web\Frontend\ui-library" @('install', '--ignore-scripts', '--no-audit', '--no-fund')
            Invoke-Robocopy "$Web\Frontend\library" "$Web\Frontend\ui-library\node_modules\$libName" @('/MIR', '/XD', 'node_modules')
            Invoke-Npm "$Web\Frontend\ui-library" @('run', 'build')
            Invoke-Npm "$Web\Frontend\implementations\typescript" @('install', '--ignore-scripts', '--no-audit', '--no-fund')
            Invoke-Robocopy "$Web\Frontend\library" "$Web\Frontend\implementations\typescript\node_modules\$libName" @('/MIR', '/XD', 'node_modules')
            Invoke-Robocopy "$Web\Frontend\ui-library" "$Web\Frontend\implementations\typescript\node_modules\$uiLibName" @('/MIR', '/XD', 'node_modules')
            Invoke-Npm "$Web\Frontend\implementations\typescript" @('run', 'build')
        }
        if (-not (Test-Path (Join-Path $WwwDir 'player.html'))) {
            Fail "缺少 $WwwDir\player.html"
        }
        $Rt = Join-Path $Tmp 'runtime'
        New-Item -ItemType Directory -Force -Path $Rt | Out-Null
        Copy-Item "$Sws\package.json" "$Rt\package.json"
        if (Test-Path "$Sws\package-lock.json") { Copy-Item "$Sws\package-lock.json" "$Rt\package-lock.json" }
        Invoke-Npm $Rt @('install', '--omit=dev', '--ignore-scripts', '--no-audit', '--no-fund', '--install-links')
        $reparse = @(Get-ChildItem "$Rt\node_modules" -Recurse -Force -Attributes ReparsePoint -ErrorAction SilentlyContinue)
        if ($reparse.Count -gt 0) { Fail "node_modules 里仍有符号链接/目录联接: $($reparse[0].FullName)" }
    } else {
        # -------------------------------------------------------------------
        Write-Step '在临时目录安装依赖并编译 Wilbur 信令服务器'
        $Ws = Join-Path $Tmp 'ws'
        Invoke-Robocopy "$Web\Common" "$Ws\Common" @('/E', '/XD', 'node_modules', 'dist', 'docs')
        Invoke-Robocopy "$Web\Signalling" "$Ws\Signalling" @('/E', '/XD', 'node_modules', 'dist', 'docs')
        Invoke-Robocopy $Sws "$Ws\SignallingWebServer" @('/E', '/XD', 'node_modules', 'dist', 'www', 'logs', 'platform_scripts')
        Copy-Item "$Web\package-lock.json" "$Ws\package-lock.json"

        $workspaces = @('Common', 'Signalling', 'SignallingWebServer')
        if ($NeedFrontend) {
            Invoke-Robocopy "$Web\Frontend\library" "$Ws\Frontend\library" @('/E', '/XD', 'node_modules', 'dist', 'docs')
            Invoke-Robocopy "$Web\Frontend\ui-library" "$Ws\Frontend\ui-library" @('/E', '/XD', 'node_modules', 'dist', 'docs')
            Invoke-Robocopy "$Web\Frontend\implementations\typescript" "$Ws\Frontend\implementations\typescript" @('/E', '/XD', 'node_modules', 'dist')
            $workspaces += @('Frontend/library', 'Frontend/ui-library', 'Frontend/implementations/typescript')
        }

        $rootPkg = Get-FileText "$Web\package.json" | ConvertFrom-Json
        $typesNode = $rootPkg.devDependencies.'@types/node'
        if (-not $typesNode) { $typesNode = '^22.14.0' }
        $wsPkg = [ordered]@{
            name            = $rootPkg.name
            private         = $true
            workspaces      = $workspaces
            devDependencies = [ordered]@{ '@types/node' = $typesNode }
        }
        Set-FileText "$Ws\package.json" ($wsPkg | ConvertTo-Json -Depth 5)

        Invoke-Npm $Ws @('install', '--ignore-scripts', '--no-audit', '--no-fund')
        Invoke-Npm $Ws @('run', 'build:cjs', '--workspace=Common')
        Invoke-Npm $Ws @('run', 'build:cjs', '--workspace=Signalling')
        Invoke-Npm $Ws @('run', 'build', '--workspace=SignallingWebServer')
        if (-not (Test-Path "$Ws\SignallingWebServer\dist\index.js")) { Fail '编译后没有 SignallingWebServer\dist\index.js' }

        if ($NeedFrontend) {
            Write-Step '编译前端静态文件 (SignallingWebServer\www)'
            Invoke-Npm $Ws @('run', 'build:esm', '--workspace=Common')
            Invoke-Npm $Ws @('run', 'build:esm', '--workspace=Frontend/library')
            Invoke-Npm $Ws @('run', 'build:esm', '--workspace=Frontend/ui-library')
            $env:WEBPACK_OUTPUT_PATH = "$Ws\SignallingWebServer\www"
            Invoke-Npm $Ws @('run', 'build', '--workspace=Frontend/implementations/typescript')
            Remove-Item Env:\WEBPACK_OUTPUT_PATH -ErrorAction SilentlyContinue
            if (-not (Test-Path "$Ws\SignallingWebServer\www\player.html")) { Fail '前端编译后没有 www\player.html' }
        }

        # -------------------------------------------------------------------
        Write-Step '生成只含运行期依赖的 node_modules (兼容多版本 UE 包名)'
        $npmIgnore = "src/`r`nnode_modules/`r`ndocs/`r`n*.tsbuildinfo`r`n"
        Set-FileText "$Ws\Common\.npmignore" $npmIgnore
        Set-FileText "$Ws\Signalling\.npmignore" $npmIgnore
        $Pkgs = Join-Path $Tmp 'pkgs'
        New-Item -ItemType Directory -Force -Path $Pkgs | Out-Null
        Invoke-Npm $Ws @('pack', '--workspace=Common', '--workspace=Signalling', '--pack-destination', $Pkgs)
        $commonTgz = Get-ChildItem $Pkgs -Filter 'epicgames-ps-lib-pixelstreamingcommon-*.tgz' | Select-Object -First 1
        $signallingTgz = Get-ChildItem $Pkgs -Filter 'epicgames-ps-lib-pixelstreamingsignalling-*.tgz' | Select-Object -First 1
        if (-not $commonTgz -or -not $signallingTgz) { Fail "npm pack 没有生成预期的 tgz: $Pkgs" }

        $commonPkgName = (Get-FileText "$Ws\Common\package.json" | ConvertFrom-Json).name
        $signallingPkgName = (Get-FileText "$Ws\Signalling\package.json" | ConvertFrom-Json).name

        $search = @("$Ws\SignallingWebServer", "$Ws\Signalling", "$Ws\Common", $Ws)
        $deps = [ordered]@{
            $commonPkgName     = "file:../pkgs/$($commonTgz.Name)"
            $signallingPkgName = "file:../pkgs/$($signallingTgz.Name)"
        }
        foreach ($pj in @("$Ws\SignallingWebServer\package.json", "$Ws\Signalling\package.json", "$Ws\Common\package.json")) {
            $p = Get-FileText $pj | ConvertFrom-Json
            if (-not $p.dependencies) { continue }
            foreach ($name in $p.dependencies.PSObject.Properties.Name) {
                if ($name -like '@epicgames-ps/*' -or $name -like '@types/*' -or $deps.Contains($name)) { continue }
                $deps[$name] = Get-InstalledVersion $search $name
            }
        }
        $Rt = Join-Path $Tmp 'runtime'
        New-Item -ItemType Directory -Force -Path $Rt | Out-Null
        $rtPkg = [ordered]@{ name = 'ps2-signalling-runtime'; private = $true; dependencies = $deps }
        Set-FileText "$Rt\package.json" ($rtPkg | ConvertTo-Json -Depth 5)
        Invoke-Npm $Rt @('install', '--omit=dev', '--ignore-scripts', '--no-audit', '--no-fund', '--install-links')

        $reparse = @(Get-ChildItem "$Rt\node_modules" -Recurse -Force -Attributes ReparsePoint -ErrorAction SilentlyContinue)
        if ($reparse.Count -gt 0) { Fail "node_modules 里仍有符号链接/目录联接: $($reparse[0].FullName)" }
        $probe = "for (const m of ['$signallingPkgName','$commonPkgName','express','express-openapi','commander','jsonc']) require(m); console.log('    runtime dependencies load OK');"
        Invoke-Native $Rt $NodeExe @('-e', $probe)
    }

    # -----------------------------------------------------------------------
    if (-not $NoTurn) {
        Write-Step '准备 coturn(本机 TURN 模式用)'
        try {
            if ($TurnZip) {
                if (-not (Test-Path $TurnZip)) { Fail "找不到 -TurnZip 指定的文件: $TurnZip" }
                $tz = (Resolve-Path $TurnZip).Path
            } else {
                $tz = Join-Path $dl 'turnserver.zip'
                Invoke-Download $TurnUrl $tz
            }
            $TurnDir = Join-Path $Tmp 'coturn'
            New-Item -ItemType Directory -Force -Path $TurnDir | Out-Null
            Invoke-Native $Tmp $Tar @('-xf', $tz, '-C', $TurnDir)
            if (-not (Test-Path "$TurnDir\turnserver.exe")) { Fail 'turnserver.zip 里没有 turnserver.exe' }
        } catch {
            $TurnDir = $null
            Write-Warning "coturn 没准备好, 本机 TURN 模式不可用(不影响默认的内网直连): $($_.Exception.Message)"
            Write-Warning "可以另外下载 $TurnUrl 后用 -TurnZip 指定。"
        }
    }

    # -----------------------------------------------------------------------
    Write-Step '替换运行时'
    Invoke-Robocopy "$Rt\node_modules" "$Sws\node_modules" @('/MIR')
    if (-not $IsCirrus) {
        Invoke-Robocopy "$Ws\SignallingWebServer\dist" "$Sws\dist" @('/MIR')
        if ($NeedFrontend) {
            Invoke-Robocopy "$Ws\SignallingWebServer\www" $WwwDir @('/MIR')
        }
    }
    New-Item -ItemType Directory -Force -Path "$OfflineDir\node" | Out-Null
    Copy-Item $NodeExe "$OfflineDir\node\node.exe" -Force
    Copy-Item (Join-Path $NodeDir 'LICENSE') "$OfflineDir\node\LICENSE" -Force
    if ($TurnDir) { Invoke-Robocopy $TurnDir "$OfflineDir\coturn" @('/MIR') }
    Write-Host "    node          -> $OfflineDir\node\node.exe"
    if (-not $IsCirrus) { Write-Host "    dist          -> $Sws\dist" }
    Write-Host "    node_modules  -> $Sws\node_modules"
    if ($TurnDir) { Write-Host "    coturn        -> $OfflineDir\coturn" }

    # -----------------------------------------------------------------------
    Write-Step '去掉网页里的 Google 字体外链'
    $htmlFiles = @(Get-ChildItem $WwwDir -Filter '*.html' -File -ErrorAction SilentlyContinue) +
                 @(Get-ChildItem "$Web\Frontend\implementations\typescript\src" -Filter '*.html' -File -ErrorAction SilentlyContinue) +
                 @(Get-ChildItem "$Web\Frontend\implementations\react\src" -Filter '*.html' -File -ErrorAction SilentlyContinue)
    foreach ($f in $htmlFiles) {
        $text = Get-FileText $f.FullName
        $new = [regex]::Replace($text, '[ \t]*<link[^>]*fonts\.(googleapis|gstatic)\.com[^>]*>[ \t]*(\r?\n)?', '')
        $new = [regex]::Replace($new, "font-family:(\s*)'?Montserrat'?(\s*);", "font-family:`$1'Montserrat', Arial, sans-serif`$2;")
        if ($new -ne $text) {
            Set-FileText $f.FullName $new
            Write-Host "    已处理 $($f.FullName.Substring($Root.Length + 1))"
        }
    }
    Copy-Item "$OfflineDir\web\index.html" (Join-Path $WwwDir 'index.html') -Force
    Write-Host "    已放入 $WwwDir\index.html"

    # -----------------------------------------------------------------------
    Write-Step '写入运行时信息并执行 UE 规范 Healthcheck'
    $info = [ordered]@{
        preparedAt       = (Get-Date).ToString('yyyy-MM-dd HH:mm:ss')
        architecture     = if ($IsCirrus) { 'cirrus' } else { 'wilbur' }
        psInfraVersion   = $PsInfraVersion
        nodeVersion      = $NodeVersion
        wilburVersion    = (Get-FileText "$Sws\package.json" | ConvertFrom-Json).version
        signallingLib    = if ($IsCirrus) { 'n/a' } else { (Get-FileText "$Ws\Signalling\package.json" | ConvertFrom-Json).version }
        commonLib        = if ($IsCirrus) { 'n/a' } else { (Get-FileText "$Ws\Common\package.json" | ConvertFrom-Json).version }
        turnserver       = [bool](Test-Path "$OfflineDir\coturn\turnserver.exe")
        npmRegistry      = $env:npm_config_registry
    }
    Set-FileText "$OfflineDir\runtime-info.json" ($info | ConvertTo-Json -Depth 3)
    Invoke-Native $Root "$OfflineDir\node\node.exe" @("$OfflineDir\ps2-offline.js", 'healthcheck')

    Write-Host ''
    Write-Host '完成。现在可以:' -ForegroundColor Green
    Write-Host "  - 在本机双击 $Root\Start-PixelStreaming.bat 验证"
    Write-Host "  - 运行 Offline\Install-ToPackage.bat <UE打包目录> 部署到打包产物"
    Write-Host '  - 或直接把整个目录拷到内网电脑'
} finally {
    if ($KeepTemp) {
        Write-Host "临时目录保留在 $Tmp"
    } else {
        $empty = Join-Path ([IO.Path]::GetTempPath()) ('ps2-empty-' + [Guid]::NewGuid().ToString('N'))
        New-Item -ItemType Directory -Force -Path $empty | Out-Null
        try { Invoke-Robocopy $empty $Tmp @('/MIR') } catch { }
        Remove-Item -Recurse -Force $Tmp, $empty -ErrorAction SilentlyContinue
    }
}
