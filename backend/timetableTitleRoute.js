const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const FILE_PATH = path.join(__dirname, 'timetableTitle.json');

router.get('/', (req, res) => {
  if (fs.existsSync(FILE_PATH)) {
    const data = fs.readFileSync(FILE_PATH, 'utf-8');
    try {
      res.json(JSON.parse(data));
    } catch {
      res.json({ title: '시간표' });
    }
  } else {
    res.json({ title: '시간표' });
  }
});

router.post('/', (req, res) => {
  const { title } = req.body;
  if (typeof title !== 'string') {
    return res.status(400).json({ error: 'title must be a string' });
  }
  try {
    fs.writeFileSync(FILE_PATH, JSON.stringify({ title }), 'utf-8');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: '파일 저장 실패', details: err.message });
  }
});

module.exports = router;
