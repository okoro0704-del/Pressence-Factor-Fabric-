# =============================================================================
# PUSH TO NETLIFY — One script: status, add, commit, push (origin main).
# Run from anywhere: .\push-to-netlify.ps1
# Or with message: .\push-to-netlify.ps1 -Message "fix: update UI"
# =============================================================================

param(
  [string]$Message = "",
  [switch]$NoCommit,
  [switch]$Yes
)

$ErrorActionPreference = "Stop"
$Root = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Parent $MyInvocation.MyCommand.Path }
Set-Location $Root

Write-Host ""
Write-Host "  PUSH TO NETLIFY" -ForegroundColor Cyan
Write-Host "  Repo: $Root" -ForegroundColor DarkGray
Write-Host ""

# 1) Status
$porcelain = git status --porcelain
$branch = git rev-parse --abbrev-ref HEAD 2>$null
$ahead = (git rev-list --count origin/$branch..HEAD 2>$null) -as [int]
$remote = git rev-parse --abbrev-ref --symbolic-full-name '@{u}' 2>$null

Write-Host "  Branch: $branch" -ForegroundColor White
if ($remote) { Write-Host "  Remote: $remote" -ForegroundColor DarkGray }
if ($ahead -gt 0) { Write-Host "  Ahead of origin: $ahead commit(s)" -ForegroundColor Yellow }
Write-Host ""

if ($porcelain) {
  Write-Host "  Uncommitted changes:" -ForegroundColor Yellow
  git status -s
  Write-Host ""

  if ($NoCommit) {
    Write-Host "  NoCommit: skipping add/commit. Push only." -ForegroundColor DarkGray
  } else {
    $doCommit = $Yes
    if (-not $Yes) {
      $r = Read-Host "  Commit all and push? (y/n)"
      $doCommit = ($r -eq 'y' -or $r -eq 'Y')
    }
    if ($doCommit) {
      if (-not $Message) { $Message = "chore: push to Netlify" }
      git add -A
      git commit -m $Message
      if ($LASTEXITCODE -ne 0) {
        Write-Host "  Commit failed or nothing to commit." -ForegroundColor Red
        exit 1
      }
    } else {
      Write-Host "  Skipped commit." -ForegroundColor DarkGray
      if ((git rev-list --count origin/$branch..HEAD 2>$null) -eq 0) {
        Write-Host "  Nothing to push." -ForegroundColor Yellow
        exit 0
      }
    }
  }
} else {
  Write-Host "  Working tree clean." -ForegroundColor Green
  if (-not $remote) {
    Write-Host "  No upstream set. Run: git push -u origin $branch" -ForegroundColor Yellow
  }
  if (($ahead -eq 0) -and -not $porcelain) {
    Write-Host "  Already up to date with origin. Nothing to push." -ForegroundColor DarkGray
    exit 0
  }
  Write-Host ""
}

# 2) Push
Write-Host "  Pushing to origin $branch..." -ForegroundColor Cyan
git push origin $branch
$pushOk = ($LASTEXITCODE -eq 0)
Write-Host ""

if ($pushOk) {
  Write-Host "  Done. Netlify will deploy from origin." -ForegroundColor Green
} else {
  Write-Host "  Push failed. Check credentials (GitHub login / token)." -ForegroundColor Red
  exit 1
}
