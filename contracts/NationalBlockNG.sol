// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title NationalBlockNG
 * @notice The Sovereign Wealth Fund — National Treasury for Nigeria
 * @dev Receives 5.0 VIDA per citizen vitalization (citizen share)
 * 
 * Key Features:
 * - Receives citizen VIDA allocations from SovrynSentinelGate
 * - Banking Partner integration (UBA, Access Bank, etc.) can view balance
 * - National projects can request fund releases (requires approval)
 * - Transparent audit trail for all inflows and outflows
 * 
 * Access Control:
 * - ARCHITECT_ROLE: Can approve releases and manage banking partners
 * - BANKING_PARTNER_ROLE: Can view balance and verify reserves
 * - SENTINEL_ROLE: Can deposit VIDA (SovrynSentinelGate)
 */
contract NationalBlockNG is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    bytes32 public constant ARCHITECT_ROLE = keccak256("ARCHITECT_ROLE");
    bytes32 public constant BANKING_PARTNER_ROLE = keccak256("BANKING_PARTNER_ROLE");
    bytes32 public constant SENTINEL_ROLE = keccak256("SENTINEL_ROLE");
    
    IERC20 public immutable vidaToken;
    
    // Treasury metrics
    uint256 public totalDeposited;
    uint256 public totalReleased;
    uint256 public totalCitizensVitalized;
    
    // Release request tracking
    struct ReleaseRequest {
        uint256 id;
        address requester;
        uint256 amount;
        string projectName;
        string justification;
        bool approved;
        bool executed;
        uint256 requestedAt;
        uint256 approvedAt;
    }
    
    mapping(uint256 => ReleaseRequest) public releaseRequests;
    uint256 public nextRequestId;
    
    // Events
    event VidaDeposited(address indexed from, uint256 amount, uint256 citizenCount);
    event BankingPartnerAdded(address indexed partner, string bankName);
    event BankingPartnerRemoved(address indexed partner);
    event ReleaseRequested(uint256 indexed requestId, address indexed requester, uint256 amount, string projectName);
    event ReleaseApproved(uint256 indexed requestId, address indexed approver);
    event ReleaseExecuted(uint256 indexed requestId, address indexed recipient, uint256 amount);
    
    /**
     * @notice Deploy NationalBlockNG vault
     * @param _vidaToken Address of SovereignVida token
     * @param _architect Address of Architect (admin)
     */
    constructor(address _vidaToken, address _architect) {
        require(_vidaToken != address(0), "NationalBlockNG: VIDA token is zero address");
        require(_architect != address(0), "NationalBlockNG: architect is zero address");
        
        vidaToken = IERC20(_vidaToken);
        
        _grantRole(DEFAULT_ADMIN_ROLE, _architect);
        _grantRole(ARCHITECT_ROLE, _architect);
    }
    
    /**
     * @notice Deposit VIDA to national treasury (called by SovrynSentinelGate)
     * @param amount Amount of VIDA to deposit
     * @param citizenCount Number of citizens vitalized in this batch
     */
    function depositVida(uint256 amount, uint256 citizenCount) external onlyRole(SENTINEL_ROLE) {
        require(amount > 0, "NationalBlockNG: amount must be > 0");
        
        vidaToken.safeTransferFrom(msg.sender, address(this), amount);
        
        totalDeposited += amount;
        totalCitizensVitalized += citizenCount;
        
        emit VidaDeposited(msg.sender, amount, citizenCount);
    }
    
    /**
     * @notice View current VIDA balance (for Banking Partners)
     * @return Current VIDA balance in the vault
     */
    function viewBalance() external view returns (uint256) {
        return vidaToken.balanceOf(address(this));
    }
    
    /**
     * @notice Get detailed treasury metrics (for Banking Partners)
     */
    function getTreasuryMetrics() external view returns (
        uint256 currentBalance,
        uint256 deposited,
        uint256 released,
        uint256 citizensVitalized,
        uint256 averagePerCitizen
    ) {
        currentBalance = vidaToken.balanceOf(address(this));
        deposited = totalDeposited;
        released = totalReleased;
        citizensVitalized = totalCitizensVitalized;
        averagePerCitizen = totalCitizensVitalized > 0 ? totalDeposited / totalCitizensVitalized : 0;
    }
    
    /**
     * @notice Request release of funds for national project
     * @param amount Amount of VIDA to release
     * @param projectName Name of the project
     * @param justification Reason for fund release
     */
    function requestRelease(
        uint256 amount,
        string calldata projectName,
        string calldata justification
    ) external returns (uint256 requestId) {
        require(amount > 0, "NationalBlockNG: amount must be > 0");
        require(amount <= vidaToken.balanceOf(address(this)), "NationalBlockNG: insufficient balance");
        require(bytes(projectName).length > 0, "NationalBlockNG: project name required");
        
        requestId = nextRequestId++;
        
        releaseRequests[requestId] = ReleaseRequest({
            id: requestId,
            requester: msg.sender,
            amount: amount,
            projectName: projectName,
            justification: justification,
            approved: false,
            executed: false,
            requestedAt: block.timestamp,
            approvedAt: 0
        });
        
        emit ReleaseRequested(requestId, msg.sender, amount, projectName);
    }

    /**
     * @notice Approve a release request (Architect only)
     * @param requestId ID of the release request
     */
    function approveRelease(uint256 requestId) external onlyRole(ARCHITECT_ROLE) {
        ReleaseRequest storage request = releaseRequests[requestId];
        require(request.id == requestId, "NationalBlockNG: request does not exist");
        require(!request.approved, "NationalBlockNG: already approved");
        require(!request.executed, "NationalBlockNG: already executed");

        request.approved = true;
        request.approvedAt = block.timestamp;

        emit ReleaseApproved(requestId, msg.sender);
    }

    /**
     * @notice Execute approved release (Architect only)
     * @param requestId ID of the release request
     * @param recipient Address to receive the funds
     */
    function executeRelease(uint256 requestId, address recipient) external onlyRole(ARCHITECT_ROLE) nonReentrant {
        ReleaseRequest storage request = releaseRequests[requestId];
        require(request.id == requestId, "NationalBlockNG: request does not exist");
        require(request.approved, "NationalBlockNG: not approved");
        require(!request.executed, "NationalBlockNG: already executed");
        require(recipient != address(0), "NationalBlockNG: recipient is zero address");

        request.executed = true;
        totalReleased += request.amount;

        vidaToken.safeTransfer(recipient, request.amount);

        emit ReleaseExecuted(requestId, recipient, request.amount);
    }

    /**
     * @notice Add banking partner (UBA, Access Bank, etc.)
     * @param partner Address of banking partner
     * @param bankName Name of the bank
     */
    function addBankingPartner(address partner, string calldata bankName) external onlyRole(ARCHITECT_ROLE) {
        require(partner != address(0), "NationalBlockNG: partner is zero address");
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
     * @notice Get release request details
     */
    function getReleaseRequest(uint256 requestId) external view returns (ReleaseRequest memory) {
        return releaseRequests[requestId];
    }

    /**
     * @notice Check if address is a banking partner
     */
    function isBankingPartner(address account) external view returns (bool) {
        return hasRole(BANKING_PARTNER_ROLE, account);
    }
}

