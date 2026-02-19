/**
 * PFF Dashboard Page
 * 
 * Complete integration example showing:
 * - ThirdwebProvider configured for Polygon Mainnet
 * - ConnectButton with embeddedWallet (Guest/Auto-Connect)
 * - National Portfolio with live balances
 * - Vitalize button (FoundationVault)
 * - Swap button (NationalTreasury)
 * - All transactions gasless via Account Abstraction
 */

import { PFFThirdwebProvider } from "@/components/pff/PFFThirdwebProvider";
import { PFFDashboard } from "@/components/pff/PFFDashboard";

export const metadata = {
  title: "PFF Dashboard | Sovereign Financial System",
  description: "Connect to PFF Protocol smart contracts on Polygon. Zero signups, zero passwords, zero gas fees.",
};

export default function PFFDashboardPage() {
  return (
    <PFFThirdwebProvider>
      <PFFDashboard />
    </PFFThirdwebProvider>
  );
}

