#!/bin/bash
# Workaround script to compile Hardhat contracts with ESM

cd "$(dirname "$0")/.."

# Check if hardhat.config.cjs exists
if [ ! -f "hardhat.config.cjs" ]; then
    echo "❌ hardhat.config.cjs not found"
    exit 1
fi

# Temporarily rename package.json to avoid ESM detection
if [ -f "package.json" ]; then
    cp package.json package.json.backup
    # Remove "type": "module" temporarily
    node -e "
        const fs = require('fs');
        const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        delete pkg.type;
        fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
    "
fi

# Run hardhat
npx hardhat compile

# Restore package.json
if [ -f "package.json.backup" ]; then
    mv package.json.backup package.json
fi

