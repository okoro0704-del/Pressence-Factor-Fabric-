// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import "./FoundationVault.sol";

/**
 * @title NationalTreasury
 * @notice PFF National Treasury — SAMM (Sovereign Automated Market Maker) with Dual-Liquidity Pool
 * @dev Manages ngnVIDA (National VIDA) with 1:1 peg to Nigerian Naira using Chainlink oracles
 * 
 * Architecture:
 * - Dual-Liquidity Pool: ngnVIDA (National VIDA) + VIDA CAP (Collateral)
 * - 1:1 Peg: ngnVIDA maintains 1:1 exchange rate with Nigerian Naira (NGN)
 * - Chainlink Oracle: NGN/USD price feed for accurate peg maintenance
 * - SAMM: Automated market maker for ngnVIDA <-> VIDA CAP swaps
 * - No Burning: All VIDA CAP remains in liquidity or collateral pools
 * 
 * Use Cases:
 * - Citizens swap VIDA CAP for ngnVIDA (pegged to Naira)
 * - National treasury manages dual-liquidity pool
 * - Maintain 1:1 peg with Naira using oracle price feeds
 * - Provide liquidity for cross-border remittances
 */
contract NationalTreasury is ERC20, AccessControl, ReentrancyGuard {
    
    // ============================================================================
    // ROLES
    // ============================================================================
    
    bytes32 public constant ARCHITECT_ROLE = keccak256("ARCHITECT_ROLE");
    bytes32 public constant TREASURY_ROLE = keccak256("TREASURY_ROLE");
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");
    
    // ============================================================================
    // LINKED CONTRACTS & ORACLES
    // ============================================================================
    
    FoundationVault public vidaToken;
    AggregatorV3Interface public ngnUsdPriceFeed; // Chainlink NGN/USD price feed
    AggregatorV3Interface public vidaUsdPriceFeed; // Chainlink VIDA/USD price feed
    
    // ============================================================================
    // DUAL-LIQUIDITY POOL
    // ============================================================================
    
    uint256 public vidaCapReserve;  // VIDA CAP collateral reserve
    uint256 public ngnVidaSupply;   // ngnVIDA total supply (minted)
    
    // ============================================================================
    // PEG CONFIGURATION
    // ============================================================================
    
    uint256 public constant PEG_RATIO = 1; // 1 ngnVIDA = 1 NGN (Naira)
    uint256 public pegTolerance = 100; // 1% tolerance (100 basis points)
    
    // ============================================================================
    // SWAP FEES
    // ============================================================================
    
    uint256 public swapFeePercent = 50; // 0.5% swap fee (50 basis points)
    uint256 public constant BASIS_POINTS = 10000;
    
    // ============================================================================
    // METRICS
    // ============================================================================
    
    uint256 public totalSwapsVidaToNgn;
    uint256 public totalSwapsNgnToVida;
    uint256 public totalVolumeSwapped;
    uint256 public totalFeesCollected;
    
    // ============================================================================
    // EVENTS
    // ============================================================================
    
    event LiquidityAdded(
        address indexed provider,
        uint256 vidaCapAmount,
        uint256 ngnVidaMinted
    );
    
    event LiquidityRemoved(
        address indexed provider,
        uint256 vidaCapAmount,
        uint256 ngnVidaBurned
    );
    
    event SwapVidaToNgn(
        address indexed user,
        uint256 vidaCapIn,
        uint256 ngnVidaOut,
        uint256 fee
    );
    
    event SwapNgnToVida(
        address indexed user,
        uint256 ngnVidaIn,
        uint256 vidaCapOut,
        uint256 fee
    );
    
    event PegAdjusted(
        uint256 oldRatio,
        uint256 newRatio,
        uint256 timestamp
    );
    
    event SwapFeeUpdated(uint256 oldFee, uint256 newFee);
    event PegToleranceUpdated(uint256 oldTolerance, uint256 newTolerance);
    
    // ============================================================================
    // CONSTRUCTOR
    // ============================================================================
    
    /**
     * @notice Deploy NationalTreasury with SAMM
     * @param _vidaToken Address of FoundationVault (VIDA CAP token)
     * @param _ngnUsdPriceFeed Chainlink NGN/USD price feed address
     * @param _vidaUsdPriceFeed Chainlink VIDA/USD price feed address
     * @param _architect Address of Architect
     */
    constructor(
        address _vidaToken,
        address _ngnUsdPriceFeed,
        address _vidaUsdPriceFeed,
        address _architect
    ) ERC20("Nigerian VIDA", "ngnVIDA") {
        require(_vidaToken != address(0), "NationalTreasury: VIDA token is zero address");
        require(_ngnUsdPriceFeed != address(0), "NationalTreasury: NGN feed is zero address");
        require(_vidaUsdPriceFeed != address(0), "NationalTreasury: VIDA feed is zero address");
        require(_architect != address(0), "NationalTreasury: architect is zero address");
        
        vidaToken = FoundationVault(_vidaToken);
        ngnUsdPriceFeed = AggregatorV3Interface(_ngnUsdPriceFeed);
        vidaUsdPriceFeed = AggregatorV3Interface(_vidaUsdPriceFeed);
        
        _grantRole(DEFAULT_ADMIN_ROLE, _architect);
        _grantRole(ARCHITECT_ROLE, _architect);
        _grantRole(TREASURY_ROLE, _architect);
    }
    
    // ============================================================================
    // CHAINLINK PRICE FEEDS
    // ============================================================================
    
    /**
     * @notice Get latest NGN/USD price from Chainlink
     * @return price NGN price in USD (8 decimals)
     */
    function getNGNPrice() public view returns (int256 price) {
        (, price, , , ) = ngnUsdPriceFeed.latestRoundData();
        require(price > 0, "NationalTreasury: invalid NGN price");
    }
    
    /**
     * @notice Get latest VIDA/USD price from Chainlink
     * @return price VIDA price in USD (8 decimals)
     */
    function getVIDAPrice() public view returns (int256 price) {
        (, price, , , ) = vidaUsdPriceFeed.latestRoundData();
        require(price > 0, "NationalTreasury: invalid VIDA price");
    }

    /**
     * @notice Calculate ngnVIDA amount for given VIDA CAP (maintains 1:1 NGN peg)
     * @param _vidaCapAmount Amount of VIDA CAP
     * @return ngnVidaAmount Equivalent ngnVIDA amount
     */
    function calculateNgnVidaAmount(uint256 _vidaCapAmount) public view returns (uint256 ngnVidaAmount) {
        int256 vidaPriceUSD = getVIDAPrice(); // VIDA price in USD (8 decimals)
        int256 ngnPriceUSD = getNGNPrice();   // NGN price in USD (8 decimals)

        // Calculate: (VIDA amount * VIDA price) / NGN price = NGN amount
        // Since ngnVIDA is 1:1 with NGN, this gives us ngnVIDA amount
        ngnVidaAmount = (_vidaCapAmount * uint256(vidaPriceUSD)) / uint256(ngnPriceUSD);
    }

    /**
     * @notice Calculate VIDA CAP amount for given ngnVIDA (maintains 1:1 NGN peg)
     * @param _ngnVidaAmount Amount of ngnVIDA
     * @return vidaCapAmount Equivalent VIDA CAP amount
     */
    function calculateVidaCapAmount(uint256 _ngnVidaAmount) public view returns (uint256 vidaCapAmount) {
        int256 vidaPriceUSD = getVIDAPrice(); // VIDA price in USD (8 decimals)
        int256 ngnPriceUSD = getNGNPrice();   // NGN price in USD (8 decimals)

        // Calculate: (NGN amount * NGN price) / VIDA price = VIDA amount
        vidaCapAmount = (_ngnVidaAmount * uint256(ngnPriceUSD)) / uint256(vidaPriceUSD);
    }

    // ============================================================================
    // SAMM: SWAP FUNCTIONS
    // ============================================================================

    /**
     * @notice Swap VIDA CAP for ngnVIDA (pegged to Naira)
     * @param _vidaCapAmount Amount of VIDA CAP to swap
     * @return ngnVidaAmount Amount of ngnVIDA received
     */
    function swapVidaToNgn(uint256 _vidaCapAmount)
        external
        nonReentrant
        returns (uint256 ngnVidaAmount)
    {
        require(_vidaCapAmount > 0, "NationalTreasury: amount must be > 0");

        // Calculate ngnVIDA amount based on oracle prices
        ngnVidaAmount = calculateNgnVidaAmount(_vidaCapAmount);

        // Calculate swap fee
        uint256 fee = (ngnVidaAmount * swapFeePercent) / BASIS_POINTS;
        uint256 ngnVidaOut = ngnVidaAmount - fee;

        // Transfer VIDA CAP from user to treasury
        vidaToken.transferFrom(msg.sender, address(this), _vidaCapAmount);

        // Update reserves
        vidaCapReserve += _vidaCapAmount;

        // Mint ngnVIDA to user
        _mint(msg.sender, ngnVidaOut);
        ngnVidaSupply += ngnVidaOut;

        // Track metrics
        totalSwapsVidaToNgn++;
        totalVolumeSwapped += _vidaCapAmount;
        totalFeesCollected += fee;

        emit SwapVidaToNgn(msg.sender, _vidaCapAmount, ngnVidaOut, fee);
    }

    /**
     * @notice Swap ngnVIDA for VIDA CAP
     * @param _ngnVidaAmount Amount of ngnVIDA to swap
     * @return vidaCapAmount Amount of VIDA CAP received
     */
    function swapNgnToVida(uint256 _ngnVidaAmount)
        external
        nonReentrant
        returns (uint256 vidaCapAmount)
    {
        require(_ngnVidaAmount > 0, "NationalTreasury: amount must be > 0");
        require(balanceOf(msg.sender) >= _ngnVidaAmount, "NationalTreasury: insufficient ngnVIDA balance");

        // Calculate VIDA CAP amount based on oracle prices
        vidaCapAmount = calculateVidaCapAmount(_ngnVidaAmount);

        // Calculate swap fee
        uint256 fee = (vidaCapAmount * swapFeePercent) / BASIS_POINTS;
        uint256 vidaCapOut = vidaCapAmount - fee;

        require(vidaCapReserve >= vidaCapOut, "NationalTreasury: insufficient VIDA CAP reserve");

        // Burn ngnVIDA from user
        _burn(msg.sender, _ngnVidaAmount);
        ngnVidaSupply -= _ngnVidaAmount;

        // Update reserves
        vidaCapReserve -= vidaCapOut;

        // Transfer VIDA CAP to user
        vidaToken.transfer(msg.sender, vidaCapOut);

        // Track metrics
        totalSwapsNgnToVida++;
        totalVolumeSwapped += vidaCapOut;
        totalFeesCollected += fee;

        emit SwapNgnToVida(msg.sender, _ngnVidaAmount, vidaCapOut, fee);
    }

    // ============================================================================
    // LIQUIDITY MANAGEMENT
    // ============================================================================

    /**
     * @notice Add liquidity to the pool (Treasury only)
     * @param _vidaCapAmount Amount of VIDA CAP to add
     */
    function addLiquidity(uint256 _vidaCapAmount)
        external
        onlyRole(TREASURY_ROLE)
        nonReentrant
    {
        require(_vidaCapAmount > 0, "NationalTreasury: amount must be > 0");

        // Transfer VIDA CAP from treasury to contract
        vidaToken.transferFrom(msg.sender, address(this), _vidaCapAmount);

        // Calculate equivalent ngnVIDA to mint
        uint256 ngnVidaToMint = calculateNgnVidaAmount(_vidaCapAmount);

        // Update reserves
        vidaCapReserve += _vidaCapAmount;

        // Mint ngnVIDA to treasury
        _mint(msg.sender, ngnVidaToMint);
        ngnVidaSupply += ngnVidaToMint;

        emit LiquidityAdded(msg.sender, _vidaCapAmount, ngnVidaToMint);
    }

    /**
     * @notice Remove liquidity from the pool (Treasury only)
     * @param _ngnVidaAmount Amount of ngnVIDA to burn
     */
    function removeLiquidity(uint256 _ngnVidaAmount)
        external
        onlyRole(TREASURY_ROLE)
        nonReentrant
    {
        require(_ngnVidaAmount > 0, "NationalTreasury: amount must be > 0");
        require(balanceOf(msg.sender) >= _ngnVidaAmount, "NationalTreasury: insufficient ngnVIDA balance");

        // Calculate equivalent VIDA CAP to return
        uint256 vidaCapToReturn = calculateVidaCapAmount(_ngnVidaAmount);

        require(vidaCapReserve >= vidaCapToReturn, "NationalTreasury: insufficient VIDA CAP reserve");

        // Burn ngnVIDA
        _burn(msg.sender, _ngnVidaAmount);
        ngnVidaSupply -= _ngnVidaAmount;

        // Update reserves
        vidaCapReserve -= vidaCapToReturn;

        // Transfer VIDA CAP back to treasury
        vidaToken.transfer(msg.sender, vidaCapToReturn);

        emit LiquidityRemoved(msg.sender, vidaCapToReturn, _ngnVidaAmount);
    }

    // ============================================================================
    // ADMINISTRATIVE FUNCTIONS
    // ============================================================================

    /**
     * @notice Update swap fee percentage
     * @param _newFeePercent New swap fee in basis points (e.g., 50 = 0.5%)
     */
    function updateSwapFee(uint256 _newFeePercent)
        external
        onlyRole(ARCHITECT_ROLE)
    {
        require(_newFeePercent <= 500, "NationalTreasury: fee cannot exceed 5%");

        uint256 oldFee = swapFeePercent;
        swapFeePercent = _newFeePercent;

        emit SwapFeeUpdated(oldFee, _newFeePercent);
    }

    /**
     * @notice Update peg tolerance
     * @param _newTolerance New tolerance in basis points (e.g., 100 = 1%)
     */
    function updatePegTolerance(uint256 _newTolerance)
        external
        onlyRole(ARCHITECT_ROLE)
    {
        require(_newTolerance <= 1000, "NationalTreasury: tolerance cannot exceed 10%");

        uint256 oldTolerance = pegTolerance;
        pegTolerance = _newTolerance;

        emit PegToleranceUpdated(oldTolerance, _newTolerance);
    }

    /**
     * @notice Update NGN/USD price feed
     * @param _newPriceFeed New Chainlink price feed address
     */
    function updateNGNPriceFeed(address _newPriceFeed)
        external
        onlyRole(ARCHITECT_ROLE)
    {
        require(_newPriceFeed != address(0), "NationalTreasury: new feed is zero address");
        ngnUsdPriceFeed = AggregatorV3Interface(_newPriceFeed);
    }

    /**
     * @notice Update VIDA/USD price feed
     * @param _newPriceFeed New Chainlink price feed address
     */
    function updateVIDAPriceFeed(address _newPriceFeed)
        external
        onlyRole(ARCHITECT_ROLE)
    {
        require(_newPriceFeed != address(0), "NationalTreasury: new feed is zero address");
        vidaUsdPriceFeed = AggregatorV3Interface(_newPriceFeed);
    }

    /**
     * @notice Grant Treasury role
     * @param _treasury Address to grant treasury role
     */
    function grantTreasuryRole(address _treasury)
        external
        onlyRole(ARCHITECT_ROLE)
    {
        _grantRole(TREASURY_ROLE, _treasury);
    }

    // ============================================================================
    // VIEW FUNCTIONS
    // ============================================================================

    /**
     * @notice Get pool reserves
     */
    function getReserves() external view returns (
        uint256 vidaCapReserve_,
        uint256 ngnVidaSupply_
    ) {
        vidaCapReserve_ = vidaCapReserve;
        ngnVidaSupply_ = ngnVidaSupply;
    }

    /**
     * @notice Get current exchange rate (VIDA CAP per ngnVIDA)
     */
    function getExchangeRate() external view returns (uint256 rate) {
        if (ngnVidaSupply == 0) return 0;
        rate = (vidaCapReserve * 10**18) / ngnVidaSupply;
    }

    /**
     * @notice Check if peg is within tolerance
     */
    function isPegHealthy() external view returns (bool) {
        if (ngnVidaSupply == 0) return true;

        uint256 expectedRatio = calculateNgnVidaAmount(1 * 10**18);
        uint256 actualRatio = (ngnVidaSupply * 10**18) / vidaCapReserve;

        uint256 deviation = expectedRatio > actualRatio
            ? expectedRatio - actualRatio
            : actualRatio - expectedRatio;

        uint256 maxDeviation = (expectedRatio * pegTolerance) / BASIS_POINTS;

        return deviation <= maxDeviation;
    }

    /**
     * @notice Get SAMM metrics
     */
    function getSAMMMetrics() external view returns (
        uint256 swapsVidaToNgn,
        uint256 swapsNgnToVida,
        uint256 volumeSwapped,
        uint256 feesCollected,
        uint256 currentSwapFee,
        bool pegHealthy
    ) {
        swapsVidaToNgn = totalSwapsVidaToNgn;
        swapsNgnToVida = totalSwapsNgnToVida;
        volumeSwapped = totalVolumeSwapped;
        feesCollected = totalFeesCollected;
        currentSwapFee = swapFeePercent;
        pegHealthy = this.isPegHealthy();
    }

    /**
     * @notice Get quote for VIDA CAP to ngnVIDA swap
     * @param _vidaCapAmount Amount of VIDA CAP to swap
     * @return ngnVidaOut Amount of ngnVIDA user will receive (after fees)
     * @return fee Swap fee amount
     */
    function getQuoteVidaToNgn(uint256 _vidaCapAmount)
        external
        view
        returns (uint256 ngnVidaOut, uint256 fee)
    {
        uint256 ngnVidaAmount = calculateNgnVidaAmount(_vidaCapAmount);
        fee = (ngnVidaAmount * swapFeePercent) / BASIS_POINTS;
        ngnVidaOut = ngnVidaAmount - fee;
    }

    /**
     * @notice Get quote for ngnVIDA to VIDA CAP swap
     * @param _ngnVidaAmount Amount of ngnVIDA to swap
     * @return vidaCapOut Amount of VIDA CAP user will receive (after fees)
     * @return fee Swap fee amount
     */
    function getQuoteNgnToVida(uint256 _ngnVidaAmount)
        external
        view
        returns (uint256 vidaCapOut, uint256 fee)
    {
        uint256 vidaCapAmount = calculateVidaCapAmount(_ngnVidaAmount);
        fee = (vidaCapAmount * swapFeePercent) / BASIS_POINTS;
        vidaCapOut = vidaCapAmount - fee;
    }
}


