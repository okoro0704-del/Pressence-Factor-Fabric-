// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./SovereignVida.sol";
import "./NationalBlockNG.sol";
import "./FoundationVault.sol";

/**
 * @title SovrynSentinelGate
 * @notice The Central Controller — Vitalization engine with 11-way VIDA split
 * @dev Orchestrates citizen vitalization and automatic VIDA distribution
 * 
 * Vitalization Flow (11 VIDA total per citizen):
 * 1. Citizen completes biometric verification (face + palm + device)
 * 2. SovrynSentinelGate mints 11 VIDA total
 * 3. Automatic distribution:
 *    - 5.0 VIDA → Citizen wallet (user receives)
 *    - 5.0 VIDA → National Block (Nigeria treasury)
 *    - 1.0 VIDA → Foundation Vault (infrastructure + loans)
 * 
 * Security:
 * - One vitalization per citizen (tracked by wallet address)
 * - Only ARCHITECT can trigger vitalization (off-chain verification required)
 * - ReentrancyGuard prevents double-minting
 * - All contracts linked at deployment
 * 
 * Access Control:
 * - ARCHITECT_ROLE: Can vitalize citizens and manage system
 * - DEFAULT_ADMIN_ROLE: Can update contract addresses (emergency only)
 */
contract SovrynSentinelGate is AccessControl, ReentrancyGuard {
    bytes32 public constant ARCHITECT_ROLE = keccak256("ARCHITECT_ROLE");
    
    // Linked contracts
    SovereignVida public vidaToken;
    NationalBlockNG public nationalBlock;
    FoundationVault public foundationVault;
    
    // Vitalization constants (in VIDA, 18 decimals)
    uint256 public constant CITIZEN_ALLOCATION = 5 * 10**18;      // 5.0 VIDA
    uint256 public constant NATIONAL_ALLOCATION = 5 * 10**18;     // 5.0 VIDA
    uint256 public constant FOUNDATION_ALLOCATION = 1 * 10**18;   // 1.0 VIDA
    uint256 public constant TOTAL_PER_VITALIZATION = 11 * 10**18; // 11.0 VIDA
    
    // Vitalization tracking
    mapping(address => bool) public isVitalized;
    mapping(address => uint256) public vitalizationTimestamp;
    uint256 public totalCitizensVitalized;
    uint256 public totalVidaMinted;
    
    // Events
    event CitizenVitalized(
        address indexed citizen,
        uint256 citizenAmount,
        uint256 nationalAmount,
        uint256 foundationAmount,
        uint256 timestamp
    );
    event ContractsLinked(address vida, address nationalBlock, address foundation);
    event ContractUpdated(string contractName, address oldAddress, address newAddress);
    
    /**
     * @notice Deploy SovrynSentinelGate
     * @param _architect Address of Architect (Isreal Okoro)
     */
    constructor(address _architect) {
        require(_architect != address(0), "SovrynSentinelGate: architect is zero address");
        
        _grantRole(DEFAULT_ADMIN_ROLE, _architect);
        _grantRole(ARCHITECT_ROLE, _architect);
    }
    
    /**
     * @notice Link all contracts (called once after deployment)
     * @param _vidaToken Address of SovereignVida token
     * @param _nationalBlock Address of NationalBlockNG
     * @param _foundationVault Address of FoundationVault
     */
    function linkContracts(
        address _vidaToken,
        address _nationalBlock,
        address _foundationVault
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(address(vidaToken) == address(0), "SovrynSentinelGate: contracts already linked");
        require(_vidaToken != address(0), "SovrynSentinelGate: VIDA token is zero address");
        require(_nationalBlock != address(0), "SovrynSentinelGate: national block is zero address");
        require(_foundationVault != address(0), "SovrynSentinelGate: foundation vault is zero address");
        
        vidaToken = SovereignVida(_vidaToken);
        nationalBlock = NationalBlockNG(_nationalBlock);
        foundationVault = FoundationVault(_foundationVault);
        
        emit ContractsLinked(_vidaToken, _nationalBlock, _foundationVault);
    }
    
    /**
     * @notice Vitalize a citizen (mint and distribute 11 VIDA)
     * @param citizenWallet Address of citizen's wallet (derived from biometric seed)
     * 
     * Distribution:
     * - 5.0 VIDA → Citizen wallet
     * - 5.0 VIDA → National Block (Nigeria)
     * - 1.0 VIDA → Foundation Vault
     */
    function vitalizeCitizen(address citizenWallet) external onlyRole(ARCHITECT_ROLE) nonReentrant {
        require(address(vidaToken) != address(0), "SovrynSentinelGate: contracts not linked");
        require(citizenWallet != address(0), "SovrynSentinelGate: citizen wallet is zero address");
        require(!isVitalized[citizenWallet], "SovrynSentinelGate: citizen already vitalized");
        
        // Mark as vitalized BEFORE minting (CEI pattern)
        isVitalized[citizenWallet] = true;
        vitalizationTimestamp[citizenWallet] = block.timestamp;
        totalCitizensVitalized++;
        
        // Mint 11 VIDA total to this contract
        vidaToken.mint(address(this), TOTAL_PER_VITALIZATION);
        totalVidaMinted += TOTAL_PER_VITALIZATION;
        
        // 1. Transfer 5.0 VIDA to citizen
        require(
            vidaToken.transfer(citizenWallet, CITIZEN_ALLOCATION),
            "SovrynSentinelGate: citizen transfer failed"
        );
        
        // 2. Approve and deposit 5.0 VIDA to National Block
        vidaToken.approve(address(nationalBlock), NATIONAL_ALLOCATION);
        nationalBlock.depositVida(NATIONAL_ALLOCATION, 1);
        
        // 3. Approve and deposit 1.0 VIDA to Foundation Vault
        vidaToken.approve(address(foundationVault), FOUNDATION_ALLOCATION);
        foundationVault.depositVida(FOUNDATION_ALLOCATION, "vitalization");
        
        emit CitizenVitalized(
            citizenWallet,
            CITIZEN_ALLOCATION,
            NATIONAL_ALLOCATION,
            FOUNDATION_ALLOCATION,
            block.timestamp
        );
    }

    /**
     * @notice Batch vitalize multiple citizens (gas optimization)
     * @param citizenWallets Array of citizen wallet addresses
     */
    function vitalizeCitizenBatch(address[] calldata citizenWallets) external onlyRole(ARCHITECT_ROLE) nonReentrant {
        require(address(vidaToken) != address(0), "SovrynSentinelGate: contracts not linked");
        require(citizenWallets.length > 0, "SovrynSentinelGate: empty batch");
        require(citizenWallets.length <= 100, "SovrynSentinelGate: batch too large");

        uint256 batchSize = citizenWallets.length;
        uint256 totalMintAmount = TOTAL_PER_VITALIZATION * batchSize;

        // Mint all VIDA at once
        vidaToken.mint(address(this), totalMintAmount);
        totalVidaMinted += totalMintAmount;

        // Process each citizen
        for (uint256 i = 0; i < batchSize; i++) {
            address citizenWallet = citizenWallets[i];

            require(citizenWallet != address(0), "SovrynSentinelGate: citizen wallet is zero address");
            require(!isVitalized[citizenWallet], "SovrynSentinelGate: citizen already vitalized");

            // Mark as vitalized
            isVitalized[citizenWallet] = true;
            vitalizationTimestamp[citizenWallet] = block.timestamp;
            totalCitizensVitalized++;

            // Transfer to citizen
            require(
                vidaToken.transfer(citizenWallet, CITIZEN_ALLOCATION),
                "SovrynSentinelGate: citizen transfer failed"
            );

            emit CitizenVitalized(
                citizenWallet,
                CITIZEN_ALLOCATION,
                NATIONAL_ALLOCATION,
                FOUNDATION_ALLOCATION,
                block.timestamp
            );
        }

        // Batch deposit to National Block
        uint256 totalNationalAmount = NATIONAL_ALLOCATION * batchSize;
        vidaToken.approve(address(nationalBlock), totalNationalAmount);
        nationalBlock.depositVida(totalNationalAmount, batchSize);

        // Batch deposit to Foundation Vault
        uint256 totalFoundationAmount = FOUNDATION_ALLOCATION * batchSize;
        vidaToken.approve(address(foundationVault), totalFoundationAmount);
        foundationVault.depositVida(totalFoundationAmount, "vitalization_batch");
    }

    /**
     * @notice Check if citizen is vitalized
     */
    function checkVitalizationStatus(address citizenWallet) external view returns (
        bool vitalized,
        uint256 timestamp
    ) {
        vitalized = isVitalized[citizenWallet];
        timestamp = vitalizationTimestamp[citizenWallet];
    }

    /**
     * @notice Get system metrics
     */
    function getSystemMetrics() external view returns (
        uint256 citizensVitalized,
        uint256 vidaMinted,
        uint256 averagePerCitizen
    ) {
        citizensVitalized = totalCitizensVitalized;
        vidaMinted = totalVidaMinted;
        averagePerCitizen = totalCitizensVitalized > 0 ? totalVidaMinted / totalCitizensVitalized : 0;
    }

    /**
     * @notice Update VIDA token address (emergency only)
     */
    function updateVidaToken(address newVidaToken) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newVidaToken != address(0), "SovrynSentinelGate: new address is zero");
        address oldAddress = address(vidaToken);
        vidaToken = SovereignVida(newVidaToken);
        emit ContractUpdated("VidaToken", oldAddress, newVidaToken);
    }

    /**
     * @notice Update National Block address (emergency only)
     */
    function updateNationalBlock(address newNationalBlock) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newNationalBlock != address(0), "SovrynSentinelGate: new address is zero");
        address oldAddress = address(nationalBlock);
        nationalBlock = NationalBlockNG(newNationalBlock);
        emit ContractUpdated("NationalBlock", oldAddress, newNationalBlock);
    }

    /**
     * @notice Update Foundation Vault address (emergency only)
     */
    function updateFoundationVault(address newFoundationVault) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newFoundationVault != address(0), "SovrynSentinelGate: new address is zero");
        address oldAddress = address(foundationVault);
        foundationVault = FoundationVault(newFoundationVault);
        emit ContractUpdated("FoundationVault", oldAddress, newFoundationVault);
    }

    /**
     * @notice Get linked contract addresses
     */
    function getLinkedContracts() external view returns (
        address vida,
        address national,
        address foundation
    ) {
        vida = address(vidaToken);
        national = address(nationalBlock);
        foundation = address(foundationVault);
    }
}

