# File Upload Setup Guide

This guide explains how to set up file uploads for profile images (avatar and banner) in Creator Ledger.

## Prerequisites

- Supabase project with Storage enabled
- Database access to run SQL migrations

## Setup Steps

### 1. Run Database Migration

First, ensure your `profiles` table has all required columns:

```bash
# In Supabase SQL Editor, run:
```

Open `migrations/ensure_profiles_schema.sql` and execute it in your Supabase SQL Editor.

This migration is **idempotent** - safe to run multiple times. It will:
- Add `banner_url` column if missing
- Add `avatar_url` column if missing
- Add other profile columns if missing
- Set up Row Level Security (RLS) policies

### 2. Set Up Storage Bucket

In your Supabase Dashboard:

1. Go to **Storage** section
2. Click **New bucket**
3. Name it: `profile-images`
4. Make it **Public** (so images can be accessed via URL)
5. Set file size limit to **5MB**
6. Add allowed MIME types: `image/jpeg`, `image/jpg`, `image/png`, `image/webp`, `image/gif`

**OR** run the SQL migration:

Open `migrations/setup_storage.sql` and execute it in your Supabase SQL Editor.

### 3. Storage Policies

The `setup_storage.sql` file includes policies for:
- **Public read access**: Anyone can view profile images
- **Upload access**: Users can upload their own images
- **Update/Delete access**: Users can manage their own images

**Note**: If you're using wallet-based authentication (not Supabase Auth), you may need to use the more permissive policies at the bottom of the file. Uncomment those and comment out the `auth.uid()`-based policies.

### 4. Verify Setup

1. Check that the `profile-images` bucket exists in Storage
2. Verify RLS policies are active
3. Test uploading an image through the UI

## How It Works

### File Upload Flow

1. User selects a file (avatar or banner)
2. File is validated (type, size)
3. Preview is shown immediately
4. On save, file is uploaded to Supabase Storage
5. Public URL is generated and saved to `profiles` table
6. Images are stored in folders by wallet address: `{walletAddress}/avatar-{timestamp}.{ext}`

### URL vs File Upload

Users can either:
- **Upload a file**: Directly from their device (recommended)
- **Enter a URL**: Link to an external image

The form supports both methods and shows a preview for either option.

## File Structure

```
profile-images/
  └── {walletAddress}/
      ├── avatar-{timestamp}.jpg
      └── banner-{timestamp}.jpg
```

## Troubleshooting

### Error: "Could not find the 'banner_url' column"

**Solution**: Run `migrations/ensure_profiles_schema.sql` in Supabase SQL Editor.

### Error: "Bucket 'profile-images' not found"

**Solution**: 
1. Create the bucket manually in Supabase Dashboard, OR
2. Run `migrations/setup_storage.sql` in Supabase SQL Editor

### Error: "new row violates row-level security policy"

**Solution**: 
1. Check that RLS policies are created (see `setup_storage.sql`)
2. If using wallet auth, use the permissive policies at the bottom of `setup_storage.sql`

### Images not loading

**Solution**:
1. Verify bucket is set to **Public**
2. Check that storage policies allow public read access
3. Verify the URL format: `https://{project}.supabase.co/storage/v1/object/public/profile-images/{path}`

## Security Considerations

- Files are limited to 5MB
- Only image types are allowed (JPEG, PNG, WebP, GIF)
- Files are organized by wallet address for easier management
- RLS policies control access (adjust based on your auth setup)

## Next Steps

After setup, users can:
1. Click "Customize Profile" in the Dashboard
2. Upload avatar (400x400px recommended, square)
3. Upload banner (1920x1080px recommended, 16:9 ratio)
4. Or enter URLs for external images
5. Save changes

Images will be automatically uploaded and URLs saved to the database.

