// Hardhat wrapper that temporarily removes "type": "module" for Hardhat operations
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const packageJsonPath = join(rootDir, 'package.json');

// Read package.json
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
const hadTypeModule = packageJson.type === 'module';
const backup = { ...packageJson };

// Remove "type": "module" temporarily
if (hadTypeModule) {
    delete packageJson.type;
    writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('📝 Temporarily removed "type": "module" for Hardhat...');
}

try {
    // Get command from args (everything after the script name)
    const args = process.argv.slice(2);
    const command = args.join(' ');
    
    if (!command) {
        console.log('Usage: node scripts/hardhat-wrapper.mjs <hardhat-command>');
        console.log('Example: node scripts/hardhat-wrapper.mjs compile');
        console.log('Example: node scripts/hardhat-wrapper.mjs run scripts/deploy.ts --network baseSepolia');
        process.exit(1);
    }

    console.log(`🚀 Running: hardhat ${command}`);
    execSync(`npx hardhat ${command}`, { 
        stdio: 'inherit',
        cwd: rootDir 
    });
} finally {
    // Restore package.json
    if (hadTypeModule) {
        writeFileSync(packageJsonPath, JSON.stringify(backup, null, 2));
        console.log('✅ Restored "type": "module" in package.json');
    }
}

