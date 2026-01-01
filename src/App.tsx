import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './hooks/useToast';
import { WalletConnect } from './components/WalletConnect';
import { ThemeToggle } from './components/ThemeToggle';
import { Dashboard } from './pages/Dashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { Pricing } from './pages/Pricing';
import { PublicProfile } from './pages/PublicProfile';
import { TermsOfService } from './pages/TermsOfService';
import { FooterMenu } from './components/FooterMenu';

import { useEffect } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';

function App() {
  useEffect(() => {
    sdk.actions.ready();
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <Router>
          <div className="min-h-screen text-foreground transition-colors">
            <header className="sticky top-0 z-50 w-full glass-card border-b border-border/50">
              <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                  <div className="flex items-center gap-6">
                    <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-all group">
                      <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg group-hover:scale-110 transition-transform bg-black flex items-center justify-center">
                        <img src="/assets/logo.png" alt="CL Logo" className="w-full h-full object-cover" />
                      </div>
                      <span className="text-xl font-black bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent hidden sm:inline tracking-tight">CREATOR LEDGER</span>
                    </Link>
                  </div>
                  <div className="flex items-center gap-3">
                    <ThemeToggle />
                    <WalletConnect />
                  </div>
                </div>
              </div>
            </header>

            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-20 sm:pb-24">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/u/:address" element={<PublicProfile />} />
              </Routes>
            </main>

            <FooterMenu />
          </div>
        </Router>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
