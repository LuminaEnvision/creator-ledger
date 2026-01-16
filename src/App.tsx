import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './hooks/useToast';
import { WalletConnect } from './components/WalletConnect';
import { ThemeToggle } from './components/ThemeToggle';
import { FooterMenu } from './components/FooterMenu';
import { AppInstallPrompt } from './components/AppInstallPrompt';

// (bundle-dynamic-imports: Use dynamic imports for heavy components)
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const Pricing = lazy(() => import('./pages/Pricing').then(m => ({ default: m.Pricing })));
const PublicProfile = lazy(() => import('./pages/PublicProfile').then(m => ({ default: m.PublicProfile })));
const TermsOfService = lazy(() => import('./pages/TermsOfService').then(m => ({ default: m.TermsOfService })));
const VerifySignature = lazy(() => import('./pages/VerifySignature').then(m => ({ default: m.VerifySignature })));

// Loading component for Suspense fallback
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

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
                      <span className="text-xl font-black hidden sm:inline tracking-tight">
                        <span className="text-slate-800 dark:bg-gradient-to-r dark:from-primary dark:to-accent dark:bg-clip-text dark:text-transparent">CREATOR</span>
                        <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"> LEDGER</span>
                      </span>
                    </Link>
                  </div>
                  <div className="flex items-center gap-3">
                    <ThemeToggle />
                    <WalletConnect />
                  </div>
                </div>
              </div>
            </header>

            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/pricing" element={<Pricing />} />
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/terms" element={<TermsOfService />} />
                  <Route path="/verify" element={<VerifySignature />} />
                  <Route path="/u/:address" element={<PublicProfile />} />
                </Routes>
              </Suspense>
            </main>

            <FooterMenu />
            <AppInstallPrompt />
          </div>
        </Router>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
