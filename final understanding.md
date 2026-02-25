# DreamFund System Understanding

## 1. What This System Does
- A scholarship recommendation platform with three services:
  - React frontend (UI, user flows, admin pages)
  - Express backend (auth, OTP, scraping, matching, reports)
  - Python extraction service (transcript NER and field extraction)

## 2. High-Level Architecture
- Frontend (React) communicates with backend over REST API.
- Backend stores users, scholarships, OTPs in MongoDB.
- Extraction service parses uploaded transcripts and returns program/field data.
- Matching engine ranks scholarships using a hybrid rule + content score.

## 3. Core Backend Entry Points
- Server bootstrap, middleware, routes: [server/server.js](server/server.js)
- Auth routes (login, register, profile): [server/routes/auth.js](server/routes/auth.js)
- OTP routes (send/verify/resend/status): [server/routes/otpAuth.js](server/routes/otpAuth.js)
- Scholarships routes (CRUD, matching, scraping): [server/routes/scholarships.js](server/routes/scholarships.js)
- Upload + extract routes: [server/routes/upload.js](server/routes/upload.js) and [server/routes/extract.js](server/routes/extract.js)
- Reports + clicks: [server/routes/reports.js](server/routes/reports.js), [server/routes/clickTracking.js](server/routes/clickTracking.js)

## 4. Core Models (Database)
- User schema + profile fields: [server/models/User.js](server/models/User.js)
- Scholarship schema + requirements: [server/models/Scholarship.js](server/models/Scholarship.js)
- OTP schema + TTL logic: [server/models/OTP.js](server/models/OTP.js)

## 5. Matching Engine (Core Logic)
- Main class: [server/services/hybridMatcher.js](server/services/hybridMatcher.js)
- Key functions:
  - `calculateRuleBasedScore()`
  - `calculateMajorCompatibilityScore()`
  - `checkMajorCompatibility()`
  - `calculateHybridScore()`
  - `matchScholarships()`
- Scoring approach:
  - Rule-based score: GPA gate
  - Content score: program + major openness and match
  - Final score: 50% rule + 50% content

## 6. Content-Based Enhancements
- TF-IDF and keyword enrichment: [server/services/contentBasedMatcher.js](server/services/contentBasedMatcher.js)
- Used to enhance scholarship metadata and improve ranking context.

## 7. Scraping Pipeline
- Main scraper: [server/services/scholarshipScraper.js](server/services/scholarshipScraper.js)
  - Uses axios + cheerio for HTML parsing
  - Handles pagination, throttling, and detail extraction
- LLM-assisted extraction for eligible courses:
  - [server/services/ollamaExtractor.js](server/services/ollamaExtractor.js)

## 8. OTP and Email Delivery
- OTP orchestration: [server/utils/otpUtils.js](server/utils/otpUtils.js)
  - `generateAndSendOTP()`
  - `verifyOTP()`
  - `resendOTP()`
- Email service (Brevo API + SMTP fallback): [server/services/emailService.js](server/services/emailService.js)

## 9. Frontend Entry Points
- App routing: [client/src/App.js](client/src/App.js)
- Auth context and API calls: [client/src/contexts/AuthContext.js](client/src/contexts/AuthContext.js)
- Scholarship context: [client/src/contexts/ScholarshipContext.js](client/src/contexts/ScholarshipContext.js)
- Key pages:
  - Landing: [client/src/pages/LandingPage.js](client/src/pages/LandingPage.js)
  - Login: [client/src/pages/LoginPage.js](client/src/pages/LoginPage.js)
  - OTP Login: [client/src/pages/OTPLoginPage.js](client/src/pages/OTPLoginPage.js)
  - Upload transcript: [client/src/pages/UploadPage.js](client/src/pages/UploadPage.js)
  - Results: [client/src/pages/ResultsPage.js](client/src/pages/ResultsPage.js)
  - Admin: [client/src/pages/admin/AdminDashboard.js](client/src/pages/admin/AdminDashboard.js)

## 10. Extraction Service (Python)
- Flask service + NER + PDF parsing: [extraction-service/ner_service.py](extraction-service/ner_service.py)
- Course translation: [extraction-service/course_translator.py](extraction-service/course_translator.py)
- Data prep and training helpers: [extraction-service/dataPrepation.py](extraction-service/dataPrepation.py), [extraction-service/modelTraining.py](extraction-service/modelTraining.py)

## 11. Key End-to-End Flows
### A. OTP Login
1. UI submits email: [client/src/components/OTPLogin.js](client/src/components/OTPLogin.js)
2. Backend sends OTP: [server/routes/otpAuth.js](server/routes/otpAuth.js) -> [server/utils/otpUtils.js](server/utils/otpUtils.js) -> [server/services/emailService.js](server/services/emailService.js)
3. UI verifies OTP: [client/src/components/OTPLogin.js](client/src/components/OTPLogin.js) -> [server/routes/otpAuth.js](server/routes/otpAuth.js)

### B. Transcript Upload and Profile Enrichment
1. Upload file: [client/src/pages/UploadPage.js](client/src/pages/UploadPage.js)
2. Backend upload handler: [server/routes/upload.js](server/routes/upload.js)
3. Extract data via Python: [server/routes/extract.js](server/routes/extract.js) -> [extraction-service/ner_service.py](extraction-service/ner_service.py)
4. Profile update: [client/src/contexts/AuthContext.js](client/src/contexts/AuthContext.js)

### C. Scholarship Matching
1. Fetch scholarships: [client/src/contexts/ScholarshipContext.js](client/src/contexts/ScholarshipContext.js)
2. Backend match endpoint: [server/routes/scholarships.js](server/routes/scholarships.js)
3. Scoring: [server/services/hybridMatcher.js](server/services/hybridMatcher.js)
4. Display results: [client/src/pages/ResultsPage.js](client/src/pages/ResultsPage.js)

### D. Scraping and Ingestion
1. Scrape listings: [server/services/scholarshipScraper.js](server/services/scholarshipScraper.js)
2. Extract detail fields + eligible courses: [server/services/ollamaExtractor.js](server/services/ollamaExtractor.js)
3. Store in MongoDB: [server/models/Scholarship.js](server/models/Scholarship.js)

## 12. Admin Features
- Admin login and dashboard: [client/src/pages/admin/AdminLogin.js](client/src/pages/admin/AdminLogin.js), [client/src/pages/admin/AdminDashboard.js](client/src/pages/admin/AdminDashboard.js)
- Manage scholarships: [client/src/pages/admin/ScholarshipManagement.js](client/src/pages/admin/ScholarshipManagement.js)
- Reports and analytics: [client/src/pages/admin/ReportsPage.js](client/src/pages/admin/ReportsPage.js), [server/routes/reports.js](server/routes/reports.js)

## 13. Important Configuration
- Backend env: [server/.env](server/.env)
  - `MONGODB_URI`, `JWT_SECRET`, `BREVO_API_KEY`
  - SMTP settings for OTP emails
- Frontend proxy: [client/package.json](client/package.json)

## 14. Where to Change What (Quick Map)
- Change scoring logic: [server/services/hybridMatcher.js](server/services/hybridMatcher.js)
- Change scraping fields: [server/services/scholarshipScraper.js](server/services/scholarshipScraper.js)
- Change OTP email behavior: [server/services/emailService.js](server/services/emailService.js)
- Change extraction logic: [extraction-service/ner_service.py](extraction-service/ner_service.py)
- Change results UI: [client/src/pages/ResultsPage.js](client/src/pages/ResultsPage.js)

## 15. Reference Docs
- Architecture overview: [codebase.md](codebase.md)
- System flow: [plans/scholarship_recommendation_flow.md](plans/scholarship_recommendation_flow.md)
- Quick start: [README.md](README.md)
