import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isAdmin } from '../lib/admin';

export const FooterMenu = () => {
    const location = useLocation();
    const { user } = useAuth();
    const userIsAdmin = isAdmin(user?.walletAddress);

    const isActive = (path: string) => location.pathname === path;

    return (
        <footer className="fixed bottom-0 left-0 right-0 z-[100] glass-card border-t border-border/50 bg-background/98 backdrop-blur-xl shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
            <div className="container mx-auto px-4 max-w-7xl">
                <nav className="flex items-center justify-around h-16 min-h-[64px]">
                    <Link
                        to="/"
                        className={`flex flex-col items-center justify-center gap-1 px-4 py-2 min-h-[44px] rounded-lg transition-all ${
                            isActive('/') 
                                ? 'text-primary' 
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        <span className="text-[10px] font-bold uppercase tracking-wider">Dashboard</span>
                    </Link>

                    <Link
                        to="/pricing"
                        className={`flex flex-col items-center justify-center gap-1 px-4 py-2 min-h-[44px] rounded-lg transition-all ${
                            isActive('/pricing') 
                                ? 'text-primary' 
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        <span className="text-[10px] font-bold uppercase tracking-wider">Pricing</span>
                    </Link>

                    {userIsAdmin && (
                        <Link
                            to="/admin"
                            className={`flex flex-col items-center justify-center gap-1 px-4 py-2 min-h-[44px] rounded-lg transition-all ${
                                isActive('/admin') 
                                    ? 'text-primary' 
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            <span className="text-[10px] font-bold uppercase tracking-wider">Admin</span>
                        </Link>
                    )}
                </nav>
            </div>
        </footer>
    );
};

