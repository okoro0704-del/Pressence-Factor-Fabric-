// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

/**
 * @title SovereignVida
 * @notice The Hybrid Token — Economic Layer for PFF Global Nation
 * @dev ERC20 token with 110M pre-mint split across Treasury, Foundation, and Architect
 * 
 * Pre-mint Distribution (110,000,000 VIDA):
 * - 40% (44M) → National Treasury
 * - 40% (44M) → Foundation Vault
 * - 20% (22M) → Architect
 * 
 * Minting Authority:
 * - Only SovrynSentinelGate (MINTER_ROLE) can mint new tokens during vitalization
 * - Architect (DEFAULT_ADMIN_ROLE) can grant/revoke roles
 * 
 * Compatible with: Polygon, RSK, Ethereum L2s
 */
contract SovereignVida is ERC20, ERC20Burnable, ERC20Permit, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    
    // Pre-mint allocation percentages (basis points: 10000 = 100%)
    uint256 public constant TREASURY_ALLOCATION_BPS = 4000;  // 40%
    uint256 public constant FOUNDATION_ALLOCATION_BPS = 4000; // 40%
    uint256 public constant ARCHITECT_ALLOCATION_BPS = 2000;  // 20%
    
    // Total pre-mint supply: 110 million VIDA
    uint256 public constant PREMINT_SUPPLY = 110_000_000 * 10**18;
    
    // Maximum supply cap: 1 billion VIDA (for future growth)
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18;
    
    // Vault addresses
    address public immutable nationalTreasury;
    address public immutable foundationVault;
    address public immutable architect;
    
    event VidaMinted(address indexed to, uint256 amount, string reason);
    event MinterRoleGranted(address indexed minter, address indexed grantedBy);
    
    /**
     * @notice Deploy SovereignVida with pre-mint distribution
     * @param _nationalTreasury Address of National Block (Treasury)
     * @param _foundationVault Address of Foundation Vault
     * @param _architect Address of Architect (Isreal Okoro)
     */
    constructor(
        address _nationalTreasury,
        address _foundationVault,
        address _architect
    ) ERC20("Sovereign VIDA", "VIDA") ERC20Permit("Sovereign VIDA") {
        require(_nationalTreasury != address(0), "SovereignVida: treasury is zero address");
        require(_foundationVault != address(0), "SovereignVida: foundation is zero address");
        require(_architect != address(0), "SovereignVida: architect is zero address");
        
        nationalTreasury = _nationalTreasury;
        foundationVault = _foundationVault;
        architect = _architect;
        
        // Grant DEFAULT_ADMIN_ROLE to architect
        _grantRole(DEFAULT_ADMIN_ROLE, _architect);
        
        // Pre-mint distribution
        uint256 treasuryAmount = (PREMINT_SUPPLY * TREASURY_ALLOCATION_BPS) / 10000;
        uint256 foundationAmount = (PREMINT_SUPPLY * FOUNDATION_ALLOCATION_BPS) / 10000;
        uint256 architectAmount = (PREMINT_SUPPLY * ARCHITECT_ALLOCATION_BPS) / 10000;
        
        _mint(_nationalTreasury, treasuryAmount);
        _mint(_foundationVault, foundationAmount);
        _mint(_architect, architectAmount);
        
        emit VidaMinted(_nationalTreasury, treasuryAmount, "Pre-mint: National Treasury");
        emit VidaMinted(_foundationVault, foundationAmount, "Pre-mint: Foundation Vault");
        emit VidaMinted(_architect, architectAmount, "Pre-mint: Architect");
    }
    
    /**
     * @notice Mint new VIDA tokens (only callable by MINTER_ROLE)
     * @param to Recipient address
     * @param amount Amount to mint (in wei)
     */
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        require(totalSupply() + amount <= MAX_SUPPLY, "SovereignVida: max supply exceeded");
        _mint(to, amount);
        emit VidaMinted(to, amount, "Minted by Sentinel Gate");
    }
    
    /**
     * @notice Grant MINTER_ROLE to SovrynSentinelGate
     * @param minter Address of the minter (SovrynSentinelGate)
     */
    function grantMinterRole(address minter) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(MINTER_ROLE, minter);
        emit MinterRoleGranted(minter, msg.sender);
    }
    
    /**
     * @notice Get current circulating supply
     */
    function circulatingSupply() external view returns (uint256) {
        return totalSupply();
    }
    
    /**
     * @notice Get remaining mintable supply
     */
    function remainingMintableSupply() external view returns (uint256) {
        return MAX_SUPPLY - totalSupply();
    }
    
    /**
     * @notice Check if address has minter role
     */
    function isMinter(address account) external view returns (bool) {
        return hasRole(MINTER_ROLE, account);
    }
}

