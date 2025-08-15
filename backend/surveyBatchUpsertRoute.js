const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const SURVEY_DATA_PATH = path.join(__dirname, 'survey.json');

// 수업조사표 일괄 저장/업데이트
router.post('/batch-upsert', (req, res) => {
  const { survey } = req.body;
  if (!Array.isArray(survey)) {
    return res.status(400).json({ error: 'survey 배열이 필요합니다.' });
  }
  try {
    fs.writeFileSync(SURVEY_DATA_PATH, JSON.stringify(survey, null, 2), 'utf-8');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: '파일 저장 실패', details: err.message });
  }
});

// 수업조사표 데이터 조회 (옵션)
router.get('/', (req, res) => {
  if (fs.existsSync(SURVEY_DATA_PATH)) {
    const data = fs.readFileSync(SURVEY_DATA_PATH, 'utf-8');
    try {
      res.json(JSON.parse(data));
    } catch {
      res.json([]);
    }
  } else {
    res.json([]);
  }
});

module.exports = router;
