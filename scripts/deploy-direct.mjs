// Direct deployment script using ethers - bypasses Hardhat config issues
import { ethers } from "ethers";
import * as dotenv from "dotenv";
import { readFileSync } from "fs";

dotenv.config();

const OPERATIONS_ADDRESS = "0x7eB8F203167dF3bC14D59536E671528dd97FB72a";

// Contract ABI (minimal for deployment)
const CONTRACT_ABI = [
  "constructor()",
  "function mint() payable",
  "function incrementEntryCount(address) payable",
  "function OPERATIONS_ADDRESS() view returns (address)",
];

async function main() {
  const network = process.argv[2] || "baseSepolia";
  
  const rpcUrls = {
    baseSepolia: process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org",
    base: process.env.BASE_RPC_URL || "https://mainnet.base.org",
    celoSepolia: process.env.CELO_SEPOLIA_RPC_URL || "https://alfajores-forno.celo-testnet.org",
  };

  if (!process.env.PRIVATE_KEY) {
    console.error("❌ PRIVATE_KEY not found in .env file");
    process.exit(1);
  }

  console.log("🚀 Deploying CreatorPassport contract...");
  console.log("Network:", network);
  console.log("RPC:", rpcUrls[network]);
  
  const provider = new ethers.JsonRpcProvider(rpcUrls[network]);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  console.log("Deploying from:", wallet.address);
  const balance = await provider.getBalance(wallet.address);
  console.log("Balance:", ethers.formatEther(balance), "ETH");

  // Read contract bytecode from artifacts
  let bytecode;
  try {
    const artifact = JSON.parse(readFileSync("artifacts/contracts/CreatorPassport.sol/CreatorPassport.json", "utf8"));
    bytecode = artifact.bytecode;
  } catch (err) {
    console.error("❌ Could not find compiled contract. Please compile first:");
    console.error("   Option 1: Use Remix IDE (https://remix.ethereum.org)");
    console.error("   Option 2: Try: npx hardhat compile (if config works)");
    console.error("   Option 3: Use Foundry: forge build");
    process.exit(1);
  }

  console.log("\n📦 Creating contract factory...");
  const factory = new ethers.ContractFactory(CONTRACT_ABI, bytecode, wallet);
  
  console.log("⏳ Deploying contract (this may take a minute)...");
  const contract = await factory.deploy();
  
  console.log("⏳ Waiting for deployment transaction...");
  await contract.waitForDeployment();
  
  const address = await contract.getAddress();
  console.log("\n✅ Contract deployed successfully!");
  console.log("📍 Contract Address:", address);
  
  // Verify operations address
  try {
    const operationsAddr = await contract.OPERATIONS_ADDRESS();
    console.log("💰 Operations Fee Address:", operationsAddr);
    if (operationsAddr.toLowerCase() !== OPERATIONS_ADDRESS.toLowerCase()) {
      console.warn("⚠️  WARNING: Operations address mismatch!");
    }
  } catch (err) {
    console.log("ℹ️  Could not verify operations address (contract may not be fully deployed yet)");
  }

  console.log("\n📝 Next steps:");
  console.log("1. Update src/lib/contracts.ts:");
  console.log(`   export const PASSPORT_CONTRACT_ADDRESS = '${address}';`);
  console.log("\n2. Verify contract on Basescan (optional):");
  console.log(`   npx hardhat verify --network ${network} ${address}`);
  
  console.log("\n✨ Deployment complete!");
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exit(1);
});

