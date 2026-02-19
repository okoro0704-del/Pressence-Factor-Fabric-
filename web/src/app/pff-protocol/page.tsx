/**
 * PFF Protocol Page
 * 
 * Zero-friction sovereign financial system
 * - Invisible wallet (auto-created in browser)
 * - Gasless transactions (Account Abstraction)
 * - Real-time balance display
 * - Claim Wealth (vitalization)
 * - Convert to Naira (swap)
 */

import { PFFThirdwebProvider } from "@/components/pff/PFFThirdwebProvider";
import { PFFProtocolPage } from "@/components/pff/PFFProtocolPage";

export const metadata = {
  title: "PFF Sovereign Protocol | Zero Friction Finance",
  description: "Sovereign financial system with no signups, no passwords, and no gas fees",
};

export default function PFFProtocol() {
  return (
    <PFFThirdwebProvider>
      <PFFProtocolPage />
    </PFFThirdwebProvider>
  );
}

