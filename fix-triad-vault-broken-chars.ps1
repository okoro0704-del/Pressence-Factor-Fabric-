# Fix broken characters in UserProfileBalance.tsx - Triad Vault System
$filePath = "web\components\dashboard\UserProfileBalance.tsx"
$content = Get-Content $filePath -Raw -Encoding UTF8

# Fix 1: Replace broken header with clean SVG icons
$pattern1 = '<h3 className="text-sm font-semibold text-\[#e8c547\] uppercase tracking-wider mb-6 text-center">\s*[^<]+THE ARCHITECT''S TRIAD VAULT SYSTEM[^<]+\s*</h3>'
$replacement1 = '<div className="flex items-center justify-center gap-3 mb-6">
          <svg className="w-5 h-5 text-[#e8c547]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h3 className="text-sm font-semibold text-[#e8c547] uppercase tracking-wider">
            THE ARCHITECT''S TRIAD VAULT SYSTEM
          </h3>
          <svg className="w-5 h-5 text-[#e8c547]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>'

# Fix 2: Replace broken LOCKED badge
$pattern2 = '<span className="text-xs font-mono text-red-400 bg-red-500/20 px-2 py-1 rounded animate-pulse">[^<]+LOCKED</span>'
$replacement2 = '<span className="text-xs font-mono text-red-400 bg-red-500/20 px-2 py-1 rounded animate-pulse flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  LOCKED
                </span>'

# Fix 3: Replace broken lock icon in footer text
$pattern3 = '<p className="text-\[10px\] text-\[#6b6b70\] mt-2 text-center uppercase tracking-wide">\s*[^<]+Locked Vault Releases at 1 Billion PFF Users\s*</p>'
$replacement3 = '<p className="text-[10px] text-[#6b6b70] mt-2 text-center uppercase tracking-wide flex items-center justify-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            Locked Vault Releases at 1 Billion PFF Users
          </p>'

# Apply replacements
$newContent = $content -replace $pattern1, $replacement1
$newContent = $newContent -replace $pattern2, $replacement2
$newContent = $newContent -replace $pattern3, $replacement3

# Save the file
$newContent | Set-Content $filePath -Encoding UTF8 -NoNewline

Write-Host "✅ Fixed broken characters in Triad Vault System" -ForegroundColor Green

