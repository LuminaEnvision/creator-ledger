import { useState, useEffect } from 'react';
import { reverseResolveENS } from '../lib/ens';

/**
 * Hook to resolve an Ethereum address to an ENS name
 */
export function useENS(address: string | null | undefined): string | null {
    const [ensName, setEnsName] = useState<string | null>(null);

    useEffect(() => {
        if (!address) {
            setEnsName(null);
            return;
        }

        // Only resolve ENS for web environment (not in Base App)
        const isWeb = typeof window !== 'undefined' && 
            !window.location.href.includes('base.org') &&
            !window.location.href.includes('base.xyz');

        if (!isWeb) {
            setEnsName(null);
            return;
        }

        let cancelled = false;

        reverseResolveENS(address)
            .then((name) => {
                if (!cancelled && name) {
                    setEnsName(name);
                }
            })
            .catch((err) => {
                if (!cancelled) {
                    console.log('ENS resolution failed:', err);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [address]);

    return ensName;
}

