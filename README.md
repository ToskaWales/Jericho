# Jericho

Intelligent appointment recovery platform that automatically fills cancelled slots via AI voice outreach, built for the **fonio.ai** track.

A submission for **START Hack Vienna '26**, built for the case provided by
**fonio.ai**.

---

## About

When a patient cancels a healthcare appointment at the last minute, the slot often
goes unused. Jericho detects cancellations from Cal.com, finds patients who want an
earlier appointment, ranks them with AI, and calls them through a Fonio voice agent
to offer the freed slot — then updates bookings automatically based on the call
outcome.

## The challenge

fonio.ai asked teams to use AI voice agents to solve a real scheduling problem.
Our goal was to recover cancelled appointment slots without manual staff outreach,
while respecting patient preferences and contact history.

## What we built

- Automatic recovery jobs triggered by Cal.com cancellation webhooks
- AI-powered candidate ranking (Anthropic) combined with reachability scoring
- Fonio voice agent calls with webhook-driven outcome handling and Cal.com rebooking

## Demo

Jericho is live — open the dashboard in your browser:

**https://jericho-dashboard.artemy.dev**

| | URL |
|---|---|
| **App** | https://jericho-dashboard.artemy.dev |
| **API** | https://jericho.artemy.dev/api |

---

## Deployment

| Layer | Host | URL |
|---|---|---|
| Frontend | Vercel (custom domain) | https://jericho-dashboard.artemy.dev |
| Backend | DigitalOcean App Platform | https://jericho.artemy.dev |
| Database | Firebase Firestore | — |

**Production webhooks** (point Cal.com / Fonio at the backend):

- Cal.com → `https://jericho.artemy.dev/api/webhooks/calcom`
- Fonio → `https://jericho.artemy.dev/api/webhooks/fonio`

The backend allows cross-origin requests from the Vercel app (`cors: *`).

---

## Getting started (local development)

Use this only if you want to run or change the code on your machine. The live app does not require local setup.

### Prerequisites

- Node.js 20+
- Firebase project with Firestore and a service account JSON key
- Fonio API credentials (API key, agent ID, phone number)
- Cal.com API key and event type ID
- Anthropic API key

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/timuriz/Jericho.git
cd Jericho

# 2. Configure environment
cp frontend/.env.example frontend/.env
# fill in the required values (see Configuration below)
# create backend/.env with the backend variables listed in Configuration
# place your Firebase service account at backend/service-account.json

# 3. Install / build
cd backend && npm install
cd ../frontend && npm install

# Optional: seed demo data (from backend/)
# npx ts-node seed.ts
```

### Run locally

```bash
# Terminal 1 — backend (from backend/)
npm run dev

# Terminal 2 — frontend (from frontend/)
npm run dev
```

Then open `http://localhost:5173`. Local frontend uses `VITE_API_URL=http://localhost:3001/api` from `frontend/.env`.

---

## Project structure

```
Jericho/
├── backend/                 # Express API, webhooks, recovery engine
│   └── src/
│       ├── routes/          # REST endpoints and Cal.com / Fonio webhooks
│       ├── services/        # Recovery jobs, ranking, calls, booking logic
│       └── lib/             # Firebase, Fonio, and Cal.com clients
└── frontend/                # React admin dashboard
    └── src/
        ├── pages/           # Dashboard, recovery jobs, analytics, settings
        ├── components/      # UI and feature components
        └── hooks/           # React Query data hooks
```

## Configuration

**Never commit secrets** — keep them in `.env` (which is git-ignored).

**Backend (`backend/.env`)**

| Variable | Description |
|---|---|
| `PORT` | API port (default `3001`) |
| `FRONTEND_URL` | Allowed CORS origin for local dev (production backend uses `cors: *`) |
| `FIREBASE_SERVICE_ACCOUNT_PATH` | Path to Firebase service account JSON (default `./service-account.json`) |
| `FONIO_API_KEY` | Fonio API key |
| `FONIO_AGENT_ID` | Fonio voice agent ID |
| `FONIO_PHONE_NUMBER` | Outbound caller ID |
| `FONIO_BASE_URL` | Fonio API base URL (default `https://app.fonio.ai`) |
| `CAL_API_KEY` | Cal.com API bearer token |
| `CAL_EVENT_TYPE_ID` | Cal.com event type used for recovered bookings |
| `CAL_TIMEZONE` | Timezone for bookings (default `Europe/Vienna`) |
| `CAL_BASE_URL` | Cal.com API base URL (default `https://api.cal.com`) |
| `ANTHROPIC_API_KEY` | Anthropic API key for candidate ranking |

**Frontend (`frontend/.env`)** — see [`frontend/.env.example`](frontend/.env.example). On Vercel, set `VITE_API_URL=https://jericho.artemy.dev/api` plus all `VITE_FIREBASE_*` keys.

## Architecture & assumptions

Cal.com sends webhooks on booking create, reschedule, and cancel. A cancellation
starts a recovery job: eligible patients (booked, same type/location, flagged as
wanting an earlier slot) are ranked by Claude and reachability history, then called
in order via Fonio. Fonio webhooks report call outcomes; accepted slots trigger
Cal.com rebooking and the original appointment is released. Data is stored in
Firestore. We assume patients opt in to earlier slots and that Fonio can match
return webhooks to in-flight calls by phone number.

## Troubleshooting

- **Live app shows no data** → confirm Vercel `VITE_API_URL` is `https://jericho.artemy.dev/api` and the backend at https://jericho.artemy.dev is running
- Recovery job never starts → confirm Cal.com webhooks reach `https://jericho.artemy.dev/api/webhooks/calcom`
- Fonio outcome not processed → ensure the call attempt was created before the webhook arrives; matching uses `customerPhone` and `INITIATED` status
- Backend fails on startup → check that `service-account.json` exists at the path set in `FIREBASE_SERVICE_ACCOUNT_PATH`

---

## Team

- Artemy Medvedev — developer
- ToskaWales — developer

## Submission

- Track: **fonio.ai** · Case partner: **fonio.ai**
- Submitted to the START Hack Vienna '26 GitHub organisation.

## License

Released under the MIT License — see [`LICENSE`](LICENSE).
