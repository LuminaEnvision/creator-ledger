import React, { useState } from 'react';

interface OnboardingFlowProps {
    onComplete: () => void;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
    const [step, setStep] = useState(0);

    const steps = [
        {
            title: "Welcome to Creator Ledger",
            description: "Track and verify your creative work onchain. Build your professional portfolio with cryptographic proof of ownership.",
            icon: "📝"
        },
        {
            title: "How It Works",
            description: "Submit your content links, get verified by admins, and receive an onchain Creator Passport NFT that proves your original works.",
            icon: "✨"
        },
        {
            title: "Get Started",
            description: "You can explore the app without connecting a wallet. Connect when you're ready to submit your first entry.",
            icon: "🚀"
        }
    ];

    if (step >= steps.length) {
        onComplete();
        return null;
    }

    const currentStep = steps[step];

    return (
        <div className="glass-card p-8 rounded-xl mb-4 border-2 border-primary/20">
            <div className="text-center space-y-6">
                <div className="text-6xl mb-4">{currentStep.icon}</div>
                <h3 className="text-2xl font-bold text-foreground">{currentStep.title}</h3>
                <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
                    {currentStep.description}
                </p>
                
                <div className="flex items-center justify-center gap-2 mt-6">
                    {steps.map((_, idx) => (
                        <div
                            key={idx}
                            className={`h-2 rounded-full transition-all ${
                                idx === step ? 'w-8 bg-primary' : 'w-2 bg-muted'
                            }`}
                        />
                    ))}
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
                    {step > 0 && (
                        <button
                            onClick={() => setStep(step - 1)}
                            className="px-6 py-3 min-h-[44px] rounded-xl glass-card text-sm font-bold hover:bg-accent/20 transition-all border border-border/50"
                        >
                            Previous
                        </button>
                    )}
                    {step < steps.length - 1 ? (
                        <button
                            onClick={() => setStep(step + 1)}
                            className="px-6 py-3 min-h-[44px] rounded-xl bg-gradient-to-r from-primary to-accent text-white text-base font-bold hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
                        >
                            Next
                        </button>
                    ) : (
                        <button
                            onClick={() => {
                                const formElement = document.getElementById('entry-form');
                                if (formElement) {
                                    formElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                }
                                onComplete();
                            }}
                            className="px-6 py-3 min-h-[44px] rounded-xl bg-gradient-to-r from-primary to-accent text-white text-base font-bold hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Get Started
                        </button>
                    )}
                    <button
                        onClick={onComplete}
                        className="px-6 py-3 min-h-[44px] rounded-xl glass-card text-sm font-bold hover:bg-accent/20 transition-all border border-border/50"
                    >
                        Skip
                    </button>
                </div>
            </div>
        </div>
    );
};

