// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CreatorPassport is ERC721, Ownable {
    using Strings for uint256;

    struct PassportData {
        uint256 entryCount;
        uint256 lastUpdated;
    }

    mapping(address => uint256) public addressToTokenId;
    mapping(uint256 => PassportData) public passportData;
    mapping(address => bool) public admins; // Admin addresses who can verify and mint
    uint256 private _nextTokenId = 1;
    
    // Operations fee address (treasury) for free users
    address public constant OPERATIONS_ADDRESS = 0x7eB8F203167dF3bC14D59536E671528dd97FB72a;
    uint256 public constant OPERATIONS_FEE = 0.00025 ether; // 0.00025 ETH

    // Modifier to restrict functions to admins only
    modifier onlyAdmin() {
        require(admins[msg.sender] || msg.sender == owner(), "Not an admin");
        _;
    }

    constructor() ERC721("Creator Passport", "CPASS") Ownable(msg.sender) {
        // Owner is automatically an admin
        admins[msg.sender] = true;
    }

    // Owner functions to manage admins
    function addAdmin(address admin) public onlyOwner {
        require(admin != address(0), "Invalid admin address");
        admins[admin] = true;
    }

    function removeAdmin(address admin) public onlyOwner {
        require(admin != owner(), "Cannot remove owner as admin");
        admins[admin] = false;
    }

    function mint() public payable {
        require(addressToTokenId[msg.sender] == 0, "Already has a passport");
        
        // Forward operations fee if sent
        if (msg.value > 0) {
            (bool sent, ) = payable(OPERATIONS_ADDRESS).call{value: msg.value}("");
            require(sent, "Failed to send operations fee");
        }
        
        uint256 tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);
        
        addressToTokenId[msg.sender] = tokenId;
        passportData[tokenId] = PassportData(0, block.timestamp);
    }

    // Admin function to mint passport for a specific creator address
    // Admins (verifiers) can call this to mint for creators during verification
    function mintFor(address creator) public onlyAdmin {
        require(creator != address(0), "Invalid creator address");
        require(addressToTokenId[creator] == 0, "Creator already has a passport");
        
        uint256 tokenId = _nextTokenId++;
        _safeMint(creator, tokenId);
        
        addressToTokenId[creator] = tokenId;
        passportData[tokenId] = PassportData(0, block.timestamp);
    }

    // User function to increment entry count for their own passport
    // Users call this after admin verification to update their NFT
    function incrementEntryCount() public payable {
        uint256 tokenId = addressToTokenId[msg.sender];
        require(tokenId != 0, "No passport found");
        
        // Forward operations fee if sent (for free users)
        if (msg.value > 0) {
            (bool sent, ) = payable(OPERATIONS_ADDRESS).call{value: msg.value}("");
            require(sent, "Failed to send operations fee");
        }
        
        passportData[tokenId].entryCount += 1;
        passportData[tokenId].lastUpdated = block.timestamp;
    }

    // User function to increment entry count by a specific amount
    // Charges OPERATIONS_FEE per entry increment
    function incrementEntryCountBy(uint256 count) public payable {
        require(count > 0, "Count must be greater than 0");
        uint256 tokenId = addressToTokenId[msg.sender];
        require(tokenId != 0, "No passport found");
        
        // Calculate required fee (OPERATIONS_FEE per entry)
        uint256 requiredFee = OPERATIONS_FEE * count;
        require(msg.value >= requiredFee, "Insufficient fee payment");
        
        // Forward operations fee
        if (msg.value > 0) {
            (bool sent, ) = payable(OPERATIONS_ADDRESS).call{value: msg.value}("");
            require(sent, "Failed to send operations fee");
        }
        
        // Increment entry count by the specified amount
        passportData[tokenId].entryCount += count;
        passportData[tokenId].lastUpdated = block.timestamp;
    }

    // Admin function to increment entry count for any creator (for admin use only)
    function adminIncrementEntryCount(address creator) public payable onlyAdmin {
        uint256 tokenId = addressToTokenId[creator];
        require(tokenId != 0, "No passport found");
        
        // No fee for admin operations
        if (msg.value > 0) {
            (bool sent, ) = payable(OPERATIONS_ADDRESS).call{value: msg.value}("");
            require(sent, "Failed to send operations fee");
        }
        
        passportData[tokenId].entryCount += 1;
        passportData[tokenId].lastUpdated = block.timestamp;
    }

    // Calculate level based on entry count (unlimited)
    function getLevel(uint256 entryCount) internal pure returns (uint256) {
        if (entryCount == 0) return 1;
        return entryCount;
    }

    // Get gradient colors based on entry count (visual progression)
    function getGradientColors(uint256 entryCount) internal pure returns (string memory, string memory) {
        if (entryCount == 0) return ("#64748B", "#94A3B8"); // Gray for new
        if (entryCount <= 5) return ("#7C3AED", "#3B82F6"); // Purple to Blue
        if (entryCount <= 15) return ("#EC4899", "#8B5CF6"); // Pink to Purple
        if (entryCount <= 30) return ("#F59E0B", "#EF4444"); // Gold to Red
        return ("#10B981", "#3B82F6"); // Green to Blue for high counts
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        
        PassportData memory data = passportData[tokenId];
        uint256 level = getLevel(data.entryCount);
        string memory levelStr = level.toString();
        string memory countStr = data.entryCount.toString();
        
        (string memory color1, string memory color2) = getGradientColors(data.entryCount);

        string memory svg = string(
            abi.encodePacked(
                '<svg width="500" height="500" viewBox="0 0 500 500" fill="none" xmlns="http://www.w3.org/2000/svg">',
                '<rect width="500" height="500" fill="#0A0A0F"/>',
                '<defs>',
                '<linearGradient id="paint0_linear" x1="0" y1="0" x2="500" y2="500" gradientUnits="userSpaceOnUse">',
                '<stop stop-color="', color1, '"/>',
                '<stop offset="1" stop-color="', color2, '"/>',
                '</linearGradient>',
                '<filter id="glow">',
                '<feGaussianBlur stdDeviation="3" result="coloredBlur"/>',
                '<feMerge>',
                '<feMergeNode in="coloredBlur"/>',
                '<feMergeNode in="SourceGraphic"/>',
                '</feMerge>',
                '</filter>',
                '</defs>',
                '<circle cx="250" cy="250" r="200" stroke="url(#paint0_linear)" stroke-width="3" stroke-dasharray="10 5" opacity="0.3"/>',
                '<rect x="125" y="125" width="250" height="250" rx="50" fill="url(#paint0_linear)" opacity="0.9"/>',
                '<text x="250" y="200" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-weight="900" font-size="80" filter="url(#glow)">', levelStr, '</text>',
                '<text x="250" y="240" text-anchor="middle" fill="rgba(255,255,255,0.8)" font-family="Arial, sans-serif" font-size="24" font-weight="700" letter-spacing="0.15em">LEVEL</text>',
                '<text x="250" y="320" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="16" font-weight="600" opacity="0.9">', countStr, ' ORIGINAL WORKS</text>',
                '<text x="250" y="350" text-anchor="middle" fill="rgba(255,255,255,0.6)" font-family="Arial, sans-serif" font-size="12" font-weight="500">CREATOR PASSPORT</text>',
                '</svg>'
            )
        );

        string memory json = Base64.encode(
            bytes(
                string(
                    abi.encodePacked(
                        '{"name": "Creator Passport #', tokenId.toString(), '", ',
                        '"description": "On-chain proof of originality. This NFT represents verified ownership of ', countStr, ' original creative works tied to this wallet address.", ',
                        '"image": "data:image/svg+xml;base64,', Base64.encode(bytes(svg)), '", ',
                        '"attributes": [',
                        '{"trait_type": "Level", "value": ', levelStr, '}, ',
                        '{"trait_type": "Original Works", "value": ', countStr, '}, ',
                        '{"trait_type": "Wallet Ownership", "value": "Verified"}, ',
                        '{"trait_type": "Last Updated", "value": ', data.lastUpdated.toString(), '}',
                        ']}'
                    )
                )
            )
        );

        return string(abi.encodePacked("data:application/json;base64,", json));
    }
}
