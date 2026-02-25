# Hybrid Scholarship Matching Calculation Explanation

## Overview
This document explains how the hybrid scholarship matching system calculates match scores for a student-scholarship pair, using the Gadang Scholarship Programme as an example.

## Example Data
- **Student**: GPA 3.86, Program: Computer Science, Major: Computer Science
- **Scholarship**: Gadang Scholarship Programme, Min GPA: 3.5, Open to all programs and majors, Deadline: December 31, 2026

## Calculation Flow

### Step 1: Eligibility Filtering
Before scoring, the system checks basic eligibility:
1. **Deadline Check**: Scholarship deadline (Dec 31, 2026) is in the future → Eligible
2. **GPA Check**: Student GPA (3.86) ≥ Scholarship min GPA (3.5) → Eligible
3. **If both pass**: Proceed to scoring

### Step 2: Rule-Based Scoring
Rule-based scoring evaluates strict requirements.

**Code Location**: `server/services/hybridMatcher.js:calculateRuleBasedScore()`

**Logic**:
```javascript
let ruleScore = 70; // Base score for having basic requirements

const req = scholarship.requirements || {};
const minGpa = typeof req.minGPA === 'number' ? req.minGPA : null;

if (minGpa && !isNaN(minGpa) && cgpa >= minGpa) {
  ruleScore += 30; // Fixed bonus for meeting GPA minimum
}

if (scholarship.deadline) {
  ruleScore += 5; // Reduced deadline bonus
}

return Math.min(100, ruleScore);
```

**For Gadang Scholarship**:
- Base score: 70
- GPA bonus: Student 3.86 ≥ 3.5 → +30
- Deadline bonus: Has deadline → +5
- Total: 105 → Capped at 100
- **Rule Score: 100**

### Step 3: Content-Based Scoring
Content-based scoring evaluates semantic similarity and compatibility.

**Code Location**: `server/services/hybridMatcher.js:calculateContentScore()`

**Components**:
1. **TF-IDF Similarity** (65% weight): Text similarity between student profile and scholarship
2. **Major Compatibility** (35% weight): Program/major matching logic

#### 3.1 TF-IDF Similarity Calculation
**Code Location**: `server/services/contentBasedMatcher.js:calculateSimilarity()`

**Process**:
1. Build student profile text: "Computer Science Computer Science" (program + major)
2. Build scholarship document: Title + Description + Category + Eligible Courses + Keywords + Majors + Provider
3. Preprocess text (lowercase, remove punctuation, tokenize, stem)
4. Calculate TF-IDF vectors for all scholarships
5. Compute cosine similarity between student and target scholarship vectors
6. Return similarity as percentage (0-100)

**For Gadang Scholarship**:
- Student profile: "computer scienc" (stemmed)
- Scholarship text: Contains Malaysian/local terms, not matching "computer scienc"
- **Similarity Score: ~2%** (very low due to lack of common terms)

#### 3.2 Major Compatibility Scoring
**Code Location**: `server/services/hybridMatcher.js:calculateMajorCompatibilityScore()`

**Logic**:
```javascript
const hasRestrictions = eligibleCourses.length > 0 || eligibleMajors.length > 0;
const isOpenToAll = !hasRestrictions || this.isOpenToAllScholarship(scholarship);

if (isOpenToAll) {
  score = 70; // OPEN TO ALL PROGRAMS
} else {
  // Check compatibility logic
}
```

**For Gadang Scholarship**:
- No eligibleCourses or majors specified → hasRestrictions = false
- **Major Compatibility Score: 70** (open to all)

#### 3.3 Combined Content Score
**Formula**: `(similarity × 0.65) + (majorCompatibility × 0.35)`

**For Gadang Scholarship**:
- (2 × 0.65) + (70 × 0.35) = 1.3 + 24.5 = 25.8
- Rounded: **26**

### Step 4: Behavioral Scoring
**Code Location**: `server/services/hybridMatcher.js:calculateBehavioralScore()`

**Logic**: Based on user's click history on this scholarship.
```javascript
const clicks = clickData[scholarshipId] || 0;
if (clicks > 0) {
  behavioralScore = Math.min(20, clicks * 5);
}
```

**For Gadang Scholarship**: No previous clicks → **0**

### Step 5: Diversity Bonus
**Code Location**: `server/services/hybridMatcher.js:calculateDiversityBonus()`

**Logic**: Awards bonus if scholarship category is unique in current recommendations.
```javascript
if (!matchedCategories.has(scholarship.category)) {
  diversityBonus = 10;
}
```

**For Gadang Scholarship**: Assuming category not yet in matches → **10**

### Step 6: Final Hybrid Score Calculation
**Code Location**: `server/services/hybridMatcher.js:calculateHybridScore()`

**Weights**:
```javascript
const weights = {
  ruleBased: 0.35,
  content: 0.45,
  behavioral: 0.15,
  diversity: 0.05
};
```

**Formula**:
```
hybridScore = (ruleScore × 0.35) + (contentScore × 0.45) + (behavioralScore × 0.15) + (diversityBonus × 0.05)
```

**For Gadang Scholarship**:
- Rule: 100 × 0.35 = 35
- Content: 26 × 0.45 = 11.7
- Behavioral: 0 × 0.15 = 0
- Diversity: 10 × 0.05 = 0.5
- **Total: 35 + 11.7 + 0 + 0.5 = 47.2 → 47%**

## Output Flow

### API Response Structure
```javascript
{
  totalScore: 47,
  breakdown: {
    ruleBasedScore: 35,
    contentScore: 11,
    behavioralScore: 0,
    diversityScore: 0
  },
  components: {
    ruleScore: 100,
    contentScore: 26,
    behavioralScore: 0,
    diversityBonus: 10
  },
  matchReasons: [
    { type: 'rule', text: 'Meets GPA requirement (3.86 ≥ 3.5)', icon: '📊' },
    { type: 'major', text: 'This scholarship is open to all programs', icon: '🌐' },
    { type: 'major', text: 'Open to all majors', icon: '📚' }
  ]
}
```

### Frontend Display
- **Match Score**: 47%
- **Breakdown**: Rule-based: 35% | Content: 11% | Behavioral: 0% | Diversity: 0%
- **Reasons**: Listed explanations for why it matches

## Key Insights

1. **Why low content score?** The TF-IDF similarity is low because the scholarship description doesn't contain terms matching the student's profile.

2. **Major compatibility helps**: Even with low similarity, the "open to all" logic gives a decent major compatibility score.

3. **Rule-based dominates**: With the current weights, rule-based score has significant impact when requirements are met.

4. **Room for improvement**: Content scores could be higher if scholarship descriptions included more relevant keywords or if similarity calculation was enhanced.