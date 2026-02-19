/**
 * PFF Thirdweb Provider
 * 
 * Configures invisible wallet system with:
 * - Embedded Wallet (Guest Mode - auto-created in browser)
 * - Account Abstraction (ERC-4337 for gasless transactions)
 * - Paymaster (sponsors gas fees)
 */

"use client";

import { ThirdwebProvider, embeddedWallet, smartWallet } from "@thirdweb-dev/react";
import { Polygon } from "@thirdweb-dev/chains";
import { ReactNode } from "react";

// Thirdweb Client ID (get from https://thirdweb.com/dashboard)
const THIRDWEB_CLIENT_ID = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || "your_client_id_here";

// Smart Wallet Factory Address (for Account Abstraction)
const SMART_WALLET_FACTORY = process.env.NEXT_PUBLIC_SMART_WALLET_FACTORY || "0x...";

// Paymaster URL (for gasless transactions)
const PAYMASTER_URL = process.env.NEXT_PUBLIC_PAYMASTER_URL;

interface PFFThirdwebProviderProps {
  children: ReactNode;
}

export function PFFThirdwebProvider({ children }: PFFThirdwebProviderProps) {
  return (
    <ThirdwebProvider
      clientId={THIRDWEB_CLIENT_ID}
      activeChain={Polygon}
      supportedChains={[Polygon]}
      autoConnect={true}
      supportedWallets={[
        // Embedded Wallet (Guest Mode - invisible to user)
        embeddedWallet({
          auth: {
            options: ["guest"], // Guest mode - no signup required
          },
          recommended: true,
        }),
        // Smart Wallet (Account Abstraction for gasless transactions)
        smartWallet({
          factoryAddress: SMART_WALLET_FACTORY,
          gasless: true, // Enable gasless transactions
          personalWallets: [
            embeddedWallet({
              auth: {
                options: ["guest"],
              },
            }),
          ],
        }),
      ]}
      sdkOptions={{
        gasless: {
          openzeppelin: {
            relayerUrl: PAYMASTER_URL,
          },
        },
      }}
    >
      {children}
    </ThirdwebProvider>
  );
}

