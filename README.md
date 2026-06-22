# CTI Tracker

A full-stack cyber threat intelligence platform for collecting IOCs from live threat feeds, mapping adversary activity to MITRE ATT&CK, tracking campaigns, and generating finished intelligence reports.

Built as a portfolio project inspired by enterprise CTI analyst workflows.

## Features

- **Live IOC Collection** — streams threat indicators in real time from MalwareBazaar, URLhaus, and FeodoTracker via WebSocket; deduplicates against the database automatically
- **IOC Management** — paginated table with type/source filters, bulk delete, campaign tagging, and watchlist support
- **IOC Hunt** — search stored indicators by value, type, or source to pivot on a specific threat
- **Campaign Tracking** — create and manage threat actor campaigns; associate IOCs and ATT&CK techniques per campaign
- **MITRE ATT&CK Matrix** — interactive heatmap of all ATT&CK tactics and techniques; highlight covered techniques per campaign; live data from the STIX 2.1 bundle cached for 24 hours
- **Intelligence Reports** — generate and export finished Markdown reports from campaign data
- **Watchlist** — pin high-priority IOCs for quick access across sessions
- **Google OAuth + JWT auth** — sign in with Google; sessions are backed by server-issued JWTs

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion |
| Backend | Node.js, Express.js, WebSocket (ws) |
| Database | Supabase (PostgreSQL) |
| Auth | NextAuth.js (Google OAuth) + server-side JWT |
| Icons | Phosphor Icons |

## Data Sources

| Source | Data |
|--------|------|
| [MalwareBazaar](https://bazaar.abuse.ch/) | SHA256 / MD5 / SHA1 hashes from recent malware submissions |
| [URLhaus](https://urlhaus.abuse.ch/) | Malicious URLs and domains from community reports |
| [FeodoTracker](https://feodotracker.abuse.ch/) | C2 IPs linked to Emotet, Qakbot, and banking trojans |
| [MITRE ATT&CK](https://attack.mitre.org/) | Full technique list via STIX 2.1 bundle, cached 24 h |

## Project Structure

```
cti-tracker/
├── frontend/               Next.js 14 App Router
│   ├── app/                Pages and NextAuth API route
│   ├── components/         UI components (dashboard, landing, shared)
│   ├── hooks/              Custom React hooks
│   └── lib/api/            Typed API client modules
└── server/                 Express.js backend
    ├── collectors/         Feed integrations (MalwareBazaar, URLhaus, FeodoTracker, MITRE)
    ├── analyzers/          IOC scoring and campaign summary logic
    ├── auth.js             JWT signing and middleware
    ├── db.js               Supabase client and all database queries
    ├── index.js            Express routes and WebSocket collection handler
    ├── reports.js          Markdown intelligence report generation
    └── schema.sql          PostgreSQL schema — run once in Supabase SQL editor
```

## Local Development

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier is sufficient)
- Google OAuth credentials (optional — you can also use credential-based login)

### 1. Database

In your Supabase project, open the SQL editor and run `server/schema.sql`.

### 2. Backend

```bash
cd server
npm install
cp .env.example .env
# Fill in your credentials as described in .env.example
node index.js
```

The Express server runs on `http://localhost:8000` by default.

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
# Fill in your credentials as described in .env.example
npm run dev
```

Open `http://localhost:3000`.

## Deploying

The frontend deploys directly to [Vercel](https://vercel.com). The Express backend requires a persistent host with WebSocket support — [Railway](https://railway.app), [Render](https://render.com), and [Fly.io](https://fly.io) all work on free tiers.

1. Deploy `server/` to Railway or Render and configure its environment variables.
2. Import this repo into Vercel, set the root directory to `frontend/`, and configure its environment variables — including the deployed backend URL.

## Security

- `.env` and `.env.local` are excluded by `.gitignore` — never commit them.
- The backend refuses to start if its signing key is not set in the environment.
- Service credentials are server-only and never exposed to the frontend.

## License

MIT. Threat intelligence data from MITRE ATT&CK, MalwareBazaar, URLhaus, and FeodoTracker is subject to each source's own terms and usage policies.
