-- Migration: Add custom_image_url column to ledger_entries if it doesn't exist
-- Run this in your Supabase SQL Editor if you get the "custom_image_url column not found" error

-- Check if column exists and add it if it doesn't
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'ledger_entries' 
        AND column_name = 'custom_image_url'
    ) THEN
        ALTER TABLE public.ledger_entries 
        ADD COLUMN custom_image_url text;
        
        RAISE NOTICE 'Column custom_image_url added to ledger_entries';
    ELSE
        RAISE NOTICE 'Column custom_image_url already exists';
    END IF;
END $$;

