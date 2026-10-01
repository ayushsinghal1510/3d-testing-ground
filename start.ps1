<#
.SYNOPSIS
    Start the avatar rooms app — the page and its API are one process, so this
    is the only thing to run.

.DESCRIPTION
    Dev is the default. -Prod builds first and then serves the build; the API
    runs inside Vite either way (dev server, or `vite preview`).

    Unlike the vx website, the database is required here: users and logins
    live in Neon, so a missing DATABASE_URL is a stop, not a warning.

.EXAMPLE
    .\start.ps1
    Dev server on :3100.

.EXAMPLE
    .\start.ps1 -Prod -Port 8080
    Build, then serve the build on :8080.

.EXAMPLE
    .\start.ps1 -Install -Typecheck
    Install dependencies, typecheck, then run dev.
#>

[CmdletBinding()]
param(
    # Build, then serve the build. Without it, the dev server runs.
    [switch] $Prod,

    # Build and exit. Does not serve it.
    [switch] $Build,

    # Port to listen on.
    [int] $Port = 3100,

    # npm install before anything else.
    [switch] $Install,

    # Run tsc --noEmit and stop if it fails.
    [switch] $Typecheck,

    # Delete dist/ before building.
    [switch] $Clean,

    # Print what would run, and run nothing.
    [switch] $DryRun
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

# Every path here is relative to the project, not to wherever this was invoked.
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Push-Location $root

function Write-Step ([string] $Text) { Write-Host "→ $Text" -ForegroundColor Cyan }
function Write-Warn ([string] $Text) { Write-Host "! $Text" -ForegroundColor Yellow }

function Invoke-Step {
    param([string] $Label, [string] $Command)

    Write-Step $Label

    if ($DryRun) {
        Write-Host "  $Command" -ForegroundColor DarkGray
        return
    }

    Invoke-Expression $Command

    if ($LASTEXITCODE -ne 0) {
        throw "$Label failed (exit $LASTEXITCODE)"
    }
}

try {
    if (-not (Test-Path 'package.json')) {
        throw "No package.json here — run this from the project directory."
    }

    if (-not (Test-Path '.env')) {
        Copy-Item '.env.example' '.env'
        throw "Created .env from .env.example — fill in DATABASE_URL, VX_FLOW_API_KEY and VX_VOICEBOT_GPU, then run again."
    }

    $envLines = @(Get-Content '.env')

    if (-not ($envLines -match '^\s*DATABASE_URL\s*=\s*\S')) {
        throw "DATABASE_URL is missing from .env — users and logins live in Neon."
    }

    if (-not ($envLines -match '^\s*VX_FLOW_API_KEY\s*=\s*\S')) {
        Write-Warn "VX_FLOW_API_KEY is not set — sign-in works, but every room will decline to start."
    }

    # Signs the session cookie. Generated once; changing it signs everyone out.
    $secret = $envLines | Where-Object { $_ -match '^\s*SESSION_SECRET\s*=' } | Select-Object -First 1
    if (-not $secret -or $secret -match '=\s*$' -or $secret -match '=\s*change-me\s*$') {
        Write-Step 'Generating SESSION_SECRET'
        if (-not $DryRun) {
            $value = node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
            $envLines = @($envLines | Where-Object { $_ -notmatch '^\s*SESSION_SECRET\s*=' }) + "SESSION_SECRET=$value"
            Set-Content '.env' $envLines
        }
    }

    if ($Install) {
        Invoke-Step 'Installing dependencies' 'npm install'
    }
    elseif (-not (Test-Path 'node_modules')) {
        Write-Warn "node_modules is missing — installing."
        Invoke-Step 'Installing dependencies' 'npm install'
    }

    if ($Typecheck) {
        Invoke-Step 'Typechecking' 'npx tsc --noEmit'
    }

    if ($Clean) {
        Write-Step 'Cleaning dist/'
        if (-not $DryRun -and (Test-Path 'dist')) {
            Remove-Item -Recurse -Force 'dist'
        }
    }

    if ($Build) {
        Invoke-Step 'Building' 'npm run build'
        Write-Host ''
        Write-Host "Built into dist/. Serve it with: .\start.ps1 -Prod -Port $Port" -ForegroundColor Green
        return
    }

    Write-Host ''
    Write-Host "No users yet? Create the super-admin first:" -ForegroundColor DarkGray
    Write-Host "  npm run add-user -- admin <password> '*' --super" -ForegroundColor DarkGray

    if ($Prod) {
        Invoke-Step 'Building' 'npm run build'
        Write-Host ''
        Write-Host "Serving the build on http://localhost:$Port" -ForegroundColor Green
        Write-Host ''
        Invoke-Step 'Starting' "npx vite preview --port $Port"
    }
    else {
        Write-Host ''
        Write-Host "Dev server on http://localhost:$Port" -ForegroundColor Green
        Write-Host ''
        Invoke-Step 'Starting' "npx vite dev --port $Port"
    }
}
finally {
    Pop-Location
}
