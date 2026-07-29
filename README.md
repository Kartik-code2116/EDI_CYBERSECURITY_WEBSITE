# 🛡️ CyberShield AI — Cyber Threat Detection Platform

An AI-powered, full-stack MERN web application for detecting cyber threats in URLs, PDF documents, and DOCX files.

---

## 📁 Project Structure

```
PROJECT/
├── client/          # React + Vite + Tailwind frontend
└── server/          # Node.js + Express + MongoDB backend
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- npm or yarn

### 1. Clone & Setup Backend

```bash
cd server
cp .env.example .env    # Edit with your MongoDB URI and secrets
npm install
npm run dev             # Starts on http://localhost:5000
```

### 2. Setup Frontend

```bash
cd client
npm install
npm run dev             # Starts on http://localhost:5173
```

---

## ⚙️ Environment Variables (server/.env)

| Variable | Description |
|---|---|
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | JWT signing secret (change in production!) |
| `JWT_REFRESH_SECRET` | Refresh token secret |
| `AI_URL_ANALYZER_API` | Your AI URL analysis endpoint |
| `AI_DOC_ANALYZER_API` | Your AI document analysis endpoint |
| `AI_API_KEY` | API key for your AI service |
| `CLIENT_URL` | Frontend URL for CORS |

> **Development Mode**: When `AI_URL_ANALYZER_API` is unreachable, the system automatically falls back to realistic **mock responses** so you can develop the UI without the AI service running.

---

## 🌐 API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register new user |
| POST | `/api/auth/login` | Public | Login |
| POST | `/api/auth/refresh` | Public | Refresh JWT |
| GET | `/api/auth/me` | User | Get current user |
| POST | `/api/analyze/url` | User | Analyze URL |
| POST | `/api/analyze/document` | User | Analyze PDF/DOCX |
| GET | `/api/history` | User | Scan history |
| GET | `/api/history/stats` | User | Dashboard stats |
| GET | `/api/report/:scanId` | User | Download PDF report |
| GET | `/api/profile` | User | Get profile |
| PUT | `/api/profile` | User | Update profile |
| GET | `/api/admin/stats` | Admin | Platform stats |
| GET | `/api/admin/users` | Admin | All users |
| DELETE | `/api/admin/users/:id` | Admin | Deactivate user |

---

## 🤖 Connecting Your AI Models

In `server/services/aiService.js`, the `analyzeUrl` and `analyzeDocument` functions call your external AI APIs:

```javascript
// For URL analysis — your AI should accept:
POST {AI_URL_ANALYZER_API}
Body: { url: "https://example.com" }

// Expected response:
{
  threatScore: 75,        // 0–100
  threatLevel: "suspicious", // safe | warning | suspicious | malicious
  confidenceScore: 92,
  detectedFeatures: ["Phishing keywords", "Suspicious redirect"],
  recommendation: "Avoid this URL",
  aiExplanation: "The model detected...",
  scanDuration: 1200
}
```

```javascript
// For document analysis — your AI should accept:
POST {AI_DOC_ANALYZER_API}
Body: multipart/form-data with 'file' field

// Expected response:
{
  threatScore: 80,
  threatLevel: "malicious",
  confidenceScore: 88,
  pages: 12,
  macrosFound: true,
  hiddenObjects: false,
  embeddedLinks: ["http://malicious.com"],
  detectedFeatures: ["Macro virus"],
  recommendation: "Do not open",
  aiExplanation: "...",
  scanDuration: 2400
}
```

---

## 🎨 Design System

| Color | Hex | Usage |
|---|---|---|
| Cyber Black | `#050a14` | Background |
| Cyber Navy | `#0d1f3c` | Cards |
| Cyber Cyan | `#00d4ff` | Primary accent |
| Cyber Purple | `#7c3aed` | Secondary accent |
| Safe Green | `#00ff88` | Safe status |
| Warning Yellow | `#ffcc00` | Warning status |
| Suspicious Orange | `#ff8800` | Suspicious status |
| Malicious Red | `#ff3366` | Malicious status |

---

## 👥 User Roles

| Role | Access |
|---|---|
| `user` | Dashboard, URL Analyzer, Doc Analyzer, History, Reports, Profile |
| `admin` | Everything above + Admin Panel |

---

## 📦 Tech Stack

**Frontend:** React 18, Vite, Tailwind CSS, Framer Motion, React Router v6, Recharts, Axios

**Backend:** Node.js, Express.js, MongoDB, Mongoose, JWT, Multer, PDFKit, bcryptjs

---

## 🔒 Security Features

- JWT access tokens (15 min) + refresh tokens (7 days)
- Auto token refresh on expiry
- bcrypt password hashing (12 rounds)
- Helmet.js security headers
- Rate limiting (100 req/15min)
- Role-based route guards
- CORS protection
- File type and size validation
