// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./FoundationVault.sol";

/**
 * @title SentinelGate
 * @notice PFF Sentinel Gate — RBAC, License Stamps, and Fee Management
 * @dev Role-based access control with modular licensing (ADRS, BPS, SSS)
 * 
 * Architecture:
 * - RBAC: Architect (Owner), Foundation, Partner Banks (50% discount), External Banks (Full fee)
 * - License Stamps: isPFFVerified, adrsExpiry, bpsExpiry, sssExpiry
 * - Hardstop Modifiers: Instant revert if license expired
 * - Fee Splits: 30-40% Architect, 100% onboarding to Foundation
 * 
 * Licensing Model:
 * - ADRS (Automated Debt Recovery System): Query locked collateral
 * - BPS (Borderless Payment System): Gasless meta-transactions
 * - SSS (Sentinel Suite System): Full access to all modules
 * 
 * Fee Structure:
 * - Partner Banks: 50% discount on all fees
 * - External Banks: Full fee
 * - Onboarding Fee: 100% to Foundation
 * - Transaction Fee: 30-40% to Architect, 60-70% to Foundation
 */
contract SentinelGate is AccessControl, ReentrancyGuard {
    
    // ============================================================================
    // ROLES
    // ============================================================================
    
    bytes32 public constant ARCHITECT_ROLE = keccak256("ARCHITECT_ROLE");
    bytes32 public constant FOUNDATION_ROLE = keccak256("FOUNDATION_ROLE");
    bytes32 public constant PARTNER_BANK_ROLE = keccak256("PARTNER_BANK_ROLE");
    bytes32 public constant EXTERNAL_BANK_ROLE = keccak256("EXTERNAL_BANK_ROLE");
    
    // ============================================================================
    // LICENSE STAMPS
    // ============================================================================
    
    struct LicenseStamp {
        bool isPFFVerified;      // PFF verification status
        uint256 adrsExpiry;      // ADRS license expiry timestamp
        uint256 bpsExpiry;       // BPS license expiry timestamp
        uint256 sssExpiry;       // SSS (full suite) license expiry timestamp
        uint256 onboardingDate;  // Date of onboarding
        bool isPartnerBank;      // 50% fee discount flag
    }
    
    mapping(address => LicenseStamp) public licenses;
    
    // ============================================================================
    // FEE CONFIGURATION
    // ============================================================================
    
    uint256 public architectFeePercent = 35; // 35% to Architect (30-40% range)
    uint256 public foundationFeePercent = 65; // 65% to Foundation
    
    uint256 public onboardingFee = 1000 * 10**18; // 1000 VIDA CAP onboarding fee
    uint256 public adrsAnnualFee = 500 * 10**18;  // 500 VIDA CAP per year
    uint256 public bpsAnnualFee = 500 * 10**18;   // 500 VIDA CAP per year
    uint256 public sssAnnualFee = 1500 * 10**18;  // 1500 VIDA CAP per year (full suite)
    
    uint256 public partnerBankDiscount = 50; // 50% discount for partner banks
    
    // ============================================================================
    // LINKED CONTRACTS
    // ============================================================================
    
    FoundationVault public vidaToken;
    address public architectWallet;
    address public foundationWallet;
    
    // ============================================================================
    // TRACKING
    // ============================================================================
    
    uint256 public totalBanksOnboarded;
    uint256 public totalPartnerBanks;
    uint256 public totalExternalBanks;
    uint256 public totalFeesCollected;
    
    // ============================================================================
    // EVENTS
    // ============================================================================
    
    event BankOnboarded(
        address indexed bank,
        bool isPartner,
        uint256 onboardingFee,
        uint256 timestamp
    );
    
    event LicenseGranted(
        address indexed bank,
        string licenseType,
        uint256 expiryTimestamp,
        uint256 fee
    );
    
    event LicenseRevoked(
        address indexed bank,
        string licenseType
    );
    
    event FeeCollected(
        address indexed from,
        uint256 amount,
        uint256 architectShare,
        uint256 foundationShare
    );
    
    event FeeConfigUpdated(
        uint256 architectPercent,
        uint256 foundationPercent
    );
    
    // ============================================================================
    // MODIFIERS (HARDSTOP)
    // ============================================================================
    
    /**
     * @notice Hardstop: Revert if ADRS license expired
     */
    modifier onlyActiveADRS() {
        require(
            licenses[msg.sender].adrsExpiry > block.timestamp || 
            licenses[msg.sender].sssExpiry > block.timestamp,
            "SentinelGate: ADRS license expired"
        );
        _;
    }
    
    /**
     * @notice Hardstop: Revert if BPS license expired
     */
    modifier onlyActiveBPS() {
        require(
            licenses[msg.sender].bpsExpiry > block.timestamp || 
            licenses[msg.sender].sssExpiry > block.timestamp,
            "SentinelGate: BPS license expired"
        );
        _;
    }
    
    /**
     * @notice Hardstop: Revert if SSS license expired
     */
    modifier onlyActiveSSS() {
        require(
            licenses[msg.sender].sssExpiry > block.timestamp,
            "SentinelGate: SSS license expired"
        );
        _;
    }

    // ============================================================================
    // CONSTRUCTOR
    // ============================================================================

    /**
     * @notice Deploy SentinelGate
     * @param _vidaToken Address of FoundationVault (VIDA CAP token)
     * @param _architect Address of Architect (Isreal Okoro)
     * @param _foundation Address of Foundation wallet
     */
    constructor(
        address _vidaToken,
        address _architect,
        address _foundation
    ) {
        require(_vidaToken != address(0), "SentinelGate: VIDA token is zero address");
        require(_architect != address(0), "SentinelGate: architect is zero address");
        require(_foundation != address(0), "SentinelGate: foundation is zero address");

        vidaToken = FoundationVault(_vidaToken);
        architectWallet = _architect;
        foundationWallet = _foundation;

        _grantRole(DEFAULT_ADMIN_ROLE, _architect);
        _grantRole(ARCHITECT_ROLE, _architect);
        _grantRole(FOUNDATION_ROLE, _foundation);
    }

    // ============================================================================
    // BANK ONBOARDING
    // ============================================================================

    /**
     * @notice Onboard a new bank (Partner or External)
     * @param _bank Address of the bank
     * @param _isPartner True if partner bank (50% discount), false if external
     */
    function onboardBank(address _bank, bool _isPartner)
        external
        onlyRole(ARCHITECT_ROLE)
        nonReentrant
    {
        require(_bank != address(0), "SentinelGate: bank is zero address");
        require(!licenses[_bank].isPFFVerified, "SentinelGate: bank already onboarded");

        // Calculate onboarding fee (100% to Foundation)
        uint256 fee = _isPartner ? (onboardingFee * partnerBankDiscount) / 100 : onboardingFee;

        // Transfer onboarding fee from bank to Foundation (100%)
        vidaToken.transferFrom(_bank, foundationWallet, fee);

        // Grant role
        if (_isPartner) {
            _grantRole(PARTNER_BANK_ROLE, _bank);
            totalPartnerBanks++;
        } else {
            _grantRole(EXTERNAL_BANK_ROLE, _bank);
            totalExternalBanks++;
        }

        // Create license stamp
        licenses[_bank] = LicenseStamp({
            isPFFVerified: true,
            adrsExpiry: 0,
            bpsExpiry: 0,
            sssExpiry: 0,
            onboardingDate: block.timestamp,
            isPartnerBank: _isPartner
        });

        totalBanksOnboarded++;
        totalFeesCollected += fee;

        emit BankOnboarded(_bank, _isPartner, fee, block.timestamp);
    }

    // ============================================================================
    // LICENSE MANAGEMENT
    // ============================================================================

    /**
     * @notice Grant ADRS license to a bank
     * @param _bank Address of the bank
     * @param _durationDays License duration in days
     */
    function grantADRSLicense(address _bank, uint256 _durationDays)
        external
        onlyRole(ARCHITECT_ROLE)
        nonReentrant
    {
        require(licenses[_bank].isPFFVerified, "SentinelGate: bank not onboarded");

        // Calculate fee with partner discount
        uint256 fee = licenses[_bank].isPartnerBank
            ? (adrsAnnualFee * partnerBankDiscount) / 100
            : adrsAnnualFee;

        // Adjust fee for duration (pro-rated)
        fee = (fee * _durationDays) / 365;

        // Collect fee and split
        _collectFee(_bank, fee);

        // Grant license
        uint256 expiryTimestamp = block.timestamp + (_durationDays * 1 days);
        licenses[_bank].adrsExpiry = expiryTimestamp;

        emit LicenseGranted(_bank, "ADRS", expiryTimestamp, fee);
    }

    /**
     * @notice Grant BPS license to a bank
     * @param _bank Address of the bank
     * @param _durationDays License duration in days
     */
    function grantBPSLicense(address _bank, uint256 _durationDays)
        external
        onlyRole(ARCHITECT_ROLE)
        nonReentrant
    {
        require(licenses[_bank].isPFFVerified, "SentinelGate: bank not onboarded");

        // Calculate fee with partner discount
        uint256 fee = licenses[_bank].isPartnerBank
            ? (bpsAnnualFee * partnerBankDiscount) / 100
            : bpsAnnualFee;

        // Adjust fee for duration (pro-rated)
        fee = (fee * _durationDays) / 365;

        // Collect fee and split
        _collectFee(_bank, fee);

        // Grant license
        uint256 expiryTimestamp = block.timestamp + (_durationDays * 1 days);
        licenses[_bank].bpsExpiry = expiryTimestamp;

        emit LicenseGranted(_bank, "BPS", expiryTimestamp, fee);
    }

    /**
     * @notice Grant SSS (full suite) license to a bank
     * @param _bank Address of the bank
     * @param _durationDays License duration in days
     */
    function grantSSSLicense(address _bank, uint256 _durationDays)
        external
        onlyRole(ARCHITECT_ROLE)
        nonReentrant
    {
        require(licenses[_bank].isPFFVerified, "SentinelGate: bank not onboarded");

        // Calculate fee with partner discount
        uint256 fee = licenses[_bank].isPartnerBank
            ? (sssAnnualFee * partnerBankDiscount) / 100
            : sssAnnualFee;

        // Adjust fee for duration (pro-rated)
        fee = (fee * _durationDays) / 365;

        // Collect fee and split
        _collectFee(_bank, fee);

        // Grant license (SSS includes ADRS + BPS)
        uint256 expiryTimestamp = block.timestamp + (_durationDays * 1 days);
        licenses[_bank].sssExpiry = expiryTimestamp;
        licenses[_bank].adrsExpiry = expiryTimestamp;
        licenses[_bank].bpsExpiry = expiryTimestamp;

        emit LicenseGranted(_bank, "SSS", expiryTimestamp, fee);
    }

    /**
     * @notice Revoke ADRS license
     * @param _bank Address of the bank
     */
    function revokeADRSLicense(address _bank)
        external
        onlyRole(ARCHITECT_ROLE)
    {
        licenses[_bank].adrsExpiry = 0;
        emit LicenseRevoked(_bank, "ADRS");
    }

    /**
     * @notice Revoke BPS license
     * @param _bank Address of the bank
     */
    function revokeBPSLicense(address _bank)
        external
        onlyRole(ARCHITECT_ROLE)
    {
        licenses[_bank].bpsExpiry = 0;
        emit LicenseRevoked(_bank, "BPS");
    }

    /**
     * @notice Revoke SSS license
     * @param _bank Address of the bank
     */
    function revokeSSSLicense(address _bank)
        external
        onlyRole(ARCHITECT_ROLE)
    {
        licenses[_bank].sssExpiry = 0;
        licenses[_bank].adrsExpiry = 0;
        licenses[_bank].bpsExpiry = 0;
        emit LicenseRevoked(_bank, "SSS");
    }

    // ============================================================================
    // FEE COLLECTION (INTERNAL)
    // ============================================================================

    /**
     * @notice Internal function to collect and split fees
     * @param _from Address paying the fee
     * @param _amount Total fee amount
     */
    function _collectFee(address _from, uint256 _amount) internal {
        require(_amount > 0, "SentinelGate: fee amount is zero");

        // Calculate splits
        uint256 architectShare = (_amount * architectFeePercent) / 100;
        uint256 foundationShare = _amount - architectShare;

        // Transfer fees
        vidaToken.transferFrom(_from, architectWallet, architectShare);
        vidaToken.transferFrom(_from, foundationWallet, foundationShare);

        totalFeesCollected += _amount;

        emit FeeCollected(_from, _amount, architectShare, foundationShare);
    }

    // ============================================================================
    // ADMINISTRATIVE FUNCTIONS
    // ============================================================================

    /**
     * @notice Update fee split percentages
     * @param _architectPercent Architect fee percentage (30-40%)
     * @param _foundationPercent Foundation fee percentage (60-70%)
     */
    function updateFeeSplit(uint256 _architectPercent, uint256 _foundationPercent)
        external
        onlyRole(ARCHITECT_ROLE)
    {
        require(_architectPercent + _foundationPercent == 100, "SentinelGate: percentages must sum to 100");
        require(_architectPercent >= 30 && _architectPercent <= 40, "SentinelGate: architect percent must be 30-40%");

        architectFeePercent = _architectPercent;
        foundationFeePercent = _foundationPercent;

        emit FeeConfigUpdated(_architectPercent, _foundationPercent);
    }

    /**
     * @notice Update onboarding fee
     * @param _newFee New onboarding fee in VIDA CAP
     */
    function updateOnboardingFee(uint256 _newFee)
        external
        onlyRole(ARCHITECT_ROLE)
    {
        onboardingFee = _newFee;
    }

    /**
     * @notice Update ADRS annual fee
     * @param _newFee New ADRS annual fee in VIDA CAP
     */
    function updateADRSFee(uint256 _newFee)
        external
        onlyRole(ARCHITECT_ROLE)
    {
        adrsAnnualFee = _newFee;
    }

    /**
     * @notice Update BPS annual fee
     * @param _newFee New BPS annual fee in VIDA CAP
     */
    function updateBPSFee(uint256 _newFee)
        external
        onlyRole(ARCHITECT_ROLE)
    {
        bpsAnnualFee = _newFee;
    }

    /**
     * @notice Update SSS annual fee
     * @param _newFee New SSS annual fee in VIDA CAP
     */
    function updateSSSFee(uint256 _newFee)
        external
        onlyRole(ARCHITECT_ROLE)
    {
        sssAnnualFee = _newFee;
    }

    /**
     * @notice Update partner bank discount percentage
     * @param _newDiscount New discount percentage (0-100)
     */
    function updatePartnerDiscount(uint256 _newDiscount)
        external
        onlyRole(ARCHITECT_ROLE)
    {
        require(_newDiscount <= 100, "SentinelGate: discount cannot exceed 100%");
        partnerBankDiscount = _newDiscount;
    }

    /**
     * @notice Update architect wallet address
     * @param _newArchitect New architect wallet address
     */
    function updateArchitectWallet(address _newArchitect)
        external
        onlyRole(ARCHITECT_ROLE)
    {
        require(_newArchitect != address(0), "SentinelGate: new architect is zero address");
        architectWallet = _newArchitect;
    }

    /**
     * @notice Update foundation wallet address
     * @param _newFoundation New foundation wallet address
     */
    function updateFoundationWallet(address _newFoundation)
        external
        onlyRole(ARCHITECT_ROLE)
    {
        require(_newFoundation != address(0), "SentinelGate: new foundation is zero address");
        foundationWallet = _newFoundation;
    }

    // ============================================================================
    // VIEW FUNCTIONS
    // ============================================================================

    /**
     * @notice Check if bank has active ADRS license
     * @param _bank Address of the bank
     */
    function hasActiveADRS(address _bank) external view returns (bool) {
        return licenses[_bank].adrsExpiry > block.timestamp ||
               licenses[_bank].sssExpiry > block.timestamp;
    }

    /**
     * @notice Check if bank has active BPS license
     * @param _bank Address of the bank
     */
    function hasActiveBPS(address _bank) external view returns (bool) {
        return licenses[_bank].bpsExpiry > block.timestamp ||
               licenses[_bank].sssExpiry > block.timestamp;
    }

    /**
     * @notice Check if bank has active SSS license
     * @param _bank Address of the bank
     */
    function hasActiveSSS(address _bank) external view returns (bool) {
        return licenses[_bank].sssExpiry > block.timestamp;
    }

    /**
     * @notice Get license details for a bank
     * @param _bank Address of the bank
     */
    function getLicenseDetails(address _bank) external view returns (LicenseStamp memory) {
        return licenses[_bank];
    }

    /**
     * @notice Get system metrics
     */
    function getSystemMetrics() external view returns (
        uint256 banksOnboarded,
        uint256 partnerBanks,
        uint256 externalBanks,
        uint256 feesCollected,
        uint256 architectPercent,
        uint256 foundationPercent
    ) {
        banksOnboarded = totalBanksOnboarded;
        partnerBanks = totalPartnerBanks;
        externalBanks = totalExternalBanks;
        feesCollected = totalFeesCollected;
        architectPercent = architectFeePercent;
        foundationPercent = foundationFeePercent;
    }
}


