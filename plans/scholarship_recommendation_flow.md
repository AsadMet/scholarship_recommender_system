# Scholarship Recommendation System: End-to-End Flow Documentation

This document traces the complete scholarship recommendation workflow, from student login to results display, including all relevant code snippets, data flow, and logic explanations.

## Stage 1: Student Logs In

### Frontend Code: Login Form Handling

**File: `client/src/pages/LoginPage.js`**

```javascript
const LoginPage = () => {
  // ... form state management
  const { login } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    const result = await login(form.email, form.password)
    if (result.success) {
      const role = result.user?.role
      // Navigate based on role (admin or user)
      navigate("/")
    }
  }
}
```

**Explanation**: The login form collects email and password, calls the `login` function from `AuthContext`, and navigates to the landing page upon success.

### Frontend Code: Auth Context Login

**File: `client/src/contexts/AuthContext.js`**

```javascript
const login = async (email, password) => {
  try {
    let response = await axios.post("/api/auth/login", { email, password })
    // Fallback to Express server if Next.js fails
    const { token, user } = response.data
    localStorage.setItem("token", newToken)
    setToken(newToken)
    setUser(userData)
    return { success: true, user: userData }
  } catch (error) {
    return { success: false, message: error.response?.data?.message || error.message }
  }
}
```

**Explanation**: The `login` function sends credentials to `/api/auth/login` (tries Next.js first, falls back to Express), stores the JWT token, and updates user state.

### Backend Code: Login API

**File: `server/routes/auth.js`**

```javascript
router.post('/login', async (req, res) => {
  const { email, password } = req.body
  const user = await User.findOne({ email })
  if (!user) return res.status(400).json({ message: 'Invalid credentials' })

  const isMatch = await bcrypt.compare(password, user.password)
  if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' })

  const token = jwt.sign({ userId: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'fallback-secret-key', { expiresIn: '7d' })
  res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } })
})
```

**Explanation**: Validates credentials against database, generates JWT token, returns user data (excluding password).

**Data Flow**: User credentials → Frontend AuthContext → Backend /login API → JWT token + user data → LocalStorage → User state updated → Navigation to landing page.

---

## Stage 2: Student Selects Major on Profile Page

### Frontend Code: Profile Page Major Selection

**File: `client/src/pages/ProfilePage.js`**

```javascript
const ProfilePage = () => {
  const [formData, setFormData] = useState({ major: "" })

  const majors = [
    "Computer Science", "Information Technology", "Software Engineering",
    // ... list of majors including Diploma options
  ]

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleUploadTranscript = (e) => {
    e.preventDefault()
    if (!formData.major) {
      setMessage("Please select your major before proceeding.")
      return
    }
    navigate("/upload", { state: { major: formData.major } })
  }

  return (
    <select name="major" value={formData.major} onChange={handleInputChange}>
      {majors.map((major) => (
        <option key={major} value={major}>{major}</option>
      ))}
    </select>
  )
}
```

**Explanation**: Displays a dropdown of major options. Validates major selection before allowing navigation to upload page. Passes selected major via React Router state.

**Data Flow**: Major selection → Form state → Validation → React Router state → Upload page.

---

## Stage 3: Student Clicks "Upload Transcript"

### Frontend Code: Navigation to Upload

**File: `client/src/pages/ProfilePage.js`**

```javascript
cdconst handleUploadTranscript = (e) => {
  e.preventDefault()
  if (!formData.major) {
    setMessage("Please select your major before proceeding.")
    return
  }
  navigate("/upload", { state: { major: formData.major } })
}
```

**Explanation**: Validates major selection and navigates to upload page with major in state.

### Frontend Code: Upload Page Receives Major

**File: `client/src/pages/UploadPage.js`**

```javascript
const UploadPage = () => {
  const location = useLocation()
  const selectedMajor = location.state?.major || ""
  // ... upload logic uses selectedMajor
}
```

**Explanation**: Retrieves major from React Router location state.

**Data Flow**: Profile major → React Router state → Upload page major variable.

---

## Stage 4: Transcript is Uploaded and Extracted (CGPA)

### Frontend Code: File Upload to Backend

**File: `client/src/pages/UploadPage.js`**

```javascript
const uploadFiles = async () => {
  const uploadPromises = files.map(async (file) => {
    const formData = new FormData()
    formData.append("document", file)
    const response = await axios.post("http://localhost:5000/api/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    return { file, uploadResponse: response.data }
  })

  const uploadResults = await Promise.all(uploadPromises)

  const extractionPromises = uploadResults.map(async (result) => {
    const extractResponse = await axios.post("http://localhost:5000/api/extract", {
      fileId: result.uploadResponse.fileId,
      fileName: result.file.name,
      filePath: result.uploadResponse.filePath,
    })
    return {
      fileName: result.file.name,
      cgpa: extractResult.cgpa?.toString() || "Not found",
      name: extractResult.name || "Not found",
      program: extractResult.program || "Not found",
      confidence: extractResult.confidence || { name: 0, cgpa: 0, program: 0 },
    }
  })
}
```

**Explanation**: Uploads files to `/api/upload` endpoint, then sends file info to `/api/extract` for processing.

### Backend Code: File Upload Handling

**File: `server/routes/upload.js`**

```javascript
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(__dirname, '../uploads')
      cb(null, uploadDir)
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
      const filename = 'document-' + uniqueSuffix + path.extname(file.originalname)
      cb(null, filename)
    }
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
})

router.post('/', upload.single('document'), (req, res) => {
  res.json({
    fileId: req.file.filename,
    filePath: req.file.path,
    message: 'File uploaded successfully'
  })
})
```

**Explanation**: Uses Multer to save uploaded files to `server/uploads/` directory with unique filenames.

### Backend Code: Extraction API

**File: `server/routes/extract.js`**

```javascript
router.post('/', async (req, res) => {
  const { filePath } = req.body
  if (!filePath) return res.status(400).json({ error: 'Missing file path' })

  try {
    const response = await axios.post('http://localhost:5001/api/extract', {
      filePath: filePath,
      fileName: fileName,
      fileId: fileId
    })
    res.json(response.data)
  } catch (extractionError) {
    return res.status(503).json({ error: "Extraction service unavailable" })
  }
})
```

**Explanation**: Forwards extraction request to Python service on port 5001.

### AI/Extraction Code: PDF Text Extraction and NER

**File: `extraction-service/ner_service.py`**

```python
def extract_text_from_pdf(file_path):
  if HAS_PYMUPDF:
    with fitz.open(file_path) as doc:
      text = ""
      for page in doc:
        text += page.get_text()
  else:
    reader = PdfReader(file_path)
    text = ""
    for page in reader.pages:
      text += page.extract_text()
  return text

def extract_with_custom_ner(text):
  doc = nlp(text)
  for ent in doc.ents:
    if ent.label_ == "CGPA" and cgpa is None:
      try:
        cgpa_text = ent.text.strip()
        cgpa_value = float(cgpa_text)
        if 0.0 <= cgpa_value <= 4.0:
          cgpa = f"{cgpa_value:.2f}"
          cgpa_confidence = calculate_enhanced_confidence(cgpa, "CGPA", "ner", model_conf)
      except ValueError:
        pass
  return {
    'cgpa': cgpa,
    'confidence': { 'cgpa': cgpa_confidence },
    'method': 'custom_ner_only'
  }
```

**Explanation**: Extracts text using PyMuPDF or pypdf, then uses spaCy NER model to identify CGPA entity. Validates CGPA range (0.0-4.0).

**Clarification**: Major is NOT extracted from transcript - it comes from the profile page selection.

**Data Flow**: File upload → Saved to disk → File path sent to extraction service → Text extracted from PDF → NER identifies CGPA → CGPA returned to frontend.

---

## Stage 5: Scholarships are Filtered (Rule-Based)

### Backend Code: Rule-Based Filtering in Hybrid Matching

**File: `server/services/hybridMatcher.js`**

```javascript
calculateRuleBasedScore(scholarship, studentData) {
  const { cgpa } = studentData;
  const req = scholarship.requirements || {};
  const minGpa = typeof req.minGPA === 'number' ? req.minGPA : null;

  // Binary GPA eligibility gate
  if (minGpa === null || isNaN(minGpa)) {
    return 100; // No GPA requirement = 100%
  }
  if (cgpa >= minGpa) {
    return 100;
  }
  return 0;
}

matchScholarships(scholarships, studentData, options = {}) {
  for (let i = 0; i < scholarships.length; i++) {
    const scholarship = scholarships[i];
    const req = scholarship.requirements || {};
    const minGpa = typeof req.minGPA === 'number' ? req.minGpa : null;
    const cgpaOk = minGpa === null || isNaN(minGpa) ? true : studentData.cgpa >= minGpa;

    // Rule-based filtering: only GPA and deadline determine eligibility
    if (!cgpaOk) {
      if (includeNonEligible) {
        nonEligible.push({ scholarship, eligible: false, reasons: [...] });
      }
      continue;
    }
    // ... proceed to scoring
  }
}
```

**Explanation**: Rule-based filtering uses only GPA and deadline. If student CGPA < scholarship minGPA, scholarship is ineligible. Deadline filtering happens separately.

**Data Flow**: Student CGPA + scholarship requirements → Rule score calculation → Eligibility determination → Eligible scholarships proceed to scoring.

---

## Stage 6: Scholarships are Scored and Ranked (Content-Based)

### Backend Code: Content-Based Scoring Logic

**File: `server/services/hybridMatcher.js`**

```javascript
calculateMajorCompatibilityScore(scholarship, studentData) {
  const req = scholarship.requirements || {};
  const eligibleCourses = Array.isArray(scholarship.eligibleCourses) ? scholarship.eligibleCourses : [];
  const eligibleMajors = Array.isArray(req.majors) ? req.majors : [];
  
  const isOpenToAllByKeywords = this.isOpenToAllScholarship(scholarship);
  const hasNoProgramRestrictions = eligibleCourses.length === 0;
  const hasNoMajorRestrictions = eligibleMajors.length === 0;
  
  const isOpenToAllPrograms = hasNoProgramRestrictions || isOpenToAllByKeywords;
  const isOpenToAllMajors = hasNoMajorRestrictions || isOpenToAllByKeywords;

  let score = 0;
  if (isOpenToAllPrograms && isOpenToAllMajors) {
    score = 100;
  } else if (isOpenToAllPrograms && !isOpenToAllMajors) {
    score = 50;
  } else if (!isOpenToAllPrograms && isOpenToAllMajors) {
    score = 50;
  } else {
    const studentMajor = studentData.major || studentData.program || '';
    const majorMatch = this.checkMajorCompatibility(studentMajor, eligibleCourses, eligibleMajors);
    if (majorMatch) {
      score = 100;
    } else {
      score = 0;
    }
  }
  return score;
}

calculateHybridScore(scholarship, studentData, allScholarships, options = {}) {
  const ruleScore = this.calculateRuleBasedScore(scholarship, studentData);
  const contentScore = this.calculateContentScore(studentProfile, scholarship, allScholarships, studentData);
  
  const hybridScore = Math.round((ruleScore * 0.5) + (contentScore * 0.5));
  
  return {
    totalScore: Math.min(100, Math.max(0, hybridScore)),
    breakdown: {
      ruleBasedScore: Math.round(ruleScore * 0.5),
      contentScore: Math.round(contentScore * 0.5)
    }
  };
}
```

**Explanation**: Content-based scoring evaluates program/major compatibility. Score is 100% if student major matches scholarship requirements, or if scholarship is "open to all". Final hybrid score = 50% rule-based + 50% content-based.

### Backend Code: Major Compatibility Check

**File: `server/services/hybridMatcher.js`**

```javascript
checkMajorCompatibility(studentMajor, eligibleCourses, eligibleMajors) {
  const normalize = (s) => (typeof s === 'string' ? s.trim().toLowerCase() : '');
  const studentMajorNorm = normalize(studentMajor);
  
  // Check eligibleCourses (programs)
  if (eligibleCourses.length > 0) {
    const courseMatch = eligibleCourses.some(course => {
      const courseNorm = normalize(course);
      return courseNorm === studentMajorNorm ||
             courseNorm.includes(studentMajorNorm) ||
             studentMajorNorm.includes(courseNorm);
    });
    if (courseMatch) return true;
  }

  // Check eligibleMajors
  if (eligibleMajors.length > 0) {
    const majorMatch = eligibleMajors.some(major => {
      const majorNorm = normalize(major);
      return majorNorm === studentMajorNorm ||
             majorNorm.includes(studentMajorNorm) ||
             studentMajorNorm.includes(majorNorm);
    });
    if (majorMatch) return true;
  }
  return false;
}
```

**Explanation**: Compares student major against scholarship's eligibleCourses and eligibleMajors arrays using partial string matching.

**Data Flow**: Student major + scholarship eligibility data → Compatibility check → Content score → Hybrid score → Ranking.

---

## Stage 7: "Why You Match" Explanations are Generated

### Backend Code: Match Reasons Generation

**File: `server/services/hybridMatcher.js`**

```javascript
generateMatchReasons(scholarship, studentData, ruleScore, contentScore) {
  const reasons = [];

  // GPA requirement check
  const req = scholarship.requirements || {};
  const minGpa = typeof req.minGPA === 'number' ? req.minGPA : null;
  if (minGpa === null || isNaN(minGpa)) {
    reasons.push({ type: 'rule', text: 'No minimum GPA requirement', icon: '✅' });
  } else if (studentData.cgpa >= minGpa) {
    reasons.push({ type: 'rule', text: `Meets GPA requirement (${studentData.cgpa} ≥ ${minGpa})`, icon: '📊' });
  } else {
    reasons.push({ type: 'rule', text: `Does not meet GPA requirement (${studentData.cgpa} < ${minGpa})`, icon: '📉' });
  }
  
  // Content-based reasons: Program and major compatibility
  const eligibleCourses = Array.isArray(scholarship.eligibleCourses) ? scholarship.eligibleCourses : [];
  const hasNoProgramRestrictions = eligibleCourses.length === 0;
  const isOpenToAllByKeywords = this.isOpenToAllScholarship(scholarship);
  
  if (isOpenToAllPrograms && isOpenToAllMajors) {
    reasons.push({
      type: 'content',
      text: 'This scholarship is open to all programs',
      icon: '🌐'
    });
    reasons.push({
      type: 'content',
      text: 'This scholarship is open to all majors',
      icon: '📚'
    });
  } else {
    // Detailed program/major matching reasons
    // ... (checks program match, major match, generates appropriate messages)
  }
  
  return reasons;
}
```

**Explanation**: Generates human-readable explanations for why a student matches or doesn't match a scholarship, categorized by rule-based (GPA) and content-based (program/major) factors.

**Data Flow**: Student data + scholarship data + scores → Reason generation logic → Array of explanation objects with text, icons, and types.

---

## Stage 8: Results are Returned to the Frontend

### Backend Code: Matches API Endpoint

**File: `server/routes/scholarships.js`**

```javascript
router.get("/matches/:userId", auth, async (req, res) => {
  const user = await User.findById(req.params.userId);
  const studentCgpa = Number(user?.profile?.gpa || 0);
  const studentMajor = user?.profile?.major || user?.profile?.program || "";
  
  const scholarships = await Scholarship.find({ status: "active" });
  
  const studentData = {
    cgpa: studentCgpa,
    major: studentMajor,
    program: studentMajor,
    name: user?.name || "",
    fullProfile: contentBasedMatcher.buildStudentProfile(user)
  };

  const matches = await hybridMatcher.matchScholarships(scholarships, studentData);
  
  res.json(matches);
});
```

**Explanation**: Retrieves user profile data, fetches active scholarships, runs hybrid matching, returns sorted matches with reasons.

### Frontend Code: Results Display

**File: `client/src/pages/ResultsPage.js`**

```javascript
const ResultsPage = () => {
  useEffect(() => {
    const fetchMatches = async () => {
      const matchData = await getScholarshipMatches(userId);
      setMatches(matchData.eligible || matchData);
      setNonEligible(matchData.nonEligible || []);
    };
    fetchMatches();
  }, [user, userId, getScholarshipMatches]);

  return (
    <div>
      {matches.map((match) => (
        <div key={match.scholarship._id}>
          <h3>{match.scholarship.title}</h3>
          <h4>Why you match:</h4>
          <ul>
            {match.matchReasons.map((reason, idx) => (
              <li key={idx}>
                <span>{reason.icon}</span>
                {reason.text}
                {reason.type === 'content' && <span>AI Match</span>}
              </li>
            ))}
          </ul>
          {match.scoreBreakdown && (
            <div>
              Rule-based: {match.scoreBreakdown.ruleBasedScore}% | 
              Content: {match.scoreBreakdown.contentScore}% | 
              Total: {match.totalScore}%
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
```

**Explanation**: Fetches matches from backend, displays eligible scholarships with match reasons and score breakdowns.

**Data Flow**: User ID → /matches/:userId API → Hybrid matching logic → Sorted matches with reasons → Frontend display.

---

## Missing Logic or Issues Identified

1. **Major Extraction**: The requirements state that major is NOT extracted from transcript, but the code shows `program` is extracted and used. However, the selected major from profile overrides this for matching.

2. **Hybrid Matching Weighting**: The code uses 50% rule-based + 50% content-based, but content-based is actually major compatibility only (not full TF-IDF as commented).

3. **Anonymous Flow**: For users without accounts, extracted data is read from localStorage and public matches API is called.

4. **Behavioral Scoring**: Removed in current implementation (returns 0).

5. **Diversity Bonus**: Removed in current implementation (returns 0).

6. **Course Translation**: Python service translates Malay program names to English using a course translator.

7. **Model Confidence**: Custom NER provides model-based confidence scores for extracted entities.

The end-to-end flow is complete and functional, with clear separation of concerns between rule-based and content-based matching.