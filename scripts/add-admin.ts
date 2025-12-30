import { ethers } from "hardhat";
import { PASSPORT_CONTRACT_ADDRESS } from "../src/lib/contracts";

/**
 * Script to add an admin to the CreatorPassport contract
 * 
 * Usage:
 *   npx hardhat run scripts/add-admin.ts --network baseSepolia
 * 
 * Or set ADMIN_ADDRESS in .env:
 *   ADMIN_ADDRESS=0x7D85fCbB505D48E6176483733b62b51704e0bF95 npx hardhat run scripts/add-admin.ts --network baseSepolia
 */

async function main() {
  const signers = await ethers.getSigners();
  if (signers.length === 0) {
    throw new Error("No signers available. Make sure PRIVATE_KEY is set in .env");
  }
  
  const deployer = signers[0];
  const network = await ethers.provider.getNetwork();
  
  console.log("Adding admin to CreatorPassport contract...");
  console.log("Network:", network.name || "unknown", "Chain ID:", network.chainId.toString());
  console.log("Calling from (must be contract owner):", deployer.address);
  
  // Get admin address from env or command line args
  const adminAddress = process.env.ADMIN_ADDRESS || process.argv[2];
  
  if (!adminAddress) {
    throw new Error("Please provide admin address:\n  ADMIN_ADDRESS=0x... npx hardhat run scripts/add-admin.ts --network baseSepolia\n  OR\n  npx hardhat run scripts/add-admin.ts --network baseSepolia 0x...");
  }
  
  if (!ethers.isAddress(adminAddress)) {
    throw new Error(`Invalid address: ${adminAddress}`);
  }
  
  console.log("Admin address to add:", adminAddress);
  console.log("Contract address:", PASSPORT_CONTRACT_ADDRESS);
  
  // Get contract instance
  const contract = await ethers.getContractAt("CreatorPassport", PASSPORT_CONTRACT_ADDRESS);
  
  // Check if deployer is owner
  const owner = await contract.owner();
  if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
    throw new Error(`Deployer (${deployer.address}) is not the contract owner (${owner}). Only the owner can add admins.`);
  }
  
  // Check if already admin
  const isAlreadyAdmin = await contract.admins(adminAddress);
  if (isAlreadyAdmin) {
    console.log("⚠️  Address is already an admin");
    return;
  }
  
  // Add admin
  console.log("\n⏳ Adding admin...");
  const tx = await contract.addAdmin(adminAddress);
  console.log("Transaction hash:", tx.hash);
  
  console.log("⏳ Waiting for confirmation...");
  await tx.wait();
  
  // Verify
  const isAdmin = await contract.admins(adminAddress);
  if (isAdmin) {
    console.log("\n✅ Admin added successfully!");
    console.log("Admin address:", adminAddress);
  } else {
    console.log("\n❌ Failed to add admin");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });

