import { ethers } from "hardhat";

const PASSPORT_CONTRACT_ADDRESS = '0x3c7AD530306a9A7eDAD3Da52b915dECF40edC6a1';
const ADMIN_ADDRESS = '0x7d85fcbb505d48e6176483733b62b51704e0bf95'; // Your admin wallet

async function main() {
    const signers = await ethers.getSigners();
    if (signers.length === 0) {
        throw new Error("No signers available. Make sure PRIVATE_KEY is set in .env");
    }
    
    const deployer = signers[0];
    const network = await ethers.provider.getNetwork();
    
    console.log("Adding admin to CreatorPassport contract...");
    console.log("Network:", network.name || "unknown", "Chain ID:", network.chainId.toString());
    console.log("Deployer:", deployer.address);
    console.log("Contract:", PASSPORT_CONTRACT_ADDRESS);
    console.log("Admin to add:", ADMIN_ADDRESS);
    console.log("");

    // Contract ABI (just the functions we need)
    const contractABI = [
        'function owner() view returns (address)',
        'function admins(address) view returns (bool)',
        'function addAdmin(address admin)'
    ];

    const contract = new ethers.Contract(PASSPORT_CONTRACT_ADDRESS, contractABI, deployer);

    // Check if caller is owner
    const owner = await contract.owner();
    console.log('👑 Contract Owner:', owner);
    
    if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
        throw new Error(`❌ Wallet ${deployer.address} is not the contract owner. Only the owner can add admins.`);
    }

    // Check if admin is already added
    const isAlreadyAdmin = await contract.admins(ADMIN_ADDRESS);
    if (isAlreadyAdmin) {
        console.log('✅ Admin is already registered!');
        return;
    }

    console.log('📝 Adding admin...');
    const tx = await contract.addAdmin(ADMIN_ADDRESS);
    console.log('⏳ Transaction hash:', tx.hash);
    console.log('⏳ Waiting for confirmation...');
    
    const receipt = await tx.wait();
    console.log('✅ Admin added successfully!');
    console.log('📋 Block number:', receipt.blockNumber);
    
    // Verify
    const isAdmin = await contract.admins(ADMIN_ADDRESS);
    console.log('🔍 Verification - Is admin?', isAdmin);
    
    if (isAdmin) {
        console.log('✅ Success! Admin wallet is now registered in the contract.');
        console.log('You can now use the admin dashboard to verify entries.');
    } else {
        console.log('⚠️  Warning: Admin check returned false. Please verify manually.');
    }
}

main()
    .then(() => {
        console.log('✅ Script completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Error:', error);
        process.exit(1);
    });
