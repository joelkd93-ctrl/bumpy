# 🚀 Bumpy — Deployment Guide with Turso & Cloudflare Workers

This guide walks you through setting up the complete Bumpy backend with Turso (SQLite edge database) and Cloudflare Workers.

---

## 📋 Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [Cloudflare account](https://dash.cloudflare.com/) (free tier works)
- [Turso account](https://turso.tech/) (free tier: 500 DBs, 9GB storage)
- Wrangler CLI: `npm install -g wrangler`
- Turso CLI: `curl -sSfL https://get.tur.so/install.sh | bash`

---

## 1️⃣ Set Up Turso Database

### Login to Turso
```bash
turso auth login
```

### Create a database
```bash
turso db create bumpy-db --location ams  # Amsterdam (closest to Norway)
```

### Get your credentials
```bash
# Get database URL
turso db show bumpy-db --url
# Output: libsql://bumpy-db-yourusername.turso.io

# Create auth token
turso db tokens create bumpy-db
# Output: eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9...
```

**Save these values — you'll need them!**

---

## 2️⃣ Set Up Cloudflare Worker

### Navigate to worker folder
```bash
cd worker
```

### Login to Cloudflare
```bash
wrangler login
```

### Add your Turso secrets
```bash
wrangler secret put TURSO_DATABASE_URL
# Paste: libsql://bumpy-db-yourusername.turso.io

wrangler secret put TURSO_AUTH_TOKEN
# Paste: eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9...
```

### Deploy the worker
```bash
wrangler deploy
```

You'll get a URL like: `https://bumpy-api.your-subdomain.workers.dev`

### Initialize the database
```bash
curl -X POST https://bumpy-api.your-subdomain.workers.dev/api/init
```

Should return: `{"success":true,"message":"Database initialized"}`

---

## 3️⃣ Update Frontend API URL

Edit `src/main.js` and update the API base URL:

```javascript
// Line ~363
window.API_BASE = "https://bumpy-api.your-subdomain.workers.dev";
```

Also update `src/utils/storage-improved.js`:

```javascript
// Line ~7
const API_URL = 'https://bumpy-api.your-subdomain.workers.dev/api';
```

---

## 4️⃣ Deploy Frontend

### Build the app
```bash
cd ..  # Back to main folder
npm install
npm run build
```

### Deploy to Vercel (easiest)
```bash
npm i -g vercel
vercel --prod
```

### Or deploy to Cloudflare Pages
```bash
# Push to GitHub first, then:
# 1. Go to pages.cloudflare.com
# 2. Create project → Connect GitHub
# 3. Build command: npm run build
# 4. Output directory: dist
```

---

## 5️⃣ Optional: Custom Domain

### For the API (Cloudflare Worker)
1. Go to Cloudflare Dashboard → Workers → Your Worker
2. Click "Triggers" → "Add Custom Domain"
3. Enter: `api.bumpy.app` (or your domain)

### For the Frontend (Vercel/Cloudflare Pages)
1. Go to your project settings
2. Add custom domain: `bumpy.app`

---

## 🧪 Test the Setup

### Test API health
```bash
curl https://your-api-url/api/settings
```

### Test sync
```bash
curl -X POST https://your-api-url/api/sync \
  -H "Content-Type: application/json" \
  -d '{"settings":{"name":"Test"}}'
```

### Test presence
```bash
curl -X POST https://your-api-url/api/presence \
  -H "Content-Type: application/json" \
  -d '{"role":"andrine"}'
```

---

## 📊 Database Schema Overview

| Table | Purpose |
|-------|---------|
| `settings` | App settings (name, due date, etc.) |
| `journal` | Weekly bump photos & notes |
| `moods` | Daily mood entries |
| `kicks` | Completed kick sessions |
| `active_kick_session` | Real-time kick counter |
| `name_votes` | Baby name preferences |
| `predictions` | Baby prediction game answers |
| `presence` | Real-time partner presence |
| `auction_profiles` | Love auction coin balances |
| `auctions` | Active love auctions |
| `owned_rewards` | Won auction items |
| `ledger` | Transaction history |
| `weekly_answers` | Weekly question answers |

---

## 🔧 Troubleshooting

### "Database not found" error
```bash
# Re-run init
curl -X POST https://your-api-url/api/init
```

### CORS errors
The worker includes CORS headers for all origins. If you see CORS errors:
1. Check the worker is deployed
2. Verify the URL is correct in your frontend

### Sync not working
1. Check browser console for errors
2. Verify API_BASE is set correctly
3. Test API directly with curl

### Turso connection issues
```bash
# Test connection
turso db shell bumpy-db
> SELECT * FROM settings;
```

---

## 📈 Monitoring

### Cloudflare Worker Analytics
- Dashboard → Workers → Your Worker → Analytics
- See request counts, errors, latency

### Turso Dashboard
- [turso.tech/app](https://turso.tech/app)
- View database usage, queries, storage

---

## 🔄 Updating

### Update Worker
```bash
cd worker
wrangler deploy
```

### Update Frontend
```bash
npm run build
vercel --prod  # or push to GitHub for Pages
```

---

## 💰 Cost Estimate

**Free tier covers:**
- Turso: 500 databases, 9GB storage, 1B row reads/month
- Cloudflare Workers: 100k requests/day
- Vercel/Cloudflare Pages: Unlimited static hosting

**For a personal pregnancy app: $0/month** 🎉

---

## 🆘 Support

If you run into issues:
1. Check the browser console (F12)
2. Check worker logs: `wrangler tail`
3. Test endpoints with curl
4. Verify secrets are set correctly

Happy pregnancy tracking! 💕👶
