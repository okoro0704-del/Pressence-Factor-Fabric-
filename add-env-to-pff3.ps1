# PFF2 to PFF3 Environment Variables Migration
Write-Host "Adding environment variables to PFF3..." -ForegroundColor Cyan

# Check if Netlify CLI is installed
try {
    netlify --version | Out-Null
} catch {
    Write-Host "Installing Netlify CLI..." -ForegroundColor Yellow
    npm install -g netlify-cli
}

# Add each environment variable
Write-Host "Setting variables..." -ForegroundColor Green

netlify env:set NEXT_PUBLIC_THIRDWEB_CLIENT_ID "592694ecd2c638f524f961cfd7ab5956" --site pff3
netlify env:set NEXT_PUBLIC_SUPABASE_URL "https://xbpomcmkzwunozrsbqxf.supabase.co" --site pff3
netlify env:set NEXT_PUBLIC_SUPABASE_ANON_KEY "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhicG9tY21rend1bm96cnNicXhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MzUwNzUsImV4cCI6MjA4NTIxMTA3NX0.RIKURwGoev3epQczHR8vKfNcE_bqarX5OyJjodmPk9o" --site pff3
netlify env:set PFF_MASTER_PASSWORD "202604070001" --site pff3
netlify env:set PFF_EMERGENCY_BYPASS_SECRET "your_emergency_bypass_secret_here" --site pff3
netlify env:set NEXT_PUBLIC_SENTINEL_ROOT_DEVICE "HP-LAPTOP-ROOT-SOVEREIGN-001" --site pff3
netlify env:set NEXT_PUBLIC_ROOT_DEVICE_TYPE "LAPTOP" --site pff3
netlify env:set NEXT_PUBLIC_ARCHITECT_MASTER_PHONE "+2348166666666" --site pff3
netlify env:set SERPER_API_KEY "0c509db146a51f5418913d2fb7aa5fe82410274d" --site pff3
netlify env:set TAVILY_API_KEY "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" --site pff3
netlify env:set NEXT_PUBLIC_FOUNDATION_VAULT_ADDRESS "0xD42C5b854319e43e2F9e2c387b13b84D1dF542E0" --site pff3
netlify env:set NEXT_PUBLIC_NATIONAL_TREASURY_ADDRESS "0x5E8474D3BaaF27A4531F34f6fA8c9E237ce1ebb4" --site pff3
netlify env:set NEXT_PUBLIC_VIDA_CAP_TOKEN_ADDRESS "0xDc6EFba149b47f6F6d77AC0523c51F204964C12E" --site pff3
netlify env:set NEXT_PUBLIC_NGN_VIDA_TOKEN_ADDRESS "0x5dD456B88f2be6688E7A04f78471A3868bd06811" --site pff3
netlify env:set NEXT_PUBLIC_NATION_ADDRESS "0x5E8474D3BaaF27A4531F34f6fA8c9E237ce1ebb4" --site pff3
netlify env:set NEXT_PUBLIC_CHAIN_ID "137" --site pff3
netlify env:set NEXT_PUBLIC_PROJECT_NAME "PFF Sovereign Protocol" --site pff3
netlify env:set NEXT_PUBLIC_TRIBUTE_STANDARD "11" --site pff3
netlify env:set NEXT_PUBLIC_VITALIE_MODEL_SPLIT "0.50" --site pff3
netlify env:set NEXT_PUBLIC_RSK_RPC_URL "https://public-node.rsk.co" --site pff3
netlify env:set NEXT_PUBLIC_RSK_CHAIN_ID "30" --site pff3
netlify env:set NEXT_PUBLIC_RSK_NETWORK_NAME "Rootstock Mainnet" --site pff3
netlify env:set NEXT_PUBLIC_RSK_RPC_FALLBACK "https://rsk-mainnet.sovryn.app" --site pff3
netlify env:set NEXT_PUBLIC_RSK_WS_URL "wss://public-node.rsk.co/websocket" --site pff3
netlify env:set NEXT_PUBLIC_RSK_EXPLORER "https://explorer.rsk.co" --site pff3
netlify env:set NEXT_PUBLIC_DLLR_ADDRESS "0xc1411567d2670e24d9C4DaAa7CdA95686e1250AA" --site pff3
netlify env:set NEXT_PUBLIC_ZUSD_ADDRESS "0xdB107FA69E33f05180a4C2cE9c2E7CB481645C2d" --site pff3
netlify env:set NEXT_PUBLIC_SOVRYN_PROTOCOL_ADDRESS "0x5A0D867e0D70Fcc6Ade25C3F1B89d618b5B4Eaa7" --site pff3
netlify env:set NEXT_PUBLIC_SOVRYN_WEALTH_DASHBOARD_URL "https://sovryn.app" --site pff3
netlify env:set NEXT_TELEMETRY_DISABLED "1" --site pff3
netlify env:set CI "true" --site pff3
netlify env:set NODE_VERSION "20" --site pff3
netlify env:set NPM_FLAGS "--legacy-peer-deps" --site pff3
netlify env:set NODE_OPTIONS "--max-old-space-size=4096" --site pff3
netlify env:set NETLIFY_NEXT_PLUGIN_SKIP "true" --site pff3

Write-Host "Done! All variables added to PFF3." -ForegroundColor Green
Write-Host "Visit https://app.netlify.com/sites/pff3/deploys to trigger a new deployment" -ForegroundColor Cyan

