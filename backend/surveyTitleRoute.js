const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const SURVEY_TITLE_PATH = path.join(__dirname, 'surveyTitle.json');

// 제목 불러오기
router.get('/', (req, res) => {
  if (fs.existsSync(SURVEY_TITLE_PATH)) {
    const data = fs.readFileSync(SURVEY_TITLE_PATH, 'utf-8');
    try {
      res.json(JSON.parse(data));
    } catch {
      res.json({ title: '수업조사표' });
    }
  } else {
    res.json({ title: '수업조사표' });
  }
});

// 제목 저장하기
router.post('/', (req, res) => {
  const { title } = req.body;
  if (typeof title !== 'string') {
    return res.status(400).json({ error: 'title must be a string' });
  }
  fs.writeFileSync(SURVEY_TITLE_PATH, JSON.stringify({ title }), 'utf-8');
  res.json({ success: true });
});

module.exports = router;
