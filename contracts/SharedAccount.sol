// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title PFF Shared Account
 * @notice A shared business account with multiple admins
 * @dev This contract is cloned by SharedAccountFactory for each new account
 * 
 * Features:
 * - Multiple admin management
 * - Partner tracking (who created the account)
 * - Account metadata (name, creation time)
 * - Admin-only access control
 */

contract SharedAccount is ReentrancyGuard {
    
    // ============================================================================
    // STATE VARIABLES
    // ============================================================================
    
    /// @notice Account name (e.g., "UBA Business Account")
    string public accountName;
    
    /// @notice Partner that created this account
    address public partner;
    
    /// @notice Timestamp when account was created
    uint256 public createdAt;
    
    /// @notice Mapping of admin addresses
    mapping(address => bool) public isAdmin;
    
    /// @notice Array of all admin addresses
    address[] public admins;
    
    /// @notice Whether the account has been initialized
    bool public initialized;
    
    // ============================================================================
    // EVENTS
    // ============================================================================
    
    event AccountInitialized(
        string accountName,
        address[] admins,
        address partner,
        uint256 timestamp
    );
    
    event AdminAdded(address indexed admin, address indexed addedBy);
    event AdminRemoved(address indexed admin, address indexed removedBy);
    
    // ============================================================================
    // ERRORS
    // ============================================================================
    
    error AlreadyInitialized();
    error NotInitialized();
    error NotAdmin();
    error InvalidAdmin();
    error CannotRemoveLastAdmin();
    
    // ============================================================================
    // MODIFIERS
    // ============================================================================
    
    modifier onlyAdmin() {
        if (!isAdmin[msg.sender]) {
            revert NotAdmin();
        }
        _;
    }
    
    modifier onlyInitialized() {
        if (!initialized) {
            revert NotInitialized();
        }
        _;
    }
    
    // ============================================================================
    // EXTERNAL FUNCTIONS
    // ============================================================================
    
    /**
     * @notice Initialize the shared account (called by factory)
     * @param _admins Array of admin addresses
     * @param _accountName Name of the account
     * @param _partner Partner that created the account
     */
    function initialize(
        address[] memory _admins,
        string memory _accountName,
        address _partner
    ) external {
        if (initialized) {
            revert AlreadyInitialized();
        }
        
        require(_admins.length > 0, "Must have at least one admin");
        require(bytes(_accountName).length > 0, "Invalid account name");
        require(_partner != address(0), "Invalid partner");
        
        accountName = _accountName;
        partner = _partner;
        createdAt = block.timestamp;
        
        // Set all admins
        for (uint256 i = 0; i < _admins.length; i++) {
            address admin = _admins[i];
            require(admin != address(0), "Invalid admin address");
            require(!isAdmin[admin], "Duplicate admin");
            
            isAdmin[admin] = true;
            admins.push(admin);
        }
        
        initialized = true;
        
        emit AccountInitialized(_accountName, _admins, _partner, block.timestamp);
    }
    
    /**
     * @notice Add a new admin to the account
     * @param newAdmin Address of the new admin
     */
    function addAdmin(address newAdmin) external onlyAdmin onlyInitialized {
        if (newAdmin == address(0)) {
            revert InvalidAdmin();
        }
        
        require(!isAdmin[newAdmin], "Already an admin");
        
        isAdmin[newAdmin] = true;
        admins.push(newAdmin);
        
        emit AdminAdded(newAdmin, msg.sender);
    }
    
    /**
     * @notice Remove an admin from the account
     * @param admin Address of the admin to remove
     */
    function removeAdmin(address admin) external onlyAdmin onlyInitialized {
        require(isAdmin[admin], "Not an admin");
        
        if (admins.length <= 1) {
            revert CannotRemoveLastAdmin();
        }
        
        isAdmin[admin] = false;
        
        // Remove from admins array
        for (uint256 i = 0; i < admins.length; i++) {
            if (admins[i] == admin) {
                admins[i] = admins[admins.length - 1];
                admins.pop();
                break;
            }
        }
        
        emit AdminRemoved(admin, msg.sender);
    }
    
    // ============================================================================
    // VIEW FUNCTIONS
    // ============================================================================
    
    /**
     * @notice Get all admins
     * @return Array of admin addresses
     */
    function getAdmins() external view returns (address[] memory) {
        return admins;
    }
    
    /**
     * @notice Get number of admins
     * @return Admin count
     */
    function getAdminCount() external view returns (uint256) {
        return admins.length;
    }
}

