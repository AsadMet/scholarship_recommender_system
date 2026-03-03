const express = require('express');
const axios = require('axios');
const fs = require('fs');
const router = express.Router();

// Extract data from uploaded document
router.post('/', async (req, res) => {
  try {
    console.log('📄 Extract request received:', req.body);

    const { fileId, fileName, filePath } = req.body;

    if (!filePath) {
      return res.status(400).json({
        error: 'Missing file path',
        name: null,
        cgpa: null,
        program: null,
        confidence: { name: 0.0, cgpa: 0.0, program: 0.0 }
      });
    }

    // Read file from disk and encode as base64
    let fileContent;
    try {
      const fileBuffer = fs.readFileSync(filePath);
      fileContent = fileBuffer.toString('base64');
      console.log(`📦 File read successfully: ${filePath} (${fileBuffer.length} bytes)`);
    } catch (readError) {
      console.error('❌ Could not read uploaded file:', readError.message);
      return res.status(400).json({
        error: 'Could not read uploaded file',
        name: null,
        cgpa: null,
        program: null,
        confidence: { name: 0.0, cgpa: 0.0, program: 0.0 }
      });
    }

    try {
      // Call Python extraction service with file contents (not path)
      const EXTRACTION_URL = process.env.EXTRACTION_SERVICE_URL || 'http://localhost:5001';
      const response = await axios.post(`${EXTRACTION_URL}/api/extract`, {
        fileContent: fileContent,
        fileName: fileName,
        fileId: fileId
      }, {
        timeout: 90000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Python extraction successful:', response.data);
      res.json(response.data);

    } catch (extractionError) {
      console.error('❌ Python extraction service error:', extractionError.message);

      if (extractionError.code === 'ECONNREFUSED') {
        console.error('🐍 Python extraction service is not running on port 5001');
        console.error('💡 Start it with: cd extraction-service && python ner_service.py');
      }

      return res.status(503).json({
        error: "Extraction service unavailable. Please start the Python service.",
        name: null,
        cgpa: null,
        program: null,
        confidence: { name: 0.0, cgpa: 0.0, program: 0.0 }
      });
    }

  } catch (error) {
    console.error('❌ Extract route error:', error);
    res.status(500).json({
      error: 'Server error',
      message: error.message,
      name: null,
      cgpa: null,
      program: null,
      confidence: { name: 0.0, cgpa: 0.0, program: 0.0 }
    });
  }
});

module.exports = router;
