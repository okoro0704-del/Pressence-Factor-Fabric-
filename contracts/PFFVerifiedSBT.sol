// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PFF Verified SBT (Soul-Bound Token)
 * @notice Non-transferable ERC721 token for KYC verification in the PFF Protocol
 * @dev Soul-Bound Tokens cannot be transferred after minting
 *
 * Features:
 * - One token per address (enforced)
 * - Non-transferable (Soul-Bound)
 * - Revocable by owner (for fraud cases)
 * - Metadata URI for verification details
 *
 * Architect: Isreal Okoro (mrfundzman)
 */
contract PFFVerifiedSBT is ERC721, Ownable {
    uint256 private _tokenIdCounter;
    
    // Mapping from address to token ID (one token per address)
    mapping(address => uint256) public addressToTokenId;
    
    // Mapping from token ID to verification metadata URI
    mapping(uint256 => string) private _tokenURIs;
    
    // Mapping to track revoked tokens
    mapping(uint256 => bool) public isRevoked;
    
    // Events
    event SBTMinted(address indexed to, uint256 indexed tokenId, string metadataURI);
    event SBTRevoked(uint256 indexed tokenId, address indexed holder);
    event SBTRestored(uint256 indexed tokenId, address indexed holder);
    
    constructor() ERC721("PFF Verified SBT", "PFF-SBT") Ownable(msg.sender) {
        // Start token IDs at 1
        _tokenIdCounter = 1;
    }

    /**
     * @notice Mint a Soul-Bound Token to a verified user
     * @param to Address of the verified user
     * @param metadataURI IPFS or HTTP URI containing verification metadata
     */
    function mintSBT(address to, string memory metadataURI) external onlyOwner {
        require(to != address(0), "Cannot mint to zero address");
        require(addressToTokenId[to] == 0, "Address already has SBT");

        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;

        _safeMint(to, tokenId);
        _tokenURIs[tokenId] = metadataURI;
        addressToTokenId[to] = tokenId;

        emit SBTMinted(to, tokenId, metadataURI);
    }

    /**
     * @notice Batch mint SBTs to multiple addresses
     * @param recipients Array of addresses to receive SBTs
     * @param metadataURIs Array of metadata URIs (must match recipients length)
     */
    function batchMintSBT(address[] calldata recipients, string[] calldata metadataURIs) external onlyOwner {
        require(recipients.length == metadataURIs.length, "Array length mismatch");

        for (uint256 i = 0; i < recipients.length; i++) {
            address to = recipients[i];
            string memory metadataURI = metadataURIs[i];

            if (to != address(0) && addressToTokenId[to] == 0) {
                uint256 tokenId = _tokenIdCounter;
                _tokenIdCounter++;
                
                _safeMint(to, tokenId);
                _tokenURIs[tokenId] = metadataURI;
                addressToTokenId[to] = tokenId;
                
                emit SBTMinted(to, tokenId, metadataURI);
            }
        }
    }
    
    /**
     * @notice Revoke an SBT (for fraud cases)
     * @param tokenId Token ID to revoke
     */
    function revokeSBT(uint256 tokenId) external onlyOwner {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        require(!isRevoked[tokenId], "Token already revoked");
        
        isRevoked[tokenId] = true;
        emit SBTRevoked(tokenId, ownerOf(tokenId));
    }
    
    /**
     * @notice Restore a revoked SBT
     * @param tokenId Token ID to restore
     */
    function restoreSBT(uint256 tokenId) external onlyOwner {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        require(isRevoked[tokenId], "Token not revoked");
        
        isRevoked[tokenId] = false;
        emit SBTRestored(tokenId, ownerOf(tokenId));
    }
    
    /**
     * @notice Check if an address is verified (has non-revoked SBT)
     * @param account Address to check
     * @return bool True if address has valid SBT
     */
    function isVerified(address account) external view returns (bool) {
        uint256 tokenId = addressToTokenId[account];
        if (tokenId == 0) return false;
        return !isRevoked[tokenId];
    }
    
    /**
     * @notice Get token URI with metadata
     * @param tokenId Token ID
     * @return string Metadata URI
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return _tokenURIs[tokenId];
    }
    
    /**
     * @notice Get total number of SBTs minted
     * @return uint256 Total supply
     */
    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter - 1;
    }
    
    // ============================================================================
    // SOUL-BOUND: Disable all transfer functions
    // ============================================================================
    
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        
        // Allow minting (from == address(0))
        // Block all transfers (from != address(0) && to != address(0))
        require(from == address(0), "SBT: Soul-Bound Tokens cannot be transferred");
        
        return super._update(to, tokenId, auth);
    }
}

