import { ethers, upgrades } from "hardhat";

// IMPORTANT: Update this with your deployed proxy address
const PROXY_ADDRESS = process.env.PROXY_ADDRESS || "";

async function main() {
  if (!PROXY_ADDRESS) {
    throw new Error("Please set PROXY_ADDRESS environment variable or update the script");
  }

  const signers = await ethers.getSigners();
  if (signers.length === 0) {
    throw new Error("No signers available. Make sure PRIVATE_KEY is set in .env");
  }
  
  const deployer = signers[0];
  const network = await ethers.provider.getNetwork();
  
  console.log("Upgrading CreatorPassportUpgradeable contract...");
  console.log("Network:", network.name || "unknown", "Chain ID:", network.chainId.toString());
  console.log("Proxy Address:", PROXY_ADDRESS);
  console.log("Upgrading from:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");
  
  if (balance === 0n) {
    throw new Error("Account has 0 balance. Make sure you have ETH for gas fees!");
  }

  // Get the current implementation address
  const currentImplementation = await upgrades.erc1967.getImplementationAddress(PROXY_ADDRESS);
  console.log("Current Implementation:", currentImplementation);

  // Deploy the new implementation
  const CreatorPassportUpgradeable = await ethers.getContractFactory("CreatorPassportUpgradeable");
  
  console.log("\n⏳ Upgrading proxy to new implementation...");
  const upgraded = await upgrades.upgradeProxy(PROXY_ADDRESS, CreatorPassportUpgradeable);
  
  await upgraded.waitForDeployment();
  
  const newImplementation = await upgrades.erc1967.getImplementationAddress(PROXY_ADDRESS);
  console.log("\n✅ Contract upgraded successfully!");
  console.log("📦 Proxy Address (unchanged):", PROXY_ADDRESS);
  console.log("🔧 New Implementation Address:", newImplementation);
  
  // Verify the upgrade worked
  if (currentImplementation.toLowerCase() !== newImplementation.toLowerCase()) {
    console.log("✅ Implementation address changed - upgrade successful!");
  } else {
    console.warn("⚠️  Warning: Implementation address did not change. This might indicate an issue.");
  }
  
  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log("\n🔍 To verify the new implementation on Basescan, run:");
    console.log(`npx hardhat verify --network ${network.name} ${newImplementation}`);
  }
  
  console.log("\n📝 Important Notes:");
  console.log("   - The proxy address remains the same - no frontend changes needed!");
  console.log("   - All existing data and NFTs are preserved");
  console.log("   - Users can continue using the same contract address");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

