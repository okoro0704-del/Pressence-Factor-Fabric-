// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title FoundationVault
 * @notice The Credit Engine — Foundation reserves with collateral locking
 * @dev Holds VIDA as collateral for tech loans and infrastructure funding
 * 
 * Key Features:
 * - Receives Foundation allocation (1 VIDA per vitalization + levies)
 * - Lock VIDA as collateral for banking partners (UBA, Access Bank)
 * - Banks can verify locked collateral for tech loan approvals
 * - Transparent collateral management with release mechanisms
 * 
 * Use Case:
 * - PFF needs $100M tech loan from UBA
 * - Foundation locks 100,000 VIDA ($100M at $1,000/VIDA) as collateral
 * - UBA verifies locked collateral on-chain
 * - Loan approved with blockchain-backed guarantee
 * 
 * Access Control:
 * - ARCHITECT_ROLE: Can lock/unlock collateral and manage partners
 * - BANKING_PARTNER_ROLE: Can view collateral and verify reserves
 * - SENTINEL_ROLE: Can deposit VIDA (SovrynSentinelGate)
 */
contract FoundationVault is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    bytes32 public constant ARCHITECT_ROLE = keccak256("ARCHITECT_ROLE");
    bytes32 public constant BANKING_PARTNER_ROLE = keccak256("BANKING_PARTNER_ROLE");
    bytes32 public constant SENTINEL_ROLE = keccak256("SENTINEL_ROLE");
    
    IERC20 public immutable vidaToken;
    
    // Vault metrics
    uint256 public totalDeposited;
    uint256 public totalLockedCollateral;
    uint256 public totalReleasedCollateral;
    
    // Collateral lock tracking
    struct CollateralLock {
        uint256 id;
        address bankingPartner;
        uint256 amount;
        string loanReference;
        string purpose;
        bool active;
        uint256 lockedAt;
        uint256 releaseAt;
    }
    
    mapping(uint256 => CollateralLock) public collateralLocks;
    mapping(address => uint256[]) public partnerLocks; // Banking partner → lock IDs
    uint256 public nextLockId;
    
    // Events
    event VidaDeposited(address indexed from, uint256 amount, string source);
    event CollateralLocked(uint256 indexed lockId, address indexed partner, uint256 amount, string loanReference);
    event CollateralReleased(uint256 indexed lockId, address indexed partner, uint256 amount);
    event BankingPartnerAdded(address indexed partner, string bankName);
    event BankingPartnerRemoved(address indexed partner);
    
    /**
     * @notice Deploy FoundationVault
     * @param _vidaToken Address of SovereignVida token
     * @param _architect Address of Architect (admin)
     */
    constructor(address _vidaToken, address _architect) {
        require(_vidaToken != address(0), "FoundationVault: VIDA token is zero address");
        require(_architect != address(0), "FoundationVault: architect is zero address");
        
        vidaToken = IERC20(_vidaToken);
        
        _grantRole(DEFAULT_ADMIN_ROLE, _architect);
        _grantRole(ARCHITECT_ROLE, _architect);
    }
    
    /**
     * @notice Deposit VIDA to foundation vault (called by SovrynSentinelGate)
     * @param amount Amount of VIDA to deposit
     * @param source Source of deposit (e.g., "vitalization", "conversion_levy", "corporate_royalty")
     */
    function depositVida(uint256 amount, string calldata source) external onlyRole(SENTINEL_ROLE) {
        require(amount > 0, "FoundationVault: amount must be > 0");
        
        vidaToken.safeTransferFrom(msg.sender, address(this), amount);
        totalDeposited += amount;
        
        emit VidaDeposited(msg.sender, amount, source);
    }
    
    /**
     * @notice Get available (unlocked) VIDA balance
     */
    function availableBalance() public view returns (uint256) {
        uint256 totalBalance = vidaToken.balanceOf(address(this));
        return totalBalance > totalLockedCollateral ? totalBalance - totalLockedCollateral : 0;
    }
    
    /**
     * @notice Get total VIDA balance (locked + available)
     */
    function totalBalance() external view returns (uint256) {
        return vidaToken.balanceOf(address(this));
    }
    
    /**
     * @notice Lock VIDA as collateral for tech loan
     * @param bankingPartner Address of banking partner (UBA, Access Bank, etc.)
     * @param amount Amount of VIDA to lock
     * @param loanReference Loan reference number
     * @param purpose Purpose of the loan
     * @param lockDurationDays Duration to lock collateral (in days)
     */
    function lockForCollateral(
        address bankingPartner,
        uint256 amount,
        string calldata loanReference,
        string calldata purpose,
        uint256 lockDurationDays
    ) external onlyRole(ARCHITECT_ROLE) returns (uint256 lockId) {
        require(bankingPartner != address(0), "FoundationVault: partner is zero address");
        require(amount > 0, "FoundationVault: amount must be > 0");
        require(amount <= availableBalance(), "FoundationVault: insufficient available balance");
        require(hasRole(BANKING_PARTNER_ROLE, bankingPartner), "FoundationVault: not a banking partner");
        require(bytes(loanReference).length > 0, "FoundationVault: loan reference required");
        
        lockId = nextLockId++;
        uint256 releaseTimestamp = block.timestamp + (lockDurationDays * 1 days);
        
        collateralLocks[lockId] = CollateralLock({
            id: lockId,
            bankingPartner: bankingPartner,
            amount: amount,
            loanReference: loanReference,
            purpose: purpose,
            active: true,
            lockedAt: block.timestamp,
            releaseAt: releaseTimestamp
        });
        
        partnerLocks[bankingPartner].push(lockId);
        totalLockedCollateral += amount;
        
        emit CollateralLocked(lockId, bankingPartner, amount, loanReference);
    }

    /**
     * @notice Release collateral lock (after loan repayment or expiry)
     * @param lockId ID of the collateral lock
     */
    function releaseCollateral(uint256 lockId) external onlyRole(ARCHITECT_ROLE) nonReentrant {
        CollateralLock storage lock = collateralLocks[lockId];
        require(lock.id == lockId, "FoundationVault: lock does not exist");
        require(lock.active, "FoundationVault: lock already released");

        lock.active = false;
        totalLockedCollateral -= lock.amount;
        totalReleasedCollateral += lock.amount;

        emit CollateralReleased(lockId, lock.bankingPartner, lock.amount);
    }

    /**
     * @notice Verify collateral for banking partner (read-only)
     * @param lockId ID of the collateral lock
     * @return lock Collateral lock details
     * @return isValid Whether the lock is active and valid
     */
    function verifyCollateral(uint256 lockId) external view returns (
        CollateralLock memory lock,
        bool isValid
    ) {
        lock = collateralLocks[lockId];
        isValid = lock.active && lock.id == lockId;
    }

    /**
     * @notice Get all active locks for a banking partner
     * @param partner Address of banking partner
     */
    function getPartnerActiveLocks(address partner) external view returns (uint256[] memory activeLockIds) {
        uint256[] memory allLocks = partnerLocks[partner];
        uint256 activeCount = 0;

        // Count active locks
        for (uint256 i = 0; i < allLocks.length; i++) {
            if (collateralLocks[allLocks[i]].active) {
                activeCount++;
            }
        }

        // Build active locks array
        activeLockIds = new uint256[](activeCount);
        uint256 index = 0;
        for (uint256 i = 0; i < allLocks.length; i++) {
            if (collateralLocks[allLocks[i]].active) {
                activeLockIds[index] = allLocks[i];
                index++;
            }
        }
    }

    /**
     * @notice Get total locked collateral for a banking partner
     * @param partner Address of banking partner
     */
    function getPartnerLockedAmount(address partner) external view returns (uint256 totalLocked) {
        uint256[] memory allLocks = partnerLocks[partner];

        for (uint256 i = 0; i < allLocks.length; i++) {
            CollateralLock memory lock = collateralLocks[allLocks[i]];
            if (lock.active) {
                totalLocked += lock.amount;
            }
        }
    }

    /**
     * @notice Get vault metrics
     */
    function getVaultMetrics() external view returns (
        uint256 total,
        uint256 available,
        uint256 locked,
        uint256 deposited,
        uint256 released
    ) {
        total = vidaToken.balanceOf(address(this));
        available = availableBalance();
        locked = totalLockedCollateral;
        deposited = totalDeposited;
        released = totalReleasedCollateral;
    }

    /**
     * @notice Add banking partner (UBA, Access Bank, etc.)
     * @param partner Address of banking partner
     * @param bankName Name of the bank
     */
    function addBankingPartner(address partner, string calldata bankName) external onlyRole(ARCHITECT_ROLE) {
        require(partner != address(0), "FoundationVault: partner is zero address");
        _grantRole(BANKING_PARTNER_ROLE, partner);
        emit BankingPartnerAdded(partner, bankName);
    }

    /**
     * @notice Remove banking partner
     * @param partner Address of banking partner
     */
    function removeBankingPartner(address partner) external onlyRole(ARCHITECT_ROLE) {
        _revokeRole(BANKING_PARTNER_ROLE, partner);
        emit BankingPartnerRemoved(partner);
    }

    /**
     * @notice Grant Sentinel role to SovrynSentinelGate
     * @param sentinel Address of SovrynSentinelGate
     */
    function grantSentinelRole(address sentinel) external onlyRole(ARCHITECT_ROLE) {
        _grantRole(SENTINEL_ROLE, sentinel);
    }

    /**
     * @notice Check if address is a banking partner
     */
    function isBankingPartner(address account) external view returns (bool) {
        return hasRole(BANKING_PARTNER_ROLE, account);
    }

    /**
     * @notice Get collateral lock details
     */
    function getCollateralLock(uint256 lockId) external view returns (CollateralLock memory) {
        return collateralLocks[lockId];
    }
}

