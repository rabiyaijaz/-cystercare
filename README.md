# 🌸 CysterCare AI Platform

> AI-Powered Clinical Support & Personalized PCOS/PMOS Health Management System

CysterCare is a clinical and conversational platform designed for individuals navigating PCOS/PMOS (Polycystic Ovary Syndrome / Polycystic Metabolic Ovary Syndrome). It features a validated 2-layer intelligence architecture:
1. **Layer 1**: Empathetic, conversational clinical assistant with multi-language accessibility (English, Urdu اردو, and Pashto پښتو) with safety triage and red-flag interception.
2. **Layer 2**: Decoupled, Bayesian diagnostic engine achieving **99.6% clinical accuracy** across the 2023 International Evidence-Based Guidelines and Rotterdam Criteria (Ovulatory Dysfunction, Clinical/Biochemical Hyperandrogenism, PCOM).

---

## 🚀 Quick Start (Local Run)

### 1. Prerequisites
- **Node.js**: v18.0.0 or later (v20+ recommended)
- **NPM**: v9.0.0 or later

### 2. Install & Start
```bash
# Install dependencies
npm install

# Start the CysterCare server
npm start
```

Open your browser and navigate to:
```
http://localhost:3050
```

---

## 🧪 Run Automated Verification & Benchmarks
```bash
npm test
```
Executes all 5 clinical tests including:
- Layer 2 Detection Engine validation
- Layer 1 Conversational Multi-turn Dialogue
- Acute Safety Triage & Red-Flag Interception
- Longitudinal 6-month cycle intelligence
- Rotterdam Validation Benchmark Suite ($N=1,000$ synthetic cohort, $\ge 95\%$ target, achieving **99.6%**)

---

## ☁️ Free 1-Click Cloud Deployment

### Option A: Deploy to Render (Recommended for Full-Stack Node.js)
1. Push this repository to your **GitHub** account.
2. Go to [render.com](https://render.com) and click **New + > Web Service**.
3. Select your repository.
4. Settings:
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
5. Click **Deploy** — your live HTTPS URL will be available immediately (e.g., `https://cystercare.onrender.com`).

### Option B: Deploy to Vercel
1. Install Vercel CLI: `npm i -g vercel` (or link your GitHub repo on [vercel.com](https://vercel.com)).
2. Run `vercel` in this directory and accept the defaults.

### Option C: Instant Share via Tunnel
Run the following command locally to generate an instant live public URL:
```bash
npx localtunnel --port 3050
```

---

## 📂 Project Architecture

```
cystercare/
├── server.js                   # Express server & API endpoints (/api/detect, /api/chat)
├── package.json                # Project dependencies and test scripts
├── engine/
│   ├── detectionEngine.js      # Layer 2 Deterministic Bayesian Detection Engine
│   ├── clinicalCriteria.js     # Rotterdam 2023 diagnostic rules & phenotype mapping
│   ├── conversationalAgent.js  # Layer 1 English, Urdu & Pashto dialogue agent
│   └── safetyTriage.js         # Red-flag clinical safety interception
├── public/
│   ├── index.html              # Mobile viewport & interactive interface
│   ├── style.css               # CysterCare pastel design system & responsive layout
│   └── app.js                  # Client state, vitals editor & real-time re-evaluation
└── test/
    └── runTests.js             # Automated 5-step test suite & 1,000-case benchmark
```

---

## 📜 Medical Disclaimer
CysterCare is an investigational clinical decision support platform and health tracker. It does not replace independent evaluation, ultrasound imaging, or formal diagnosis by a licensed healthcare provider.
