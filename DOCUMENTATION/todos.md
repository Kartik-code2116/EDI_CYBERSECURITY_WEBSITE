# AI-Powered Cyber Threat Detection & Security Analysis Platform --- TODO

> **Current status:** Basic website exists, but the UI/UX needs
> improvement, authentication is not reliable, password recovery is
> missing, and the security-analysis pipeline needs to be made
> evidence-based before the project is treated as a trustworthy scanner.
> A browser extension for URL checking has also been created.

------------------------------------------------------------------------

## 0. Current Project Status

### Already available

-   [x] Basic web application created
-   [x] Basic website/pages created
-   [x] Browser extension created for checking URLs
-   [x] PDF analyzer prototype exists
-   [x] Static PDF features such as hash, metadata, page count,
    encryption, URLs, annotations and entropy are part of the
    planned/implemented analysis
-   [x] Initial rule-based risk scoring exists
-   [x] Initial project architecture documented
-   [x] Project scope includes PDF + URL analysis
-   [x] ML-based classification is planned
-   [x] Threat-intelligence integration is planned
-   [x] AI explanation layer is planned

### Current problems to fix first

-   [ ] UI is not polished / professional enough
-   [x] Login is not working reliably — fixed: sanitized errors, user enumeration prevention
-   [x] Signup is not working reliably — fixed: name/password validation, confirmPassword, clear error messages
-   [x] Forgot Password / Password Reset is missing — implemented: secure token model, reset endpoint, ResetPassword page
-   [x] Authentication error handling needs improvement — fixed: sanitized 500 errors, generic login failure message
-   [ ] Website scanner needs a trustworthy multi-stage detection
    pipeline
-   [ ] File scanner must clearly distinguish **suspicious indicators**
    from **proof of malware**
-   [ ] URL extension and web application should use the same
    URL-analysis logic
-   [x] Scan results need evidence, confidence, explanations and
    limitations — added standard scan-result schema (server/schemas/scanResult.js)
-   [ ] ML model must be trained and evaluated on properly labeled data
    before being presented as the main detector

------------------------------------------------------------------------

# PHASE 1 --- Project Cleanup & Architecture

## 1.1 Repository Cleanup

-   [x] Review current frontend structure
-   [x] Review current backend structure
-   [ ] Remove duplicate / unused files
-   [ ] Standardize naming conventions
-   [x] Create `.env.example` — exists in server/ and backend/
-   [x] Ensure secrets/API keys are never committed — comprehensive .gitignore added
-   [x] Add/update `.gitignore` — root .gitignore now covers all subprojects
-   [x] Add proper `README.md` — exists with full setup instructions
-   [x] Add development setup instructions
-   [ ] Add production deployment instructions

## 1.2 Separate the Major Modules

-   [x] Authentication module — server/controllers/authController.js + routes/authRoutes.js
-   [x] File scanning module — server/controllers/analyzeController.js (document handler)
-   [x] URL scanning module — server/controllers/analyzeController.js (URL handler)
-   [ ] Threat-intelligence module
-   [ ] ML prediction module
-   [ ] Risk assessment module
-   [x] IOC extraction module — included in standard scan schema (iocs field)
-   [x] AI explanation module — ai_explanation field in scan result schema
-   [x] Report generation module — server/controllers/reportController.js
-   [x] Scan history module — server/controllers/historyController.js
-   [x] Browser extension module — extension/ (Chrome MV3) + backend/ (FastAPI)

## 1.3 Common Analysis API

-   [x] Create a single backend API for URL analysis — server/routes/analyzeRoutes.js + extensionRoutes.js
-   [ ] Make the browser extension call the same URL-analysis service — extension currently uses FastAPI backend directly; unification pending
-   [ ] Prevent duplicate URL-analysis logic between extension and
    website — pending unification
-   [x] Define a standard scan-result JSON format — server/schemas/scanResult.js implements the spec from this document

Example:

``` json
{
  "target": "https://example.com",
  "type": "url",
  "status": "completed",
  "classification": "suspicious",
  "risk_score": 72,
  "confidence": 0.91,
  "evidence": [],
  "threat_intelligence": {},
  "iocs": [],
  "recommendations": []
}
```

------------------------------------------------------------------------

# PHASE 2 --- UI/UX Redesign

## 2.1 Overall Website Design

-   [ ] Redesign homepage
-   [ ] Create a professional cybersecurity visual style
-   [ ] Improve typography
-   [ ] Improve spacing
-   [ ] Improve colors and contrast
-   [ ] Improve buttons
-   [ ] Improve cards
-   [ ] Improve forms
-   [ ] Improve loading states
-   [ ] Improve error states
-   [ ] Add responsive design
-   [ ] Test desktop/tablet/mobile layouts

## 2.2 Homepage

-   [ ] Clear project title
-   [ ] Short explanation of what the platform does
-   [ ] URL scan input
-   [ ] File upload area
-   [ ] Scan button
-   [ ] Explain how scanning works
-   [ ] Explain that results are risk assessments, not absolute proof of
    safety
-   [ ] Add extension information
-   [ ] Add supported file types
-   [ ] Add security disclaimer

## 2.3 Dashboard

-   [ ] Create clean dashboard
-   [ ] Total scans
-   [ ] Recent scans
-   [ ] Suspicious scans
-   [ ] Potentially malicious scans
-   [ ] Potentially safe scans
-   [ ] Threat distribution chart
-   [ ] Scan history
-   [ ] Quick URL scan
-   [ ] Quick file scan

> Do not use fake/random statistics for a new user. Show empty states
> such as "No scans yet."

## 2.4 Scan Result UI

-   [ ] Show classification
-   [ ] Show risk score
-   [ ] Show confidence separately
-   [ ] Show detected evidence
-   [ ] Show why each indicator matters
-   [ ] Show threat-intelligence results
-   [ ] Show IOCs
-   [ ] Show ML explanation / feature importance
-   [ ] Show AI-generated explanation
-   [ ] Show recommended actions
-   [ ] Show limitations
-   [ ] Add "Download Report"

## 2.5 Accessibility

-   [ ] Keyboard navigation
-   [ ] Proper labels for inputs
-   [ ] Good color contrast
-   [ ] Do not rely only on red/green colors
-   [ ] Accessible error messages
-   [ ] Mobile-friendly upload controls

------------------------------------------------------------------------

# PHASE 3 --- Authentication

## 3.1 Signup

-   [ ] Fix signup form
-   [ ] Validate name
-   [ ] Validate email
-   [ ] Validate password
-   [ ] Add confirm-password validation
-   [ ] Prevent duplicate email accounts
-   [ ] Hash passwords securely
-   [ ] Store users securely
-   [ ] Return useful validation errors
-   [ ] Show success state after signup
-   [ ] Redirect correctly after successful signup

## 3.2 Login

-   [ ] Fix login flow
-   [ ] Validate email/password
-   [ ] Handle incorrect credentials
-   [ ] Handle unverified account if email verification is implemented
-   [ ] Secure session/token handling
-   [ ] Add logout
-   [ ] Protect dashboard routes
-   [ ] Protect scan-history routes
-   [ ] Test refresh/re-login behavior

## 3.3 Forgot Password

-   [ ] Add "Forgot Password?" link
-   [ ] Create email/password-reset workflow
-   [ ] Generate secure, time-limited reset token
-   [ ] Store only a safe representation of the reset token if
    appropriate
-   [ ] Send password-reset email
-   [ ] Create reset-password page
-   [ ] Validate token expiration
-   [ ] Invalidate token after successful reset
-   [ ] Add password-strength validation
-   [ ] Prevent user enumeration through error messages
-   [ ] Test expired/invalid/already-used reset links

## 3.4 Authentication Security

-   [ ] Password hashing
-   [ ] Secure cookies/tokens
-   [ ] CSRF protection where applicable
-   [ ] Rate-limit login attempts
-   [ ] Rate-limit password-reset requests
-   [ ] Validate all server-side inputs
-   [ ] Never log passwords or reset tokens
-   [ ] Add security headers
-   [ ] Add audit logging for important authentication events

------------------------------------------------------------------------

# PHASE 4 --- Secure File Upload Pipeline

## 4.1 Upload Validation

-   [ ] Allow only supported file types
-   [ ] Validate MIME type
-   [ ] Validate file signature/magic bytes
-   [ ] Do not trust the file extension
-   [ ] Limit maximum file size
-   [ ] Generate safe server-side filenames
-   [ ] Prevent path traversal
-   [ ] Prevent executable upload where not supported
-   [ ] Store uploads outside publicly accessible directories

## 4.2 Safe Storage

-   [ ] Treat every uploaded file as untrusted
-   [ ] Never execute uploaded files
-   [ ] Use isolated storage
-   [ ] Restrict file permissions
-   [ ] Add automatic cleanup/retention policy
-   [ ] Prevent uploaded files from being directly served as executable
    content

## 4.3 File Types

### MVP

-   [ ] PDF

### Later

-   [ ] DOCX
-   [ ] XLSX
-   [ ] PPTX
-   [ ] ZIP/RAR
-   [ ] EXE/PE
-   [ ] APK
-   [ ] Email files
-   [ ] Images/QR codes

------------------------------------------------------------------------

# PHASE 5 --- PDF Security Analyzer

## 5.1 Core Feature Extraction

-   [ ] SHA-256
-   [ ] File size
-   [ ] Page count
-   [ ] Metadata
-   [ ] Encryption status
-   [ ] Object count
-   [ ] Entropy
-   [ ] JavaScript indicators
-   [ ] `/JS`
-   [ ] `/JavaScript`
-   [ ] `/OpenAction`
-   [ ] `/AA`
-   [ ] `/Launch`
-   [ ] Embedded files
-   [ ] `/EmbeddedFile`
-   [ ] `/EmbeddedFiles`
-   [ ] RichMedia
-   [ ] Forms
-   [ ] Annotations
-   [ ] URLs
-   [ ] Suspicious strings

## 5.2 Evidence Quality

-   [ ] Store exactly which indicators were detected
-   [ ] Store where possible the PDF object/reference associated with
    the indicator
-   [ ] Distinguish:
    -   [ ] Detected feature
    -   [ ] Suspicious indicator
    -   [ ] External reputation evidence
    -   [ ] ML prediction
    -   [ ] Final risk assessment
-   [ ] Never label a PDF malicious from one weak indicator alone

## 5.3 Analyzer Testing

-   [ ] Create benign PDF test set
-   [ ] Create controlled security-test samples
-   [ ] Test encrypted PDFs
-   [ ] Test large PDFs
-   [ ] Test PDFs with legitimate JavaScript
-   [ ] Test PDFs with legitimate embedded files
-   [ ] Test malformed PDFs
-   [ ] Test PDFs containing URLs
-   [ ] Test false-positive cases
-   [ ] Test false-negative cases

------------------------------------------------------------------------

# PHASE 6 --- URL Analyzer

## 6.1 URL Parsing

-   [ ] Validate URL format
-   [ ] Normalize URLs safely
-   [ ] Extract scheme
-   [ ] Extract hostname
-   [ ] Extract port
-   [ ] Extract path
-   [ ] Extract query parameters
-   [ ] Extract fragment

## 6.2 URL Features

-   [ ] URL length
-   [ ] Number of dots
-   [ ] Number of subdomains
-   [ ] Special characters
-   [ ] IP-address hostname detection
-   [ ] Punycode / IDN detection
-   [ ] Suspicious keywords
-   [ ] Number of redirects
-   [ ] HTTPS usage
-   [ ] Domain age where available
-   [ ] Domain reputation
-   [ ] URL reputation
-   [ ] Certificate information where appropriate

## 6.3 Important Security Rule

-   [ ] Do not visit arbitrary submitted URLs directly from the user's
    browser/backend without a controlled design
-   [ ] Prevent SSRF when the backend performs URL fetching
-   [ ] Block private/internal IP ranges for server-side requests where
    appropriate
-   [ ] Set network timeouts
-   [ ] Limit redirects
-   [ ] Validate redirect destinations
-   [ ] Isolate URL-fetching infrastructure if active inspection is
    introduced

------------------------------------------------------------------------

# PHASE 7 --- Browser Extension

## 7.1 Extension UI

-   [ ] Improve extension popup UI
-   [ ] Show current URL
-   [ ] Add "Scan URL" button
-   [ ] Show scan status
-   [ ] Show risk classification
-   [ ] Show risk score
-   [ ] Show evidence
-   [ ] Show recommendations
-   [ ] Link to full web-app report

## 7.2 Extension Integration

-   [ ] Connect extension to common URL-analysis API
-   [ ] Authenticate extension securely if login is required
-   [ ] Handle API failures
-   [ ] Handle rate limits
-   [ ] Add timeout handling
-   [ ] Cache results carefully where useful
-   [ ] Do not expose API secrets in extension code

## 7.3 Extension Security

-   [ ] Minimize permissions
-   [ ] Review Content Security Policy
-   [ ] Validate messages between extension components
-   [ ] Avoid unnecessary access to page content
-   [ ] Avoid storing sensitive user data locally

------------------------------------------------------------------------

# PHASE 8 --- "Is It Really Suspicious?" Detection Pipeline

> **Core principle:** The platform must not claim that a file or website
> is absolutely safe or malicious. It should combine multiple
> independent evidence sources and return an explainable risk
> assessment.

## 8.1 Multi-Layer Analysis

``` text
Input
  |
  v
Validation
  |
  v
Static Analysis
  |
  v
Feature Extraction
  |
  +------> Threat Intelligence
  |
  +------> Reputation Checks
  |
  +------> ML Model
  |
  +------> IOC Extraction
  |
  v
Evidence Aggregation
  |
  v
Risk Assessment
  |
  v
Explainable Result
```

## 8.2 Evidence Categories

-   [ ] Static structural indicators
-   [ ] URL characteristics
-   [ ] Domain/IP reputation
-   [ ] File/hash reputation
-   [ ] ML prediction
-   [ ] Model confidence/calibration
-   [ ] Known IOCs
-   [ ] Behavioral evidence when sandboxing is later available
-   [ ] User/context-independent evidence only

## 8.3 Risk Decision Design

Do not use:

``` text
One indicator = Malware
```

Use a layered result such as:

``` text
Classification:
Potentially Safe / Suspicious / Potentially Malicious

Risk Score:
0–100

Confidence:
Model confidence / calibrated confidence

Evidence:
- Indicator A
- Indicator B
- Reputation result
- ML contribution

Limitations:
What the system did NOT verify
```

## 8.4 Confidence vs Risk

-   [ ] Keep risk score and model confidence separate
-   [ ] Do not call a 94% ML probability "94% malware certainty"
-   [ ] Calibrate probabilities if the model is used as a probability
    estimate
-   [ ] Display uncertainty
-   [ ] Explain false-positive/false-negative limitations

------------------------------------------------------------------------

# PHASE 9 --- Threat Intelligence

## 9.1 Hash Reputation

-   [ ] Calculate SHA-256
-   [ ] Query supported threat-intelligence source
-   [ ] Store provider/source
-   [ ] Store lookup timestamp
-   [ ] Store reputation result
-   [ ] Handle "unknown" separately from "clean"

## 9.2 URL/Domain Reputation

-   [ ] Query supported reputation services
-   [ ] Check URL/domain reputation
-   [ ] Store source and timestamp
-   [ ] Handle conflicting provider results
-   [ ] Handle no-result cases

## 9.3 Privacy

-   [ ] Clearly inform users when hashes/URLs are sent to external
    services
-   [ ] Avoid uploading full private documents to third-party services
    unless explicitly required and disclosed
-   [ ] Document third-party data handling

------------------------------------------------------------------------

# PHASE 10 --- Machine Learning

## 10.1 Dataset

-   [ ] Collect benign samples
-   [ ] Collect malicious samples legally
-   [ ] Store labels and provenance
-   [ ] Extract features consistently
-   [ ] Remove duplicates
-   [ ] Check class imbalance
-   [ ] Prevent train/test leakage
-   [ ] Version the dataset

## 10.2 Baseline

-   [ ] Logistic Regression baseline
-   [ ] Random Forest baseline
-   [ ] XGBoost/gradient boosting experiment
-   [ ] Compare models using the same test protocol

## 10.3 Evaluation

-   [ ] Accuracy
-   [ ] Precision
-   [ ] Recall
-   [ ] F1
-   [ ] Confusion matrix
-   [ ] ROC-AUC where appropriate
-   [ ] PR-AUC where appropriate
-   [ ] False-positive rate
-   [ ] False-negative rate
-   [ ] Calibration if probabilities are shown

## 10.4 Robustness

-   [ ] Test on unseen samples
-   [ ] Test on samples from different sources
-   [ ] Test edge cases
-   [ ] Measure false positives on legitimate documents
-   [ ] Measure false negatives on malicious samples
-   [ ] Document model limitations
-   [ ] Version the model

## 10.5 Explainability

-   [ ] Feature importance
-   [ ] SHAP for supported models
-   [ ] Show top contributing features
-   [ ] Explain features in user-friendly language
-   [ ] Ensure explanation matches actual model output

------------------------------------------------------------------------

# PHASE 11 --- Risk Scoring Engine

## 11.1 Prototype Heuristic

-   [ ] Keep current rule-based score only as a prototype/baseline
-   [ ] Document each rule
-   [ ] Test score behavior
-   [ ] Prevent duplicate indicators from unfairly dominating the score
-   [ ] Add unit tests

## 11.2 Final Evidence Aggregation

-   [ ] Define how static evidence contributes
-   [ ] Define how reputation contributes
-   [ ] Define how ML contributes
-   [ ] Define how conflicting evidence is handled
-   [ ] Define thresholds using validation data rather than arbitrary
    numbers
-   [ ] Version scoring logic

## 11.3 Result Categories

Use carefully worded categories such as: - \[ \] Potentially Safe - \[
\] Suspicious - \[ \] Potentially Malicious - \[ \] Unable to Analyze

------------------------------------------------------------------------

# PHASE 12 --- IOC Extraction

## Extract

-   [ ] SHA-256
-   [ ] URLs
-   [ ] Domains
-   [ ] IP addresses
-   [ ] Email addresses
-   [ ] File names
-   [ ] Suspicious strings
-   [ ] Hashes found inside documents

## IOC UI

-   [ ] IOC type
-   [ ] IOC value
-   [ ] Source
-   [ ] Confidence/evidence
-   [ ] Copy button
-   [ ] Export IOCs

------------------------------------------------------------------------

# PHASE 13 --- MITRE ATT&CK Mapping

-   [ ] Map only behavior supported by evidence
-   [ ] Avoid mapping weak indicators automatically
-   [ ] Store technique ID
-   [ ] Store technique name
-   [ ] Store evidence supporting the mapping
-   [ ] Link technique explanation in UI
-   [ ] Clearly mark inferred mappings

------------------------------------------------------------------------

# PHASE 14 --- AI Security Analyst

## 14.1 AI Input

Send structured evidence, not the assumption that the file is malicious.

Example:

``` json
{
  "classification": "suspicious",
  "risk_score": 72,
  "evidence": [
    "OpenAction detected",
    "JavaScript detected",
    "8 external URLs"
  ],
  "threat_intelligence": [],
  "model_features": []
}
```

## 14.2 AI Responsibilities

-   [ ] Explain detected evidence
-   [ ] Explain security terms
-   [ ] Explain why indicators matter
-   [ ] Explain recommended actions
-   [ ] Answer questions about the scan
-   [ ] Clearly state uncertainty
-   [ ] Never invent indicators
-   [ ] Never override the analyzer
-   [ ] Never independently declare an unknown sample safe/malicious

## 14.3 AI Chat

Support questions such as: - \[ \] Why is this file suspicious? - \[ \]
What does OpenAction mean? - \[ \] What does the detected JavaScript
mean? - \[ \] What is this IOC? - \[ \] Why did the ML model flag
this? - \[ \] What should I do next?

------------------------------------------------------------------------

# PHASE 15 --- Scan History & Database

## 15.1 Users

-   [ ] User ID
-   [ ] Name
-   [ ] Email
-   [ ] Password hash
-   [ ] Created date
-   [ ] Updated date

## 15.2 Scans

-   [ ] Scan ID
-   [ ] User ID
-   [ ] Target type
-   [ ] Filename/URL identifier
-   [ ] SHA-256 where applicable
-   [ ] Scan date
-   [ ] Risk score
-   [ ] Classification
-   [ ] Confidence
-   [ ] Status

## 15.3 Indicators

-   [ ] Indicator ID
-   [ ] Scan ID
-   [ ] Type
-   [ ] Value
-   [ ] Source
-   [ ] Evidence

## 15.4 Reports

-   [ ] Report ID
-   [ ] Scan ID
-   [ ] Generated date
-   [ ] Report location/reference

------------------------------------------------------------------------

# PHASE 16 --- Security Reports

-   [ ] Create report template
-   [ ] File/URL information
-   [ ] Scan timestamp
-   [ ] Classification
-   [ ] Risk score
-   [ ] Confidence
-   [ ] Detected features
-   [ ] Threat-intelligence results
-   [ ] IOCs
-   [ ] ML explanation
-   [ ] AI explanation
-   [ ] Recommended actions
-   [ ] Limitations
-   [ ] Generate PDF
-   [ ] Download report
-   [ ] Ensure sensitive data is handled safely

------------------------------------------------------------------------

# PHASE 17 --- Backend/API

## API Endpoints

-   [ ] `POST /auth/signup`
-   [ ] `POST /auth/login`
-   [ ] `POST /auth/logout`
-   [ ] `POST /auth/forgot-password`
-   [ ] `POST /auth/reset-password`
-   [ ] `POST /scan/file`
-   [ ] `POST /scan/url`
-   [ ] `GET /scan/:id`
-   [ ] `GET /scans`
-   [ ] `GET /reports/:id`
-   [ ] `GET /health`

## API Security

-   [ ] Input validation
-   [ ] Authentication
-   [ ] Authorization
-   [ ] Rate limiting
-   [ ] Request size limits
-   [ ] Error handling
-   [ ] Logging without secrets
-   [ ] CORS configuration
-   [ ] Security headers
-   [ ] API documentation

------------------------------------------------------------------------

# PHASE 18 --- Testing

## Frontend

-   [ ] Signup test
-   [ ] Login test
-   [ ] Logout test
-   [ ] Forgot-password test
-   [ ] Password-reset test
-   [ ] File-upload test
-   [ ] URL-scan test
-   [ ] Dashboard test
-   [ ] Scan-result test
-   [ ] Report-download test
-   [ ] Mobile UI test

## Backend

-   [ ] Authentication tests
-   [ ] Authorization tests
-   [ ] File validation tests
-   [ ] PDF analyzer unit tests
-   [ ] URL analyzer unit tests
-   [ ] ML inference tests
-   [ ] Threat-intelligence integration tests
-   [ ] API tests

## Security Testing

-   [ ] Path traversal
-   [ ] Malicious filename
-   [ ] Oversized upload
-   [ ] Invalid MIME type
-   [ ] Malformed PDF
-   [ ] SSRF protections
-   [ ] XSS
-   [ ] CSRF where applicable
-   [ ] Injection attacks
-   [ ] Rate-limit testing
-   [ ] Authentication bypass testing
-   [ ] Session/token security testing

------------------------------------------------------------------------

# PHASE 19 --- Deployment

-   [ ] Dockerize backend
-   [ ] Dockerize frontend
-   [ ] Use environment variables
-   [ ] Configure production database
-   [ ] Configure HTTPS
-   [ ] Configure reverse proxy
-   [ ] Configure logging
-   [ ] Configure monitoring
-   [ ] Configure file cleanup
-   [ ] Configure backups
-   [ ] Restrict server permissions
-   [ ] Separate analysis infrastructure from application infrastructure
    where possible

------------------------------------------------------------------------

# PHASE 20 --- Advanced Security Analysis

### Future

-   [ ] Sandbox-based dynamic analysis
-   [ ] Isolated VM
-   [ ] Network monitoring
-   [ ] Process monitoring
-   [ ] File-system monitoring
-   [ ] YARA rules
-   [ ] PE analysis
-   [ ] DOCX/XLSX/PPTX analysis
-   [ ] APK analysis
-   [ ] Email attachment analysis
-   [ ] QR phishing analysis
-   [ ] Network traffic analysis
-   [ ] Malware family classification
-   [ ] Similarity search
-   [ ] SIEM integration
-   [ ] Real-time alerts

> Dynamic analysis must run in an isolated environment and must not
> expose the host machine or sensitive resources to untrusted samples.

------------------------------------------------------------------------

# PHASE 21 --- Documentation

-   [ ] Update README
-   [ ] System architecture diagram
-   [ ] Database ER diagram
-   [ ] API documentation
-   [ ] Authentication flow
-   [ ] PDF analysis flow
-   [ ] URL analysis flow
-   [ ] ML pipeline
-   [ ] Threat-intelligence flow
-   [ ] AI explanation flow
-   [ ] Browser-extension architecture
-   [ ] Security model
-   [ ] Limitations
-   [ ] Dataset documentation
-   [ ] Model evaluation report
-   [ ] Installation guide
-   [ ] Deployment guide
-   [ ] User guide

------------------------------------------------------------------------

# Recommended Development Order

Do **not** try to build every feature simultaneously.

## Milestone 1 --- Make the existing website usable

1.  [ ] Fix UI/UX
2.  [ ] Fix Signup
3.  [ ] Fix Login
4.  [ ] Add Logout
5.  [ ] Add Forgot Password
6.  [ ] Protect dashboard/routes
7.  [ ] Test authentication completely

## Milestone 2 --- Make the scanner reliable

8.  [ ] Secure file-upload pipeline
9.  [ ] Stabilize PDF analyzer
10. [ ] Stabilize URL analyzer
11. [ ] Create common scan-result schema
12. [ ] Build scan-result page

## Milestone 3 --- Make the detection meaningful

13. [ ] Add evidence-based risk assessment
14. [ ] Add threat-intelligence checks
15. [ ] Add IOC extraction
16. [ ] Build labeled dataset
17. [ ] Train baseline ML models
18. [ ] Evaluate false positives/false negatives
19. [ ] Add explainability

## Milestone 4 --- Connect everything

20. [ ] Integrate website + backend + ML
21. [ ] Integrate browser extension
22. [ ] Add scan history
23. [ ] Add reports
24. [ ] Add AI Security Analyst

## Milestone 5 --- Production hardening

25. [ ] Security testing
26. [ ] Docker
27. [ ] HTTPS
28. [ ] Logging/monitoring
29. [ ] Documentation
30. [ ] Deployment

------------------------------------------------------------------------

# Definition of Done

The project should be considered an MVP when:

-   [ ] User can create an account
-   [ ] User can log in/out
-   [ ] User can recover a forgotten password
-   [ ] User can submit a URL
-   [ ] User can upload a supported file
-   [ ] Uploaded files are treated as untrusted and are never executed
-   [ ] PDF static analysis produces structured evidence
-   [ ] URL analysis produces structured evidence
-   [ ] Risk assessment combines multiple evidence sources
-   [ ] Threat intelligence can enrich the result
-   [ ] ML model has been evaluated on held-out data
-   [ ] Result explains why the item was flagged
-   [ ] Result distinguishes risk from certainty
-   [ ] User can view scan history
-   [ ] User can download a report
-   [ ] Browser extension uses the same URL-analysis backend
-   [ ] Security tests cover authentication and untrusted input handling
-   [ ] Documentation explains limitations

------------------------------------------------------------------------

# Critical Product Rule

The platform should **not** promise:

> "This file is 100% safe."

or:

> "This file is definitely malware."

Instead, the platform should communicate:

> **"Based on the evidence available to our static analysis,
> threat-intelligence checks, and machine-learning model, this item is
> assessed as potentially safe, suspicious, or potentially malicious."**

The result should always show **the evidence behind the assessment** and
**what the system did not verify**.
