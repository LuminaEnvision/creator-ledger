import React from 'react';

import { FreePassport } from './passports/FreePassport';
import { PremiumPassport } from './passports/PremiumPassport';
import { supabase } from '../lib/supabase';

interface PassportDisplayProps {
    walletAddress: string;
    isPremium?: boolean;
}

export const PassportDisplay: React.FC<PassportDisplayProps> = ({ walletAddress, isPremium = false }) => {
    const [entryCount, setEntryCount] = React.useState(0);
    const [username, setUsername] = React.useState<string | undefined>(undefined);

    React.useEffect(() => {
        const fetchData = async () => {
            if (!walletAddress) return;

            // Fetch entry count
            const { count } = await supabase
                .from('ledger_entries')
                .select('*', { count: 'exact', head: true })
                .eq('wallet_address', walletAddress);

            if (count !== null) setEntryCount(count);

            // Fetch profile name
            const { data } = await supabase
                .from('profiles')
                .select('display_name')
                .eq('wallet_address', walletAddress)
                .single();

            if (data?.display_name) setUsername(data.display_name);
        };

        fetchData();
    }, [walletAddress]);

    return (
        <div className="mt-4 glass-card rounded-2xl p-6 animate-in slide-in-from-top-2 duration-300 mx-auto w-full max-w-sm">
            <div className="text-center mb-6">
                <h3 className="text-xl font-black text-foreground tracking-tight mb-2">Creator's Passport</h3>
                <p className="text-sm text-muted-foreground">
                    Onchain proof of your creative legacy
                </p>
            </div>

            {/* NFT Display - Clean and Centered */}
            <div className="flex flex-col items-center gap-6">
                <div className="flex justify-center w-full">
                    {isPremium ? (
                        <PremiumPassport
                            walletAddress={walletAddress}
                            entryCount={entryCount}
                            username={username}
                            size="lg"
                            className="shadow-[0_0_50px_rgba(var(--primary-rgb),0.3)]"
                        />
                    ) : (
                        <FreePassport
                            walletAddress={walletAddress}
                            entryCount={entryCount}
                            size="lg"
                        />
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4 w-full">
                    <div className="bg-secondary/30 rounded-xl p-3 text-center border border-white/5">
                        <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Status</div>
                        <div className={`font-black ${isPremium ? 'text-primary' : 'text-foreground'}`}>
                            {isPremium ? 'PRO VERIFIED' : 'ACTIVE'}
                        </div>
                    </div>
                    <div className="bg-secondary/30 rounded-xl p-3 text-center border border-white/5">
                        <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Entries</div>
                        <div className="font-black text-foreground">{entryCount}</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

