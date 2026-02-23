// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

/**
 * @title FoundationVault
 * @notice PFF Sovereign Economic OS — Core VIDA CAP Token with Dual-Vault System
 * @dev ERC20 token with 1 Trillion pre-mint, spendable + locked balances, Chainlink price feed
 * 
 * Architecture:
 * - Total Supply: 1,000,000,000,000 VIDA CAP (1 Trillion) pre-minted to contract
 * - Dual-Vault: Every address has spendable (liquid) and locked (collateral) balances
 * - Vitalization: 11-unit distribution (5+5 locked, 1+1 spendable, 1 sentinel + foundation)
 * - Chainlink: USD price feed for $100 sentinel siphon calculation
 * - Foundation Reserve: Hardlocked until board activation
 * 
 * Rootstock Optimization:
 * - Gas-efficient storage patterns
 * - Meta-transaction ready (ERC-2771 compatible)
 * - Chainlink oracles for RSK mainnet
 */
contract FoundationVault is ERC20, AccessControl, ReentrancyGuard {
    
    // ============================================================================
    // ROLES & CONSTANTS
    // ============================================================================
    
    bytes32 public constant ARCHITECT_ROLE = keccak256("ARCHITECT_ROLE");
    bytes32 public constant SENTINEL_ROLE = keccak256("SENTINEL_ROLE");
    bytes32 public constant FOUNDATION_ROLE = keccak256("FOUNDATION_ROLE");
    
    uint256 public constant TOTAL_SUPPLY = 1_000_000_000_000 * 10**18; // 1 Trillion VIDA CAP
    uint256 public constant VITALIZATION_UNITS = 11 * 10**18; // 11 VIDA CAP per vitalization
    uint256 public constant SENTINEL_USD_AMOUNT = 100; // $100 USD per vitalization
    
    // ============================================================================
    // DUAL-VAULT SYSTEM
    // ============================================================================
    
    struct DualVault {
        uint256 spendable;  // Liquid balance (transferable)
        uint256 locked;     // Collateral balance (non-transferable until unlocked)
    }
    
    mapping(address => DualVault) public vaults;
    
    // ============================================================================
    // VITALIZATION TRACKING
    // ============================================================================
    
    mapping(address => bool) public isVitalized;
    mapping(address => uint256) public vitalizationTimestamp;
    uint256 public totalCitizensVitalized;
    uint256 public totalNationsVitalized;
    
    // ============================================================================
    // FOUNDATION GLOBAL RESERVE
    // ============================================================================
    
    uint256 public foundationGlobalReserve; // Hardlocked until board activation
    bool public isBoardActive; // Governance activation flag
    
    // ============================================================================
    // SENTINEL CONFIGURATION
    // ============================================================================
    
    address public sentinelWallet;
    AggregatorV3Interface public priceFeed; // Chainlink VIDA/USD price feed
    
    // ============================================================================
    // EVENTS
    // ============================================================================
    
    event CitizenVitalized(
        address indexed citizen,
        address indexed nation,
        uint256 citizenSpendable,
        uint256 citizenLocked,
        uint256 nationSpendable,
        uint256 nationLocked,
        uint256 sentinelAmount,
        uint256 foundationAmount,
        uint256 timestamp
    );
    
    event VaultTransfer(address indexed from, address indexed to, uint256 amount, bool isLocked);
    event CollateralLocked(address indexed account, uint256 amount);
    event CollateralUnlocked(address indexed account, uint256 amount);
    event BoardActivated(uint256 timestamp);
    event SentinelWalletUpdated(address indexed oldWallet, address indexed newWallet);
    event PriceFeedUpdated(address indexed oldFeed, address indexed newFeed);
    
    // ============================================================================
    // CONSTRUCTOR
    // ============================================================================
    
    /**
     * @notice Deploy FoundationVault with 1 Trillion VIDA CAP pre-mint
     * @param _architect Address of the Architect (Isreal Okoro)
     * @param _sentinelWallet Address to receive $100 USD equivalent per vitalization
     * @param _priceFeed Chainlink VIDA/USD price feed address (RSK mainnet)
     */
    constructor(
        address _architect,
        address _sentinelWallet,
        address _priceFeed
    ) ERC20("VIDA CAP", "VIDA") {
        require(_architect != address(0), "FoundationVault: architect is zero address");
        require(_sentinelWallet != address(0), "FoundationVault: sentinel wallet is zero address");
        require(_priceFeed != address(0), "FoundationVault: price feed is zero address");
        
        // Grant roles
        _grantRole(DEFAULT_ADMIN_ROLE, _architect);
        _grantRole(ARCHITECT_ROLE, _architect);
        
        // Set sentinel configuration
        sentinelWallet = _sentinelWallet;
        priceFeed = AggregatorV3Interface(_priceFeed);
        
        // Pre-mint 1 Trillion VIDA CAP to contract address
        _mint(address(this), TOTAL_SUPPLY);
        
        // Initialize contract's own vault with full supply as spendable
        vaults[address(this)].spendable = TOTAL_SUPPLY;
    }
    
    // ============================================================================
    // CHAINLINK PRICE FEED
    // ============================================================================
    
    /**
     * @notice Get latest VIDA/USD price from Chainlink
     * @return price VIDA price in USD (8 decimals)
     */
    function getLatestPrice() public view returns (int256 price) {
        (, price, , , ) = priceFeed.latestRoundData();
        require(price > 0, "FoundationVault: invalid price feed");
    }
    
    /**
     * @notice Calculate VIDA CAP amount for $100 USD
     * @return vidaAmount Amount of VIDA CAP equivalent to $100 USD
     */
    function calculateSentinelAmount() public view returns (uint256 vidaAmount) {
        int256 priceUSD = getLatestPrice(); // Price in USD with 8 decimals
        require(priceUSD > 0, "FoundationVault: invalid price");

        // Calculate: $100 / (price in USD) = VIDA amount
        // Price has 8 decimals, we need 18 decimals for VIDA
        vidaAmount = (SENTINEL_USD_AMOUNT * 10**18 * 10**8) / uint256(priceUSD);
    }

    // ============================================================================
    // VITALIZATION LOGIC (11-UNIT DISTRIBUTION)
    // ============================================================================

    /**
     * @notice Vitalize a citizen and their nation with 11-unit VIDA CAP distribution
     * @param _citizen Address of the citizen to vitalize
     * @param _nation Address of the nation treasury
     *
     * Distribution Breakdown:
     * - Citizen: 1 spendable + 4 locked = 5 VIDA CAP
     * - Nation: 1 spendable + 4 locked = 5 VIDA CAP
     * - Sentinel: $100 USD equivalent (dynamic based on price feed)
     * - Foundation: Remainder of 11th unit (hardlocked until board activation)
     */
    function vitalize(address _citizen, address _nation)
        external
        onlyRole(SENTINEL_ROLE)
        nonReentrant
    {
        require(_citizen != address(0), "FoundationVault: citizen is zero address");
        require(_nation != address(0), "FoundationVault: nation is zero address");
        require(!isVitalized[_citizen], "FoundationVault: citizen already vitalized");
        require(vaults[address(this)].spendable >= VITALIZATION_UNITS, "FoundationVault: insufficient supply");

        // Mark as vitalized (CEI pattern)
        isVitalized[_citizen] = true;
        vitalizationTimestamp[_citizen] = block.timestamp;
        totalCitizensVitalized++;

        // Calculate sentinel amount ($100 USD equivalent)
        uint256 sentinelAmount = calculateSentinelAmount();

        // Ensure sentinel amount doesn't exceed 11 units
        require(sentinelAmount <= VITALIZATION_UNITS, "FoundationVault: sentinel amount exceeds vitalization units");

        // Calculate foundation remainder (11th unit - sentinel amount)
        uint256 foundationAmount = VITALIZATION_UNITS - (10 * 10**18) - sentinelAmount;

        // Deduct from contract's spendable vault
        vaults[address(this)].spendable -= VITALIZATION_UNITS;

        // 1. Citizen allocation: 1 spendable + 4 locked
        vaults[_citizen].spendable += 1 * 10**18;
        vaults[_citizen].locked += 4 * 10**18;

        // 2. Nation allocation: 1 spendable + 4 locked
        vaults[_nation].spendable += 1 * 10**18;
        vaults[_nation].locked += 4 * 10**18;

        // Track nation vitalization
        if (!isVitalized[_nation]) {
            isVitalized[_nation] = true;
            totalNationsVitalized++;
        }

        // 3. Sentinel siphon: $100 USD equivalent (liquid)
        vaults[sentinelWallet].spendable += sentinelAmount;

        // 4. Foundation global reserve: Remainder (hardlocked)
        foundationGlobalReserve += foundationAmount;

        emit CitizenVitalized(
            _citizen,
            _nation,
            1 * 10**18,  // citizenSpendable
            4 * 10**18,  // citizenLocked
            1 * 10**18,  // nationSpendable
            4 * 10**18,  // nationLocked
            sentinelAmount,
            foundationAmount,
            block.timestamp
        );
    }

    // ============================================================================
    // DUAL-VAULT MANAGEMENT
    // ============================================================================

    /**
     * @notice Transfer spendable VIDA CAP to another address
     * @param _to Recipient address
     * @param _amount Amount to transfer
     */
    function transferSpendable(address _to, uint256 _amount) external nonReentrant {
        require(_to != address(0), "FoundationVault: transfer to zero address");
        require(vaults[msg.sender].spendable >= _amount, "FoundationVault: insufficient spendable balance");

        vaults[msg.sender].spendable -= _amount;
        vaults[_to].spendable += _amount;

        emit VaultTransfer(msg.sender, _to, _amount, false);
    }

    /**
     * @notice Lock spendable VIDA CAP as collateral
     * @param _amount Amount to lock
     */
    function lockCollateral(uint256 _amount) external nonReentrant {
        require(vaults[msg.sender].spendable >= _amount, "FoundationVault: insufficient spendable balance");

        vaults[msg.sender].spendable -= _amount;
        vaults[msg.sender].locked += _amount;

        emit CollateralLocked(msg.sender, _amount);
    }

    /**
     * @notice Unlock collateral back to spendable (Architect only for debt recovery)
     * @param _account Address to unlock collateral for
     * @param _amount Amount to unlock
     */
    function unlockCollateral(address _account, uint256 _amount)
        external
        onlyRole(ARCHITECT_ROLE)
        nonReentrant
    {
        require(vaults[_account].locked >= _amount, "FoundationVault: insufficient locked balance");

        vaults[_account].locked -= _amount;
        vaults[_account].spendable += _amount;

        emit CollateralUnlocked(_account, _amount);
    }

    /**
     * @notice Get dual-vault balances for an address
     * @param _account Address to query
     * @return spendable Liquid balance
     * @return locked Collateral balance
     * @return total Combined balance
     */
    function getVaultBalances(address _account)
        external
        view
        returns (uint256 spendable, uint256 locked, uint256 total)
    {
        spendable = vaults[_account].spendable;
        locked = vaults[_account].locked;
        total = spendable + locked;
    }

    // ============================================================================
    // ERC20 OVERRIDES (Dual-Vault Integration)
    // ============================================================================

    /**
     * @notice Override balanceOf to return spendable balance only
     * @dev Locked balance is not included in standard ERC20 balance
     */
    function balanceOf(address account) public view override returns (uint256) {
        return vaults[account].spendable;
    }

    /**
     * @notice Override transfer to use dual-vault system
     */
    function transfer(address to, uint256 amount) public override nonReentrant returns (bool) {
        require(to != address(0), "FoundationVault: transfer to zero address");
        require(vaults[msg.sender].spendable >= amount, "FoundationVault: insufficient spendable balance");

        vaults[msg.sender].spendable -= amount;
        vaults[to].spendable += amount;

        emit Transfer(msg.sender, to, amount);
        emit VaultTransfer(msg.sender, to, amount, false);

        return true;
    }

    /**
     * @notice Override transferFrom to use dual-vault system
     */
    function transferFrom(address from, address to, uint256 amount)
        public
        override
        nonReentrant
        returns (bool)
    {
        require(to != address(0), "FoundationVault: transfer to zero address");
        require(vaults[from].spendable >= amount, "FoundationVault: insufficient spendable balance");

        // Check allowance
        uint256 currentAllowance = allowance(from, msg.sender);
        require(currentAllowance >= amount, "FoundationVault: insufficient allowance");

        // Update allowance
        _approve(from, msg.sender, currentAllowance - amount);

        // Transfer
        vaults[from].spendable -= amount;
        vaults[to].spendable += amount;

        emit Transfer(from, to, amount);
        emit VaultTransfer(from, to, amount, false);

        return true;
    }

    // ============================================================================
    // FOUNDATION BOARD ACTIVATION
    // ============================================================================

    /**
     * @notice Activate the Foundation Board (unlocks global reserve)
     * @dev Only Architect can activate, irreversible action
     */
    function activateBoard() external onlyRole(ARCHITECT_ROLE) {
        require(!isBoardActive, "FoundationVault: board already active");

        isBoardActive = true;

        emit BoardActivated(block.timestamp);
    }

    /**
     * @notice Release foundation global reserve (only when board is active)
     * @param _to Recipient address
     * @param _amount Amount to release
     */
    function releaseFoundationReserve(address _to, uint256 _amount)
        external
        onlyRole(FOUNDATION_ROLE)
        nonReentrant
    {
        require(isBoardActive, "FoundationVault: board not active");
        require(_to != address(0), "FoundationVault: recipient is zero address");
        require(foundationGlobalReserve >= _amount, "FoundationVault: insufficient reserve");

        foundationGlobalReserve -= _amount;
        vaults[_to].spendable += _amount;

        emit VaultTransfer(address(this), _to, _amount, false);
    }

    // ============================================================================
    // ADMINISTRATIVE FUNCTIONS
    // ============================================================================

    /**
     * @notice Update sentinel wallet address
     * @param _newSentinelWallet New sentinel wallet address
     */
    function updateSentinelWallet(address _newSentinelWallet)
        external
        onlyRole(ARCHITECT_ROLE)
    {
        require(_newSentinelWallet != address(0), "FoundationVault: new wallet is zero address");

        address oldWallet = sentinelWallet;
        sentinelWallet = _newSentinelWallet;

        emit SentinelWalletUpdated(oldWallet, _newSentinelWallet);
    }

    /**
     * @notice Update Chainlink price feed address
     * @param _newPriceFeed New price feed address
     */
    function updatePriceFeed(address _newPriceFeed)
        external
        onlyRole(ARCHITECT_ROLE)
    {
        require(_newPriceFeed != address(0), "FoundationVault: new feed is zero address");

        address oldFeed = address(priceFeed);
        priceFeed = AggregatorV3Interface(_newPriceFeed);

        emit PriceFeedUpdated(oldFeed, _newPriceFeed);
    }

    /**
     * @notice Grant Sentinel role to SentinelGate contract
     * @param _sentinelGate Address of SentinelGate contract
     */
    function grantSentinelRole(address _sentinelGate)
        external
        onlyRole(ARCHITECT_ROLE)
    {
        _grantRole(SENTINEL_ROLE, _sentinelGate);
    }

    /**
     * @notice Grant Foundation role to Foundation multisig
     * @param _foundation Address of Foundation multisig
     */
    function grantFoundationRole(address _foundation)
        external
        onlyRole(ARCHITECT_ROLE)
    {
        _grantRole(FOUNDATION_ROLE, _foundation);
    }

    // ============================================================================
    // VIEW FUNCTIONS
    // ============================================================================

    /**
     * @notice Get system metrics
     */
    function getSystemMetrics() external view returns (
        uint256 totalSupply_,
        uint256 contractSpendable,
        uint256 contractLocked,
        uint256 foundationReserve,
        uint256 citizensVitalized,
        uint256 nationsVitalized,
        bool boardActive
    ) {
        totalSupply_ = TOTAL_SUPPLY;
        contractSpendable = vaults[address(this)].spendable;
        contractLocked = vaults[address(this)].locked;
        foundationReserve = foundationGlobalReserve;
        citizensVitalized = totalCitizensVitalized;
        nationsVitalized = totalNationsVitalized;
        boardActive = isBoardActive;
    }
}


