# JobMatch.AI — AI Job Finder & Resume Matcher

**Upload your resume. Get AI-matched jobs. Apply in one click.**

JobMatch.AI is a full-stack application that uses AI to parse your resume, discover relevant job listings, and score each match with a short explanation—so you spend less time searching and more time applying.

**Repository:** [github.com/GarvitUpreti/JobMatch.AI](https://github.com/GarvitUpreti/JobMatch.AI)

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)

---

## Features

| Feature | Description |
|--------|-------------|
| **Resume upload** | Upload a PDF or TXT file, or paste your resume text and parse it in one click. |
| **AI parsing** | Extracts skills, experience, education, and a professional summary using Groq (Llama 3.3 70B). |
| **Job discovery** | Browse mock jobs out of the box, or connect Adzuna for live listings from the web. |
| **Text filter** | Search jobs by keyword (title, company, location, skills, description). |
| **AI match & score** | When enabled, jobs are ranked by fit (0–100%) with a short “why it fits” reason. |
| **Structured job cards** | Experience, location, requirements, and responsibilities on separate lines with clear labels. |
| **Posted date** | See how long ago each job was posted (e.g. “2 days ago”). |
| **Direct apply** | One-click link to the job’s apply page. |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, Vite, Tailwind CSS |
| **Backend** | NestJS (Node.js) |
| **AI** | Groq API — Llama 3.3 70B Versatile |
| **Job data** | Adzuna API (optional) or built-in mock jobs |

---

## Prerequisites

- **Node.js** 18+ and **npm**
- **Groq API key** — [Create one at console.groq.com](https://console.groq.com)
- **(Optional)** Adzuna App ID & Key — [Register at developer.adzuna.com](https://developer.adzuna.com/signup) for real job listings

---

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/GarvitUpreti/JobMatch.AI.git
cd JobMatch.AI
```

### 2. Backend setup

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` and set at least:

```env
GROQ_API_KEY=your_groq_api_key_here
```

Then install and run:

```bash
npm install
npm run start:dev
```

Backend runs at **http://localhost:3000**.

### 3. Frontend setup

In a new terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at **http://localhost:5173**. Requests to `/api` are proxied to the backend.

### 4. Use the app

1. Open **http://localhost:5173**
2. Upload your resume or paste its text and click **Parse**
3. Browse jobs, use the search box to filter, and turn on **AI match & score** for ranked results
4. Click **Apply →** on any job to open the apply link

---

## Environment Variables

All variables are set in **`backend/.env`**. The frontend uses the dev proxy and needs no env file.

| Variable | Required | Description |
|----------|----------|-------------|
| `GROQ_API_KEY` | **Yes** | API key from [console.groq.com](https://console.groq.com). Used for resume parsing and job matching. |
| `ADZUNA_APP_ID` | No | Application ID from [developer.adzuna.com](https://developer.adzuna.com/signup). Enables live job listings. |
| `ADZUNA_APP_KEY` | No | Application Key from the same Adzuna account. |
| `ADZUNA_COUNTRY` | No | Country code for job search (e.g. `gb`, `us`, `in`). Default: `gb`. |
| `PORT` | No | Backend port. Default: `3000`. |

---

## Project Structure

```
project/
├── backend/                 # NestJS API
│   ├── src/
│   │   ├── ai/              # Groq client (Llama 3.3 70B)
│   │   ├── resume/          # Resume upload, PDF/text parsing, AI extraction
│   │   └── jobs/            # Job listing, Adzuna fetch, AI matching & scoring
│   ├── .env                 # Your keys (do not commit)
│   └── .env.example         # Template for required/optional variables
│
├── frontend/                 # React + Vite + Tailwind
│   ├── src/
│   │   ├── components/      # ResumeUpload, JobDashboard
│   │   ├── utils/           # parseJobDescription, postedAgo
│   │   └── api.ts           # Backend API client
│   └── index.html
│
└── README.md
```

---

## License

MIT (or your preferred license).
