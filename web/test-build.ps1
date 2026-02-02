# PFF Build Test Script (PowerShell)
# Tests the build locally before deploying to Netlify
# Run: .\test-build.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PFF BUILD TEST - NETLIFY STATIC EXPORT" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check Node version
Write-Host "[1/6] Checking Node.js version..." -ForegroundColor Yellow
$nodeVersion = node --version
Write-Host "Node version: $nodeVersion" -ForegroundColor Green
Write-Host ""

# Step 2: Check if we're in the web directory
Write-Host "[2/6] Checking directory..." -ForegroundColor Yellow
if (!(Test-Path "package.json")) {
    Write-Host "ERROR: package.json not found. Are you in the web directory?" -ForegroundColor Red
    Write-Host "Run: cd web" -ForegroundColor Yellow
    exit 1
}
Write-Host "✓ In correct directory" -ForegroundColor Green
Write-Host ""

# Step 3: Install dependencies
Write-Host "[3/6] Installing dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: npm install failed" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Dependencies installed" -ForegroundColor Green
Write-Host ""

# Step 4: Clean previous build
Write-Host "[4/6] Cleaning previous build..." -ForegroundColor Yellow
if (Test-Path "out") {
    Remove-Item -Recurse -Force "out"
    Write-Host "✓ Removed old 'out' directory" -ForegroundColor Green
}
if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next"
    Write-Host "✓ Removed old '.next' directory" -ForegroundColor Green
}
Write-Host ""

# Step 5: Run build
Write-Host "[5/6] Running build..." -ForegroundColor Yellow
Write-Host "Command: npm run build" -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "BUILD FAILED!" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Common fixes:" -ForegroundColor Yellow
    Write-Host "1. Check next.config.js has 'output: export'" -ForegroundColor White
    Write-Host "2. Ensure no API routes in pages/api/" -ForegroundColor White
    Write-Host "3. Remove PWA plugins if present" -ForegroundColor White
    Write-Host "4. Check for TypeScript errors" -ForegroundColor White
    Write-Host ""
    exit 1
}
Write-Host "✓ Build completed successfully" -ForegroundColor Green
Write-Host ""

# Step 6: Verify output
Write-Host "[6/6] Verifying build output..." -ForegroundColor Yellow

if (!(Test-Path "out")) {
    Write-Host "ERROR: 'out' directory not created" -ForegroundColor Red
    exit 1
}
Write-Host "✓ 'out' directory exists" -ForegroundColor Green

if (!(Test-Path "out/ArchitectCommandCenter.html")) {
    Write-Host "WARNING: ArchitectCommandCenter.html not found in out/" -ForegroundColor Yellow
    Write-Host "Checking for index.html..." -ForegroundColor Yellow
}

if (Test-Path "out/index.html") {
    Write-Host "✓ index.html exists" -ForegroundColor Green
}

# Count files in out directory
$fileCount = (Get-ChildItem -Path "out" -Recurse -File).Count
Write-Host "✓ Generated $fileCount files" -ForegroundColor Green
Write-Host ""

# Success message
Write-Host "========================================" -ForegroundColor Green
Write-Host "BUILD TEST PASSED!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Test locally: npx serve out" -ForegroundColor White
Write-Host "2. Commit changes: git add . && git commit -m 'fix: build configuration'" -ForegroundColor White
Write-Host "3. Push to deploy: git push origin main" -ForegroundColor White
Write-Host ""
Write-Host "Your build is ready for Netlify deployment! 🚀" -ForegroundColor Green

