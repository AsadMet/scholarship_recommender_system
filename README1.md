# — Developer README (README1.md)

## Overview

cholarship discovery platform that scrapes scholarships, extracts student data from transcripts, and recommends scholarships using a Hybrid Matching engine (Rule-based + Content-based + Behavioral + Diversity).

This document focuses on: high-level architecture, how the **Hybrid Matching** works, the **Extraction (NER)** pipeline, how to run services locally, and developer notes for contributing and troubleshooting.

---

## Table of Contents

- Overview
- Quick Start
- Services & Architecture
- Hybrid Matching (detailed)
- Extraction Pipeline (detailed)
- API Endpoints
- Running Locally
- Environment Variables
- Troubleshooting
- Notes & Suggested Improvements
- Contributing

---

## Quick Start

1. Install backend deps:
   - cd server
   - npm install
2. Start backend (dev):
   - npm run dev
3. Start extraction service (Python):
   - cd extraction-service
   - python ner_service.py
   - or use start-services.sh to start both services
4. Start frontend:
   - cd client
   - npm install
   - npm start

Ports used by default:
- Backend: http://localhost:5000
- Frontend: http://localhost:3000
- Extraction service (Python): http://localhost:5001

---

## Services & Architecture

- server/: Express API and matching logic
  - services/hybridMatcher.js — orchestrates rule-based, content-based, behavioral, diversity scoring
  - services/contentBasedMatcher.js — TF-IDF, keyword extraction, category assignment
  - services/scholarshipScraper.js — scrapes scholarship pages, extracts deadlines, emails, amounts
  - routes/extract.js — proxies extraction requests to Python service
  - models/Scholarship.js, models/User.js — Mongoose models

- extraction-service/: Flask service that extracts Name, CGPA, Program, and full extracted text from uploaded documents
  - ner_service.py — extraction logic and API

---

## Hybrid Matching (Detailed) 🔧

Summary:
- Hybrid combines 4 components with default weights: Rule-based (40%), Content (30%), Behavioral (20%), Diversity (10%).

1) Rule-Based Scoring (calculateRuleBasedScore)
- Inputs: scholarship.requirements (minGPA, majors), scholarship.eligibleCourses, scholarship.deadline, student profile (cgpa, program).
- Base score: 50; GPA bonus up to +30; program match +20; deadline present +10. Capped to 100.

2) Content-Based Scoring (contentBasedMatcher.calculateSimilarity)
- Uses `natural` TF-IDF implementation.
- Student profile text is built from user.name, user.profile.program, user.profile.major, and user.profile.extractedText.
- Each scholarship is turned into a document (title, description, category, eligibleCourses, keywords, provider name).
- TF-IDF vectors are computed and cosine similarity measured; returned as a 0–100 integer.

3) Behavioral Scoring (calculateBehavioralScore)
- Uses simple click counts stored in `clickData[scholarshipId]`.
- Score = min(20, clicks * 5).

4) Diversity Bonus (calculateDiversityBonus)
- If the scholarship's category isn't present in current matched top-N, give +10 bonus.

5) Final hybrid score (calculateHybridScore)
- Weighted sum: ruleScore*0.40 + contentScore*0.30 + behavioralScore*0.20 + diversityBonus*0.10
- Returns object: totalScore (0–100), breakdown (component weights), components (raw scores), matchReasons (human-readable reasons)

6) Matching pipeline (matchScholarships)
- Filters out expired scholarships and non-eligible by GPA/program (unless includeNonEligible=true).
- Calls calculateHybridScore for each eligible scholarship and returns sorted matches.

Where to customize:
- Weights in `hybridMatcher.calculateHybridScore`
- Stop words / category map in `contentBasedMatcher.js`
- Add precomputed embeddings or caching for TF-IDF performance improvements

---

## Extraction Pipeline (Detailed) 🐍

Service: `extraction-service/ner_service.py` (Flask)

1) Supported inputs: PDF files (extracted with PyMuPDF / fitz) or plain text files. Works best with transcripts.
2) Text extraction: `extract_text_from_pdf(file_path)` or fallback text read.
3) Extraction functions:
   - extract_name(text): tries line-based heuristics and regex; returns (name, confidence)
   - extract_cgpa(text): looks for 'Final CGPA' and decimal numbers in a reasonable range; returns (cgpa, confidence)
   - extract_program(text): looks for 'DIPLOMA'/'DEGREE' lines or keyword matches; returns (program, confidence)
4) API: POST /api/extract with JSON body { filePath, fileName, fileId? }
   - Returns: { name, cgpa, program, confidence: {name, cgpa, program}, fileName, textLength, extractedText }
5) Error handling: returns 400 on missing file / unreadable content; returns 503 via server proxy if Python service is down.
6) Proxying: `server/routes/extract.js` POST '/' forwards request to `http://localhost:5001/api/extract` and returns the response.

Security note: `extract.js` calls the Python service without authentication; if running in production, secure the endpoint and validate file paths.

---

## API Endpoints (Key)

- GET /api/scholarships — list scholarships (filters: status, category, minCGPA, search, page, limit)
- GET /api/scholarships/:id — get scholarship
- GET /api/scholarships/matches/:userId — (auth) get hybrid matches for a user
- POST /api/scholarships/public-matches — (public) get matches using provided {cgpa, program, name}
- POST /api/extract — proxies to Python extraction service; body: { filePath, fileName }
- POST /api/scholarships/enhance-all — auto-generate description, keywords, category

Example extraction request (server side):
POST http://localhost:5000/api/extract
Body: { "filePath": "C:\\path\\to\\uploads\\transcript.pdf", "fileName": "transcript.pdf" }

---

## Running Locally

Prereqs:
- Node 18+ (or Node 16+), npm
- Python 3.10+ and dependencies from extraction-service/requirements.txt
- MongoDB running locally or provide MONGODB_URI

Start services (Dev):
1) Backend:
   cd server
   npm install
   npm run dev

2) Python extraction service (separate terminal):
   cd extraction-service
   pip install -r requirements.txt
   python ner_service.py

3) Frontend:
   cd client
   npm install
   npm start

Or run `./start-services.sh` which attempts to start the Python extraction service and the backend.

---

## Environment Variables

- MONGODB_URI (optional) — default uses mongodb://127.0.0.1:27017/dreamfundDB
- PORT (optional) — backend port (default 5000)
- For Python extraction service, default port is 5001 (no env var used by ner_service.py)

---

## Troubleshooting

- "Python extraction service is not running": Start the Python service and ensure it's reachable at http://localhost:5001
- If content scores are zero: run `POST /api/scholarships/enhance-all` to add descriptions/keywords
- MongoDB connection errors: check `MONGODB_URI` and that MongoDB is running

---

## Notes & Suggested Improvements ✨

- Add unit tests for `hybridMatcher.calculateHybridScore` and the extraction heuristics
- Cache TF-IDF vectors or precompute embeddings to improve performance for large datasets
- Secure the extraction endpoint in production (validate file access, add auth)
- Consider adding end-to-end samples and a small seed dataset for local testing

---

## Contributing

- Fork, create a branch, add tests, open a PR describing the change
- Run `npm run dev` and ensure unit tests (if added) pass

---

## License

MIT

---

If you'd like, I can now:
- add example curl requests and sample responses to the Examples section (yes/no)
- add a small example dataset and unit tests (yes/no)

Please tell me which you'd like next.