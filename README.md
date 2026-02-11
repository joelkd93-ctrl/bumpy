# 💕 Bumpy — A Loving Pregnancy Companion

A beautiful, polished Progressive Web App (PWA) for tracking pregnancy milestones, baby kicks, and sharing special moments together.

## ✨ Features

- **📊 Pregnancy Progress** — Beautiful progress ring showing your journey
- **🦶 Kick Counter** — Track and share baby's movements in real-time
- **📔 Journal** — Capture photos and memories each week
- **😊 Mood Tracker** — Log how you're feeling day by day
- **💖 Timeline** — Beautiful timeline of your pregnancy journey
- **🥰 Together Mode** — Interactive games and heartbeat sharing for partners
- **🌙 Dark Mode** — Automatic dark theme support
- **📴 Offline Support** — Works without internet connection

## 🚀 Quick Deploy

### Option 1: Vercel (Recommended)
```bash
npm i -g vercel
vercel --prod
```

### Option 2: Netlify
```bash
npm i -g netlify-cli
netlify deploy --prod --dir=.
```

### Option 3: Cloudflare Pages
1. Push to GitHub
2. Connect to Cloudflare Pages
3. Set build output directory to `/` (root)

## 📁 Project Structure

```
bumpy-pwa/
├── index.html          # Main HTML with PWA meta tags
├── manifest.json       # PWA manifest
├── sw.js               # Service worker
├── browserconfig.xml   # Windows tiles config
├── robots.txt          # SEO
├── icons/              # App icons
│   ├── icon.svg        # Vector icon (source)
│   ├── favicon.svg     # Browser favicon
│   └── icon-*.png      # Generated PNG icons
├── src/
│   ├── main.js         # App entry point
│   ├── styles/
│   │   ├── main.css    # Core styles
│   │   └── polish.css  # UI polish enhancements
│   ├── pages/          # Page components
│   ├── components/     # Shared components
│   └── utils/          # Utilities
└── generate-icons.html # Icon generator tool
```

## 🎨 Generating Icons

Before deploying, generate the required PNG icons:

1. Open `generate-icons.html` in a browser
2. Click each download link to save the icons
3. Save them to the `/icons/` folder

Required icons:
- `icon-48.png` through `icon-512.png`
- `icon-maskable-192.png` and `icon-maskable-512.png`

## 🔧 Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## 📱 PWA Installation

### iOS (Safari)
1. Open the app in Safari
2. Tap the Share button
3. Select "Add to Home Screen"

### Android (Chrome)
1. Open the app in Chrome
2. Tap the menu (⋮)
3. Select "Install app" or "Add to Home screen"

### Desktop (Chrome/Edge)
1. Look for the install icon in the address bar
2. Click "Install"

## ⚙️ Configuration

### API Endpoint
Edit `src/main.js` to change the API endpoint:
```javascript
window.API_BASE = "https://your-api.workers.dev";
```

### Due Date
Users can set their due date in Settings within the app.

## 🎯 Lighthouse Score Targets

- **Performance**: 95+
- **Accessibility**: 100
- **Best Practices**: 100
- **SEO**: 100
- **PWA**: ✓ Installable

## 📋 Pre-Deploy Checklist

- [ ] Generate all PNG icons from SVG
- [ ] Update `manifest.json` start_url if needed
- [ ] Update API endpoint in `main.js`
- [ ] Test on mobile devices
- [ ] Run Lighthouse audit
- [ ] Test offline functionality
- [ ] Verify install prompt works

## 🔒 Privacy

- All data is stored locally on device
- Optional cloud sync via API
- No third-party tracking

## 💜 Credits

Made with love for Andrine & Yoel

---

**Version**: 3.0.0  
**Last Updated**: February 2026
