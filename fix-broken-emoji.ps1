# Fix broken emoji in UserProfileBalance.tsx
$filePath = "web\components\dashboard\UserProfileBalance.tsx"
$content = Get-Content $filePath -Raw -Encoding UTF8

# Replace the broken emoji span with clean SVG icon
$pattern = '<span className="text-2xl">[^<]+</span>'
$replacement = '<div className="flex-shrink-0">
              <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>'

$newContent = $content -replace $pattern, $replacement

# Save the file
$newContent | Set-Content $filePath -Encoding UTF8 -NoNewline

Write-Host "✅ Fixed broken emoji in UserProfileBalance.tsx" -ForegroundColor Green

