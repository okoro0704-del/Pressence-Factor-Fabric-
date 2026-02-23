/**
 * Custom Hook: usePFFBalances
 * 
 * Fetches real-time balances for VIDA CAP and ngnVIDA tokens
 * Automatically formats uint256 values to human-readable numbers
 */

import { useAddress, useContract, useContractRead } from "@thirdweb-dev/react";
import { useEffect, useState } from "react";
import { PFF_CONTRACTS, ERC20_ABI, FOUNDATION_VAULT_ABI } from "../contracts";
import { ethers } from "ethers";

export interface PFFBalances {
  vidaCap: {
    spendable: string;
    locked: string;
    total: string;
    raw: {
      spendable: bigint;
      locked: bigint;
      total: bigint;
    };
  };
  ngnVida: {
    balance: string;
    raw: bigint;
  };
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Format uint256 balance to human-readable number
 * Divides by 10^18 and formats with commas
 */
export function formatBalance(rawBalance: bigint | string | undefined): string {
  if (!rawBalance) return "0.00";
  
  try {
    const balance = typeof rawBalance === "string" ? BigInt(rawBalance) : rawBalance;
    const formatted = ethers.formatEther(balance);
    const num = parseFloat(formatted);
    
    // Format with commas and 2 decimal places
    return num.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  } catch (error) {
    console.error("Error formatting balance:", error);
    return "0.00";
  }
}

export function usePFFBalances(): PFFBalances {
  const address = useAddress();
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  // Connect to FoundationVault (VIDA CAP with dual-vault system)
  const { contract: foundationVault } = useContract(
    PFF_CONTRACTS.FOUNDATION_VAULT,
    FOUNDATION_VAULT_ABI
  );

  // Connect to ngnVIDA token
  const { contract: ngnVidaToken } = useContract(
    PFF_CONTRACTS.NGN_VIDA_TOKEN,
    ERC20_ABI
  );

  // Fetch VIDA CAP dual-vault balances
  const { data: vaultBalances, isLoading: isLoadingVida, error: vidaError } = useContractRead(
    foundationVault,
    "getVaultBalances",
    [address || ethers.ZeroAddress]
  );

  // Fetch ngnVIDA balance
  const { data: ngnVidaBalance, isLoading: isLoadingNgn, error: ngnError } = useContractRead(
    ngnVidaToken,
    "balanceOf",
    [address || ethers.ZeroAddress]
  );

  // Refetch function
  const refetch = () => {
    setRefetchTrigger((prev) => prev + 1);
  };

  // Auto-refetch when address changes
  useEffect(() => {
    if (address) {
      refetch();
    }
  }, [address]);

  // Parse VIDA CAP balances (dual-vault system)
  const vidaCapBalances = vaultBalances
    ? {
        spendable: formatBalance(vaultBalances[0]),
        locked: formatBalance(vaultBalances[1]),
        total: formatBalance(vaultBalances[2]),
        raw: {
          spendable: BigInt(vaultBalances[0]?.toString() || "0"),
          locked: BigInt(vaultBalances[1]?.toString() || "0"),
          total: BigInt(vaultBalances[2]?.toString() || "0"),
        },
      }
    : {
        spendable: "0.00",
        locked: "0.00",
        total: "0.00",
        raw: {
          spendable: BigInt(0),
          locked: BigInt(0),
          total: BigInt(0),
        },
      };

  // Parse ngnVIDA balance
  const ngnVidaBalances = ngnVidaBalance
    ? {
        balance: formatBalance(ngnVidaBalance),
        raw: BigInt(ngnVidaBalance.toString()),
      }
    : {
        balance: "0.00",
        raw: BigInt(0),
      };

  return {
    vidaCap: vidaCapBalances,
    ngnVida: ngnVidaBalances,
    isLoading: isLoadingVida || isLoadingNgn,
    error: (vidaError || ngnError) as Error | null,
    refetch,
  };
}

