# NUCLEAR FIX: Replace ALL broken UTF-8 characters in UserProfileBalance.tsx
$filePath = "web\components\dashboard\UserProfileBalance.tsx"
$content = Get-Content $filePath -Raw -Encoding UTF8

# Import the sanitization utility
$sanitizePattern = '[ÃƒÆ'†â€™šÂ¢â‚¬Â¦¡Å¡¯¸Ââ€œ]+'

# Fix all broken Naira symbols - replace with clean ₦
$content = $content -replace 'ÃƒÆ'Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ'Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ'Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦', '₦'

# Fix broken lock emoji patterns
$content = $content -replace 'ÃƒÆ'Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ'Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ'Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ'Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â½', '🔓'
$content = $content -replace 'ÃƒÆ'Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ'Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ'Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂºÃƒÆ'Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ'Ã†â€™Ãƒâ€šÃ‚Â¯ÃƒÆ'Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ'Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â', '🔒'

# Fix any remaining broken UTF-8 sequences - remove them entirely
$content = $content -replace 'ÃƒÆ'[^a-zA-Z0-9\s<>{}()[\].,;:''"`!@#$%^&*+=|\\/?-]+', ''
$content = $content -replace 'Ã[ƒÆ'†â€™šÂ¢â‚¬Â¦¡Å¡¯¸]+', ''
$content = $content -replace 'â€[™šž¢]+', ''
$content = $content -replace 'Â[¢£¤¥¦§¨©ª«¬®¯°±²³´µ¶·¸¹º»¼½¾¿]+', ''

# Save the file
$content | Set-Content $filePath -Encoding UTF8 -NoNewline

Write-Host "✅ NUCLEAR FIX: Removed ALL broken UTF-8 characters" -ForegroundColor Green
Write-Host "   - Fixed broken Naira symbols → ₦" -ForegroundColor Cyan
Write-Host "   - Fixed broken lock emojis → 🔓🔒" -ForegroundColor Cyan
Write-Host "   - Removed all ghost characters" -ForegroundColor Cyan

