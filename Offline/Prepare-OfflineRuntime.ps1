#Requires -Version 5.1
<#
.SYNOPSIS
  Builds the self-contained offline runtime for Unreal Engine Pixel Streaming:
  portable Node.js + compiled Signalling Server + symlink-free node_modules + frontend assets.

.DESCRIPTION
  Supports two directory layouts:
    1. PixelStreamingInfrastructure repository root layout (SignallingWebServer at root)
    2. Packaged UE project layout (Samples/PixelStreaming2/WebServers or Samples/PixelStreaming/WebServers)

  Supports multiple Unreal Engine versions:
    - UE 5.5 / 5.6 / 5.7 / 5.8 / master (Wilbur architecture: Common + Signalling + SignallingWebServer)
    - UE 5.3 / 5.4 (Cirrus architecture: SignallingWebServer/cirrus.js + Public)

  Steps:
    1. Download portable Node.js (version from NODE_VERSION, or v18.20.4 on Cirrus branches) and verify SHA256
    2. Install dependencies in a temporary workspace, build frontend (if www/player.html or Public/player.html is missing) and signalling server
    3. Generate a production-only, symlink-free node_modules directory
       (npm workspaces create directory junctions with absolute paths that break when copied to another machine)
    4. Replace SignallingWebServer dist and node_modules atomically
    5. Strip external Google Fonts links from HTML files (which block page loading in offline / intranet / China networks without VPN)
    6. Optional: prepare portable coturn for local TURN mode
    7. Run UE-standard end-to-end Healthcheck (/api/status and offline web player verification)

.PARAMETER Mirror
  official = nodejs.org + registry.npmjs.org (default)
  cn       = npmmirror.com mirror (recommended in China without VPN)
.PARAMETER NodeZip
  Path to a pre-downloaded node-<version>-win-x64.zip archive.
.PARAMETER TurnZip
  Path to a pre-downloaded turnserver.zip archive.
.PARAMETER NoTurn
  Skip downloading coturn (disables [Turn] Mode=local in PixelStreaming.ini).
.PARAMETER BuildFrontend
  Force rebuilding the TypeScript frontend (Frontend/library -> ui-library -> implementations/typescript).
.PARAMETER KeepTemp
  Keep temporary build directory for troubleshooting.
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
    throw "SignallingWebServer directory not found under $Root or $Root\WebServers."
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
    if ($code -ne 0) { Fail "Command failed (exit code $code): $Exe $($Arguments -join ' ')" }
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
    if ($code -ge 8) { Fail "robocopy failed (exit code $code): $From -> $To" }
}

function Get-FileText([string]$Path) { [IO.File]::ReadAllText($Path) }
function Set-FileText([string]$Path, [string]$Text) { [IO.File]::WriteAllText($Path, $Text, $Utf8NoBom) }

function Get-InstalledVersion([string[]]$SearchRoots, [string]$Package, [string]$DeclaredSpec) {
    $reqMajor = $null
    if ($DeclaredSpec -match '(\d+)') { $reqMajor = $Matches[1] }
    foreach ($r in $SearchRoots) {
        $pj = Join-Path $r ("node_modules\" + ($Package -replace '/', '\') + "\package.json")
        if (Test-Path $pj) {
            $ver = (Get-FileText $pj | ConvertFrom-Json).version
            if (-not $reqMajor -or $ver.StartsWith("$reqMajor.")) { return $ver }
        }
    }
    if ($DeclaredSpec) { return $DeclaredSpec }
    Fail "Dependency $Package not found in build roots"
}

function Invoke-Download([string]$Url, [string]$OutFile) {
    Write-Host "    Downloading $Url"
    Invoke-WebRequest -Uri $Url -OutFile $OutFile -UseBasicParsing
}

# ---------------------------------------------------------------------------
Write-Step 'Checking directory layout and UE architecture'
$IsCirrus = (Test-Path "$Sws\cirrus.js") -and -not (Test-Path "$Web\Common\package.json")
$WwwDir = if ($IsCirrus) { Join-Path $Sws 'Public' } else { Join-Path $Sws 'www' }

if ($IsCirrus) {
    foreach ($p in @("$Sws\package.json", "$Sws\cirrus.js")) {
        if (-not (Test-Path $p)) { Fail "Missing required file: $p" }
    }
} else {
    foreach ($p in @("$Web\package-lock.json", "$Web\Common\package.json", "$Web\Signalling\package.json", "$Sws\package.json")) {
        if (-not (Test-Path $p)) { Fail "Missing required file: $p" }
    }
}
if (-not (Test-Path $Tar)) { Fail "System tar.exe not found at $Tar (Windows 10 1803+ required)" }

$NodeVersion = if (Test-Path "$Web\NODE_VERSION") { (Get-FileText "$Web\NODE_VERSION").Trim() } else { 'v18.20.4' }
if ($NodeVersion -notmatch '^v\d+\.\d+\.\d+$') { Fail "Invalid NODE_VERSION value: '$NodeVersion'" }
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
Write-Host "    Architecture  : $(if ($IsCirrus) { 'Cirrus (UE 5.3/5.4)' } else { 'Wilbur (UE 5.5+)' })"
Write-Host "    PS Infra Ver  : $PsInfraVersion"
Write-Host "    Node Version  : $NodeVersion"
Write-Host "    npm Registry  : $env:npm_config_registry"
Write-Host "    Temp Dir      : $Tmp"

try {
    # -----------------------------------------------------------------------
    Write-Step "Preparing portable Node.js $NodeVersion"
    $dl = Join-Path $Tmp 'dl'
    New-Item -ItemType Directory -Force -Path $dl | Out-Null
    if ($NodeZip) {
        if (-not (Test-Path $NodeZip)) { Fail "File specified by -NodeZip not found: $NodeZip" }
        $zip = (Resolve-Path $NodeZip).Path
    } else {
        $zip = Join-Path $dl "$NodeName.zip"
        Invoke-Download "$NodeBase/$NodeName.zip" $zip
    }
    $sums = Join-Path $dl 'SHASUMS256.txt'
    try {
        Invoke-Download "$NodeBase/SHASUMS256.txt" $sums
        $line = Select-String -Path $sums -SimpleMatch "$NodeName.zip" | Select-Object -First 1
        if (-not $line) { Fail "$NodeName.zip not found in SHASUMS256.txt" }
        $expected = ($line.Line -split '\s+')[0].ToLower()
        $actual = (Get-FileHash -Algorithm SHA256 $zip).Hash.ToLower()
        if ($expected -ne $actual) { Fail "Node zip SHA256 mismatch:`nExpected: $expected`nActual:   $actual" }
        Write-Host "    SHA256 verified: $actual"
    } catch {
        if (-not $NodeZip) { throw }
        Write-Warning "Could not fetch official checksums; skipping verification for local -NodeZip: $($_.Exception.Message)"
    }
    Invoke-Native $Tmp $Tar @('-xf', $zip, '-C', $Tmp)
    $NodeDir = Join-Path $Tmp $NodeName
    $NodeExe = Join-Path $NodeDir 'node.exe'
    $NpmCli = Join-Path $NodeDir 'node_modules\npm\bin\npm-cli.js'
    if (-not (Test-Path $NodeExe) -or -not (Test-Path $NpmCli)) { Fail "Incomplete Node archive: $zip" }

    function Invoke-Npm([string]$Dir, [string[]]$NpmArgs) { Invoke-Native $Dir $NodeExe (@($NpmCli) + $NpmArgs) }

    $NeedFrontend = $BuildFrontend -or -not (Test-Path (Join-Path $WwwDir 'player.html'))

    if ($IsCirrus) {
        # -------------------------------------------------------------------
        Write-Step 'Preparing Cirrus (UE 5.3 / 5.4) runtime and frontend'
        if ($NeedFrontend -and (Test-Path "$Web\Frontend\implementations\typescript")) {
            Write-Step 'Building Cirrus frontend into SignallingWebServer\Public'
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
            Fail "Missing frontend file: $WwwDir\player.html"
        }
        $Rt = Join-Path $Tmp 'runtime'
        New-Item -ItemType Directory -Force -Path $Rt | Out-Null
        Copy-Item "$Sws\package.json" "$Rt\package.json"
        if (Test-Path "$Sws\package-lock.json") { Copy-Item "$Sws\package-lock.json" "$Rt\package-lock.json" }
        Invoke-Npm $Rt @('install', '--omit=dev', '--ignore-scripts', '--no-audit', '--no-fund', '--install-links')
        $reparse = @(Get-ChildItem "$Rt\node_modules" -Recurse -Force -Attributes ReparsePoint -ErrorAction SilentlyContinue)
        if ($reparse.Count -gt 0) { Fail "Symlink/junction remains in node_modules: $($reparse[0].FullName)" }
    } else {
        # -------------------------------------------------------------------
        Write-Step 'Installing workspace dependencies and building Wilbur signalling server'
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
        if (-not (Test-Path "$Ws\SignallingWebServer\dist\index.js")) { Fail 'Build did not produce SignallingWebServer\dist\index.js' }

        if ($NeedFrontend) {
            Write-Step 'Building frontend static assets (SignallingWebServer\www)'
            Invoke-Npm $Ws @('run', 'build:esm', '--workspace=Common')
            Invoke-Npm $Ws @('run', 'build:esm', '--workspace=Frontend/library')
            Invoke-Npm $Ws @('run', 'build:esm', '--workspace=Frontend/ui-library')
            $env:WEBPACK_OUTPUT_PATH = "$Ws\SignallingWebServer\www"
            Invoke-Npm $Ws @('run', 'build', '--workspace=Frontend/implementations/typescript')
            Remove-Item Env:\WEBPACK_OUTPUT_PATH -ErrorAction SilentlyContinue
            if (-not (Test-Path "$Ws\SignallingWebServer\www\player.html")) { Fail 'Frontend build did not produce www\player.html' }
        }

        # -------------------------------------------------------------------
        Write-Step 'Packaging standalone production node_modules (multi-UE compatible)'
        $npmIgnore = "src/`r`nnode_modules/`r`ndocs/`r`n*.tsbuildinfo`r`n"
        Set-FileText "$Ws\Common\.npmignore" $npmIgnore
        Set-FileText "$Ws\Signalling\.npmignore" $npmIgnore
        $Pkgs = Join-Path $Tmp 'pkgs'
        New-Item -ItemType Directory -Force -Path $Pkgs | Out-Null
        Invoke-Npm $Ws @('pack', '--workspace=Common', '--workspace=Signalling', '--pack-destination', $Pkgs)
        $commonTgz = Get-ChildItem $Pkgs -Filter 'epicgames-ps-lib-pixelstreamingcommon-*.tgz' | Select-Object -First 1
        $signallingTgz = Get-ChildItem $Pkgs -Filter 'epicgames-ps-lib-pixelstreamingsignalling-*.tgz' | Select-Object -First 1
        if (-not $commonTgz -or -not $signallingTgz) { Fail "npm pack did not generate expected tarballs in $Pkgs" }

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
            foreach ($prop in $p.dependencies.PSObject.Properties) {
                $name = $prop.Name
                $spec = [string]$prop.Value
                if ($name -like '@epicgames-ps/*' -or $name -like '@types/*' -or $deps.Contains($name)) { continue }
                $deps[$name] = Get-InstalledVersion $search $name $spec
            }
        }
        $Rt = Join-Path $Tmp 'runtime'
        New-Item -ItemType Directory -Force -Path $Rt | Out-Null
        $rtPkg = [ordered]@{ name = 'ps2-signalling-runtime'; private = $true; dependencies = $deps }
        Set-FileText "$Rt\package.json" ($rtPkg | ConvertTo-Json -Depth 5)
        Invoke-Npm $Rt @('install', '--omit=dev', '--ignore-scripts', '--no-audit', '--no-fund', '--install-links')

        $reparse = @(Get-ChildItem "$Rt\node_modules" -Recurse -Force -Attributes ReparsePoint -ErrorAction SilentlyContinue)
        if ($reparse.Count -gt 0) { Fail "Symlink/junction remains in node_modules: $($reparse[0].FullName)" }
        $probe = "for (const m of ['$signallingPkgName','$commonPkgName','express','express-openapi','commander','jsonc']) require(m); console.log('    runtime dependencies load OK');"
        Invoke-Native $Rt $NodeExe @('-e', $probe)
    }

    # -----------------------------------------------------------------------
    if (-not $NoTurn) {
        Write-Step 'Preparing portable coturn (for local TURN mode)'
        try {
            if ($TurnZip) {
                if (-not (Test-Path $TurnZip)) { Fail "File specified by -TurnZip not found: $TurnZip" }
                $tz = (Resolve-Path $TurnZip).Path
            } else {
                $tz = Join-Path $dl 'turnserver.zip'
                Invoke-Download $TurnUrl $tz
            }
            $TurnDir = Join-Path $Tmp 'coturn'
            New-Item -ItemType Directory -Force -Path $TurnDir | Out-Null
            Invoke-Native $Tmp $Tar @('-xf', $tz, '-C', $TurnDir)
            if (-not (Test-Path "$TurnDir\turnserver.exe")) { Fail 'turnserver.exe not found inside turnserver.zip' }
        } catch {
            $TurnDir = $null
            Write-Warning "coturn was not prepared; local TURN mode will be unavailable (direct LAN mode is unaffected): $($_.Exception.Message)"
        }
    }

    # -----------------------------------------------------------------------
    Write-Step 'Replacing runtime files'
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
    Write-Step 'Stripping external Google Fonts links from HTML files'
    $htmlFiles = @(Get-ChildItem $WwwDir -Filter '*.html' -File -ErrorAction SilentlyContinue) +
                 @(Get-ChildItem "$Web\Frontend\implementations\typescript\src" -Filter '*.html' -File -ErrorAction SilentlyContinue) +
                 @(Get-ChildItem "$Web\Frontend\implementations\react\src" -Filter '*.html' -File -ErrorAction SilentlyContinue)
    foreach ($f in $htmlFiles) {
        $text = Get-FileText $f.FullName
        $new = [regex]::Replace($text, '[ \t]*<link[^>]*fonts\.(googleapis|gstatic)\.com[^>]*>[ \t]*(\r?\n)?', '')
        $new = [regex]::Replace($new, "font-family:(\s*)'?Montserrat'?(\s*);", "font-family:`$1'Montserrat', Arial, sans-serif`$2;")
        if ($new -ne $text) {
            Set-FileText $f.FullName $new
            Write-Host "    Cleaned $($f.FullName.Substring($Root.Length + 1))"
        }
    }
    Copy-Item "$OfflineDir\web\index.html" (Join-Path $WwwDir 'index.html') -Force
    Write-Host "    Synced $WwwDir\index.html"

    # -----------------------------------------------------------------------
    Write-Step 'Writing runtime metadata and executing UE Standard Healthcheck'
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
    Write-Host 'Done! You can now:' -ForegroundColor Green
    Write-Host "  - Run $Root\Start-PixelStreaming.bat to start Pixel Streaming offline"
    Write-Host "  - Run Offline\Install-ToPackage.bat <PackagedProjectDir> to deploy into a packaged UE build"
    Write-Host '  - Copy this folder directly to any offline / intranet machine'
} finally {
    if ($KeepTemp) {
        Write-Host "Temporary directory kept at $Tmp"
    } else {
        $empty = Join-Path ([IO.Path]::GetTempPath()) ('ps2-empty-' + [Guid]::NewGuid().ToString('N'))
        New-Item -ItemType Directory -Force -Path $empty | Out-Null
        try { Invoke-Robocopy $empty $Tmp @('/MIR') } catch { }
        Remove-Item -Recurse -Force $Tmp, $empty -ErrorAction SilentlyContinue
    }
}
