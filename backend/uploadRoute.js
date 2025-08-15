// 파일 업로드 라우트 (multer 사용)
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// 업로드 폴더 생성
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// multer 설정
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    let originalName = file.originalname;
    try {
      if (/[\x80-\xff]/.test(originalName)) {
        originalName = Buffer.from(originalName, 'binary').toString('utf8');
      }
      if (/[�]/.test(originalName)) {
        originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
      }
    } catch (e) {}
    // 서버에는 타임스탬프+원본명으로 저장 (중복 방지)
    const uniqueName = Date.now() + '_' + originalName;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// POST /api/upload
router.post('/', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '파일이 업로드되지 않았습니다.' });
  }
  // 반환: 파일명, URL
  // 한글 등 특수문자 파일명은 URL 인코딩 필요
  res.json({
    name: req.file.originalname,
    url: '/uploads/' + encodeURIComponent(req.file.filename)
  });
});

// 파일 다운로드 라우트: /api/download/:filename
router.get('/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(uploadDir, filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).send('파일을 찾을 수 없습니다.');
  }
  // 원본 파일명 복원 (타임스탬프_원본명)
  // 다운로드 시 원본 파일명(타임스탬프 제거)만 추천
  let originalName = filename.split('_').slice(1).join('_');
  try {
    originalName = decodeURIComponent(originalName);
  } catch (e) {}
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(originalName)}"; filename*=UTF-8''${encodeURIComponent(originalName)}`);
  res.setHeader('Content-Type', 'application/octet-stream');
  res.sendFile(filePath);
});

module.exports = router;
