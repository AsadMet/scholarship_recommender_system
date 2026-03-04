const express = require('express');
const axios = require('axios');
const fs = require('fs');
const router = express.Router();

const EXTRACTION_URL = process.env.EXTRACTION_SERVICE_URL || 'http://localhost:5001';

// Poll the health endpoint until the service is up or timeout is reached.
// Render free-tier services spin down and need up to 2 minutes to cold-start.
async function waitForExtractionService(maxWaitMs = 150000) {
  const start = Date.now();
  let attempt = 0;
  while (Date.now() - start < maxWaitMs) {
    attempt++;
    try {
      await axios.get(`${EXTRACTION_URL}/health`, { timeout: 10000 });
      console.log(`✅ Extraction service is up (attempt ${attempt})`);
      return true;
    } catch (e) {
      const elapsed = Math.round((Date.now() - start) / 1000);
      console.log(`⏳ Waiting for extraction service... ${elapsed}s elapsed (attempt ${attempt})`);
      await new Promise(resolve => setTimeout(resolve, 6000));
    }
  }
  console.error('❌ Extraction service did not respond within timeout');
  return false;
}

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
      // Wake up the extraction service first (handles Render free-tier cold starts)
      console.log(`🔌 Checking extraction service at ${EXTRACTION_URL}...`);
      const isUp = await waitForExtractionService(150000);

      if (!isUp) {
        return res.status(503).json({
          error: 'Extraction service did not start in time. Please try again in a minute.',
          name: null,
          cgpa: null,
          program: null,
          confidence: { name: 0.0, cgpa: 0.0, program: 0.0 }
        });
      }

      // Call Python extraction service with file contents (not path)
      const response = await axios.post(`${EXTRACTION_URL}/api/extract`, {
        fileContent: fileContent,
        fileName: fileName,
        fileId: fileId
      }, {
        timeout: 120000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Python extraction successful:', response.data);
      res.json(response.data);

    } catch (extractionError) {
      console.error('❌ Python extraction service error:', extractionError.message);

      return res.status(503).json({
        error: 'Extraction service unavailable. Please try again.',
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
