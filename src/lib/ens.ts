/**
 * ENS (Ethereum Name Service) resolution utilities
 */

/**
 * Resolve an ENS name to an Ethereum address
 */
export async function resolveENS(name: string): Promise<string | null> {
    try {
        // Use a public ENS resolver endpoint
        const response = await fetch(`https://api.ensideas.com/ens/resolve/${name}`);
        const data = await response.json();
        
        if (data.address) {
            return data.address.toLowerCase();
        }
        return null;
    } catch (error) {
        console.error('Error resolving ENS:', error);
        return null;
    }
}

/**
 * Reverse resolve an Ethereum address to an ENS name
 */
export async function reverseResolveENS(address: string): Promise<string | null> {
    try {
        // Use a public ENS reverse resolver endpoint
        const response = await fetch(`https://api.ensideas.com/ens/reverse/${address.toLowerCase()}`);
        const data = await response.json();
        
        if (data.name) {
            return data.name;
        }
        return null;
    } catch (error) {
        console.error('Error reverse resolving ENS:', error);
        return null;
    }
}

/**
 * Check if a string is a valid ENS name
 */
export function isENSName(name: string): boolean {
    return name.endsWith('.eth') && name.length > 4;
}

