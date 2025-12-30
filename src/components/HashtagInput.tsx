import React, { useState, useRef, useEffect, type KeyboardEvent } from 'react';

interface HashtagInputProps {
    value: string[];
    onChange: (tags: string[]) => void;
    placeholder?: string;
    className?: string;
}

export const HashtagInput: React.FC<HashtagInputProps> = ({
    value,
    onChange,
    placeholder = "Type tags and press comma...",
    className = ""
}) => {
    const [inputValue, setInputValue] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Normalize tags: ensure they start with # and remove duplicates
    const normalizeTags = (tags: string[]): string[] => {
        return Array.from(new Set(
            tags
                .map(tag => tag.trim())
                .filter(tag => tag.length > 0)
                .map(tag => tag.startsWith('#') ? tag : `#${tag}`)
                .map(tag => tag.replace(/\s+/g, '')) // Remove spaces
        ));
    };

    // Update parent when tags change
    useEffect(() => {
        const normalized = normalizeTags(value);
        if (JSON.stringify(normalized) !== JSON.stringify(value)) {
            onChange(normalized);
        }
    }, [value, onChange]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let newValue = e.target.value;
        
        // Auto-add # if user starts typing without it
        if (newValue.length > 0 && !newValue.startsWith('#')) {
            newValue = '#' + newValue;
        }
        
        setInputValue(newValue);
    };

    const addTag = (tag: string) => {
        if (!tag.trim()) return;
        
        const normalizedTag = tag.trim().startsWith('#') 
            ? tag.trim() 
            : `#${tag.trim()}`;
        
        const cleanTag = normalizedTag.replace(/\s+/g, '');
        
        if (cleanTag.length > 1 && !value.includes(cleanTag)) {
            onChange([...value, cleanTag]);
        }
        
        setInputValue('');
    };

    const removeTag = (tagToRemove: string) => {
        onChange(value.filter(tag => tag !== tagToRemove));
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === ',' || e.key === 'Enter') {
            e.preventDefault();
            if (inputValue.trim()) {
                addTag(inputValue);
            }
        } else if (e.key === 'Backspace' && inputValue === '' && value.length > 0) {
            // Remove last tag when backspace is pressed on empty input
            removeTag(value[value.length - 1]);
        }
    };

    const handleBlur = () => {
        setIsFocused(false);
        // Add tag if there's input when blurring
        if (inputValue.trim()) {
            addTag(inputValue);
        }
    };

    const handleFocus = () => {
        setIsFocused(true);
    };

    // Click outside to add tag
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                if (inputValue.trim()) {
                    addTag(inputValue);
                }
            }
        };

        if (isFocused) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isFocused, inputValue]);

    return (
        <div 
            ref={containerRef}
            className={`flex flex-wrap gap-2 p-3 rounded-lg border-2 transition-colors ${
                isFocused 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border bg-background'
            } ${className}`}
            onClick={() => inputRef.current?.focus()}
        >
            {/* Display existing tags */}
            {value.map((tag, index) => (
                <span
                    key={index}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-sm font-medium group"
                >
                    <span>{tag}</span>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            removeTag(tag);
                        }}
                        className="opacity-60 hover:opacity-100 transition-opacity text-primary hover:text-red-500"
                        aria-label={`Remove ${tag}`}
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </span>
            ))}
            
            {/* Input field */}
            <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={handleFocus}
                onBlur={handleBlur}
                placeholder={value.length === 0 ? placeholder : ""}
                className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground"
            />
            
            {/* Helper text */}
            {isFocused && value.length === 0 && (
                <div className="absolute mt-10 text-xs text-muted-foreground bg-background/95 backdrop-blur-sm p-2 rounded border border-border shadow-lg z-10">
                    <p>💡 Type a tag and press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">,</kbd> or <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Enter</kbd> to add</p>
                </div>
            )}
        </div>
    );
};

