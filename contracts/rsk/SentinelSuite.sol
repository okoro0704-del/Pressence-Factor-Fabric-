// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/metatx/ERC2771Context.sol";
import "./FoundationVault.sol";
import "./SentinelGate.sol";

/**
 * @title SentinelSuite
 * @notice PFF Sentinel Suite — ADRS (Debt Recovery) + BPS (Borderless Payments)
 * @dev Modular licensing system with gasless meta-transactions (ERC-2771)
 * 
 * Architecture:
 * - ADRS: Automated Debt Recovery System (query locked collateral, execute recovery)
 * - BPS: Borderless Payment System (gasless meta-transactions for cross-border payments)
 * - ERC-2771: Meta-transaction support for gasless user experience on Rootstock
 * - License Enforcement: Uses SentinelGate hardstop modifiers
 * 
 * ADRS (Automated Debt Recovery System):
 * - Query locked collateral in FoundationVault
 * - Execute debt recovery by unlocking collateral
 * - Track loan defaults and recovery metrics
 * 
 * BPS (Borderless Payment System):
 * - Gasless cross-border payments using meta-transactions
 * - Relayer network for transaction submission
 * - Fee-less experience for end users
 */
contract SentinelSuite is AccessControl, ReentrancyGuard, ERC2771Context {
    
    // ============================================================================
    // ROLES
    // ============================================================================
    
    bytes32 public constant ARCHITECT_ROLE = keccak256("ARCHITECT_ROLE");
    bytes32 public constant RELAYER_ROLE = keccak256("RELAYER_ROLE");
    
    // ============================================================================
    // LINKED CONTRACTS
    // ============================================================================
    
    FoundationVault public vidaToken;
    SentinelGate public sentinelGate;
    
    // ============================================================================
    // ADRS: LOAN TRACKING
    // ============================================================================
    
    struct Loan {
        uint256 id;
        address borrower;
        address lender;
        uint256 principal;
        uint256 collateralLocked;
        uint256 dueDate;
        bool isActive;
        bool isDefaulted;
        bool isRecovered;
        uint256 createdAt;
        uint256 recoveredAt;
    }
    
    mapping(uint256 => Loan) public loans;
    mapping(address => uint256[]) public borrowerLoans;
    mapping(address => uint256[]) public lenderLoans;
    uint256 public nextLoanId;
    
    // ============================================================================
    // ADRS: METRICS
    // ============================================================================
    
    uint256 public totalLoansCreated;
    uint256 public totalLoansDefaulted;
    uint256 public totalLoansRecovered;
    uint256 public totalCollateralRecovered;
    
    // ============================================================================
    // BPS: PAYMENT TRACKING
    // ============================================================================
    
    struct Payment {
        uint256 id;
        address from;
        address to;
        uint256 amount;
        string currency; // "NGN", "USD", "EUR", etc.
        uint256 timestamp;
        bytes32 txHash;
    }
    
    mapping(uint256 => Payment) public payments;
    mapping(address => uint256[]) public userPayments;
    uint256 public nextPaymentId;
    
    // ============================================================================
    // BPS: METRICS
    // ============================================================================
    
    uint256 public totalPaymentsProcessed;
    uint256 public totalVolumeTransferred;
    
    // ============================================================================
    // EVENTS
    // ============================================================================
    
    // ADRS Events
    event LoanCreated(
        uint256 indexed loanId,
        address indexed borrower,
        address indexed lender,
        uint256 principal,
        uint256 collateral,
        uint256 dueDate
    );
    
    event LoanDefaulted(
        uint256 indexed loanId,
        address indexed borrower,
        uint256 collateralLocked
    );
    
    event DebtRecovered(
        uint256 indexed loanId,
        address indexed lender,
        uint256 collateralRecovered
    );
    
    // BPS Events
    event BorderlessPayment(
        uint256 indexed paymentId,
        address indexed from,
        address indexed to,
        uint256 amount,
        string currency,
        bytes32 txHash
    );
    
    event RelayerAdded(address indexed relayer);
    event RelayerRemoved(address indexed relayer);
    
    // ============================================================================
    // CONSTRUCTOR
    // ============================================================================
    
    /**
     * @notice Deploy SentinelSuite
     * @param _vidaToken Address of FoundationVault (VIDA CAP token)
     * @param _sentinelGate Address of SentinelGate (license management)
     * @param _trustedForwarder Address of ERC2771 trusted forwarder for meta-transactions
     * @param _architect Address of Architect
     */
    constructor(
        address _vidaToken,
        address _sentinelGate,
        address _trustedForwarder,
        address _architect
    ) ERC2771Context(_trustedForwarder) {
        require(_vidaToken != address(0), "SentinelSuite: VIDA token is zero address");
        require(_sentinelGate != address(0), "SentinelSuite: sentinel gate is zero address");
        require(_architect != address(0), "SentinelSuite: architect is zero address");
        
        vidaToken = FoundationVault(_vidaToken);
        sentinelGate = SentinelGate(_sentinelGate);
        
        _grantRole(DEFAULT_ADMIN_ROLE, _architect);
        _grantRole(ARCHITECT_ROLE, _architect);
    }

    // ============================================================================
    // ERC2771 CONTEXT OVERRIDE
    // ============================================================================

    /**
     * @notice Override _msgSender for meta-transaction support
     */
    function _msgSender() internal view override(Context, ERC2771Context) returns (address) {
        return ERC2771Context._msgSender();
    }

    /**
     * @notice Override _msgData for meta-transaction support
     */
    function _msgData() internal view override(Context, ERC2771Context) returns (bytes calldata) {
        return ERC2771Context._msgData();
    }

    /**
     * @notice Override _contextSuffixLength for meta-transaction support
     */
    function _contextSuffixLength() internal view override(Context, ERC2771Context) returns (uint256) {
        return ERC2771Context._contextSuffixLength();
    }

    // ============================================================================
    // ADRS: LOAN MANAGEMENT
    // ============================================================================

    /**
     * @notice Create a new loan with collateral lock
     * @param _borrower Address of the borrower
     * @param _lender Address of the lender (bank)
     * @param _principal Loan principal amount in VIDA CAP
     * @param _collateralAmount Collateral amount to lock
     * @param _durationDays Loan duration in days
     */
    function createLoan(
        address _borrower,
        address _lender,
        uint256 _principal,
        uint256 _collateralAmount,
        uint256 _durationDays
    ) external nonReentrant returns (uint256 loanId) {
        // Check ADRS license
        require(sentinelGate.hasActiveADRS(_msgSender()), "SentinelSuite: ADRS license required");
        require(_borrower != address(0), "SentinelSuite: borrower is zero address");
        require(_lender != address(0), "SentinelSuite: lender is zero address");
        require(_principal > 0, "SentinelSuite: principal must be > 0");
        require(_collateralAmount > 0, "SentinelSuite: collateral must be > 0");

        // Query borrower's locked collateral
        (, uint256 lockedBalance, ) = vidaToken.getVaultBalances(_borrower);
        require(lockedBalance >= _collateralAmount, "SentinelSuite: insufficient locked collateral");

        // Create loan
        loanId = nextLoanId++;
        uint256 dueDate = block.timestamp + (_durationDays * 1 days);

        loans[loanId] = Loan({
            id: loanId,
            borrower: _borrower,
            lender: _lender,
            principal: _principal,
            collateralLocked: _collateralAmount,
            dueDate: dueDate,
            isActive: true,
            isDefaulted: false,
            isRecovered: false,
            createdAt: block.timestamp,
            recoveredAt: 0
        });

        borrowerLoans[_borrower].push(loanId);
        lenderLoans[_lender].push(loanId);
        totalLoansCreated++;

        emit LoanCreated(loanId, _borrower, _lender, _principal, _collateralAmount, dueDate);
    }

    /**
     * @notice Mark loan as defaulted (after due date)
     * @param _loanId ID of the loan
     */
    function markLoanDefaulted(uint256 _loanId) external nonReentrant {
        // Check ADRS license
        require(sentinelGate.hasActiveADRS(_msgSender()), "SentinelSuite: ADRS license required");

        Loan storage loan = loans[_loanId];
        require(loan.id == _loanId, "SentinelSuite: loan does not exist");
        require(loan.isActive, "SentinelSuite: loan not active");
        require(!loan.isDefaulted, "SentinelSuite: loan already defaulted");
        require(block.timestamp > loan.dueDate, "SentinelSuite: loan not yet due");

        loan.isDefaulted = true;
        totalLoansDefaulted++;

        emit LoanDefaulted(_loanId, loan.borrower, loan.collateralLocked);
    }

    /**
     * @notice Execute debt recovery (unlock collateral and transfer to lender)
     * @param _loanId ID of the loan
     */
    function executeDebtRecovery(uint256 _loanId)
        external
        onlyRole(ARCHITECT_ROLE)
        nonReentrant
    {
        Loan storage loan = loans[_loanId];
        require(loan.id == _loanId, "SentinelSuite: loan does not exist");
        require(loan.isDefaulted, "SentinelSuite: loan not defaulted");
        require(!loan.isRecovered, "SentinelSuite: debt already recovered");

        // Unlock collateral from borrower
        vidaToken.unlockCollateral(loan.borrower, loan.collateralLocked);

        // Transfer unlocked collateral to lender
        vidaToken.transferFrom(loan.borrower, loan.lender, loan.collateralLocked);

        loan.isRecovered = true;
        loan.isActive = false;
        loan.recoveredAt = block.timestamp;

        totalLoansRecovered++;
        totalCollateralRecovered += loan.collateralLocked;

        emit DebtRecovered(_loanId, loan.lender, loan.collateralLocked);
    }

    /**
     * @notice Query locked collateral for a borrower
     * @param _borrower Address of the borrower
     * @return lockedBalance Amount of locked collateral
     */
    function queryLockedCollateral(address _borrower)
        external
        view
        returns (uint256 lockedBalance)
    {
        // Check ADRS license
        require(sentinelGate.hasActiveADRS(_msgSender()), "SentinelSuite: ADRS license required");

        (, lockedBalance, ) = vidaToken.getVaultBalances(_borrower);
    }

    // ============================================================================
    // BPS: BORDERLESS PAYMENT SYSTEM (GASLESS META-TRANSACTIONS)
    // ============================================================================

    /**
     * @notice Process borderless payment (gasless via meta-transaction)
     * @param _to Recipient address
     * @param _amount Amount to transfer in VIDA CAP
     * @param _currency Currency code (e.g., "NGN", "USD", "EUR")
     * @dev Uses ERC2771 meta-transaction, relayer pays gas
     */
    function processBorderlessPayment(
        address _to,
        uint256 _amount,
        string calldata _currency
    ) external nonReentrant returns (uint256 paymentId) {
        // Check BPS license
        require(sentinelGate.hasActiveBPS(_msgSender()), "SentinelSuite: BPS license required");
        require(_to != address(0), "SentinelSuite: recipient is zero address");
        require(_amount > 0, "SentinelSuite: amount must be > 0");

        // Get actual sender (supports meta-transactions)
        address sender = _msgSender();

        // Transfer VIDA CAP
        vidaToken.transferFrom(sender, _to, _amount);

        // Record payment
        paymentId = nextPaymentId++;
        bytes32 txHash = keccak256(abi.encodePacked(sender, _to, _amount, block.timestamp));

        payments[paymentId] = Payment({
            id: paymentId,
            from: sender,
            to: _to,
            amount: _amount,
            currency: _currency,
            timestamp: block.timestamp,
            txHash: txHash
        });

        userPayments[sender].push(paymentId);
        userPayments[_to].push(paymentId);

        totalPaymentsProcessed++;
        totalVolumeTransferred += _amount;

        emit BorderlessPayment(paymentId, sender, _to, _amount, _currency, txHash);
    }

    /**
     * @notice Batch process borderless payments (gas optimization)
     * @param _recipients Array of recipient addresses
     * @param _amounts Array of amounts to transfer
     * @param _currency Currency code
     */
    function processBorderlessPaymentBatch(
        address[] calldata _recipients,
        uint256[] calldata _amounts,
        string calldata _currency
    ) external nonReentrant {
        // Check BPS license
        require(sentinelGate.hasActiveBPS(_msgSender()), "SentinelSuite: BPS license required");
        require(_recipients.length == _amounts.length, "SentinelSuite: array length mismatch");
        require(_recipients.length > 0, "SentinelSuite: empty batch");
        require(_recipients.length <= 100, "SentinelSuite: batch too large");

        address sender = _msgSender();

        for (uint256 i = 0; i < _recipients.length; i++) {
            require(_recipients[i] != address(0), "SentinelSuite: recipient is zero address");
            require(_amounts[i] > 0, "SentinelSuite: amount must be > 0");

            // Transfer VIDA CAP
            vidaToken.transferFrom(sender, _recipients[i], _amounts[i]);

            // Record payment
            uint256 paymentId = nextPaymentId++;
            bytes32 txHash = keccak256(abi.encodePacked(sender, _recipients[i], _amounts[i], block.timestamp));

            payments[paymentId] = Payment({
                id: paymentId,
                from: sender,
                to: _recipients[i],
                amount: _amounts[i],
                currency: _currency,
                timestamp: block.timestamp,
                txHash: txHash
            });

            userPayments[sender].push(paymentId);
            userPayments[_recipients[i]].push(paymentId);

            totalPaymentsProcessed++;
            totalVolumeTransferred += _amounts[i];

            emit BorderlessPayment(paymentId, sender, _recipients[i], _amounts[i], _currency, txHash);
        }
    }

    // ============================================================================
    // RELAYER MANAGEMENT (FOR META-TRANSACTIONS)
    // ============================================================================

    /**
     * @notice Add relayer for meta-transaction submission
     * @param _relayer Address of the relayer
     */
    function addRelayer(address _relayer)
        external
        onlyRole(ARCHITECT_ROLE)
    {
        require(_relayer != address(0), "SentinelSuite: relayer is zero address");
        _grantRole(RELAYER_ROLE, _relayer);
        emit RelayerAdded(_relayer);
    }

    /**
     * @notice Remove relayer
     * @param _relayer Address of the relayer
     */
    function removeRelayer(address _relayer)
        external
        onlyRole(ARCHITECT_ROLE)
    {
        _revokeRole(RELAYER_ROLE, _relayer);
        emit RelayerRemoved(_relayer);
    }

    // ============================================================================
    // VIEW FUNCTIONS
    // ============================================================================

    /**
     * @notice Get loan details
     * @param _loanId ID of the loan
     */
    function getLoanDetails(uint256 _loanId) external view returns (Loan memory) {
        return loans[_loanId];
    }

    /**
     * @notice Get all loans for a borrower
     * @param _borrower Address of the borrower
     */
    function getBorrowerLoans(address _borrower) external view returns (uint256[] memory) {
        return borrowerLoans[_borrower];
    }

    /**
     * @notice Get all loans for a lender
     * @param _lender Address of the lender
     */
    function getLenderLoans(address _lender) external view returns (uint256[] memory) {
        return lenderLoans[_lender];
    }

    /**
     * @notice Get payment details
     * @param _paymentId ID of the payment
     */
    function getPaymentDetails(uint256 _paymentId) external view returns (Payment memory) {
        return payments[_paymentId];
    }

    /**
     * @notice Get all payments for a user
     * @param _user Address of the user
     */
    function getUserPayments(address _user) external view returns (uint256[] memory) {
        return userPayments[_user];
    }

    /**
     * @notice Get ADRS metrics
     */
    function getADRSMetrics() external view returns (
        uint256 loansCreated,
        uint256 loansDefaulted,
        uint256 loansRecovered,
        uint256 collateralRecovered
    ) {
        loansCreated = totalLoansCreated;
        loansDefaulted = totalLoansDefaulted;
        loansRecovered = totalLoansRecovered;
        collateralRecovered = totalCollateralRecovered;
    }

    /**
     * @notice Get BPS metrics
     */
    function getBPSMetrics() external view returns (
        uint256 paymentsProcessed,
        uint256 volumeTransferred
    ) {
        paymentsProcessed = totalPaymentsProcessed;
        volumeTransferred = totalVolumeTransferred;
    }
}


