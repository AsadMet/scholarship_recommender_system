# Hybrid Scholarship Matching System

## Overview

This system combines **Rule-Based Filtering** with **Content-Based Filtering** to provide more accurate and personalized scholarship recommendations.

## Architecture

### 1. Rule-Based Filtering (50% weight)
- **CGPA Matching**: studentCGPA ≥ scholarship.minGPA
- **Program Matching**: Student program matches eligible courses
- **Deadline Validation**: Only active, non-expired scholarships

### 2. Content-Based Filtering (50% weight)
- **Program Compatibility**: +50% if scholarship is open to all programs or matches student's program
- **Major Compatibility**: +50% if scholarship is open to all majors or matches student's major
- **Condition-Based Scoring**: 100% if both conditions met, 50% if one met, 0% if none



## Components

### Backend Services

#### 1. `contentBasedMatcher.js`
```javascript
// Extract keywords from text
const keywords = contentBasedMatcher.extractKeywords(text, 10);

// Build student profile from user data
const profile = contentBasedMatcher.buildStudentProfile(user);

// Calculate similarity between student and scholarship
const similarity = contentBasedMatcher.calculateSimilarity(
  studentProfile,
  scholarship,
  allScholarships
);

// Auto-enhance scholarship with description, keywords, category
await contentBasedMatcher.enhanceScholarship(scholarship);
```

#### 2. `hybridMatcher.js`
```javascript
// Calculate comprehensive hybrid score
const result = await hybridMatcher.calculateHybridScore(
  scholarship,
  studentData,
  allScholarships,
  { clickData, currentMatches, index }
);

// Result structure:
{
  totalScore: 85,
  breakdown: {
    ruleBasedScore: 50,  // 50% weight
    contentScore: 50,    // 50% weight
  },
  matchReasons: [
    { type: 'rule', text: 'Meets GPA requirement', icon: '📊' },
    { type: 'content', text: 'Similar interests: engineering, programming', icon: '🔍' },
    { type: 'category', text: 'STEM category', icon: '📚' }
  ]
}

// Match scholarships for a student
const matches = await hybridMatcher.matchScholarships(
  scholarships,
  studentData,
  { clickData }
);
```

### Database Schema Updates

#### Scholarship Model
```javascript
{
  // Existing fields...
  description: String,      // Detailed description for content matching
  keywords: [String],       // Extracted keywords
  category: String,         // STEM, Business, Arts, etc.
}
```

### API Endpoints

#### 1. Get Hybrid Matches (Authenticated)
```
GET /api/scholarships/matches/:userId
```
Returns scholarships with hybrid matching scores and detailed reasons.

#### 2. Get Public Hybrid Matches
```
POST /api/scholarships/public-matches
Body: { cgpa, program, name }
```
For anonymous users, uses hybrid matching without authentication.

#### 3. Auto-Enhance Scholarships
```
POST /api/scholarships/enhance-all
```
Automatically enhances all existing scholarships with:
- Generated descriptions
- Extracted keywords
- Auto-categorization

## How to Use

### Step 1: Install Dependencies
```bash
cd server
npm install natural --save
```

### Step 2: Enhance Existing Scholarships
```bash
# Call the enhancement endpoint to auto-generate descriptions, keywords, and categories
curl -X POST http://localhost:5000/api/scholarships/enhance-all
```

### Step 3: Test Hybrid Matching
```bash
# For authenticated users
curl http://localhost:5000/api/scholarships/matches/USER_ID

# For anonymous users
curl -X POST http://localhost:5000/api/scholarships/public-matches \
  -H "Content-Type: application/json" \
  -d '{"cgpa": 3.5, "program": "Computer Science", "name": "John Doe"}'
```

## Match Score Calculation

### Example Calculation

**Student Profile:**
- CGPA: 3.5
- Program: Computer Science
- Achievements: Coding competition winner, Dean's list

**Scholarship:**
- Min GPA: 3.0
- Eligible Courses: ["Computer Science", "Software Engineering"]
- Description: "For outstanding students in technology and programming"
- Category: STEM

**Score Breakdown:**

1. **Rule-Based (50%)**:
   - GPA requirement met: +50
   - Weighted: 50 × 0.50 = **25 points**

2. **Content-Based (50%)**:
   - Program compatibility: met (matches "Computer Science")
   - Major compatibility: met (open to all majors)
   - Total: 100
   - Weighted: 100 × 0.50 = **50 points**

**Final Score: 25 + 50 = 75%**

## Features

### Content-Based Matching Advantages

1. **Program and Major Compatibility**
   - Checks if scholarship is open to all or specifically matches student's program/major
   - Condition-based scoring ensures fair evaluation

2. **Clear Eligibility Criteria**
   - Transparent scoring based on explicit compatibility checks
   - No reliance on complex text similarity calculations

### Match Reasons Display

The UI now shows:
- **Rule-based reasons**: GPA requirements met
- **Content-based reasons**: Program and major compatibility explanations
- **Match score breakdown**: Visual breakdown of rule and content scores

## Customization

### Adjust Weights
Edit `server/services/hybridMatcher.js`:
```javascript
const weights = {
  ruleBased: 0.50,   // Increase for stricter requirements
  content: 0.50,     // Increase for more semantic matching
};
```

### Add Custom Categories
Edit `server/services/contentBasedMatcher.js`:
```javascript
const categories = {
  'Your Category': ['keyword1', 'keyword2', 'keyword3'],
  // ...
};
```

### Modify Stop Words
Edit the stop words list to improve keyword extraction:
```javascript
this.stopWords = new Set([
  // Add more domain-specific stop words
]);
```

## Performance Considerations

1. **TF-IDF Calculation**: O(n) where n = number of scholarships
2. **Caching**: Results are calculated in real-time (no caching yet)
3. **Optimization**: For large datasets (>10,000 scholarships), consider:
   - Pre-computing TF-IDF vectors
   - Using vector databases (Pinecone, Weaviate)
   - Implementing pagination

## Future Enhancements

### 1. Machine Learning Integration
- Use user feedback to train a neural network
- Implement collaborative filtering (user-user similarity)
- Add deep learning embeddings (BERT, GPT)

### 2. Advanced Features
- **Temporal Patterns**: Learn when users typically apply
- **Success Prediction**: Predict application success probability
- **Multi-objective Optimization**: Balance amount, match score, deadline

### 3. Behavioral Learning
- Track which scholarships users apply to
- Learn from rejected vs accepted applications
- Adjust weights dynamically per user

## Troubleshooting

### Issue: Low Content Scores
- **Cause**: Scholarships missing descriptions/keywords
- **Fix**: Run `/api/scholarships/enhance-all` to auto-generate

### Issue: All Rule-Based Scores
- **Cause**: Content similarity calculation failing
- **Fix**: Check `natural` package installation and server logs

### Issue: Scores Not Changing
- **Cause**: Weights might be too conservative
- **Fix**: Adjust weights in `hybridMatcher.js`

## Testing

### Unit Test Example
```javascript
const hybridMatcher = require('./services/hybridMatcher');

const scholarship = {
  _id: 'test-id',
  title: 'Tech Scholarship',
  description: 'For computer science students',
  requirements: { minGPA: 3.0 },
  eligibleCourses: ['Computer Science']
};

const studentData = {
  cgpa: 3.5,
  program: 'Computer Science',
  fullProfile: 'Computer Science student with coding experience'
};

const result = await hybridMatcher.calculateHybridScore(
  scholarship,
  studentData,
  [scholarship]
);

console.log(result.totalScore); // Should be > 50
console.log(result.matchReasons); // Should contain reasons
```

## Monitoring

### Key Metrics to Track
1. **Average Match Scores**: Should be between 50-80
2. **Content Score Distribution**: Should not be all 0
3. **User Engagement**: Click-through rates on recommendations
4. **Application Success**: % of recommended scholarships applied to

### Logging
Check server logs for:
```
🔍 Starting HYBRID scholarship matching
📊 Hybrid matching results: X matches found
✅ Enhanced: Scholarship Name
```

## Credits

Built with:
- **natural**: NLP library for TF-IDF and tokenization
- **MongoDB**: Database for scholarships and user data
- **Express.js**: API server

## License

MIT License - see LICENSE file for details