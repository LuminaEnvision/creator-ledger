#!/bin/bash

# Contract Redeployment Script
# This script redeploys the CreatorPassport contract with updated fee (0.00025 ETH)

set -e  # Exit on error

echo "🚀 Creator Passport Contract Redeployment"
echo "=========================================="
echo ""
echo "📋 Changes:"
echo "   - Operations Fee: 0.00025 ETH"
echo "   - Operations Address: 0x7eB8F203167dF3bC14D59536E671528dd97FB72a"
echo "   - Added mintFor() function for admin to mint passports for creators"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "   Please create a .env file with:"
    echo "   PRIVATE_KEY=your_private_key"
    echo "   BASE_SEPOLIA_RPC_URL=https://sepolia.base.org"
    echo "   BASESCAN_API_KEY=your_api_key (optional)"
    exit 1
fi

# Check if PRIVATE_KEY is set
if ! grep -q "PRIVATE_KEY=" .env; then
    echo "❌ Error: PRIVATE_KEY not found in .env file!"
    exit 1
fi

echo "📦 Step 1: Cleaning previous build..."
npx hardhat clean

echo ""
echo "🔨 Step 2: Compiling contract..."
npx hardhat compile

echo ""
echo "🌐 Step 3: Deploying to Base Sepolia..."
echo "   (Make sure you have Base Sepolia ETH for gas fees)"
echo ""

npx hardhat run scripts/deploy.ts --network baseSepolia

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Copy the contract address from above"
echo "   2. Update src/lib/contracts.ts with the new address:"
echo "      export const PASSPORT_CONTRACT_ADDRESS = 'YOUR_NEW_ADDRESS';"
echo "   3. Test the deployment with a test submission"
echo "   4. Verify on Basescan (optional):"
echo "      npx hardhat verify --network baseSepolia YOUR_CONTRACT_ADDRESS"
echo ""

