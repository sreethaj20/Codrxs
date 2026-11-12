# Codrxs Coding Academy - Production Website (Frontend + Backend)

A complete, production-ready full-stack web platform for **End-to-End Medical Coding Learning & Development, Live Chart Training, and Corporate Placement**.

---

## 🚀 Key Features Built-In

1. **Learning & Development (End-to-End Medical Coding)**:
   - Full curriculum covering **ICD-10-CM**, **CPT-4**, and **HCPCS Level II**.
   - Modular breakdowns for Inpatient, Outpatient, Modifiers, and Compliance.
2. **Placement Pipeline**:
   - Tie-ups with leading hospitals, RCM companies, and healthcare BPOs.
3. **Candidate Interest Registration Engine**:
   - Interactive assessment form capturing qualification, experience level, preferred batch, and career targets.
4. **2-Week Fast-Track Duration**:
   - Structured 14-day outcome-driven roadmap.
5. **100% Web Training Model**:
   - Zero software setup required for students.
6. **Resume Rebuilding**:
   - ATS keyword optimization and recruiter polish.
7. **Interview Cracking Drills**:
   - 1-on-1 technical mock tests and oral question banks.
8. **Live Chart Simulation**:
   - Real-world de-identified hospital chart auditing and code verification preview.
9. **Backend REST API & Admin Portal**:
   - Backend candidate persistence (`/api/register`, `/api/candidates`, `/api/candidates/export`).
   - Admin CRM dashboard (`/admin.html`) to review and export student applications.

---

## 📁 Project Architecture

```
web/
├── index.html         # Main user-facing website & candidate interest form
├── admin.html         # Admin CRM to view, filter, and export candidate leads
├── style.css          # Modern, responsive medical styling
├── script.js          # Client-side validation & REST API integration
├── server.js          # Production Node.js backend server (zero dependencies)
├── package.json       # Project configuration
├── data/
│   └── candidates.json# Persistent storage for registered candidate leads
└── README.md          # Deployment & publishing documentation
```

---

## 💻 How to Run Locally

### 1. Start the Server
Open your terminal inside this directory and run:

```bash
npm start
```
*(or run `node server.js` directly)*

### 2. View in Browser
- **Public Student Website**: Open `http://localhost:3000`
- **Admissions Admin Dashboard**: Open `http://localhost:3000/admin.html`
- **Health Check API**: Open `http://localhost:3000/api/health`

---

## 🌐 How to Publish / Deploy This Website

Because this project is built using native Node.js APIs without bulky external dependencies, it can be published to any modern hosting platform in under 2 minutes:

### Option 1: Render (Recommended - Free & Instant)
1. Push this folder to a GitHub repository.
2. Go to [render.com](https://render.com) and create a **New Web Service**.
3. Select your repository.
4. Settings:
   - **Environment**: `Node`
   - **Build Command**: *(leave blank or `npm start`)*
   - **Start Command**: `node server.js`
5. Click **Create Web Service**. Your website will be live with a free HTTPS domain!

### Option 2: Railway
1. Push to GitHub.
2. Go to [railway.app](https://railway.app), click **New Project** -> **Deploy from GitHub repo**.
3. Railway automatically detects `server.js` and deploys your website.

### Option 3: Static-Only Host (Vercel / Netlify / GitHub Pages)
If you prefer static hosting:
- You can deploy `index.html` and `style.css` directly to Netlify or GitHub Pages.
- Submissions will gracefully fall back to storing in candidate browser storage if the backend is detached.
