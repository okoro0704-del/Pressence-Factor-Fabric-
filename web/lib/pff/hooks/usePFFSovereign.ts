/**
 * usePFFSovereign Hook
 * 
 * Complete hook for PFF Protocol interactions:
 * - Live balance reading (VIDA CAP, ngnVIDA)
 * - Claim citizenship (vitalize)
 * - Execute swap (approve + swap in one call)
 * - All transactions are gasless via Account Abstraction
 */

import { useAddress, useContract, useContractRead, useContractWrite } from "@thirdweb-dev/react";
import { useState, useCallback, useEffect } from "react";
import { PFF_CONTRACTS, FOUNDATION_VAULT_ABI, NATIONAL_TREASURY_ABI, ERC20_ABI } from "../contracts";
import { ethers } from "ethers";

export interface PFFSovereignData {
  // Balances
  vidaCapBalance: string; // Formatted (e.g., "1,345,450.00")
  vidaCapSpendable: string;
  vidaCapLocked: string;
  ngnVidaBalance: string;
  
  // Raw balances (for calculations)
  vidaCapBalanceRaw: bigint;
  ngnVidaBalanceRaw: bigint;
  
  // Loading states
  isLoadingBalances: boolean;
  isClaimingCitizenship: boolean;
  isExecutingSwap: boolean;
  
  // Actions
  claimCitizenship: (nationAddress: string) => Promise<void>;
  executeSwap: (amount: string) => Promise<void>;
  refreshBalances: () => void;
  
  // Errors
  error: string | null;
  clearError: () => void;
}

/**
 * Format balance from wei to human-readable with commas
 */
function formatBalance(balance: bigint | string | undefined): string {
  if (!balance) return "0.00";
  
  try {
    const balanceBigInt = typeof balance === "string" ? BigInt(balance) : balance;
    const formatted = ethers.formatUnits(balanceBigInt, 18);
    const num = parseFloat(formatted);
    
    return num.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  } catch (error) {
    console.error("Error formatting balance:", error);
    return "0.00";
  }
}

export function usePFFSovereign(): PFFSovereignData {
  const address = useAddress();
  const [error, setError] = useState<string | null>(null);
  const [isClaimingCitizenship, setIsClaimingCitizenship] = useState(false);
  const [isExecutingSwap, setIsExecutingSwap] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // ============================================================================
  // CONTRACT INITIALIZATION
  // ============================================================================

  // VIDA CAP Token (ERC20 interface)
  const { contract: vidaCapToken } = useContract(
    PFF_CONTRACTS.VIDA_CAP_TOKEN,
    ERC20_ABI
  );

  // ngnVIDA Token (ERC20 interface)
  const { contract: ngnVidaToken } = useContract(
    PFF_CONTRACTS.NGN_VIDA_TOKEN,
    ERC20_ABI
  );

  // FoundationVault (for vitalize and dual-vault balances)
  const { contract: foundationVault } = useContract(
    PFF_CONTRACTS.FOUNDATION_VAULT,
    FOUNDATION_VAULT_ABI
  );

  // NationalTreasury (for swap operations)
  const { contract: nationalTreasury } = useContract(
    PFF_CONTRACTS.NATIONAL_TREASURY,
    NATIONAL_TREASURY_ABI
  );

  // ============================================================================
  // LIVE BALANCE READING
  // ============================================================================

  // Read VIDA CAP dual-vault balances
  const { 
    data: vaultBalances, 
    isLoading: isLoadingVida,
    refetch: refetchVida 
  } = useContractRead(
    foundationVault,
    "getVaultBalances",
    [address || ethers.ZeroAddress],
    { enabled: !!address }
  );

  // Read ngnVIDA balance
  const { 
    data: ngnVidaBalance, 
    isLoading: isLoadingNgn,
    refetch: refetchNgn 
  } = useContractRead(
    ngnVidaToken,
    "balanceOf",
    [address || ethers.ZeroAddress],
    { enabled: !!address }
  );

  // ============================================================================
  // CONTRACT WRITE FUNCTIONS
  // ============================================================================

  // Vitalize function (claim citizenship)
  const { mutateAsync: vitalizeAsync } = useContractWrite(foundationVault, "vitalize");

  // Approve VIDA CAP for Treasury
  const { mutateAsync: approveVidaCap } = useContractWrite(vidaCapToken, "approve");

  // Swap VIDA to NGN
  const { mutateAsync: swapVidaToNgn } = useContractWrite(nationalTreasury, "swapVidaToNgn");

  // ============================================================================
  // REFRESH BALANCES
  // ============================================================================

  const refreshBalances = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
    refetchVida?.();
    refetchNgn?.();
  }, [refetchVida, refetchNgn]);

  // Auto-refresh when address changes
  useEffect(() => {
    if (address) {
      refreshBalances();
    }
  }, [address, refreshTrigger]);

  // ============================================================================
  // ACTION: CLAIM CITIZENSHIP (VITALIZE)
  // ============================================================================

  const claimCitizenship = useCallback(
    async (nationAddress: string) => {
      if (!address) {
        setError("Wallet not connected");
        throw new Error("Wallet not connected");
      }

      if (!nationAddress) {
        setError("Nation address not provided");
        throw new Error("Nation address not provided");
      }

      try {
        setIsClaimingCitizenship(true);
        setError(null);

        console.log("Claiming citizenship...", { citizen: address, nation: nationAddress });

        // Call vitalize function (gasless via Account Abstraction)
        const tx = await vitalizeAsync({
          args: [address, nationAddress],
        });

        console.log("Citizenship claimed successfully:", tx);

        // Refresh balances after successful claim
        setTimeout(() => {
          refreshBalances();
        }, 2000);

        return tx;
      } catch (err: any) {
        console.error("Claim citizenship error:", err);
        const errorMessage = err.reason || err.message || "Failed to claim citizenship";
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsClaimingCitizenship(false);
      }
    },
    [address, vitalizeAsync, refreshBalances]
  );

  // ============================================================================
  // ACTION: EXECUTE SWAP (APPROVE + SWAP)
  // ============================================================================

  const executeSwap = useCallback(
    async (amount: string) => {
      if (!address) {
        setError("Wallet not connected");
        throw new Error("Wallet not connected");
      }

      if (!amount || parseFloat(amount) <= 0) {
        setError("Invalid amount");
        throw new Error("Invalid amount");
      }

      try {
        setIsExecutingSwap(true);
        setError(null);

        // Convert amount to wei
        const amountWei = ethers.parseUnits(amount, 18);

        console.log("Executing swap...", { amount, amountWei: amountWei.toString() });

        // Step 1: Approve VIDA CAP for NationalTreasury (gasless)
        console.log("Step 1: Approving VIDA CAP...");
        const approveTx = await approveVidaCap({
          args: [PFF_CONTRACTS.NATIONAL_TREASURY, amountWei],
        });
        console.log("Approval successful:", approveTx);

        // Wait a bit for approval to be confirmed
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Step 2: Execute swap (gasless)
        console.log("Step 2: Swapping VIDA to NGN...");
        const swapTx = await swapVidaToNgn({
          args: [amountWei],
        });
        console.log("Swap successful:", swapTx);

        // Refresh balances after successful swap
        setTimeout(() => {
          refreshBalances();
        }, 2000);

        return swapTx;
      } catch (err: any) {
        console.error("Execute swap error:", err);
        const errorMessage = err.reason || err.message || "Failed to execute swap";
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsExecutingSwap(false);
      }
    },
    [address, approveVidaCap, swapVidaToNgn, refreshBalances]
  );

  // ============================================================================
  // PARSE AND FORMAT BALANCES
  // ============================================================================

  const vidaCapBalanceRaw = vaultBalances?.[2] ? BigInt(vaultBalances[2].toString()) : BigInt(0);
  const vidaCapSpendableRaw = vaultBalances?.[0] ? BigInt(vaultBalances[0].toString()) : BigInt(0);
  const vidaCapLockedRaw = vaultBalances?.[1] ? BigInt(vaultBalances[1].toString()) : BigInt(0);
  const ngnVidaBalanceRaw = ngnVidaBalance ? BigInt(ngnVidaBalance.toString()) : BigInt(0);

  return {
    // Formatted balances
    vidaCapBalance: formatBalance(vidaCapBalanceRaw),
    vidaCapSpendable: formatBalance(vidaCapSpendableRaw),
    vidaCapLocked: formatBalance(vidaCapLockedRaw),
    ngnVidaBalance: formatBalance(ngnVidaBalanceRaw),
    
    // Raw balances
    vidaCapBalanceRaw,
    ngnVidaBalanceRaw,
    
    // Loading states
    isLoadingBalances: isLoadingVida || isLoadingNgn,
    isClaimingCitizenship,
    isExecutingSwap,
    
    // Actions
    claimCitizenship,
    executeSwap,
    refreshBalances,
    
    // Errors
    error,
    clearError: () => setError(null),
  };
}

