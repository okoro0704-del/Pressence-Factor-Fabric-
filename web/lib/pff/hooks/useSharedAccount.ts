/**
 * @file useSharedAccount Hook
 * @description React hooks for interacting with individual Shared Accounts
 */

import { useContract, useContractRead, useContractWrite, useAddress } from "@thirdweb-dev/react";
import { useState, useCallback } from "react";
import { SHARED_ACCOUNT_ABI } from "../sharedAccountFactory";

/**
 * Hook to interact with a specific Shared Account
 */
export function useSharedAccount(accountAddress?: string) {
  const address = useAddress();
  const { contract } = useContract(accountAddress, SHARED_ACCOUNT_ABI);
  
  // Contract write functions
  const { mutateAsync: addAdminTx } = useContractWrite(contract, "addAdmin");
  const { mutateAsync: removeAdminTx } = useContractWrite(contract, "removeAdmin");
  
  // State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  /**
   * Add a new admin to the account
   */
  const addAdmin = useCallback(
    async (newAdmin: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);
      
      try {
        await addAdminTx({ args: [newAdmin] });
        return true;
      } catch (err: any) {
        console.error("Error adding admin:", err);
        setError(err.message || "Failed to add admin");
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [addAdminTx]
  );
  
  /**
   * Remove an admin from the account
   */
  const removeAdmin = useCallback(
    async (admin: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);
      
      try {
        await removeAdminTx({ args: [admin] });
        return true;
      } catch (err: any) {
        console.error("Error removing admin:", err);
        
        if (err.message.includes("CannotRemoveLastAdmin")) {
          setError("Cannot remove the last admin");
        } else {
          setError(err.message || "Failed to remove admin");
        }
        
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [removeAdminTx]
  );
  
  return {
    contract,
    addAdmin,
    removeAdmin,
    isLoading,
    error,
    isConnected: !!address,
  };
}

/**
 * Hook to get account information
 */
export function useAccountInfo(accountAddress?: string) {
  const { contract } = useContract(accountAddress, SHARED_ACCOUNT_ABI);
  
  const { data: accountName, isLoading: loadingName } = useContractRead(contract, "accountName");
  const { data: partner, isLoading: loadingPartner } = useContractRead(contract, "partner");
  const { data: createdAt, isLoading: loadingCreatedAt } = useContractRead(contract, "createdAt");
  const { data: admins, isLoading: loadingAdmins } = useContractRead(contract, "getAdmins");
  
  const isLoading = loadingName || loadingPartner || loadingCreatedAt || loadingAdmins;
  
  return {
    accountName: (accountName as string) || "",
    partner: (partner as string) || "",
    createdAt: createdAt ? Number(createdAt) : 0,
    admins: (admins as string[]) || [],
    isLoading,
  };
}

/**
 * Hook to check if current user is an admin
 */
export function useIsAdmin(accountAddress?: string) {
  const address = useAddress();
  const { contract } = useContract(accountAddress, SHARED_ACCOUNT_ABI);
  
  const { data: isAdmin, isLoading } = useContractRead(
    contract,
    "isAdmin",
    [address || "0x0000000000000000000000000000000000000000"]
  );
  
  return {
    isAdmin: !!isAdmin,
    isLoading,
  };
}

/**
 * Hook to get admin count
 */
export function useAdminCount(accountAddress?: string) {
  const { contract } = useContract(accountAddress, SHARED_ACCOUNT_ABI);
  
  const { data: count, isLoading } = useContractRead(contract, "getAdminCount");
  
  return {
    count: count ? Number(count) : 0,
    isLoading,
  };
}

/**
 * Hook to check if account is initialized
 */
export function useIsInitialized(accountAddress?: string) {
  const { contract } = useContract(accountAddress, SHARED_ACCOUNT_ABI);
  
  const { data: initialized, isLoading } = useContractRead(contract, "initialized");
  
  return {
    initialized: !!initialized,
    isLoading,
  };
}

/**
 * Helper function to format address for display
 */
export function formatAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Helper function to format timestamp
 */
export function formatTimestamp(timestamp: number): string {
  if (!timestamp) return "";
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

