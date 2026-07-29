# 🛡️ CyberShield AI — Team Integration Guide

> **This document is for team members only.**  
> It explains the full project architecture, how each member's work connects, and exactly how to plug your AI models into this web application.

---

## 👥 Team Roles & Responsibilities

| Member | Task |
|---|---|
| **Web Developer** (Prashant) | Full-stack MERN app — this repository |
| **AI/ML Team — URL Model** | Train & deploy a URL threat classifier |
| **AI/ML Team — Document Model** | Train & deploy a PDF/DOCX threat analyzer |
| **Testing / QA** | End-to-end testing of the integrated system |

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                     USER BROWSER                         │
│              React Frontend (port 5173)                  │
└────────────────────────┬────────────────────────────────┘
                         │  HTTP (Axios)
                         ▼
┌─────────────────────────────────────────────────────────┐
│               Express Backend (port 5000)                │
│                                                          │
│  POST /api/analyze/url  ──────────────┐                  │
│  POST /api/analyze/document  ─────────┤                  │
│                                       ▼                  │
│                            aiService.js                  │
│                    (calls your AI endpoints)             │
└───────────────────────┬──────────────┬──────────────────┘
                        │              │
           HTTP POST    │              │   HTTP POST
                        ▼              ▼
          ┌─────────────────┐  ┌──────────────────┐
          │  URL Classifier  │  │  Document Analyzer│
          │  (your AI model) │  │  (your AI model)  │
          │  port 8001       │  │  port 8001        │
          └─────────────────┘  └──────────────────┘
                        │              │
                        └──────┬───────┘
                               ▼
                    ┌──────────────────┐
                    │  MongoDB Atlas   │
                    │  cybershield_db  │
                    └──────────────────┘
```

---

## 📁 Project Folder Structure (What matters to you)

```
PROJECT/
├── server/
│   ├── services/
│   │   └── aiService.js         ← ⭐ THE ONLY FILE YOU NEED TO EDIT
│   ├── controllers/
│   │   └── analyzeController.js ← Calls aiService, saves to DB
│   ├── models/
│   │   └── Scan.js              ← The DB schema for scan results
│   └── .env                     ← Where you put your AI server URL
│
├── client/src/
│   ├── pages/
│   │   ├── UrlAnalyzer.jsx      ← Shows URL scan results
│   │   └── DocumentAnalyzer.jsx ← Shows document scan results
│   └── components/
│       └── shared/RiskMeter.jsx ← Reads threatScore (0–100)
│
└── TEAM_GUIDE.md                ← You are here
```

---

## 🤖 How Your AI Model Connects (Step by Step)

### Step 1 — Your AI model must be a REST API server

Your model must listen for HTTP POST requests.  
It can be Flask, FastAPI, Django, Node.js — **any framework is fine.**

```
# Example using FastAPI (Python)
uvicorn main:app --port 8001
```

### Step 2 — Set your server URL in `.env`

Open `server/.env` and update these two lines:

```env
AI_URL_ANALYZER_API=http://localhost:8001/analyze/url
AI_DOC_ANALYZER_API=http://localhost:8001/analyze/document
AI_API_KEY=your_api_key_if_any
```

If your AI model is deployed on a cloud server (e.g. Render, Railway, AWS):
```env
AI_URL_ANALYZER_API=https://your-ai-server.com/analyze/url
AI_DOC_ANALYZER_API=https://your-ai-server.com/analyze/document
```

### Step 3 — Match the exact JSON contract (very important)

The web app reads specific JSON fields from your response.  
If field names are different, the results won't display correctly.

---

## 🔗 URL Analyzer — API Contract

### Request (sent FROM the web app TO your model)

```
POST http://your-ai-server/analyze/url
Content-Type: application/json
Authorization: Bearer <AI_API_KEY>

{
  "url": "https://suspicious-site.example.com"
}
```

### Response (your model must return this JSON)

```json
{
  "threatScore": 78,
  "threatLevel": "suspicious",
  "confidenceScore": 92,
  "detectedFeatures": [
    "Phishing keywords in page title",
    "Suspicious redirect chain detected",
    "Domain registered less than 30 days ago"
  ],
  "recommendation": "Avoid this URL. Multiple threat indicators detected.",
  "aiExplanation": "The neural classifier detected 3 high-risk patterns with 92% confidence. The domain exhibits characteristics common in phishing campaigns.",
  "scanDuration": 1340
}
```

### Field Reference

| Field | Type | Range / Values | Required |
|---|---|---|---|
| `threatScore` | `number` | `0` to `100` | ✅ Yes |
| `threatLevel` | `string` | `"safe"` / `"warning"` / `"suspicious"` / `"malicious"` | ✅ Yes |
| `confidenceScore` | `number` | `0` to `100` (%) | ✅ Yes |
| `detectedFeatures` | `string[]` | List of detected threat indicators | Optional |
| `recommendation` | `string` | One-sentence advice to the user | Optional |
| `aiExplanation` | `string` | Longer explanation of what the model found | Optional |
| `scanDuration` | `number` | Time taken in **milliseconds** | Optional |

### Threat Level Mapping (must match exactly)

| `threatScore` range | Expected `threatLevel` |
|---|---|
| 0 – 24 | `"safe"` → shown as 🟢 Green |
| 25 – 49 | `"warning"` → shown as 🟡 Yellow |
| 50 – 74 | `"suspicious"` → shown as 🟠 Orange |
| 75 – 100 | `"malicious"` → shown as 🔴 Red |

---

## 📄 Document Analyzer — API Contract

### Request (sent FROM the web app TO your model)

```
POST http://your-ai-server/analyze/document
Content-Type: multipart/form-data
Authorization: Bearer <AI_API_KEY>

Form fields:
  file     → the actual PDF or DOCX file (binary)
  mimetype → "application/pdf" or
             "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
```

### Response (your model must return this JSON)

```json
{
  "threatScore": 85,
  "threatLevel": "malicious",
  "confidenceScore": 94,
  "pages": 12,
  "macrosFound": true,
  "hiddenObjects": false,
  "embeddedLinks": [
    "http://malicious-payload.com/dropper",
    "https://track.phish-site.net/click"
  ],
  "detectedFeatures": [
    "VBA macro with auto-execution trigger",
    "Obfuscated JavaScript in PDF stream",
    "External link to known malicious domain"
  ],
  "recommendation": "Do NOT open this document. It contains active macro malware.",
  "aiExplanation": "Static analysis of the DOCX file revealed a VBA macro that auto-executes on open (AutoOpen event). The macro contacts external servers for payload download.",
  "scanDuration": 2200
}
```

### Field Reference

| Field | Type | Values | Required |
|---|---|---|---|
| `threatScore` | `number` | `0` – `100` | ✅ Yes |
| `threatLevel` | `string` | `"safe"` / `"warning"` / `"suspicious"` / `"malicious"` | ✅ Yes |
| `confidenceScore` | `number` | `0` – `100` | ✅ Yes |
| `pages` | `number` | Number of pages in the document | Optional |
| `macrosFound` | `boolean` | `true` if macros detected | Optional |
| `hiddenObjects` | `boolean` | `true` if hidden objects/layers found | Optional |
| `embeddedLinks` | `string[]` | List of URLs found inside the document | Optional |
| `detectedFeatures` | `string[]` | List of threat indicators found | Optional |
| `recommendation` | `string` | Short user advice | Optional |
| `aiExplanation` | `string` | Detailed model explanation | Optional |
| `scanDuration` | `number` | Milliseconds | Optional |

---

## ⚙️ The One File That Connects Everything

### [`server/services/aiService.js`](./server/services/aiService.js)

This is the **bridge** between the web app and your AI model.  
You do **not** need to touch any other backend file.

```javascript
// This is what currently calls your AI for URL analysis:
const response = await axios.post(
  process.env.AI_URL_ANALYZER_API,   // ← your endpoint from .env
  { url },
  {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.AI_API_KEY}`,  // ← your key
    },
    timeout: 30000,  // 30 second timeout
  }
);
return response.data;  // ← must match the JSON contract above
```

If your AI server needs a **different request format** (e.g. different field names),  
edit only the `analyzeUrl()` or `analyzeDocument()` functions in `aiService.js`.

---

## 🧪 Development Mode (AI not ready yet)

If the AI server is **not running**, the web app automatically uses **mock responses** so UI development can continue.

```javascript
// In aiService.js — this runs automatically when AI is unreachable:
if (process.env.NODE_ENV === 'development') {
  return generateMockUrlResult(url);   // realistic random data
}
```

To disable mock responses and force real AI calls, set:
```env
NODE_ENV=production
```

---

## 🚀 How to Run the Project Locally

### Prerequisites
- Node.js v18 or higher
- MongoDB Atlas URI (get from Prashant)
- Git

### Setup

```bash
# 1. Clone the repo
git clone https://github.com/prashantthorat100/EDI_CYBERSECURITY_WEBSITE.git
cd EDI_CYBERSECURITY_WEBSITE

# 2. Setup Backend
cd server
cp .env.example .env      # Create your .env
# Open .env and fill in:
#   MONGO_URI=<get from Prashant>
#   JWT_SECRET=any-random-string
#   AI_URL_ANALYZER_API=http://localhost:8001/analyze/url
#   AI_DOC_ANALYZER_API=http://localhost:8001/analyze/document
npm install
npm run dev               # Starts on http://localhost:5000

# 3. Setup Frontend (new terminal)
cd client
npm install
npm run dev               # Starts on http://localhost:5173

# 4. Run YOUR AI server (new terminal)
# e.g. for FastAPI:
uvicorn your_model:app --port 8001
```

---

## 📡 Testing Your AI Integration

### Test URL Analyzer (using curl)
```bash
curl -X POST http://localhost:5000/api/analyze/url \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_jwt_token>" \
  -d '{"url": "https://google.com"}'
```

### Test Document Analyzer (using curl)
```bash
curl -X POST http://localhost:5000/api/analyze/document \
  -H "Authorization: Bearer <your_jwt_token>" \
  -F "file=@/path/to/test.pdf"
```

### Get a JWT token for testing
```bash
# 1. Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@test.com","password":"Test1234!"}'

# 2. Copy the "token" from the response
```

---

## 🐍 Minimal FastAPI Starter (for AI team)

If you're using Python + FastAPI, here's a minimal starter that the web app can talk to immediately:

```python
# ai_server.py
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/analyze/url")
async def analyze_url(body: dict):
    url = body.get("url", "")
    
    # ── Replace this block with your actual model ──────────────
    score = 45  # your model's output (0–100)
    # ───────────────────────────────────────────────────────────
    
    level = (
        "safe"       if score < 25 else
        "warning"    if score < 50 else
        "suspicious" if score < 75 else
        "malicious"
    )
    return {
        "threatScore":      score,
        "threatLevel":      level,
        "confidenceScore":  88,
        "detectedFeatures": [],
        "recommendation":   "Exercise caution.",
        "aiExplanation":    f"Analyzed {url}. Score: {score}/100.",
        "scanDuration":     1200,
    }

@app.post("/analyze/document")
async def analyze_document(
    file: UploadFile = File(...),
    mimetype: str    = Form(default=""),
):
    contents = await file.read()
    
    # ── Replace this block with your actual model ──────────────
    score = 30  # your model's output (0–100)
    # ───────────────────────────────────────────────────────────
    
    level = (
        "safe"       if score < 25 else
        "warning"    if score < 50 else
        "suspicious" if score < 75 else
        "malicious"
    )
    return {
        "threatScore":      score,
        "threatLevel":      level,
        "confidenceScore":  91,
        "pages":            None,
        "macrosFound":      False,
        "hiddenObjects":    False,
        "embeddedLinks":    [],
        "detectedFeatures": [],
        "recommendation":   "Document appears clean.",
        "aiExplanation":    f"Analyzed {file.filename}. Score: {score}/100.",
        "scanDuration":     1800,
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)
```

```bash
# Install and run
pip install fastapi uvicorn python-multipart
python ai_server.py
# → Your AI server listens on http://localhost:8001
```

---

## 🔄 Git Workflow for the Team

```bash
# Always create a feature branch — never push to main directly
git checkout -b feature/url-model-integration

# Make your changes
git add .
git commit -m "feat: integrate URL classifier with aiService"

# Push and open a Pull Request
git push origin feature/url-model-integration
```

### Branch naming convention
| Work type | Branch name |
|---|---|
| AI model integration | `feature/url-model` or `feature/doc-model` |
| Bug fix | `fix/response-format` |
| Testing | `test/ai-endpoint-tests` |

---

## ❓ Common Issues & Fixes

| Problem | Fix |
|---|---|
| `AI URL service error: ECONNREFUSED` | Your AI server is not running on port 8001 |
| Charts show empty / 0 | No scans done yet — this is correct behaviour |
| `401 Unauthorized` | JWT token expired — log in again |
| `File too large` | Max file size is 20MB |
| `Only PDF and DOCX allowed` | Check file extension and MIME type |
| Frontend can't reach backend | Check `vite.config.js` proxy — backend must be on port 5000 |
| `threatLevel` not showing colour | Must be exactly: `"safe"` / `"warning"` / `"suspicious"` / `"malicious"` |

---

## 📞 Contact

| Name | Role | Responsibility |
|---|---|---|
| Prashant Thorat | Web Developer | Full MERN stack, API gateway |
| AI Team Member | URL Model | URL threat classifier endpoint |
| AI Team Member | Document Model | PDF/DOCX analyzer endpoint |

> **For questions about the web app:** Contact Prashant  
> **For questions about the AI endpoints:** Contact the respective AI team member

---

*Last updated: July 2026*
