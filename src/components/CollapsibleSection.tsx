import React, { useState, useEffect, useRef } from 'react';

interface CollapsibleSectionProps {
    title: string;
    defaultOpen?: boolean;
    children: React.ReactNode;
    icon?: React.ReactNode;
    className?: string;
    badge?: string | number; // Optional badge to show count or status
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
    title,
    defaultOpen = false,
    children,
    icon,
    className = '',
    badge
}) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const hasRenderedRef = useRef(false);
    
    // Auto-open if children change and indicate there's content (e.g., collections exist)
    useEffect(() => {
        if (!hasRenderedRef.current && badge && Number(badge) > 0) {
            setIsOpen(true);
            hasRenderedRef.current = true;
        }
    }, [badge]);

    return (
        <div className={`border border-border/50 rounded-xl overflow-hidden ${className}`}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 hover:bg-accent/10 transition-colors"
            >
                <div className="flex items-center gap-3">
                    {icon && <div className="text-primary">{icon}</div>}
                    <h3 className="text-lg font-bold">{title}</h3>
                    {badge !== undefined && (
                        <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-bold">
                            {badge}
                        </span>
                    )}
                </div>
                <svg
                    className={`w-5 h-5 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {isOpen && (
                <div className="p-4 border-t border-border/50">
                    {children}
                </div>
            )}
        </div>
    );
};

