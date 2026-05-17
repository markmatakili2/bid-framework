# Tuinnov8 BID Assessment — Full Stack

One repo. One deploy. Everything on Render — frontend, backend, and database.

---

## What's Inside

```
tuinnov8-backend/
├── server.js          ← Express API + serves frontend
├── public/
│   ├── index.html     ← BID Assessment Tool (frontend)
│   └── admin.html     ← Admin dashboard
├── render.yaml        ← Render deployment config (auto-deploys everything)
├── package.json
├── .env.example
└── README.md
```

---

## Deploy to Render (Free) — 5 Steps

### Step 1 — Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main

# Create a new repo on github.com called tuinnov8-bid
# then:
git remote add origin https://github.com/YOUR_USERNAME/tuinnov8-bid.git
git push -u origin main
```

### Step 2 — Connect to Render

1. Go to **https://render.com** and sign up (free, no card needed)
2. Click **"New"** → **"Blueprint"**
3. Connect your GitHub account and select your **tuinnov8-bid** repo
4. Render reads `render.yaml` and automatically sets up:
   - ✅ Node.js web service
   - ✅ Free PostgreSQL database
   - ✅ Auto-generated session secret
   - ✅ Database URL injected into the app

### Step 3 — Set Admin Credentials

In the Render dashboard → your web service → **Environment** tab, add:

| Key | Value |
|---|---|
| `ADMIN_USER` | `admin` (or your preferred username) |
| `ADMIN_PASS` | `your-strong-password` |

Click **Save Changes** — Render will redeploy automatically.

### Step 4 — Get Your URL

Render gives you a URL like:
```
https://tuinnov8-bid.onrender.com
```

That's it. Everything is live.

### Step 5 — Connect Frontend to Backend

Open `public/index.html`, find this line near the bottom:
```js
const API_URL = (typeof window !== 'undefined' && window.TUINNOV8_API) ...
```

Add this line just before `</body>`:
```html
<script>
  window.TUINNOV8_API = 'https://tuinnov8-bid.onrender.com';
</script>
```

Commit and push — Render auto-redeploys in ~1 minute.

---

## Access Points

| URL | What it is |
|---|---|
| `https://your-app.onrender.com` | BID Assessment Tool |
| `https://your-app.onrender.com/admin` | Admin Dashboard |

**Admin login:**
- Username: whatever you set as `ADMIN_USER`
- Password: whatever you set as `ADMIN_PASS`

---

## Render Free Tier — What You Get

| Resource | Free Tier |
|---|---|
| Web service | ✅ Free (sleeps after 15 min idle) |
| PostgreSQL | ✅ Free (1GB storage, 90 days*) |
| Bandwidth | ✅ 100GB/month |
| Custom domain | ✅ Supported |

> ⚠️ **Important:** Render's free PostgreSQL expires after **90 days**.
> Before day 90, upgrade to the paid database ($7/month) or export
> your data and recreate the database. Your web service stays free forever.

> ℹ️ **Cold starts:** Free web services sleep after 15 minutes of inactivity.
> The first request after sleeping takes ~30 seconds to wake up.
> This is fine for a consultation tool — not noticeable in normal use.

---

## Local Development

```bash
# 1. Install PostgreSQL locally (or use a free cloud DB)
# 2. Copy env file
cp .env.example .env
# 3. Edit .env with your local DB connection string
# 4. Install dependencies
npm install
# 5. Start
node server.js
# App: http://localhost:3000
# Admin: http://localhost:3000/admin
```

---

*© 2025 Tuinnov8 · Internal Use*
