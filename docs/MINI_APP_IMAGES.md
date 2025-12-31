# Base Mini App Image Requirements

This guide provides the recommended image sizes and specifications for your Creator Ledger Base mini app manifest.

## Image Specifications

### 1. **iconUrl** - App Icon
- **Size**: 512x512px (square)
- **Format**: PNG (with transparency) or JPG
- **Purpose**: App icon displayed in Base app directory and when launching
- **Requirements**:
  - Square aspect ratio (1:1)
  - High resolution for retina displays
  - Should work on both light and dark backgrounds
  - Recommended: PNG with transparency

**Example**: `/assets/icon-512x512.png`

---

### 2. **splashImageUrl** - Loading/Splash Screen
- **Size**: 1200x1200px (square, 1:1 ratio) - **RECOMMENDED**
- **Alternative**: 1080x1920px (9:16 portrait) for mobile-first
- **Format**: PNG or JPG
- **Purpose**: Shown while the mini app is loading
- **Requirements**:
  - Should match `splashBackgroundColor` theme (#0F172A)
  - Center-focused design (may be cropped on different devices)
  - Should include app logo/branding
  - **Square format is most common** for splash screens as they work across all device orientations
  - Keep important content in the center 60% (safe zone)

**Example**: `/assets/splash-1200x1200.png`

---

### 3. **heroImageUrl** - Hero/Banner Image
- **Size**: 1200x630px (1.91:1 ratio) - same as Open Graph
- **Format**: PNG or JPG
- **Purpose**: Featured image in app listings and discovery
- **Requirements**:
  - Landscape orientation
  - High-quality, visually appealing
  - Should represent your app's core value proposition
  - Text should be readable at small sizes

**Example**: `/assets/hero-1200x630.png`

---

### 4. **ogImageUrl** - Open Graph Image
- **Size**: 1200x630px (1.91:1 ratio)
- **Format**: PNG or JPG
- **Purpose**: Preview image when sharing your app on social media
- **Requirements**:
  - Standard Open Graph ratio (1.91:1)
  - Should include app name and key messaging
  - Optimized for social media previews
  - File size: < 1MB recommended

**Example**: `/assets/og-image-1200x630.png`

---

### 5. **screenshotUrls** - App Screenshots
- **Size**: 1200x800px (3:2 ratio) or 1080x1920px (9:16 for mobile)
- **Format**: PNG or JPG
- **Purpose**: Showcase your app's features and UI
- **Requirements**:
  - Multiple screenshots recommended (3-5)
  - Should show key features and user flows
  - Can be desktop or mobile views
  - High quality, clear UI elements

**Examples**:
- `/assets/screenshot-1-1200x800.png` (Dashboard)
- `/assets/screenshot-2-1200x800.png` (Entry creation)
- `/assets/screenshot-3-1200x800.png` (NFT display)
- `/assets/screenshot-4-1200x800.png` (Public profile)

---

## Quick Reference Table

| Image Type | Dimensions | Aspect Ratio | Format | Max Size |
|------------|-----------|--------------|--------|----------|
| **iconUrl** | 512x512px | 1:1 (square) | PNG/JPG | 500KB |
| **splashImageUrl** | 1200x1200px | 1:1 (square) | PNG/JPG | 1MB |
| **heroImageUrl** | 1200x630px | 1.91:1 | PNG/JPG | 1MB |
| **ogImageUrl** | 1200x630px | 1.91:1 | PNG/JPG | 1MB |
| **screenshotUrls** | 1200x800px | 3:2 | PNG/JPG | 1MB each |

---

## Design Tips

1. **Consistency**: Use consistent branding, colors, and style across all images
2. **Text Readability**: Ensure text is large enough to read at thumbnail sizes
3. **Safe Zones**: Keep important content in the center 80% of the image (edges may be cropped)
4. **Color Contrast**: Ensure good contrast with `splashBackgroundColor` (#0F172A)
5. **File Optimization**: Compress images to reduce load times while maintaining quality

---

## Current Assets

You currently have:
- `/assets/logo.png` - Can be used as a starting point for icon
- `/assets/free_nft.png` - Could be used in screenshots
- `/assets/pro_nft.png` - Could be used in screenshots

---

## Recommended Image Creation Workflow

1. **Create base designs** in Figma/Photoshop at the specified dimensions
2. **Export** at 2x resolution for retina displays (e.g., 1024x1024 for icon)
3. **Optimize** using tools like:
   - [TinyPNG](https://tinypng.com/) for compression
   - [Squoosh](https://squoosh.app/) for format conversion
4. **Test** by viewing images at different sizes
5. **Upload** to `/public/assets/` directory
6. **Update manifest** with correct URLs

---

## Example Manifest Configuration

```json
{
  "miniapp": {
    "iconUrl": "https://creator-ledger-five.vercel.app/assets/icon-512x512.png",
    "splashImageUrl": "https://creator-ledger-five.vercel.app/assets/splash-1200x1200.png",
    "heroImageUrl": "https://creator-ledger-five.vercel.app/assets/hero-1200x630.png",
    "ogImageUrl": "https://creator-ledger-five.vercel.app/assets/og-image-1200x630.png",
    "screenshotUrls": [
      "https://creator-ledger-five.vercel.app/assets/screenshot-dashboard-1200x800.png",
      "https://creator-ledger-five.vercel.app/assets/screenshot-nft-1200x800.png",
      "https://creator-ledger-five.vercel.app/assets/screenshot-profile-1200x800.png"
    ]
  }
}
```

