// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title PFF Shared Account Factory
 * @notice Factory contract for creating shared business accounts in the PFF Ecosystem
 * @dev External partners (like UBA) can call this to create accounts with KYC verification
 * 
 * Features:
 * - Creates shared accounts with multiple admins
 * - Verifies KYC status via PFF Verified SBT
 * - Emits events for Sentinel webhook notifications
 * - Partner whitelisting for security
 */

interface IPFFVerifiedSBT {
    function balanceOf(address owner) external view returns (uint256);
}

interface ISharedAccount {
    function initialize(
        address[] memory admins,
        string memory accountName,
        address partner
    ) external;
}

contract SharedAccountFactory is Ownable, ReentrancyGuard {
    
    // ============================================================================
    // STATE VARIABLES
    // ============================================================================
    
    /// @notice PFF Verified SBT contract for KYC verification
    IPFFVerifiedSBT public immutable pffVerifiedSBT;
    
    /// @notice Shared Account implementation contract (for clones)
    address public sharedAccountImplementation;
    
    /// @notice Mapping of partner addresses to their whitelisted status
    mapping(address => bool) public whitelistedPartners;
    
    /// @notice Mapping of partner addresses to their names
    mapping(address => string) public partnerNames;
    
    /// @notice Mapping of Sovereign IDs to their created accounts
    mapping(address => address[]) public sovereignAccounts;
    
    /// @notice Array of all created accounts
    address[] public allAccounts;
    
    /// @notice Sentinel webhook URL (stored on-chain for transparency)
    string public sentinelWebhookURL;
    
    // ============================================================================
    // EVENTS
    // ============================================================================
    
    /// @notice Emitted when a new shared account is created
    event AccountCreated(
        address indexed account,
        address indexed sovereignID,
        address indexed partner,
        string accountName,
        uint256 timestamp
    );
    
    /// @notice Emitted when a partner is whitelisted
    event PartnerWhitelisted(address indexed partner, string partnerName);
    
    /// @notice Emitted when a partner is removed
    event PartnerRemoved(address indexed partner);
    
    /// @notice Emitted when Sentinel webhook URL is updated
    event SentinelWebhookUpdated(string newURL);
    
    // ============================================================================
    // ERRORS
    // ============================================================================
    
    error NotWhitelistedPartner();
    error SovereignIDNotVerified(address sovereignID);
    error InvalidSovereignID();
    error InvalidAccountName();
    error AccountCreationFailed();
    
    // ============================================================================
    // CONSTRUCTOR
    // ============================================================================
    
    constructor(
        address _pffVerifiedSBT,
        address _sharedAccountImplementation,
        string memory _sentinelWebhookURL
    ) Ownable(msg.sender) {
        pffVerifiedSBT = IPFFVerifiedSBT(_pffVerifiedSBT);
        sharedAccountImplementation = _sharedAccountImplementation;
        sentinelWebhookURL = _sentinelWebhookURL;
    }
    
    // ============================================================================
    // EXTERNAL FUNCTIONS
    // ============================================================================
    
    /**
     * @notice Create a new shared business account
     * @dev Called by whitelisted partners (e.g., UBA)
     * @param sovereignID The PFF Sovereign ID (master wallet) to set as admin
     * @param accountName Human-readable name for the account
     * @param additionalAdmins Optional additional admin addresses
     * @return account The address of the newly created shared account
     * 
     * Requirements:
     * - Caller must be a whitelisted partner
     * - Sovereign ID must own a PFF Verified SBT (KYC passed)
     * - Account name must not be empty
     */
    function createAccount(
        address sovereignID,
        string calldata accountName,
        address[] calldata additionalAdmins
    ) external nonReentrant returns (address account) {
        // 1. Verify caller is whitelisted partner
        if (!whitelistedPartners[msg.sender]) {
            revert NotWhitelistedPartner();
        }
        
        // 2. Validate inputs
        if (sovereignID == address(0)) {
            revert InvalidSovereignID();
        }
        
        if (bytes(accountName).length == 0) {
            revert InvalidAccountName();
        }
        
        // 3. KYC CHECK: Verify Sovereign ID owns PFF Verified SBT
        uint256 sbtBalance = pffVerifiedSBT.balanceOf(sovereignID);
        if (sbtBalance == 0) {
            revert SovereignIDNotVerified(sovereignID);
        }
        
        // 4. Create shared account (minimal proxy clone)
        account = _createClone(sharedAccountImplementation);
        if (account == address(0)) {
            revert AccountCreationFailed();
        }

        // 5. Build admin list (Sovereign ID + additional admins)
        address[] memory admins = new address[](additionalAdmins.length + 1);
        admins[0] = sovereignID;
        for (uint256 i = 0; i < additionalAdmins.length; i++) {
            admins[i + 1] = additionalAdmins[i];
        }

        // 6. Initialize the shared account
        ISharedAccount(account).initialize(admins, accountName, msg.sender);

        // 7. Record the account
        sovereignAccounts[sovereignID].push(account);
        allAccounts.push(account);

        // 8. Emit event for Sentinel webhook
        emit AccountCreated(
            account,
            sovereignID,
            msg.sender,
            accountName,
            block.timestamp
        );

        return account;
    }

    /**
     * @notice Get all accounts created by a Sovereign ID
     * @param sovereignID The Sovereign ID to query
     * @return Array of account addresses
     */
    function getAccountsBySovereign(address sovereignID)
        external
        view
        returns (address[] memory)
    {
        return sovereignAccounts[sovereignID];
    }

    /**
     * @notice Get total number of accounts created
     * @return Total account count
     */
    function getTotalAccounts() external view returns (uint256) {
        return allAccounts.length;
    }

    /**
     * @notice Get account at specific index
     * @param index The index to query
     * @return Account address
     */
    function getAccountAtIndex(uint256 index) external view returns (address) {
        require(index < allAccounts.length, "Index out of bounds");
        return allAccounts[index];
    }

    // ============================================================================
    // ADMIN FUNCTIONS
    // ============================================================================

    /**
     * @notice Whitelist a partner to use the factory
     * @param partner Partner address
     * @param partnerName Partner name (e.g., "UBA", "GTBank")
     */
    function whitelistPartner(address partner, string calldata partnerName)
        external
        onlyOwner
    {
        require(partner != address(0), "Invalid partner address");
        require(bytes(partnerName).length > 0, "Invalid partner name");

        whitelistedPartners[partner] = true;
        partnerNames[partner] = partnerName;

        emit PartnerWhitelisted(partner, partnerName);
    }

    /**
     * @notice Remove a partner from whitelist
     * @param partner Partner address to remove
     */
    function removePartner(address partner) external onlyOwner {
        whitelistedPartners[partner] = false;
        delete partnerNames[partner];

        emit PartnerRemoved(partner);
    }

    /**
     * @notice Update Sentinel webhook URL
     * @param newURL New webhook URL
     */
    function updateSentinelWebhook(string calldata newURL) external onlyOwner {
        require(bytes(newURL).length > 0, "Invalid URL");
        sentinelWebhookURL = newURL;

        emit SentinelWebhookUpdated(newURL);
    }

    /**
     * @notice Update shared account implementation
     * @param newImplementation New implementation address
     */
    function updateImplementation(address newImplementation) external onlyOwner {
        require(newImplementation != address(0), "Invalid implementation");
        sharedAccountImplementation = newImplementation;
    }

    // ============================================================================
    // INTERNAL FUNCTIONS
    // ============================================================================

    /**
     * @notice Create a minimal proxy clone (EIP-1167)
     * @param implementation Implementation contract to clone
     * @return instance Address of the cloned contract
     */
    function _createClone(address implementation) internal returns (address instance) {
        assembly {
            let ptr := mload(0x40)
            mstore(ptr, 0x3d602d80600a3d3981f3363d3d373d3d3d363d73000000000000000000000000)
            mstore(add(ptr, 0x14), shl(0x60, implementation))
            mstore(add(ptr, 0x28), 0x5af43d82803e903d91602b57fd5bf30000000000000000000000000000000000)
            instance := create(0, ptr, 0x37)
        }
        require(instance != address(0), "Clone creation failed");
    }
}
