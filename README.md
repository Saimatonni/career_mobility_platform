# Career Mobility Platform (Prototype)

An AI-ready, **rule-based** international career-mobility prototype. A user creates a career profile, the system scores a set of opportunities against it, and the user gets **ranked recommendations with clear, evidence-based reasons**, can open a detailed view of each role, and can **shortlist** opportunities.


| Layer | Folder | Stack |
|---|---|---|
| Frontend | [`frontend/`](frontend) | React 18, Vite 5, plain CSS |
| Backend | [`backend/`](backend) | Node.js, Express 4, Mongoose 8 |
| Database | MongoDB Atlas (or in-memory fallback) | MongoDB |

The two apps are fully separate: each has its own `package.json`, dependencies and run script. They talk only over the REST API (`/api`).

A full write-up (architecture, data model, matching method, trade-offs, test evidence, AI disclosure) is in **`Career_Mobility_Platform_Documentation.pdf`**.

---

## 1. Prerequisites

* Node.js **18 or newer** (tested on 22) and npm
* A MongoDB connection string (MongoDB Atlas free tier is fine) — *optional*: without one the backend runs in **in-memory mock mode**, so you can still run everything

## 2. Quick start (3 steps)

Open **two terminals**.

### Terminal 1 — Backend

```bash
cd backend
npm install
cp .env.example .env        # Windows PowerShell: copy .env.example .env
# edit .env and paste your MongoDB connection string into MONGODB_URI
npm run dev                 # or: npm start
```

You should see:

```
[store] Connected to MongoDB (db: career_mobility)
[store] Seeded 12 sample opportunities.
[server] API listening on http://localhost:5050/api  (storage: mongodb)
```

### Terminal 2 — Frontend

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**.

### Try the demo flow

1. Click **Load sample profile** (the fictional candidate from the brief, work authorisation *not specified*) → **Create profile & see matches**.
2. Review the ranked list. Open a role to see the **score breakdown, strengths, gaps and eligibility flags**.
3. Click **☆ Shortlist** on a card or in the detail view. Check the **Shortlist** tab.
4. Edit the profile (e.g. set work authorisation, add German) and watch the ranking change.

---


## 3. Tests

```bash
cd backend
npm test
```

Uses Node's built-in test runner (no extra packages):

* `tests/matching.test.js` – strong match, partial match, critical-gap case, eligibility (unknown / student-only / sponsorship), missing data, aliases, regions, ranking
* `tests/validation.test.js` – required fields, enums, ranges, duplicates, injection-style payloads
* `tests/api.test.js` – full HTTP flow (profile → matches → detail → shortlist) against the in-memory store

---

## 4. How matching works (short version)

Six weighted criteria, each scored 0–1 and shown to the user:

| Criterion | Weight | Logic |
|---|---:|---|
| Skills | 30 | Exact/alias match = 1, related skill = ½; 85 % required + 15 % preferred |
| Experience | 15 | Years vs min/max range; −0.3 per missing year; overqualified penalty |
| Education | 10 | Level met (70 %) + field relevance (30 %) |
| Location | 15 | Preferred country 1.0 · preferred region 0.8 · remote-friendly 0.6 · otherwise 0.1 |
| Language | 15 | Weakest *required* language decides (met 1 · one level short 0.5 · missing 0) |
| Interests | 15 | Overlap between career interests and role tags/title |

**Eligibility is not a score.** Work-authorisation and student-only rules produce flags: `verify` (unknown / needs sponsorship), `critical` (known blocker) or `info`. Unknown status is **never treated as satisfied** and is labelled *requires verification, not a legal determination*.
**Critical gaps** (missing required language, confirmed eligibility blocker, ≥3 years short of experience, ≥2 education levels short, no required skills at all) **cap the score at 45**.
**Missing profile data** is excluded and the remaining weights re-normalised; a confidence value and a "Not assessed" note are shown.

No external AI service is used; results are deterministic and fully explainable.

## 5. API overview

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Status + storage mode |
| GET | `/api/meta` | Dropdown values (education, language levels, countries) |
| GET | `/api/sample-profile` | Fictional sample candidate |
| POST / GET / PUT | `/api/profiles`, `/api/profiles/:id` | Create / read / update profile (validated) |
| GET | `/api/opportunities`, `/api/opportunities/:id` | List / read opportunities |
| GET | `/api/profiles/:id/matches` | Ranked matches with explanations |
| GET | `/api/profiles/:id/matches/:opportunityId` | Match detail |
| GET | `/api/profiles/:id/shortlist` | Shortlisted roles |
| PUT / DELETE | `/api/profiles/:id/shortlist/:opportunityId` | Add (with optional note) / remove |

Errors are JSON: `{ "error": { "code", "message", "details" } }` with proper status codes (400, 404, 413, 422, 429, 500).

## 6. Project structure

```
career-mobility-platform/
├── README.md
├── Career_Mobility_Platform_Documentation.pdf
├── backend/
│   ├── .env.example
│   ├── package.json
│   ├── scripts/seed.js
│   ├── src/
│   │   ├── server.js              # start-up, graceful shutdown
│   │   ├── app.js                 # express app (helmet, cors, rate limit)
│   │   ├── config/env.js
│   │   ├── routes/index.js        # REST endpoints
│   │   ├── middleware/errors.js   # HttpError + central error handler
│   │   ├── validation/profile.js  # validation + sanitising
│   │   ├── models/                # Mongoose: Profile, Opportunity, Shortlist
│   │   ├── store/                 # mongoStore + memoryStore (same interface)
│   │   ├── services/matching/     # config, factors, engine (pure functions)
│   │   ├── data/                  # 12 sample opportunities + sample profile
│   │   └── utils/
│   └── tests/
└── frontend/
    ├── .env.example
    ├── index.html, vite.config.js, package.json
    └── src/
        ├── App.jsx, main.jsx, api.js, styles.css
        ├── pages/        # Profile, Matches, Detail, Shortlist
        ├── components/   # TagInput, MatchCard, FactorBars, EligibilityFlags, ...
        └── utils/
```

## 7. Technologies used

React 18 · Vite · Node.js · Express · Mongoose / MongoDB Atlas · helmet · cors · express-rate-limit · dotenv · Node test runner. Full list and versions are in `backend/package.json` and `frontend/package.json`.
