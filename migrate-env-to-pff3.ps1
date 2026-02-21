# ============================================================================
# PFF2 → PFF3 Environment Variables Migration Script
# Automatically adds all environment variables to Netlify PFF3 site
# ============================================================================

Write-Host "🚀 PFF Environment Variables Migration to PFF3" -ForegroundColor Cyan
Write-Host "=" * 70

# Check if Netlify CLI is installed
$netlifyInstalled = Get-Command netlify -ErrorAction SilentlyContinue
if (-not $netlifyInstalled) {
    Write-Host "❌ Netlify CLI not found. Installing..." -ForegroundColor Red
    npm install -g netlify-cli
}

Write-Host "`n📋 Adding environment variables to pff3.netlify.app..." -ForegroundColor Yellow

# Define all environment variables
$envVars = @{
    "NEXT_PUBLIC_THIRDWEB_CLIENT_ID" = "592694ecd2c638f524f961cfd7ab5956"
    "NEXT_PUBLIC_SUPABASE_URL" = "https://xbpomcmkzwunozrsbqxf.supabase.co"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY" = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhicG9tY21rend1bm96cnNicXhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MzUwNzUsImV4cCI6MjA4NTIxMTA3NX0.RIKURwGoev3epQczHR8vKfNcE_bqarX5OyJjodmPk9o"
    "PFF_MASTER_PASSWORD" = "202604070001"
    "PFF_EMERGENCY_BYPASS_SECRET" = "your_emergency_bypass_secret_here"
    "NEXT_PUBLIC_SENTINEL_ROOT_DEVICE" = "HP-LAPTOP-ROOT-SOVEREIGN-001"
    "NEXT_PUBLIC_ROOT_DEVICE_TYPE" = "LAPTOP"
    "NEXT_PUBLIC_ARCHITECT_MASTER_PHONE" = "+2348166666666"
    "SERPER_API_KEY" = "0c509db146a51f5418913d2fb7aa5fe82410274d"
    "TAVILY_API_KEY" = "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"
    "NEXT_PUBLIC_FOUNDATION_VAULT_ADDRESS" = "0xD42C5b854319e43e2F9e2c387b13b84D1dF542E0"
    "NEXT_PUBLIC_NATIONAL_TREASURY_ADDRESS" = "0x5E8474D3BaaF27A4531F34f6fA8c9E237ce1ebb4"
    "NEXT_PUBLIC_VIDA_CAP_TOKEN_ADDRESS" = "0xDc6EFba149b47f6F6d77AC0523c51F204964C12E"
    "NEXT_PUBLIC_NGN_VIDA_TOKEN_ADDRESS" = "0x5dD456B88f2be6688E7A04f78471A3868bd06811"
    "NEXT_PUBLIC_NATION_ADDRESS" = "0x5E8474D3BaaF27A4531F34f6fA8c9E237ce1ebb4"
    "NEXT_PUBLIC_CHAIN_ID" = "137"
    "NEXT_PUBLIC_PROJECT_NAME" = "PFF Sovereign Protocol"
    "NEXT_PUBLIC_TRIBUTE_STANDARD" = "11"
    "NEXT_PUBLIC_VITALIE_MODEL_SPLIT" = "0.50"
    "NEXT_PUBLIC_RSK_RPC_URL" = "https://public-node.rsk.co"
    "NEXT_PUBLIC_RSK_CHAIN_ID" = "30"
    "NEXT_PUBLIC_RSK_NETWORK_NAME" = "Rootstock Mainnet"
    "NEXT_PUBLIC_RSK_RPC_FALLBACK" = "https://rsk-mainnet.sovryn.app"
    "NEXT_PUBLIC_RSK_WS_URL" = "wss://public-node.rsk.co/websocket"
    "NEXT_PUBLIC_RSK_EXPLORER" = "https://explorer.rsk.co"
    "NEXT_PUBLIC_DLLR_ADDRESS" = "0xc1411567d2670e24d9C4DaAa7CdA95686e1250AA"
    "NEXT_PUBLIC_ZUSD_ADDRESS" = "0xdB107FA69E33f05180a4C2cE9c2E7CB481645C2d"
    "NEXT_PUBLIC_SOVRYN_PROTOCOL_ADDRESS" = "0x5A0D867e0D70Fcc6Ade25C3F1B89d618b5B4Eaa7"
    "NEXT_PUBLIC_SOVRYN_WEALTH_DASHBOARD_URL" = "https://sovryn.app"
    "NEXT_TELEMETRY_DISABLED" = "1"
    "CI" = "true"
    "NODE_VERSION" = "20"
    "NPM_FLAGS" = "--legacy-peer-deps"
    "NODE_OPTIONS" = "--max-old-space-size=4096"
    "NETLIFY_NEXT_PLUGIN_SKIP" = "true"
}

$count = 0
$total = $envVars.Count

foreach ($key in $envVars.Keys) {
    $count++
    $value = $envVars[$key]
    Write-Host "[$count/$total] Adding: $key" -ForegroundColor Green
    
    # Use Netlify CLI to set environment variable
    netlify env:set $key $value --site pff3
}

Write-Host "`n✅ Migration complete! $total environment variables added to PFF3." -ForegroundColor Green
Write-Host "`n🚀 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Go to https://app.netlify.com/sites/pff3/deploys"
Write-Host "   2. Click 'Trigger deploy' and then 'Clear cache and deploy site'"
Write-Host "   3. Wait for deployment to complete"
Write-Host "   4. Visit https://pff3.netlify.app to verify"
Write-Host ""

