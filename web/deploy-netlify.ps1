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

# 2. Trigger deploy on Netlify (build runs on Netlify; no local blob upload)
Set-Location $webDir
Write-Host "Triggering Netlify production deploy..." -ForegroundColor Cyan
npx netlify deploy --prod --trigger
if ($LASTEXITCODE -ne 0) {
  Write-Host ""
  Write-Host "If you see 'Project not found' or 'CI configured':" -ForegroundColor Yellow
  Write-Host "  1. Run: npx netlify link   (in the web folder) and pick your site." -ForegroundColor Yellow
  Write-Host "  2. In Netlify: Site settings -> Build & deploy -> Link repository (connect your Git repo)." -ForegroundColor Yellow
  Write-Host "  3. Set Base directory to: web" -ForegroundColor Yellow
  exit $LASTEXITCODE
}
Write-Host "Done." -ForegroundColor Green
