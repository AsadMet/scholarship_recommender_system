# Hybrid Matching System - Changes Summary

## Date: January 15, 2026

## Overview
This document details all changes made to the hybrid scholarship matching system to improve the scoring logic while preserving the existing architecture, function names, and API response format.

---

## Files Modified

### `server/services/hybridMatcher.js`

All changes were made to this single file. The system flow, function names, and response structure remain unchanged.

---

## Detailed Changes

### 1. Rule-Based Scoring - `calculateRuleBasedScore()`

**Previous Logic:**
```javascript
let ruleScore = 70; // Base score
if (cgpa >= minGpa) {
  ruleScore += 30; // GPA bonus
}
if (scholarship.deadline) {
  ruleScore += 5; // Deadline bonus
}
return Math.min(100, ruleScore);
```

**New Logic:**
```javascript
// Binary GPA eligibility gate
if (minGpa && !isNaN(minGpa) && cgpa >= minGpa) {
  return 100;
}
return 0;
```

**Changes:**
- ✅ Removed base score of 70
- ✅ Removed deadline bonus
- ✅ Made GPA the ONLY rule-based condition
- ✅ Converted to binary scoring: 100 if eligible, 0 if not
- ✅ Removed all other rule-based checks

**Impact:**
- Rule-based scoring now acts as a pure eligibility gate
- Students either meet the GPA requirement (100) or don't (0)
- No partial credit or bonus points

---

### 2. Content-Based Scoring - `calculateContentScore()`

**Previous Logic:**
```javascript
// Calculate TF-IDF similarity
const similarity = contentBasedMatcher.calculateSimilarity(...);

// Calculate major compatibility
const majorCompatibilityScore = this.calculateMajorCompatibilityScore(...);

// Combine: 65% TF-IDF + 35% major compatibility
const combinedScore = (similarity * 0.65) + (majorCompatibilityScore * 0.35);
```

**New Logic:**
```javascript
// Content-based score depends ONLY on program and major openness
// TF-IDF is not used for scoring (kept in codebase for potential future use)
const contentScore = this.calculateMajorCompatibilityScore(scholarship, studentData);

return Math.min(100, Math.max(0, Math.round(contentScore)));
```

**Changes:**
- ✅ Removed TF-IDF similarity calculation from scoring
- ✅ Content score now depends ONLY on program/major openness
- ✅ TF-IDF code remains in codebase but doesn't affect scoring

**Impact:**
- Text similarity no longer influences match scores
- Only program and major openness determines content score
- Scoring is now deterministic and explainable

---

### 3. Major Compatibility Logic - `calculateMajorCompatibilityScore()`

**Previous Logic:**
```javascript
const isOpenToAll = !hasRestrictions || this.isOpenToAllScholarship(scholarship);

if (isOpenToAll) {
  score = 70; // Open to all
} else {
  const majorMatch = this.checkMajorCompatibility(...);
  if (majorMatch) {
    score = 75; // Match
  } else {
    score = -25; // Mismatch
  }
}
```

**New Logic:**
```javascript
// Determine openness separately for programs and majors
const hasNoProgramRestrictions = eligibleCourses.length === 0;
const hasNoMajorRestrictions = eligibleMajors.length === 0;

const isOpenToAllPrograms = hasNoProgramRestrictions || isOpenToAllByKeywords;
const isOpenToAllMajors = hasNoMajorRestrictions || isOpenToAllByKeywords;

// Apply 4-condition scoring
if (isOpenToAllPrograms && isOpenToAllMajors) {
  score = 100; // Both open
} else if (isOpenToAllPrograms && !isOpenToAllMajors) {
  score = 50; // Programs only
} else if (!isOpenToAllPrograms && isOpenToAllMajors) {
  score = 50; // Majors only
} else {
  score = 0; // Neither open
}
```

**Changes:**
- ✅ Split openness check into programs and majors separately
- ✅ Implemented 4-condition scoring logic:
  - **Condition 1:** Open to all programs AND majors → 100%
  - **Condition 2:** Open to all programs ONLY → 50%
  - **Condition 3:** Open to all majors ONLY → 50%
  - **Condition 4:** Neither open → 0%
- ✅ Removed student major matching logic
- ✅ Removed negative penalty (-25) for mismatches

**Impact:**
- Content scoring is now based purely on scholarship openness
- 50% weight for program openness + 50% for major openness
- No student-specific matching - purely scholarship characteristic based

---

### 4. Behavioral Scoring - `calculateBehavioralScore()`

**Previous Logic:**
```javascript
const clicks = clickData[scholarshipId] || 0;
if (clicks > 0) {
  behavioralScore = Math.min(20, clicks * 5);
}
return behavioralScore;
```

**New Logic:**
```javascript
// Behavioral scoring removed - always returns 0
return 0;
```

**Changes:**
- ✅ Removed click tracking logic
- ✅ Always returns 0
- ✅ Function kept for code compatibility

**Impact:**
- User click history no longer affects match scores
- Scoring is now stateless and deterministic

---

### 5. Diversity Bonus - `calculateDiversityBonus()`

**Previous Logic:**
```javascript
const matchedCategories = new Set(...);
if (!matchedCategories.has(scholarship.category)) {
  diversityBonus = 10;
}
return diversityBonus;
```

**New Logic:**
```javascript
// Diversity bonus removed - always returns 0
return 0;
```

**Changes:**
- ✅ Removed category diversity tracking
- ✅ Always returns 0
- ✅ Function kept for code compatibility

**Impact:**
- Scholarship category no longer affects scoring
- No bonus for diverse recommendations

---

### 6. Final Hybrid Score - `calculateHybridScore()`

**Previous Weights:**
```javascript
const weights = {
  ruleBased: 0.35,  // 35%
  content: 0.45,    // 45%
  behavioral: 0.15, // 15%
  diversity: 0.05   // 5%
};

hybridScore = (ruleScore * 0.35) + (contentScore * 0.45) + 
              (behavioralScore * 0.15) + (diversityBonus * 0.05);
```

**New Calculation:**
```javascript
// Final score: 50% rule-based + 50% content-based
const hybridScore = Math.round(
  (ruleScore * 0.5) +
  (contentScore * 0.5)
);
```

**Changes:**
- ✅ Changed to 50/50 weighting (rule-based and content-based)
- ✅ Removed behavioral and diversity from calculation
- ✅ Removed weights parameter from options
- ✅ Behavioral and diversity components set to 0 in response

**Impact:**
- Equal importance given to GPA eligibility and program/major openness
- Simpler, more transparent scoring model
- Final scores are predictable and explainable

---

### 7. Match Reasons - `generateMatchReasons()`

**Previous Logic:**
- Included age requirement checks
- Showed GPA requirement status
- Showed major/program compatibility with student-specific matching
- Included TF-IDF similarity explanations
- Included category information

**New Logic:**
```javascript
// Rule-based reason: GPA only
if (cgpa >= minGpa) {
  reasons.push({ 
    type: 'rule', 
    text: `Meets GPA requirement (${cgpa} ≥ ${minGpa})`, 
    icon: '📊' 
  });
}

// Content-based reasons: Program and major openness
if (isOpenToAllPrograms) {
  reasons.push({
    type: 'content',
    text: 'This scholarship is open to all programs',
    icon: '🌐'
  });
}

if (isOpenToAllMajors) {
  reasons.push({
    type: 'content',
    text: 'This scholarship is open to all majors',
    icon: '📚'
  });
}
```

**Changes:**
- ✅ Removed age requirement explanations
- ✅ Simplified GPA explanation
- ✅ Changed major/program explanations to show openness status
- ✅ Removed student-specific matching explanations
- ✅ Removed TF-IDF similarity reasons
- ✅ Removed category information
- ✅ Added warning for restricted scholarships

**Impact:**
- Match reasons clearly explain GPA eligibility
- Reasons show whether scholarship is open to all programs/majors
- No confusing similarity percentages or matching terms
- Explanations are scholarship-characteristic focused, not student-specific

---

## Summary of Key Improvements

### ✅ Removed Components
1. Behavioral scoring (user clicks)
2. Diversity bonus (category variety)
3. TF-IDF text similarity scoring
4. Age requirement checks
5. Deadline-based scoring
6. Student-major matching logic

### ✅ Simplified Scoring
1. **Rule-Based:** Binary GPA gate (100 or 0)
2. **Content-Based:** Program/major openness only (0, 50, or 100)
3. **Final Score:** Simple 50/50 weighted average

### ✅ Benefits
- **Deterministic:** Same inputs always produce same outputs
- **Explainable:** Clear reasons for every score
- **Transparent:** No hidden factors or complex calculations
- **Fair:** All students evaluated by same criteria
- **Academic-appropriate:** Suitable for research and evaluation

---

## Example Calculation (Gadang Scholarship)

### Input Data
- **Student:** GPA 3.86, Program: Computer Science, Major: Computer Science
- **Scholarship:** Min GPA 3.5, Open to all programs and majors

### Old System Score: 47%
- Rule: 100 × 0.35 = 35
- Content: 26 × 0.45 = 11.7 (low due to TF-IDF)
- Behavioral: 0 × 0.15 = 0
- Diversity: 10 × 0.05 = 0.5
- **Total: 47%**

### New System Score: 100%
- Rule: 100 (GPA 3.86 ≥ 3.5) × 0.5 = 50
- Content: 100 (open to all programs AND majors) × 0.5 = 50
- **Total: 100%**

### Match Reasons (New)
- ✅ Meets GPA requirement (3.86 ≥ 3.5)
- ✅ This scholarship is open to all programs
- ✅ This scholarship is open to all majors

---

## Backward Compatibility

### ✅ Preserved
- All function names remain unchanged
- API response structure identical
- File structure unchanged
- Execution order maintained
- No new dependencies introduced

### ✅ Response Format
```javascript
{
  totalScore: 100,
  breakdown: {
    ruleBasedScore: 50,
    contentScore: 50,
    behavioralScore: 0,    // Always 0
    diversityScore: 0      // Always 0
  },
  components: {
    ruleScore: 100,
    contentScore: 100,
    behavioralScore: 0,    // Always 0
    diversityBonus: 0      // Always 0
  },
  matchReasons: [...]
}
```

---

## Testing Recommendations

1. **Test GPA boundary conditions:**
   - Student GPA = Scholarship min GPA (should be 100)
   - Student GPA < Scholarship min GPA (should be 0)
   - No min GPA requirement

2. **Test program/major openness combinations:**
   - Both open (score = 100)
   - Programs only (score = 50)
   - Majors only (score = 50)
   - Neither open (score = 0)

3. **Test final score calculation:**
   - Verify 50/50 weighting
   - Check score rounding
   - Verify score capping (0-100)

4. **Test match reasons:**
   - GPA explanations are clear
   - Program/major openness shown correctly
   - No deprecated reasons appear

---

## Migration Notes

- No database changes required
- No API endpoint changes required
- Frontend will continue to work without modifications
- Behavioral and diversity scores will show as 0
- All existing integrations remain compatible
