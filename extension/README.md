# 🛡️ AI Security Assistant — Browser Extension

A production-ready, AI-powered browser security extension that detects phishing, brand impersonation, credential harvesting, and social engineering attacks in real-time.

---

## 📁 Project Structure

```
PROJECT/
├── extension/           # Chrome Extension (React + Vite + TypeScript + MV3)
│   ├── src/
│   │   ├── background/  # Service Worker
│   │   ├── content/     # Content Script (safe metadata collector)
│   │   ├── components/  # React UI components
│   │   ├── hooks/       # useAnalysis, useSettings
│   │   ├── pages/       # PopupPage, OptionsPage
│   │   ├── popup/       # Popup entry + CSS
│   │   ├── options/     # Options entry
│   │   ├── services/    # API client, storage helpers
│   │   └── types/       # TypeScript interfaces
│   ├── public/          # manifest.json, icons/
│   └── dist/            # ← Built extension (load this in Chrome)
│
├── backend/             # Python FastAPI AI Analysis Backend
│   ├── app/
│   │   ├── api/routes/  # FastAPI routes
│   │   ├── core/        # Config, logging
│   │   ├── schemas/     # Pydantic models
│   │   ├── services/    # URL/Page/NLP/Vision/Risk/Analyst analyzers
│   │   └── db/          # SQLite repository
│   └── tests/           # pytest test suite
│
├── client/              # Existing MERN frontend (unchanged)
└── server/              # Existing Node.js backend (unchanged)
```

---

## 🚀 Quick Start

### 1. Start the FastAPI Backend

```bash
cd backend

# Copy environment file
cp .env.example .env

# Install dependencies
pip install -r requirements.txt

# Start server
uvicorn app.main:app --reload
# → http://localhost:8000
# → Docs: http://localhost:8000/docs
```

### 2. Build the Chrome Extension

```bash
cd extension

npm install
npm run build
# → Outputs to extension/dist/
```

### 3. Load Extension in Chrome

1. Open Chrome → `chrome://extensions`
2. Enable **Developer mode** (top right toggle)
3. Click **"Load unpacked"**
4. Select `extension/dist/` folder
5. The **AI Security Assistant** icon appears in your toolbar

### 4. Use the Extension

1. Visit any website
2. Click the 🛡️ icon in the toolbar
3. Click **"Scan Website"**
4. See the security analysis result

---

## ⚙️ Configuration

### Backend Environment (`backend/.env`)

| Variable | Default | Description |
|---|---|---|
| `HOST` | `0.0.0.0` | Server host |
| `PORT` | `8000` | Server port |
| `ALLOW_ALL_ORIGINS` | `true` | CORS (false in production) |
| `LLM_PROVIDER` | `none` | `gemini` \| `openai` \| `none` |
| `GEMINI_API_KEY` | _(empty)_ | Gemini API key |
| `OPENAI_API_KEY` | _(empty)_ | OpenAI API key |
| `VISION_MODEL_PATH` | _(empty)_ | Path to YOLO .pt model |
| `WEIGHT_URL` | `0.25` | URL analyzer weight |
| `WEIGHT_PAGE` | `0.20` | Page analyzer weight |
| `WEIGHT_VISION` | `0.30` | Vision analyzer weight |
| `WEIGHT_NLP` | `0.15` | NLP analyzer weight |
| `WEIGHT_BEHAVIOR` | `0.10` | Behavior analyzer weight |

### Extension API URL

Open the extension options page (Settings ⚙) to change the backend URL.  
Default: `http://localhost:8000`

---

## 🔬 API Documentation

Interactive docs available at: `http://localhost:8000/docs`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/analyze/url` | URL-only analysis (fast) |
| `POST` | `/api/analyze/page` | Full page analysis with metadata |
| `POST` | `/api/analyze/screenshot` | Vision analysis from screenshot |
| `GET` | `/api/recent` | Recent analysis records |

---

## 🤖 Model Placeholders

| Component | Status | How to Integrate |
|---|---|---|
| `URLAnalyzer` | ✅ Rule-based (real) | Implement `URLMLModelInterface` |
| `PageAnalyzer` | ✅ BeautifulSoup (real) | — |
| `SocialEngineeringAnalyzer` | ✅ Pattern-based (real) | Implement `NLPModelInterface` |
| `RiskEngine` | ✅ Weighted fusion (real) | — |
| `VisionThreatDetector` | 🔲 **PLACEHOLDER** | Implement `VisionModelInterface` with YOLOv8 |
| `SecurityAnalyst` | 🔲 **PLACEHOLDER** | Implement `LLMInterface` with Gemini/OpenAI |

### Replace Vision Model

```python
# In backend/app/api/routes/analyze.py
from ultralytics import YOLO
from app.services.vision.detector import VisionThreatDetector, VisionModelInterface

class MyYOLOModel:
    def __init__(self):
        self.model = YOLO("path/to/phishing_detector.pt")
    
    def detect(self, image_bytes: bytes) -> list:
        from PIL import Image
        import io
        img = Image.open(io.BytesIO(image_bytes))
        results = self.model(img)[0]
        # ... convert to Detection objects

_vision_detector = VisionThreatDetector(model=MyYOLOModel())
```

### Enable AI Explanations (Gemini)

```env
# In backend/.env
LLM_PROVIDER=gemini
GEMINI_API_KEY=your_api_key_here
```

```python
# In backend/app/api/routes/analyze.py  
import google.generativeai as genai
from app.services.security_analyst.analyst import SecurityAnalyst, LLMInterface

class GeminiAnalyst:
    def __init__(self):
        genai.configure(api_key=settings.gemini_api_key)
        self.model = genai.GenerativeModel("gemini-1.5-flash")
    
    def generate(self, prompt: str) -> str:
        return self.model.generate_content(prompt).text

_security_analyst = SecurityAnalyst(llm=GeminiAnalyst())
```

---

## 🧪 Testing

```bash
cd backend

# Install test dependencies
pip install pytest httpx

# Run all tests
pytest tests/ -v

# Expected: 57 passed
```

---

## 🔒 Privacy

The extension **never** collects:
- ❌ Passwords or form values
- ❌ Cookies or session tokens  
- ❌ Authentication headers
- ❌ Personal messages
- ❌ Browser history

It **only** sends to the backend:
- ✅ URL, title, meta description
- ✅ Visible text (truncated to 5000 chars)
- ✅ Structural counts (number of forms, scripts, iframes)
- ✅ External link hostnames (not full URLs)

---

## 🚀 Deployment

### Backend (Production)

```bash
# Using Gunicorn + Uvicorn workers
pip install gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Extension (Publishing)

1. Build: `npm run build:prod`
2. Zip the `dist/` folder
3. Upload to Chrome Web Store Developer Dashboard
4. Update `manifest.json` with production backend URL in `host_permissions`
5. Set `ALLOW_ALL_ORIGINS=false` in backend `.env`

---

## 📚 Future Improvements

- [ ] Train YOLO model on phishing screenshots dataset
- [ ] Fine-tune DistilBERT on social engineering text corpus
- [ ] Integrate Gemini for AI-powered explanations
- [ ] Add real-time domain reputation check (WHOIS age)
- [ ] Implement safe browsing API integration
- [ ] Add page blocking for CRITICAL risk sites
- [ ] Build scan history dashboard in popup
- [ ] Add team/enterprise deployment mode
