# Information Extraction Module

def extract_with_custom_ner(text):
    """
    Extract information using Custom NER Model Only
    With model-based confidence calculation
    """
    logger.info("=== Extracting with Custom NER Only ===")

    doc = nlp(text)

    name = None
    cgpa = None
    program = None

    name_confidence = 0.0
    cgpa_confidence = 0.0
    program_confidence = 0.0

    # Extract entities using NER model
    for ent in doc.ents:
        logger.info(f"NER found: '{ent.text[:50]}...' -> {ent.label_}")

        model_conf = get_model_confidence_from_entity(doc, ent)
        logger.info(f"  Model confidence: {model_conf:.3f}")

        # Extract STUDENT_NAME
        if ent.label_ == "STUDENT_NAME" and name is None:
            raw_name = ent.text.strip()

            # Clean up if too long (>100 chars)
            if len(raw_name) > 100:
                logger.warning(f"Name too long ({len(raw_name)} chars), cleaning...")
                lines = raw_name.split('\n')

                for line in lines[:10]:
                    line = line.strip()
                    words = line.split()

                    if 2 <= len(words) <= 8 and all(w.replace('-', '').replace("'", '').isalpha() for w in words):
                        name = line
                        name_confidence = calculate_enhanced_confidence(
                            line, "STUDENT_NAME", "ner", model_conf * 0.85
                        )
                        logger.info(f"✓ NER extracted NAME (cleaned): '{name}' (confidence: {name_confidence})")
                        break
            else:
                name = raw_name
                name_confidence = calculate_enhanced_confidence(
                    raw_name, "STUDENT_NAME", "ner", model_conf
                )
                logger.info(f"✓ NER extracted NAME: '{name}' (confidence: {name_confidence})")

        # Extract CGPA
        elif ent.label_ == "CGPA" and cgpa is None:
            try:
                cgpa_text = ent.text.strip()
                cgpa_value = float(cgpa_text)

                if 0.0 <= cgpa_value <= 4.0:
                    cgpa = f"{cgpa_value:.2f}"
                    cgpa_confidence = calculate_enhanced_confidence(
                        cgpa, "CGPA", "ner", model_conf
                    )
                    logger.info(f"✓ NER extracted CGPA: {cgpa} (confidence: {cgpa_confidence})")
                else:
                    logger.warning(f"Invalid CGPA range: {cgpa_value}")
            except ValueError:
                logger.warning(f"Cannot parse CGPA: {ent.text}")

        # Extract PROGRAM
        elif ent.label_ == "PROGRAM" and program is None:
            raw_program = ent.text.strip()

            # Clean up if too long
            if len(raw_program) > 200:
                logger.warning(f"Program too long ({len(raw_program)} chars), taking first line...")
                lines = raw_program.split('\n')
                program = lines[0].strip() if lines else raw_program
            else:
                program = raw_program

            if program:
                program_confidence = calculate_enhanced_confidence(
                    program, "PROGRAM", "ner", model_conf
                )
                logger.info(f"✓ NER extracted PROGRAM: '{program[:50]}...' (confidence: {program_confidence})")

    # Calculate overall confidence
    overall_confidence = (name_confidence + cgpa_confidence + program_confidence) / 3

    # Translate program from Malay to English
    program_malay = program
    program_english = program
    field_of_study = None

    if program and course_translator:
        logger.info(f"🔄 Translating program: {program[:50]}...")
        program_english = course_translator.translate(program)
        field_of_study = course_translator.map_to_field_category(program_english)

        if program_english != program:
            logger.info(f"✅ Translated: {program[:50]}... → {program_english[:50]}...")
            logger.info(f"📚 Field of Study: {field_of_study}")
        else:
            logger.info(f"ℹ️  No translation needed")

    return {
        'name': name,
        'cgpa': cgpa,
        'program': program_english,
        'program_malay': program_malay,
        'program_english': program_english,
        'field_of_study': field_of_study,
        'confidence': {
            'name': name_confidence,
            'cgpa': cgpa_confidence,
            'program': program_confidence,
            'overall': round(overall_confidence, 3)
        },
        'method': 'custom_ner_only',
        'quality_tier': 'high' if overall_confidence >= 0.85 else 'medium' if overall_confidence >= 0.70 else 'low',
        'model_based_confidence': True
    }

"""
This function embodies the core of the information extraction module, utilizing a custom-trained Named Entity Recognition (NER) model to extract critical student attributes such as name, CGPA, and program from academic transcripts. The methodology employs spaCy's NER capabilities, enhanced with model-based confidence calculations and quality checks to ensure accuracy. By processing the document text through the pre-trained NER model, the function identifies entities labeled as STUDENT_NAME, CGPA, and PROGRAM, while applying validation rules to filter out invalid or extraneous data. Confidence scores are computed through a multi-factor approach, considering entity consistency, boundary cleanliness, and positional context, thereby providing a robust assessment of extraction reliability. Furthermore, the function integrates course translation functionality to convert Malay program names to English equivalents, mapping them to standardized field categories, which is essential for subsequent content-based matching processes. This extraction mechanism is pivotal to the scholarship recommendation system as it transforms unstructured document data into structured student profiles, enabling precise eligibility determination and personalized recommendation generation.
"""

# Rule-Based Filtering Module

def calculate_rule_based_score(scholarship, student_data):
    cgpa = student_data.get('cgpa', 0)

    req = scholarship.get('requirements', {})
    min_gpa = req.get('minGPA') if isinstance(req.get('minGPA'), (int, float)) else None

    # Binary GPA eligibility gate
    # If no GPA requirement: ruleBasedScore = 100
    # If student CGPA >= scholarship minimum GPA: ruleBasedScore = 100
    # If student CGPA < scholarship minimum GPA: ruleBasedScore = 0
    if min_gpa is None or not isinstance(min_gpa, (int, float)):
        return 100  # No GPA requirement = 100%

    if cgpa >= min_gpa:
        return 100

    return 0

"""
The calculateRuleBasedScore method implements a strict eligibility gate based on Grade Point Average (GPA), serving as the foundational rule-based filtering component within the hybrid recommendation engine. This function enforces a binary decision-making process: scholarships with no specified minimum GPA requirement are assigned a perfect score of 100, indicating unconditional eligibility, while those with defined GPA thresholds are evaluated against the student's CGPA. If the student's academic performance meets or exceeds the scholarship's minimum requirement, a score of 100 is awarded; otherwise, a score of 0 is assigned, effectively disqualifying the student from further consideration. This approach ensures that only academically qualified candidates proceed to content-based evaluation, thereby optimizing computational efficiency and maintaining fairness in scholarship allocation. The rule-based mechanism is crucial for establishing baseline eligibility, preventing resource wastage on ineligible candidates, and providing a transparent, objective initial screening layer that complements the more nuanced content-based scoring.
"""

# Content-Based Filtering Module

def calculate_major_compatibility_score(scholarship, student_data):
    # Content-based scoring: program and major openness
    # Score is split: 50% for program openness + 50% for major openness
    # Maximum content-based score = 100%

    req = scholarship.get('requirements', {})
    eligible_courses = scholarship.get('eligibleCourses', []) if isinstance(scholarship.get('eligibleCourses'), list) else []
    eligible_majors = req.get('majors', []) if isinstance(req.get('majors'), list) else []

    # Check for open-to-all indicators in scholarship text
    is_open_to_all_by_keywords = is_open_to_all_scholarship(scholarship)

    # Determine openness for programs and majors separately
    has_no_program_restrictions = len(eligible_courses) == 0
    has_no_major_restrictions = len(eligible_majors) == 0

    is_open_to_all_programs = has_no_program_restrictions or is_open_to_all_by_keywords
    is_open_to_all_majors = has_no_major_restrictions or is_open_to_all_by_keywords

    score = 0

    # Condition 1: Open to all programs AND all majors = 100
    if is_open_to_all_programs and is_open_to_all_majors:
        score = 100
    # Condition 2: Open to all programs ONLY = 50
    elif is_open_to_all_programs and not is_open_to_all_majors:
        score = 50
    # Condition 3: Open to all majors ONLY = 50
    elif not is_open_to_all_programs and is_open_to_all_majors:
        score = 50
    # Condition 4: NOT open to all - check student-specific matching
    else:
        student_major = student_data.get('major') or student_data.get('program') or ''
        major_match = check_major_compatibility(student_major, eligible_courses, eligible_majors)

        if major_match:
            score = 100  # Student's major matches scholarship requirements
        else:
            score = 0  # Student's major doesn't match

    print(f"🎯 Program/Major compatibility for \"{scholarship.get('title', 'Unknown')}\": Programs={is_open_to_all_programs}, Majors={is_open_to_all_majors} -> score: {score}")
    return score

"""
The calculateMajorCompatibilityScore function constitutes the core of the content-based filtering approach, evaluating scholarship suitability based on academic program and major alignment. This method employs a hierarchical scoring system that assesses openness and specificity of scholarship eligibility criteria. Scholarships without restrictions on programs or majors receive higher baseline scores, reflecting their broader accessibility. The scoring mechanism allocates equal weight to program and major openness, with a maximum score of 100 for fully unrestricted scholarships. When specific eligibility criteria are defined, the function performs direct string matching between the student's declared major and the scholarship's eligible courses or majors lists. This content-based evaluation enables personalized recommendations by identifying scholarships that align with the student's academic specialization, thereby enhancing the relevance and effectiveness of the matching process. Such nuanced program-major compatibility analysis is instrumental in providing tailored scholarship opportunities, particularly in diverse educational landscapes where field-specific funding is prevalent.
"""

# Hybrid Recommendation Engine

def calculate_hybrid_score(scholarship, student_data, all_scholarships, options=None):
    if options is None:
        options = {}
    click_data = options.get('clickData', {})
    current_matches = options.get('currentMatches', [])
    index = options.get('index', 0)

    rule_score = calculate_rule_based_score(scholarship, student_data)

    student_profile = student_data.get('fullProfile') or f"{student_data.get('program', '')} {student_data.get('major', '')} {student_data.get('name', '')}".strip()

    content_score = calculate_content_score(
        student_profile,
        scholarship,
        all_scholarships,
        student_data
    )


    # Final score: 50% rule-based + 50% content-based
    hybrid_score = round(
        (rule_score * 0.5) +
        (content_score * 0.5)
    )

    return {
        'totalScore': min(100, max(0, hybrid_score)),
        'breakdown': {
            'ruleBasedScore': round(rule_score * 0.5),
            'contentScore': round(content_score * 0.5)
        },
        'components': {
            'ruleScore': rule_score,
            'contentScore': content_score
        },
        'matchReasons': generate_match_reasons(
            scholarship,
            student_data,
            rule_score,
            content_score
        )
    }

"""
The calculateHybridScore method integrates rule-based and content-based filtering paradigms to produce a comprehensive scholarship recommendation score. This hybrid approach weights rule-based eligibility (focusing on GPA thresholds) and content-based compatibility (emphasizing program and major alignment) equally at 50% each, ensuring a balanced evaluation that considers both objective academic requirements and subjective field relevance. By delegating to specialized scoring functions, the method maintains modularity while generating a unified total score ranging from 0 to 100. The function also constructs detailed match reasons, providing transparency into the scoring rationale by articulating why specific scholarships are deemed suitable or unsuitable for the candidate. This hybrid scoring mechanism is fundamental to the recommendation system as it synthesizes diverse evaluation criteria into a single, interpretable metric, enabling ranked scholarship suggestions that optimize both eligibility precision and personalization. The equal weighting approach reflects an academic design philosophy that values both merit-based qualification and field-specific alignment in scholarship allocation.
"""

# Database Interaction

# Core database query for retrieving active scholarships for recommendation
def get_active_scholarships():
    """
    Retrieve all scholarships with active status for matching process.
    This query is executed prior to hybrid matching to fetch eligible scholarships.
    """
    # MongoDB query equivalent: Scholarship.find({ status: "active" })
    # Returns all scholarships where status equals "active"
    # This is the foundational query used in the /matches/:userId endpoint
    scholarships = Scholarship.objects.filter(status="active")
    return scholarships

"""
This database interaction module exemplifies the core query mechanism for retrieving scholarship recommendations, integrating user profile data with active scholarship records through a hybrid matching process. The endpoint retrieves the authenticated user's academic profile, extracting key attributes such as GPA, major, and program, while constructing a comprehensive student profile for content-based analysis. The critical database operation involves querying the Scholarship collection with a status filter of "active", ensuring that only current and valid scholarship opportunities are considered for matching. This query serves as the foundational data retrieval step in the recommendation pipeline, providing the scholarship dataset that undergoes subsequent hybrid scoring. By fetching active scholarships and preparing student data structures, this module establishes the data pipeline that enables personalized scholarship discovery, demonstrating the integration of database persistence with algorithmic matching logic. The approach optimizes query efficiency by pre-filtering inactive scholarships, thereby reducing computational overhead in the recommendation process.
"""