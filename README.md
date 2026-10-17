<div align="center">

# NexusCampus

### Smart Campus Automation & Live Wayfinding OS

A unified campus operations platform that collapses navigation, attendance, dining, hostel facilities, and maintenance into a single, real-time dashboard — powered by a live LLM concierge.

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white&style=flat-square)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white&style=flat-square)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=white&style=flat-square)](https://tailwindcss.com)
[![Firebase](https://img.shields.io/badge/Firebase-Auth%20%2B%20Firestore-FFCA28?logo=firebase&logoColor=black&style=flat-square)](https://firebase.google.com)
[![Groq](https://img.shields.io/badge/Groq-LLM%20Inference-F55036?style=flat-square)](https://groq.com)
[![License](https://img.shields.io/badge/License-ISC-blue?style=flat-square)](#license)

[**Live Demo**](https://nexuscampus-siddhxx.netlify.app) · [Report a Bug](https://github.com/sai4627W/nexuscampus/issues) · [Request a Feature](https://github.com/sai4627W/nexuscampus/issues)

</div>

---

## Table of Contents

- [Overview](#overview)
- [The Problem](#the-problem)
- [Key Features](#key-features)
- [AI Capabilities](#ai-capabilities)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Firebase Setup](#firebase-setup)
- [Deployment](#deployment)
- [How the Routing Engine Works](#how-the-routing-engine-works)
- [Demo Walkthrough](#demo-walkthrough)
- [Roadmap](#roadmap)
- [License](#license)

---

## Overview

**NexusCampus** is a production-grade single-page application that digitizes the day-to-day operations of a college campus. Instead of juggling a dozen disconnected portals, students get one workspace where every action — finding a room, checking into a lecture, ordering food, booking a washing machine, generating a gate pass, or filing a complaint — happens in a few clicks and is reflected live across the app.

It is built around three principles:

1. **Zero dead ends** — every button performs a real state transition. There are no placeholder screens.
2. **AI where it adds leverage** — a Groq-hosted LLM handles natural-language navigation, recommendations, triage, and coaching, with graceful keyword-based fallbacks when offline.
3. **Real infrastructure** — Firebase Authentication and Cloud Firestore back the session and user data, so the app behaves like a real product, not a mockup.

---

## The Problem

Campus workflows are fragmented and manual:

- Wayfinding is guesswork — students don't know the fastest route or whether a lab is free.
- Attendance tracking is a spreadsheet copy-pasted week to week.
- Canteen queues waste 20+ minutes of a lunch break.
- Hostel facilities (laundry, study pods, gate passes) run on noticeboards and WhatsApp threads.
- Maintenance complaints get lost with no accountability or triage.

NexusCampus unifies all of these behind one consistent, real-time interface with an AI assistant that understands plain English.

---

## Key Features

### 1. Live Wayfinding & Campus Map
- Interactive SVG map of **10 campus zones** (Main Gate, Academic Block A, AI & ML Lab, Central Library, Boys/Girls Hostels, Cafeteria, Auditorium, Sports Complex, Medical Center) with drag-pan and zoom.
- **Dijkstra shortest-path routing** with exact distance (meters), estimated walk time, and turn-by-turn directions.
- Pick a start/destination from dropdowns or **click nodes directly** on the map; the optimal route animates on screen.
- **Indoor Floor Explorer** — per-building Ground/1st/2nd floor room status ("Lab 302 — Occupied till 2 PM").
- **Live crowd heatmap** with a pulse that drifts zone occupancy every 45 seconds.

### 2. Smart Attendance
- Per-subject progress rings with threshold-aware colour logic (red < 75%, amber 75–80%, green > 80%).
- **Margin calculator** — tells you how many classes you can safely skip, or how many you must attend to recover.
- One-click mark present/absent plus a **Smart QR/OTP check-in** flow with a live faculty code.
- Full attendance activity log.

### 3. Smart Cafeteria
- 13-item menu with category filters, live prep-time tags, and cart math.
- **Campus Wallet** with top-up, balance validation, and insufficient-funds guards.
- **Digital queue token** (e.g. `#TK-409`) with a live Preparing → Ready countdown and order history.

### 4. Hostel Facilities Automation
- **Digital Gate Pass** — a rules engine auto-approves daytime requests (06:00–21:00) and routes late-night requests to warden review, generating a scannable dynamic QR with a validity window.
- **Laundry (6 machines) & Study Pods (4)** — live Available / In Use / Booked tiles with book-and-start flows, real countdown timers, and completion toasts.

### 5. Maintenance Router
- Report an issue → **automatic triage** assigns the department (Electrical / IT Support / Housekeeping / Lost & Found) and priority (Urgent / Medium / Low).
- Live **Kanban board**: Reported → Assigned → Resolved with one-click transitions.

### 6. Command Layer
- **`Ctrl/⌘ + K` command palette** with 15+ natural-language commands — routes, orders, check-ins, navigation, wallet top-ups, and demo reset.

### 7. Authentication & Persistence
- **Google and Email/Password sign-in** via Firebase Auth, with a per-user profile document in Firestore (`users/{uid}`).
- All application state persists through Zustand's `persist` middleware, with a one-click **Reset Demo Data** to restore the seed dataset.

---

## AI Capabilities

All AI features are powered by **Groq** (OpenAI-compatible inference) and degrade gracefully to keyword-based logic if the API key is absent or the network fails.

| Capability | Description | Module |
| --- | --- | --- |
| **AI Concierge** | Natural-language chat that answers campus questions and triggers actions (routes on the map, opens tabs, adds items). | `conciergeReply` |
| **Voice Input** | Web Speech API dictation (en-IN) for the concierge. | `Assistant.jsx` |
| **Route Narrator** | Converts a computed route into a friendly, human walking guide. | `narrateRoute` |
| **Food Recommender** | Suggests menu items based on time of day and remaining wallet balance. | `recommendFood` |
| **Maintenance Triage** | Classifies a free-text issue into department + priority. | `triageWithAI` |
| **Attendance Strategist** | Per-subject verdicts, safe-skip counts, and an exam-focused tip. | `attendanceStrategy` |
| **Lost & Found Matcher** | Ranks existing reports against a described lost item with confidence scores. | `matchLostFound` |
| **Daily Briefing** | A concise 3-line plan covering classes, busy zones, and a saving/food tip. | `dailyBriefing` |

> **Security note:** In this demo the Groq key is exposed to the browser (`VITE_` prefix). For any production deployment, proxy LLM calls through a serverless function so the key never reaches the client.

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| **Framework** | React 19 |
| **Build tool** | Vite 8 (Rolldown) |
| **Styling** | Tailwind CSS 4 (`@tailwindcss/vite`) |
| **State** | Zustand 5 with `persist` middleware |
| **Icons** | Lucide React |
| **AI** | Groq (OpenAI-compatible chat completions) |
| **Auth & DB** | Firebase Authentication + Cloud Firestore |
| **Hosting** | Vercel / Netlify |

---

## Project Structure

```
nexuscampus/
├── src/
│   ├── components/          # App shell & shared UI
│   │   ├── Assistant.jsx        # AI concierge drawer + voice input
│   │   ├── AuthButton.jsx       # Google / email sign-in
│   │   ├── CommandPalette.jsx   # Ctrl+K command layer
│   │   ├── Sidebar.jsx          # Primary navigation
│   │   ├── Topbar.jsx           # Header, menu toggle, user chip
│   │   ├── Toasts.jsx           # Toast notifications
│   │   └── ui.jsx               # Design-system primitives
│   ├── features/            # Product modules
│   │   ├── MapView.jsx          # Wayfinding, indoor floors, heatmap
│   │   ├── Attendance.jsx       # Attendance, OTP check-in, AI strategist
│   │   ├── Cafeteria.jsx        # Menu, wallet, orders, AI recommender
│   │   ├── Facilities.jsx       # Gate pass, laundry, study pods
│   │   └── Maintenance.jsx      # Triage + Kanban, AI lost & found
│   ├── lib/                 # Core logic
│   │   ├── seed.js              # Seed dataset (zones, timetable, menu…)
│   │   ├── graph.js             # Dijkstra routing + directions
│   │   ├── store.js             # Zustand store (persisted)
│   │   ├── groq.js              # Groq client + all AI helpers
│   │   ├── firebase.js          # Firebase init + auth helpers
│   │   └── utils.js             # Formatting & helpers
│   ├── App.jsx              # Shell, tab routing, auth wiring, crowd pulse
│   ├── main.jsx             # Entry point
│   └── index.css            # Tailwind + design tokens
├── firestore.rules          # Firestore security rules
├── vercel.json              # Vercel deployment config
├── netlify.toml             # Netlify deployment config
└── vanilla-backup/          # Archived pre-React prototype
```

---

## Getting Started

### Prerequisites
- **Node.js** ≥ 18 (developed on v22)
- **npm** ≥ 9
- A free **Groq API key** — [console.groq.com/keys](https://console.groq.com/keys)
- A **Firebase** project — [console.firebase.google.com](https://console.firebase.google.com)

### Installation

```bash
# 1. Clone
git clone https://github.com/sai4627W/nexuscampus.git
cd nexuscampus

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
#    → fill in the values described below

# 4. Run the dev server
npm run dev
```

The app runs at `http://localhost:5173`.

### Build & Preview

```bash
npm run build     # production build → dist/
npm run preview   # serve the production build locally
```

---

## Environment Variables

Create a `.env` file in the project root (see `.env.example`). Vite only exposes variables prefixed with `VITE_`.

| Variable | Description | Example |
| --- | --- | --- |
| `VITE_GROQ_API_KEY` | Groq API key for LLM features | `gsk_...` |
| `VITE_GROQ_MODEL` | Groq model id | `qwen/qwen3.8-27b` |
| `VITE_FB_API_KEY` | Firebase Web API key | `AIza...` |
| `VITE_FB_AUTH_DOMAIN` | Firebase auth domain | `your-app.firebaseapp.com` |
| `VITE_FB_PROJECT_ID` | Firebase project id | `your-app` |
| `VITE_FB_STORAGE_BUCKET` | Firebase storage bucket | `your-app.firebasestorage.app` |
| `VITE_FB_SENDER_ID` | Firebase messaging sender id | `1234567890` |
| `VITE_FB_APP_ID` | Firebase web app id | `1:...:web:...` |

> **Note:** Vite inlines env vars at **build time**. After changing any variable on your host (Vercel/Netlify), you must **redeploy** for the change to take effect.

---

## Firebase Setup

1. Create a project in the [Firebase Console](https://console.firebase.google.com).
2. **Build → Authentication → Sign-in method**: enable **Google** and **Email/Password**.
3. **Authentication → Settings → Authorized domains**: add your production domain (e.g. `your-site.netlify.app`) — `localhost` is included by default for development.
4. **Build → Firestore Database → Create database**, then publish the rules from [`firestore.rules`](./firestore.rules).
5. **Project settings → Your apps** → add a Web app and copy the config values into your `.env`.

---

## Deployment

This project is deployed on **Netlify** — https://nexuscampus-siddhxx.netlify.app

### Netlify
A [`netlify.toml`](./netlify.toml) is included with the build command, publish directory, and SPA redirect preconfigured.

**Option A — Drag & drop (fastest):**
1. Run `npm run build` (with your `.env` present — Vite bakes env vars into the bundle at build time).
2. Open [app.netlify.com/drop](https://app.netlify.com/drop) and drag the generated `dist/` folder in.
3. Netlify assigns a live URL. Add that host to Firebase → Authentication → Settings → **Authorized domains**.

**Option B — Git-connected (auto-deploys):**
1. Netlify → **Add new site → Import an existing project** → pick the GitHub repo.
2. Build command `npm run build`, publish directory `dist` (auto-read from `netlify.toml`).
3. Add all `VITE_*` variables under **Site configuration → Environment variables**, then deploy.

### Vercel
Also compatible: [`vercel.json`](./vercel.json) is included. Import the repo, add the `VITE_*` variables in **Settings → Environment Variables**, and deploy. After any env change, trigger a fresh **Redeploy** (uncheck *Use existing Build Cache*).

---

## How the Routing Engine Works

Wayfinding is backed by a weighted graph of campus zones in [`src/lib/graph.js`](./src/lib/graph.js):

- Each **node** is a location (with `x`/`y` map coordinates for rendering).
- Each **edge** is a walkable path with a real distance in meters.
- `shortestPath()` runs **Dijkstra's algorithm** to compute the minimum-distance route.
- `directions()` converts the node sequence into human-readable turn-by-turn steps.
- `resolveNode()` performs fuzzy matching, so natural-language inputs like *"ai lab"* or *"academic block a"* resolve to the correct node.

---

## Demo Walkthrough

A suggested 5-minute tour for reviewers:

1. **`Ctrl + K`** → *"route hostel to AI lab"* → watch the glowing route render, then hit **AI Narrate Route**.
2. **Attendance** → run the **AI Attendance Strategist** and open **Smart Class Check-In** (live OTP).
3. **Cafeteria** → **AI Recommend** → add items → **Place Instant Order** → watch the wallet deduct and the queue token count down.
4. **Facilities** → generate a daytime **gate pass** (instant QR) and **book a washing machine** (live timer).
5. **Maintenance** → type *"AC leaking in Block A"* → see AI triage it to **Urgent / Electrical** → move it across the Kanban.
6. **Concierge** → ask *"where is my next class?"* → press **Navigate Now** to route to the venue.

---

## Roadmap

- [ ] Move Groq calls behind a serverless proxy to keep the API key off the client.
- [ ] Real-time multi-user sync via Firestore listeners (live queue, room occupancy).
- [ ] Push notifications for order-ready, laundry-complete, and gate-pass approval.
- [ ] Admin analytics dashboard for facilities and maintenance SLAs.
- [ ] PWA support with offline caching.
- [ ] Accessibility audit (WCAG 2.1 AA).

---

## License

Released under the **ISC License**. See the repository for details.

<div align="center">

Built for the **GDG Idea Sprint** hackathon.

</div>
