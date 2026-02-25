const natural = require('natural');
const TfIdf = natural.TfIdf;
const tokenizer = new natural.WordTokenizer();
const { PorterStemmer } = natural;

class ContentBasedMatcher {
  constructor() {
    this.tfidf = new TfIdf();
    this.stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'as', 'is', 'are', 'was', 'were', 'been',
      'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should',
      'could', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those'
    ]);
  }

  preprocessText(text) {
    if (!text || typeof text !== 'string') return '';

    const normalized = text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const tokens = tokenizer.tokenize(normalized) || [];

    const filtered = tokens.filter(token =>
      token.length > 2 && !this.stopWords.has(token)
    );

    const stemmed = filtered.map(token => PorterStemmer.stem(token));

    return stemmed.join(' ');
  }

  extractKeywords(text, maxKeywords = 10) {
    const processed = this.preprocessText(text);
    const tokens = tokenizer.tokenize(processed) || [];
    
    const frequency = {};
    tokens.forEach(token => {
      frequency[token] = (frequency[token] || 0) + 1;
    });
    
    const sorted = Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxKeywords)
      .map(([word]) => word);
    
    return sorted;
  }

  buildStudentProfile(user) {
    const parts = [];

    if (user.name) parts.push(user.name);

    if (user.profile) {
      if (user.profile.program) parts.push(user.profile.program);
      if (user.profile.major) parts.push(user.profile.major);

      if (user.profile.extractedText) {
        parts.push(user.profile.extractedText);
      }
    }

    return parts.join(' ');
  }

  buildScholarshipDocument(scholarship) {
    const parts = [];
    
    parts.push(scholarship.title || '');
    parts.push(scholarship.description || '');
    parts.push(scholarship.category || '');
    
    if (Array.isArray(scholarship.eligibleCourses)) {
      parts.push(...scholarship.eligibleCourses);
    }
    
    if (Array.isArray(scholarship.keywords)) {
      parts.push(...scholarship.keywords);
    }
    
    if (scholarship.requirements) {
      if (Array.isArray(scholarship.requirements.majors)) {
        parts.push(...scholarship.requirements.majors);
      }
    }
    
    if (scholarship.provider && scholarship.provider.name) {
      parts.push(scholarship.provider.name);
    }
    
    return parts.join(' ');
  }

  calculateCosineSimilarity(vec1, vec2) {
    if (!vec1 || !vec2 || vec1.length === 0 || vec2.length === 0) return 0;
    
    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;
    
    const allKeys = new Set([...Object.keys(vec1), ...Object.keys(vec2)]);
    
    allKeys.forEach(key => {
      const val1 = vec1[key] || 0;
      const val2 = vec2[key] || 0;
      dotProduct += val1 * val2;
      magnitude1 += val1 * val1;
      magnitude2 += val2 * val2;
    });
    
    const denominator = Math.sqrt(magnitude1) * Math.sqrt(magnitude2);
    if (denominator === 0) return 0;
    
    return dotProduct / denominator;
  }

  calculateSimilarity(studentProfile, scholarship, scholarships) {
    this.tfidf = new TfIdf();
    
    const studentDoc = this.preprocessText(studentProfile);
    this.tfidf.addDocument(studentDoc);
    
    scholarships.forEach(s => {
      const scholarshipDoc = this.preprocessText(this.buildScholarshipDocument(s));
      this.tfidf.addDocument(scholarshipDoc);
    });
    
    const targetIndex = scholarships.findIndex(s => 
      s._id.toString() === scholarship._id.toString()
    );
    
    if (targetIndex === -1) return 0;
    
    const studentVector = {};
    this.tfidf.listTerms(0).forEach(item => {
      studentVector[item.term] = item.tfidf;
    });
    
    const scholarshipVector = {};
    this.tfidf.listTerms(targetIndex + 1).forEach(item => {
      scholarshipVector[item.term] = item.tfidf;
    });
    
    const similarity = this.calculateCosineSimilarity(studentVector, scholarshipVector);
    
    return Math.min(100, Math.max(0, Math.round(similarity * 100)));
  }

  findMatchingTerms(studentProfile, scholarship) {
    const studentTokens = new Set(
      tokenizer.tokenize(this.preprocessText(studentProfile)) || []
    );
    const scholarshipTokens = new Set(
      tokenizer.tokenize(this.preprocessText(this.buildScholarshipDocument(scholarship))) || []
    );
    
    const matching = [...studentTokens].filter(token => scholarshipTokens.has(token));
    
    return matching.slice(0, 5);
  }

  categorizeScholarship(scholarship) {
    const text = this.buildScholarshipDocument(scholarship).toLowerCase();
    
    const categories = {
      'STEM': ['engineering', 'science', 'technology', 'mathematics', 'computer', 'data', 'physics', 'chemistry', 'biology'],
      'Business': ['business', 'management', 'finance', 'accounting', 'economics', 'entrepreneurship', 'marketing'],
      'Arts': ['arts', 'design', 'creative', 'music', 'theatre', 'literature', 'humanities'],
      'Healthcare': ['medical', 'nursing', 'health', 'medicine', 'pharmacy', 'dentistry'],
      'Education': ['education', 'teaching', 'pedagogy', 'training'],
      'Law': ['law', 'legal', 'justice', 'paralegal'],
      'Social Sciences': ['psychology', 'sociology', 'anthropology', 'political science', 'social work']
    };
    
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return category;
      }
    }
    
    return 'General';
  }

  async enhanceScholarship(scholarship) {
    if (!scholarship.description || scholarship.description.trim() === '') {
      scholarship.description = `${scholarship.title}. ` +
        `Award amount: $${scholarship.amount}. ` +
        (scholarship.eligibleCourses && scholarship.eligibleCourses.length > 0
          ? `Eligible for: ${scholarship.eligibleCourses.join(', ')}. `
          : '') +
        (scholarship.requirements && scholarship.requirements.minGPA > 0
          ? `Minimum GPA: ${scholarship.requirements.minGPA}.`
          : '');
    }
    
    if (!scholarship.keywords || scholarship.keywords.length === 0) {
      const fullText = this.buildScholarshipDocument(scholarship);
      scholarship.keywords = this.extractKeywords(fullText, 10);
    }
    
    if (!scholarship.category || scholarship.category === 'General') {
      scholarship.category = this.categorizeScholarship(scholarship);
    }
    
    return scholarship;
  }
}

module.exports = new ContentBasedMatcher();
