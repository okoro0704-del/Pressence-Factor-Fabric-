/**
 * @file Shared Account Factory Configuration
 * @description Contract configuration and ABI for the PFF Shared Account Factory
 */

// Shared Account Factory ABI
export const SHARED_ACCOUNT_FACTORY_ABI = [
  // Events
  "event AccountCreated(address indexed account, address indexed sovereignID, address indexed partner, string accountName, uint256 timestamp)",
  "event PartnerWhitelisted(address indexed partner, string partnerName)",
  "event PartnerRemoved(address indexed partner)",
  "event SentinelWebhookUpdated(string newURL)",
  
  // Main Functions
  "function createAccount(address sovereignID, string calldata accountName, address[] calldata additionalAdmins) external returns (address account)",
  
  // View Functions
  "function getAccountsBySovereign(address sovereignID) external view returns (address[] memory)",
  "function getTotalAccounts() external view returns (uint256)",
  "function getAccountAtIndex(uint256 index) external view returns (address)",
  "function whitelistedPartners(address partner) external view returns (bool)",
  "function partnerNames(address partner) external view returns (string memory)",
  "function sentinelWebhookURL() external view returns (string memory)",
  "function pffVerifiedSBT() external view returns (address)",
  
  // Admin Functions
  "function whitelistPartner(address partner, string calldata partnerName) external",
  "function removePartner(address partner) external",
  "function updateSentinelWebhook(string calldata newURL) external",
  "function updateImplementation(address newImplementation) external",
] as const;

// Shared Account ABI
export const SHARED_ACCOUNT_ABI = [
  // Events
  "event AccountInitialized(string accountName, address[] admins, address partner, uint256 timestamp)",
  "event AdminAdded(address indexed admin, address indexed addedBy)",
  "event AdminRemoved(address indexed admin, address indexed removedBy)",
  
  // Functions
  "function initialize(address[] memory _admins, string memory _accountName, address _partner) external",
  "function addAdmin(address newAdmin) external",
  "function removeAdmin(address admin) external",
  
  // View Functions
  "function accountName() external view returns (string memory)",
  "function partner() external view returns (address)",
  "function createdAt() external view returns (uint256)",
  "function isAdmin(address account) external view returns (bool)",
  "function getAdmins() external view returns (address[] memory)",
  "function getAdminCount() external view returns (uint256)",
  "function initialized() external view returns (bool)",
] as const;

/**
 * Contract addresses (to be deployed)
 * Update these after deploying the contracts
 */
export const SHARED_ACCOUNT_FACTORY_ADDRESS = 
  process.env.NEXT_PUBLIC_SHARED_ACCOUNT_FACTORY_ADDRESS || 
  "0x0000000000000000000000000000000000000000";

export const SHARED_ACCOUNT_IMPLEMENTATION_ADDRESS = 
  process.env.NEXT_PUBLIC_SHARED_ACCOUNT_IMPLEMENTATION_ADDRESS || 
  "0x0000000000000000000000000000000000000000";

/**
 * Type definitions for better TypeScript support
 */
export interface AccountCreatedEvent {
  account: string;
  sovereignID: string;
  partner: string;
  accountName: string;
  timestamp: number;
}

export interface SharedAccountInfo {
  address: string;
  accountName: string;
  partner: string;
  partnerName: string;
  createdAt: number;
  admins: string[];
  isAdmin: boolean;
}

export interface CreateAccountParams {
  sovereignID: string;
  accountName: string;
  additionalAdmins?: string[];
}

/**
 * Error messages for better UX
 */
export const FACTORY_ERRORS = {
  NOT_WHITELISTED: "Your organization is not whitelisted to create accounts",
  NOT_VERIFIED: "Sovereign ID must complete KYC verification first",
  INVALID_SOVEREIGN_ID: "Invalid Sovereign ID address",
  INVALID_ACCOUNT_NAME: "Account name cannot be empty",
  CREATION_FAILED: "Failed to create shared account",
} as const;

/**
 * Helper function to format account creation event
 */
export function formatAccountCreatedEvent(
  account: string,
  sovereignID: string,
  partner: string,
  accountName: string,
  timestamp: bigint
): AccountCreatedEvent {
  return {
    account,
    sovereignID,
    partner,
    accountName,
    timestamp: Number(timestamp),
  };
}

/**
 * Helper function to validate Sovereign ID
 */
export function isValidSovereignID(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Helper function to validate account name
 */
export function isValidAccountName(name: string): boolean {
  return name.trim().length > 0 && name.trim().length <= 100;
}

/**
 * Webhook payload structure for Sentinel notifications
 */
export interface SentinelWebhookPayload {
  event: "AccountCreated";
  data: {
    accountAddress: string;
    sovereignID: string;
    partnerAddress: string;
    partnerName: string;
    accountName: string;
    timestamp: number;
    transactionHash: string;
    blockNumber: number;
  };
}

/**
 * Partner information
 */
export interface PartnerInfo {
  address: string;
  name: string;
  isWhitelisted: boolean;
}

/**
 * Known partners (can be extended)
 */
export const KNOWN_PARTNERS: Record<string, string> = {
  // Add partner addresses here after whitelisting
  // "0x...": "UBA (United Bank for Africa)",
  // "0x...": "GTBank (Guaranty Trust Bank)",
};

