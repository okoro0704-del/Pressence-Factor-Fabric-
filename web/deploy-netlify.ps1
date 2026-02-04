# Deploy PFF Web to Netlify
# Pushes to Git, then triggers a build on Netlify (avoids local "Uploading blobs" error).
# First time: cd to web folder and run: npx netlify link
# Your site must be connected to the same Git repo in Netlify.

$ErrorActionPreference = "Stop"
$webDir = if ($PSScriptRoot) { $PSScriptRoot } else { (Get-Location).Path }
if (-not (Test-Path (Join-Path $webDir "package.json"))) {
  $webDir = Join-Path (Get-Location) "web"
}
if (-not (Test-Path (Join-Path $webDir "package.json"))) {
  Write-Error "Run from repo root or web folder. package.json not found."
}
$repoRoot = (Resolve-Path (Join-Path $webDir "..")).Path

# 1. Push latest code to Git so Netlify can build it
Set-Location $repoRoot
if (Test-Path (Join-Path $repoRoot ".git")) {
  $branch = git rev-parse --abbrev-ref HEAD 2>$null
  if ($LASTEXITCODE -eq 0 -and $branch) {
    Write-Host "Pushing to origin/$branch..." -ForegroundColor Cyan
    git push origin $branch
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  }
} else {
  Write-Host "No .git found; skipping push. Connect this folder to Git and link the repo in Netlify." -ForegroundColor Yellow
}

# 2. Deploy to Netlify
Set-Location $webDir

# Option A: Non-interactive deploy with token/site (e.g. from Netlify UI -> Site settings -> API)
$auth = $env:NETLIFY_AUTH_TOKEN
$siteId = $env:NETLIFY_SITE_ID
if ($auth -and $siteId) {
  Write-Host "Building and deploying to Netlify (NETLIFY_SITE_ID set)..." -ForegroundColor Cyan
  npm run build 2>$null
  if (Test-Path "out") {
    npx netlify-cli deploy --prod --dir=out --auth="$auth" --site="$siteId"
  } else {
    Write-Host "Build output 'out' not found. Run: npm run build" -ForegroundColor Yellow
    npx netlify-cli deploy --prod --trigger --auth="$auth" --site="$siteId"
  }
} else {
  Write-Host "Triggering Netlify production deploy (build on Netlify)..." -ForegroundColor Cyan
  npx netlify deploy --prod --trigger
}

if ($LASTEXITCODE -ne 0) {
  Write-Host ""
  Write-Host "To push to Netlify:" -ForegroundColor Yellow
  Write-Host "  A) Link once: cd web && npx netlify link   (pick your site), then run this script again." -ForegroundColor Yellow
  Write-Host "  B) Or in Netlify: connect this repo (Base directory = web). Every git push will deploy." -ForegroundColor Yellow
  Write-Host "  C) Or set NETLIFY_AUTH_TOKEN + NETLIFY_SITE_ID (from Netlify -> Site settings -> API) and run again." -ForegroundColor Yellow
  exit $LASTEXITCODE
}
Write-Host "Done." -ForegroundColor Green
