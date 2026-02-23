/**
 * @file useSharedAccountFactory Hook
 * @description React hooks for interacting with the Shared Account Factory
 */

import { useContract, useContractRead, useContractWrite, useAddress } from "@thirdweb-dev/react";
import { useState, useCallback } from "react";
import {
  SHARED_ACCOUNT_FACTORY_ABI,
  SHARED_ACCOUNT_FACTORY_ADDRESS,
  CreateAccountParams,
  SharedAccountInfo,
  FACTORY_ERRORS,
  isValidSovereignID,
  isValidAccountName,
} from "../sharedAccountFactory";

/**
 * Hook to interact with the Shared Account Factory
 */
export function useSharedAccountFactory() {
  const address = useAddress();
  const { contract } = useContract(SHARED_ACCOUNT_FACTORY_ADDRESS, SHARED_ACCOUNT_FACTORY_ABI);
  
  // Contract write function
  const { mutateAsync: createAccountTx } = useContractWrite(contract, "createAccount");
  
  // State
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  /**
   * Create a new shared account
   */
  const createAccount = useCallback(
    async (params: CreateAccountParams): Promise<string | null> => {
      setIsCreating(true);
      setError(null);
      
      try {
        // Validate inputs
        if (!isValidSovereignID(params.sovereignID)) {
          throw new Error(FACTORY_ERRORS.INVALID_SOVEREIGN_ID);
        }
        
        if (!isValidAccountName(params.accountName)) {
          throw new Error(FACTORY_ERRORS.INVALID_ACCOUNT_NAME);
        }
        
        // Call contract
        const result = await createAccountTx({
          args: [
            params.sovereignID,
            params.accountName,
            params.additionalAdmins || [],
          ],
        });
        
        // Extract account address from events
        const accountAddress = result.receipt.events?.find(
          (e: any) => e.event === "AccountCreated"
        )?.args?.account;
        
        return accountAddress || null;
      } catch (err: any) {
        console.error("Error creating account:", err);
        
        // Parse error message
        if (err.message.includes("NotWhitelistedPartner")) {
          setError(FACTORY_ERRORS.NOT_WHITELISTED);
        } else if (err.message.includes("SovereignIDNotVerified")) {
          setError(FACTORY_ERRORS.NOT_VERIFIED);
        } else {
          setError(err.message || FACTORY_ERRORS.CREATION_FAILED);
        }
        
        return null;
      } finally {
        setIsCreating(false);
      }
    },
    [createAccountTx]
  );
  
  return {
    contract,
    createAccount,
    isCreating,
    error,
    isConnected: !!address,
  };
}

/**
 * Hook to get accounts by Sovereign ID
 */
export function useAccountsBySovereign(sovereignID?: string) {
  const { contract } = useContract(SHARED_ACCOUNT_FACTORY_ADDRESS, SHARED_ACCOUNT_FACTORY_ABI);
  
  const { data: accounts, isLoading } = useContractRead(
    contract,
    "getAccountsBySovereign",
    [sovereignID || "0x0000000000000000000000000000000000000000"]
  );
  
  return {
    accounts: (accounts as string[]) || [],
    isLoading,
  };
}

/**
 * Hook to get total accounts created
 */
export function useTotalAccounts() {
  const { contract } = useContract(SHARED_ACCOUNT_FACTORY_ADDRESS, SHARED_ACCOUNT_FACTORY_ABI);
  
  const { data: total, isLoading } = useContractRead(contract, "getTotalAccounts");
  
  return {
    total: total ? Number(total) : 0,
    isLoading,
  };
}

/**
 * Hook to check if address is whitelisted partner
 */
export function useIsWhitelistedPartner(partnerAddress?: string) {
  const { contract } = useContract(SHARED_ACCOUNT_FACTORY_ADDRESS, SHARED_ACCOUNT_FACTORY_ABI);
  
  const { data: isWhitelisted, isLoading } = useContractRead(
    contract,
    "whitelistedPartners",
    [partnerAddress || "0x0000000000000000000000000000000000000000"]
  );
  
  return {
    isWhitelisted: !!isWhitelisted,
    isLoading,
  };
}

/**
 * Hook to get partner name
 */
export function usePartnerName(partnerAddress?: string) {
  const { contract } = useContract(SHARED_ACCOUNT_FACTORY_ADDRESS, SHARED_ACCOUNT_FACTORY_ABI);
  
  const { data: name, isLoading } = useContractRead(
    contract,
    "partnerNames",
    [partnerAddress || "0x0000000000000000000000000000000000000000"]
  );
  
  return {
    name: (name as string) || "",
    isLoading,
  };
}

/**
 * Hook to get Sentinel webhook URL
 */
export function useSentinelWebhook() {
  const { contract } = useContract(SHARED_ACCOUNT_FACTORY_ADDRESS, SHARED_ACCOUNT_FACTORY_ABI);
  
  const { data: webhookURL, isLoading } = useContractRead(contract, "sentinelWebhookURL");
  
  return {
    webhookURL: (webhookURL as string) || "",
    isLoading,
  };
}

