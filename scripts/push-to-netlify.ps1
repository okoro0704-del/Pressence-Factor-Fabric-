# Push to Netlify (pushes to origin/main; Netlify deploys from there)
# Run from repo root: .\scripts\push-to-netlify.ps1
# Or from anywhere: .\scripts\push-to-netlify.ps1 -RepoPath "C:\Users\Hp\Desktop\PFF - Copy"

param(
  [string]$RepoPath = (Get-Location).Path
)

Set-Location $RepoPath

Write-Host "Repository: $RepoPath" -ForegroundColor Cyan
Write-Host ""

$status = git status --porcelain
if ($status) {
  Write-Host "Uncommitted changes:" -ForegroundColor Yellow
  git status -s
  Write-Host ""
  $commit = Read-Host "Commit and push? (y/n)"
  if ($commit -eq 'y' -or $commit -eq 'Y') {
    $msg = Read-Host "Commit message (or press Enter for 'chore: push to Netlify')"
    if ([string]::IsNullOrWhiteSpace($msg)) { $msg = "chore: push to Netlify" }
    git add -A
    git commit -m $msg
  }
} else {
  Write-Host "Working tree clean. Pushing existing commits..." -ForegroundColor Green
}

Write-Host ""
git push origin main
if ($LASTEXITCODE -eq 0) {
  Write-Host ""
  Write-Host "Push complete. Netlify will pick up the update." -ForegroundColor Green
} else {
  Write-Host ""
  Write-Host "Push failed. Check your Git credentials (e.g. GitHub login or token)." -ForegroundColor Red
  exit 1
}
