const contentBasedMatcher = require('./contentBasedMatcher');

class HybridMatcher {
  calculateRuleBasedScore(scholarship, studentData) {
    const { cgpa } = studentData;
    
    const req = scholarship.requirements || {};
    const minGpa = typeof req.minGPA === 'number' ? req.minGPA : null;

    // Binary GPA eligibility gate
    // If no GPA requirement: ruleBasedScore = 100
    // If student CGPA >= scholarship minimum GPA: ruleBasedScore = 100
    // If student CGPA < scholarship minimum GPA: ruleBasedScore = 0
    if (minGpa === null || isNaN(minGpa)) {
      return 100; // No GPA requirement = 100%
    }
    
    if (cgpa >= minGpa) {
      return 100;
    }

    return 0;
  }

  calculateContentScore(studentProfile, scholarship, allScholarships, studentData) {
    try {
      // Content-based score depends ONLY on program and major openness
      // TF-IDF is not used for scoring (kept in codebase for potential future use)
      const contentScoreData = this.calculateMajorCompatibilityScore(scholarship, studentData);

      return {
        totalScore: Math.min(100, Math.max(0, Math.round(contentScoreData.totalScore))),
        programScore: contentScoreData.programScore,
        majorScore: contentScoreData.majorScore
      };
    } catch (error) {
      console.error('Content scoring error:', error);
      return { totalScore: 0, programScore: 0, majorScore: 0 };
    }
  }

  calculateBehavioralScore(scholarship, clickData = {}) {
    // Behavioral scoring removed - always returns 0
    return 0;
  }

  calculateMajorCompatibilityScore(scholarship, studentData) {
    // Content-based scoring: program and major openness
    // Score is split: 50% for program openness + 50% for major openness
    // Maximum content-based score = 100%

    const req = scholarship.requirements || {};
    const eligibleCourses = Array.isArray(scholarship.eligibleCourses) ? scholarship.eligibleCourses : [];
    const eligibleMajors = Array.isArray(req.majors) ? req.majors : [];

    const hasAllFields = (items) => items.some((item) => {
      if (typeof item !== 'string') return false;
      const text = item.trim().toLowerCase();
      return text.includes('all fields') || text.includes('all programmes') || text.includes('all programs');
    });
    
    // Check for open-to-all indicators in scholarship text
    const isOpenToAllByKeywords = this.isOpenToAllScholarship(scholarship);
    const isAllFieldsListed = hasAllFields(eligibleCourses) || hasAllFields(eligibleMajors);
    
    // Determine openness for programs and majors separately
    const hasNoProgramRestrictions = eligibleCourses.length === 0;
    const hasNoMajorRestrictions = eligibleMajors.length === 0;
    
    const isOpenToAllPrograms = hasNoProgramRestrictions || isOpenToAllByKeywords || isAllFieldsListed;
    const isOpenToAllMajors = hasNoMajorRestrictions || isOpenToAllByKeywords || isAllFieldsListed;

    let score = 0;
    let programScore = 0;
    let majorScore = 0;
    
    // Condition 1: Open to all programs AND all majors = 100
    if (isOpenToAllPrograms && isOpenToAllMajors) {
      score = 100;
      programScore = 50;
      majorScore = 50;
    }
    // Condition 2: Open to all programs ONLY = 50
    else if (isOpenToAllPrograms && !isOpenToAllMajors) {
      const studentMajor = studentData.major || studentData.program || '';
      const majorMatch = this.checkMajorCompatibility(studentMajor, eligibleCourses, eligibleMajors);
      if (majorMatch) {
        score = 100;
        programScore = 50;
        majorScore = 50;
      } else {
        score = 50;
        programScore = 50;
        majorScore = 0;
      }
    }
    // Condition 3: Open to all majors ONLY = 50
    else if (!isOpenToAllPrograms && isOpenToAllMajors) {
      const studentProgram = studentData.program || '';
      const programMatch = this.checkMajorCompatibility(studentProgram, eligibleCourses, []);
      if (programMatch) {
        score = 100;
        programScore = 50;
        majorScore = 50;
      } else {
        score = 50;
        programScore = 0;
        majorScore = 50;
      }
    }
    // Condition 4: NOT open to all - check student-specific matching
    else {
      const studentMajor = studentData.major || studentData.program || '';
      const majorMatch = this.checkMajorCompatibility(studentMajor, eligibleCourses, eligibleMajors);
      
      if (majorMatch) {
        score = 100; // Student's major matches scholarship requirements
        programScore = 50;
        majorScore = 50;
      } else {
        score = 0; // Student's major doesn't match
        programScore = 0;
        majorScore = 0;
      }
    }

    console.log(`🎯 Program/Major compatibility for "${scholarship.title}": Programs=${isOpenToAllPrograms}, Majors=${isOpenToAllMajors} -> score: ${score}`);
    return { totalScore: score, programScore, majorScore };
  }

  calculateDiversityBonus(scholarship, currentMatches, index) {
    // Diversity bonus removed - always returns 0
    return 0;
  }

  isOpenToAllScholarship(scholarship) {
    // Check for keywords indicating open-to-all scholarships
    const openKeywords = [
      'all programs', 'any major', 'open to all', 'all fields', 'any field',
      'open to all majors', 'all majors', 'no major restriction', 'any discipline',
      'all disciplines', 'any field of study', 'all fields of study'
    ];
    const textToCheck = [
      scholarship.title || '',
      scholarship.description || '',
      scholarship.category || ''
    ].join(' ').toLowerCase();

    const isOpen = openKeywords.some(keyword => textToCheck.includes(keyword));

    // Debug: Log when open-to-all is detected
    if (isOpen) {
      console.log(`🎯 Open-to-all detected for: "${scholarship.title}"`);
    }

    return isOpen;
  }

  checkMajorCompatibility(studentMajor, eligibleCourses, eligibleMajors) {
    // Check both eligibleCourses and eligibleMajors for compatibility
    const normalize = (s) => (typeof s === 'string' ? s.trim().toLowerCase() : '');
    const normalizeField = (s) => {
      const raw = normalize(s);
      if (!raw) return '';
      if (
        raw.includes('all fields') ||
        raw.includes('all programmes') ||
        raw.includes('all programs') ||
        /applicable to all\b.*\bprogram(?:mes|s)\b/.test(raw)
      ) {
        return 'all';
      }
      const cleaned = raw
        .replace(/\b(diploma|sarjana\s+muda|sarjana|ijazah|bachelor|degree|foundation|asas|program|programme|programs|courses|course|bidang|pengajian|kepujian|hons)\b/g, ' ')
        .replace(/[^a-z\s&]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      const fieldMappings = [
        ['computer science', ['computer science', 'sains komputer', 'computing', 'informatik', 'information technology', 'teknologi maklumat', 'sistem maklumat', 'software', 'kejuruteraan perisian', 'data science', 'sains data']],
        ['engineering', ['engineering', 'kejuruteraan', 'civil', 'awam', 'mechanical', 'mekanikal', 'electrical', 'elektrik', 'electronics', 'elektronik', 'chemical', 'kimia', 'industrial', 'industri', 'aerospace', 'aeroangkasa', 'biomedical', 'bioperubatan']],
        ['business', ['business', 'perniagaan', 'accounting', 'perakaunan', 'finance', 'kewangan', 'marketing', 'pemasaran', 'management', 'pengurusan', 'entrepreneurship', 'keusahawanan', 'economics', 'ekonomi', 'logistics', 'logistik', 'supply chain', 'rantaian bekalan', 'perbankan', 'banking', 'insurance', 'insurans']],
        ['medicine', ['medicine', 'perubatan', 'medical', 'pharmacy', 'farmasi', 'nursing', 'kejururawatan', 'dentistry', 'pergigian', 'physiotherapy', 'fisioterapi', 'radiography', 'radiografi', 'public health', 'kesihatan awam', 'nutrition', 'pemakanan', 'dietetik', 'optometry', 'optometri', 'allied health', 'kesihatan sekutu']],
        ['science', ['science', 'sains', 'biology', 'biologi', 'chemistry', 'kimia', 'physics', 'fizik', 'mathematics', 'matematik', 'statistics', 'statistik', 'actuarial', 'aktuari', 'geology', 'geologi', 'environmental', 'alam sekitar', 'biotechnology', 'bioteknologi']],
        ['arts', ['arts', 'sastera', 'design', 'reka bentuk', 'graphic', 'grafik', 'animation', 'animasi', 'architecture', 'seni bina', 'interior', 'dalaman', 'urban planning', 'perancangan bandar', 'quantity surveying', 'ukur bahan']],
        ['education', ['education', 'pendidikan', 'teaching', 'pengajaran', 'early childhood', 'awal kanak kanak']],
        ['law', ['law', 'undang undang', 'legal']],
        ['social sciences', ['psychology', 'psikologi', 'counseling', 'kaunseling', 'communication', 'komunikasi', 'journalism', 'kewartawanan', 'public relations', 'perhubungan awam', 'political', 'politik', 'sociology', 'sosiologi', 'history', 'sejarah', 'geography', 'geografi', 'international relations', 'hubungan antarabangsa', 'social work', 'kerja sosial']],
        ['hospitality', ['hospitality', 'hospitaliti', 'tourism', 'pelancongan', 'event management', 'pengurusan acara']],
        ['sports', ['sports', 'sukan', 'sports science', 'sains sukan', 'sports management', 'pengurusan sukan']],
        ['agriculture', ['agriculture', 'pertanian', 'forestry', 'perhutanan', 'fisheries', 'perikanan', 'food science', 'sains makanan']]
      ];
      for (const [field, keywords] of fieldMappings) {
        if (keywords.some((k) => cleaned.includes(k))) return field;
      }
      return '';
    };

    const studentMajorNorm = normalize(studentMajor);
    if (!studentMajorNorm) return false;
    // Treat "Other" as a wildcard major to bypass restrictions
    if (studentMajorNorm === 'other') return true;
    const studentField = normalizeField(studentMajorNorm);

    // Check eligibleCourses (programs)
    if (eligibleCourses.length > 0) {
      if (eligibleCourses.some((course) => normalizeField(course) === 'all')) return true;
      if (studentField) {
        const fieldMatch = eligibleCourses.some((course) => normalizeField(course) === studentField);
        if (fieldMatch) return true;
      }
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
      if (eligibleMajors.some((major) => normalizeField(major) === 'all')) return true;
      if (studentField) {
        const fieldMatch = eligibleMajors.some((major) => normalizeField(major) === studentField);
        if (fieldMatch) return true;
      }
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

  async calculateHybridScore(scholarship, studentData, allScholarships, options = {}) {
    const {
      clickData = {},
      currentMatches = [],
      index = 0
    } = options;
    
    const ruleScore = this.calculateRuleBasedScore(scholarship, studentData);
    
    const studentProfile = studentData.fullProfile ||
      `${studentData.program || ''} ${studentData.major || ''} ${studentData.name || ''}`.trim();
    
    const contentScoreData = this.calculateContentScore(
      studentProfile,
      scholarship,
      allScholarships,
      studentData
    );
    
    // Extract total content score and component scores
    const contentScore = contentScoreData.totalScore;
    const programOpenness = contentScoreData.programScore;
    const majorOpenness = contentScoreData.majorScore;
    
    // Behavioral and diversity scoring removed (kept for compatibility)
    const behavioralScore = this.calculateBehavioralScore(scholarship, clickData);
    const diversityBonus = this.calculateDiversityBonus(scholarship, currentMatches, index);
    
    // Final score: 50% rule-based + 50% content-based
    const hybridScore = Math.round(
      (ruleScore * 0.5) +
      (contentScore * 0.5)
    );
    
    return {
      totalScore: Math.min(100, Math.max(0, hybridScore)),
      breakdown: {
        ruleBasedScore: Math.round(ruleScore * 0.5),
        contentScore: Math.round(contentScore * 0.5)
      },
      components: {
        ruleScore,
        contentScore,
        programOpenness,
        majorOpenness
      },
      matchReasons: this.generateMatchReasons(
        scholarship,
        studentData,
        ruleScore,
        contentScore,
        programOpenness,
        majorOpenness
      )
    };
  }

  generateMatchReasons(scholarship, studentData, ruleScore, contentScore, programOpenness, majorOpenness) {
    const reasons = [];

    const { cgpa } = studentData;
    const req = scholarship.requirements || {};
    const minGpa = typeof req.minGPA === 'number' ? req.minGPA : null;

    // GPA requirement check
    if (minGpa === null || isNaN(minGpa)) {
      reasons.push({ type: 'rule', text: 'No minimum GPA requirement', icon: '✅' });
    } else if (cgpa >= minGpa) {
      reasons.push({ 
        type: 'rule', 
        text: `Meets CGPA requirement (${cgpa} ≥ ${minGpa})`, 
        icon: '📊' 
      });
    } else {
      reasons.push({ 
        type: 'rule', 
        text: `Does not meet CGPA requirement (${cgpa} < ${minGpa})`, 
        icon: '📉' 
      });
    }
    
    // Content-based reasons: Program and major compatibility
    const eligibleCourses = Array.isArray(scholarship.eligibleCourses) ? scholarship.eligibleCourses : [];
    const eligibleMajors = Array.isArray(req.majors) ? req.majors : [];

    const hasAllFields = (items) => items.some((item) => {
      if (typeof item !== 'string') return false;
      const text = item.trim().toLowerCase();
      return text.includes('all fields') || text.includes('all programmes') || text.includes('all programs');
    });
    
    const isOpenToAllByKeywords = this.isOpenToAllScholarship(scholarship);
    const hasNoProgramRestrictions = eligibleCourses.length === 0;
    const hasNoMajorRestrictions = eligibleMajors.length === 0;
    const isAllFieldsListed = hasAllFields(eligibleCourses) || hasAllFields(eligibleMajors);
    
    const isOpenToAllPrograms = hasNoProgramRestrictions || isOpenToAllByKeywords || isAllFieldsListed;
    const isOpenToAllMajors = hasNoMajorRestrictions || isOpenToAllByKeywords || isAllFieldsListed;

    const studentMajor = studentData.major || studentData.program || '';
    const studentProgram = studentData.program || '';
    const isOtherMajor = String(studentMajor).trim().toLowerCase() === 'other';

    if (isOpenToAllPrograms && isOpenToAllMajors) {
      // Fully open scholarship
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
    } else if (isOpenToAllPrograms && !isOpenToAllMajors) {
      // Open to all programs, but has major restrictions
      reasons.push({
        type: 'content',
        text: 'This scholarship is open to all programs',
        icon: '🌐'
      });
      
      // Check major match
      const majorMatch = this.checkMajorCompatibility(studentMajor, eligibleCourses, eligibleMajors);
      if (isOtherMajor) {
        reasons.push({
          type: 'content',
          text: 'Major set to Other; skipping major requirement check',
          icon: '✅'
        });
      } else if (majorMatch) {
        reasons.push({
          type: 'content',
          text: 'Your major matches the scholarship requirements',
          icon: '✅'
        });
      } else {
        reasons.push({
          type: 'content',
          text: `Not eligible: Your major (${studentMajor}) does not match the required majors`,
          icon: '❌'
        });
      }
    } else if (!isOpenToAllPrograms && isOpenToAllMajors) {
      // Has program restrictions, open to all majors
      const programMatch = this.checkMajorCompatibility(studentProgram, eligibleCourses, []);
      if (programMatch) {
        reasons.push({
          type: 'content',
          text: 'Your program matches the scholarship requirements',
          icon: '✅'
        });
      } else {
        reasons.push({
          type: 'content',
          text: `Not eligible: Your program (${studentProgram}) does not match the required programs`,
          icon: '❌'
        });
      }
      
      reasons.push({
        type: 'content',
        text: 'This scholarship is open to all majors',
        icon: '📚'
      });
    } else {
      // Has restrictions on both programs and majors
      const programMatch = this.checkMajorCompatibility(studentProgram, eligibleCourses, []);
      const majorMatch = this.checkMajorCompatibility(studentMajor, [], eligibleMajors);
      
      if (programMatch) {
        reasons.push({
          type: 'content',
          text: 'Your program matches the scholarship requirements',
          icon: '✅'
        });
      } else {
        reasons.push({
          type: 'content',
          text: `Not eligible: Your program (${studentProgram}) does not match the required programs`,
          icon: '❌'
        });
      }
      
      if (isOtherMajor) {
        reasons.push({
          type: 'content',
          text: 'Major set to Other; skipping major requirement check',
          icon: '✅'
        });
      } else if (majorMatch) {
        reasons.push({
          type: 'content',
          text: 'Your major matches the scholarship requirements',
          icon: '✅'
        });
      } else {
        reasons.push({
          type: 'content',
          text: `Not eligible: Your major (${studentMajor}) does not match the required majors`,
          icon: '❌'
        });
      }
    }
    
    return reasons;
  }

  async matchScholarships(scholarships, studentData, options = {}) {
    const matches = [];
    const nonEligible = [];
    const includeNonEligible = options.includeNonEligible || false;
    
    for (let i = 0; i < scholarships.length; i++) {
      const scholarship = scholarships[i];
      
      const now = new Date();
      const deadlineOk = !scholarship.deadline || scholarship.deadline > now;
      
      if (!deadlineOk) {
        if (includeNonEligible) {
          nonEligible.push({
            scholarship,
            eligible: false,
            reasons: [{ text: 'Scholarship deadline has passed', icon: '⏰' }]
          });
        }
        continue;
      }
      
      const req = scholarship.requirements || {};
      const minGpa = typeof req.minGPA === 'number' ? req.minGPA : null;
      const cgpaOk = minGpa === null || isNaN(minGpa) ? true : studentData.cgpa >= minGpa;
      
      // Rule-based filtering: only GPA and deadline determine eligibility
      // Program/major compatibility is handled in content-based scoring for ranking
      if (!cgpaOk) {
        if (includeNonEligible) {
          const reasons = [];
          if (!cgpaOk) {
            reasons.push({
              text: `GPA too low (${studentData.cgpa} < ${minGpa})`,
              icon: '📉'
            });
          }
          nonEligible.push({
            scholarship,
            eligible: false,
            reasons
          });
        }
        continue;
      }
      
      const scoreData = await this.calculateHybridScore(
        scholarship,
        studentData,
        scholarships,
        { ...options, currentMatches: matches, index: i }
      );
      
      matches.push({
        scholarship,
        matchScore: scoreData.totalScore,
        scoreBreakdown: scoreData.breakdown,
        components: scoreData.components,
        matchReasons: scoreData.matchReasons,
        eligible: true
      });
    }
    
    matches.sort((a, b) => b.matchScore - a.matchScore);
    
    if (includeNonEligible) {
      return { eligible: matches, nonEligible: nonEligible.slice(0, 5) };
    }
    
    return matches;
  }
}

module.exports = new HybridMatcher();
