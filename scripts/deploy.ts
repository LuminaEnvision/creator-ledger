import { ethers } from "hardhat";

async function main() {
  const signers = await ethers.getSigners();
  if (signers.length === 0) {
    throw new Error("No signers available. Make sure PRIVATE_KEY is set in .env");
  }
  
  const deployer = signers[0];
  const network = await ethers.provider.getNetwork();
  
  console.log("Deploying CreatorPassport contract...");
  console.log("Network:", network.name || "unknown", "Chain ID:", network.chainId.toString());
  console.log("Deploying from:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");
  
  if (balance === 0n) {
    console.warn("⚠️  Warning: Account has 0 balance. Make sure you have ETH for gas fees!");
  }

  const CreatorPassport = await ethers.getContractFactory("CreatorPassport");
  const passport = await CreatorPassport.deploy();

  await passport.waitForDeployment();

  const address = await passport.getAddress();
  console.log("\n✅ CreatorPassport deployed to:", address);
  console.log("\n📝 Please update PASSPORT_CONTRACT_ADDRESS in src/lib/contracts.ts with:");
  console.log(`export const PASSPORT_CONTRACT_ADDRESS = '${address}';`);
  
  // Wait for block confirmations before reading constants (if on testnet/mainnet)
  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log("\n⏳ Waiting for block confirmations before verification...");
    const tx = passport.deploymentTransaction();
    if (tx) {
      await tx.wait(3); // Wait for 3 confirmations
    }
  }
  
  // Verify operations address and fee
  try {
    const operationsAddress = await passport.OPERATIONS_ADDRESS();
    const operationsFee = await passport.OPERATIONS_FEE();
    console.log("\n💰 Operations fee address:", operationsAddress);
    console.log("💰 Operations fee amount:", ethers.formatEther(operationsFee), "ETH");
    
    // Verify expected values
    const expectedAddress = "0x7eB8F203167dF3bC14D59536E671528dd97FB72a";
    const expectedFee = ethers.parseEther("0.00025");
    
    if (operationsAddress.toLowerCase() !== expectedAddress.toLowerCase()) {
      console.warn("⚠️  WARNING: Operations address mismatch!");
      console.warn("   Expected:", expectedAddress);
      console.warn("   Got:", operationsAddress);
    } else {
      console.log("✅ Operations address verified");
    }
    
    if (operationsFee.toString() !== expectedFee.toString()) {
      console.warn("⚠️  WARNING: Operations fee mismatch!");
      console.warn("   Expected:", ethers.formatEther(expectedFee), "ETH");
      console.warn("   Got:", ethers.formatEther(operationsFee), "ETH");
    } else {
      console.log("✅ Operations fee verified (0.00025 ETH)");
    }
  } catch (error: any) {
    console.warn("\n⚠️  Could not verify contract constants (this is normal if contract just deployed):");
    console.warn("   Error:", error.message);
    console.warn("   You can verify manually on Basescan or try again in a few seconds");
    console.log("\n📋 Expected values:");
    console.log("   Operations Address: 0x7eB8F203167dF3bC14D59536E671528dd97FB72a");
    console.log("   Operations Fee: 0.00025 ETH");
  }
  
  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log("\n🔍 To verify on Basescan, run:");
    console.log(`npx hardhat verify --network ${network.name} ${address}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

