// 사용자 일괄 등록/업데이트 (엑셀 업로드용)
const pool = require('./db');
module.exports = (req, res) => {
  const { users } = req.body;
  if (!Array.isArray(users)) {
    return res.status(400).json({ error: 'users 배열이 필요합니다.' });
  }
  const results = [];
  let errorRows = [];
  let completed = 0;
  users.forEach((user, idx) => {
    // 이메일 중복 체크 후 있으면 update, 없으면 insert
    pool.query('SELECT id FROM user WHERE email = ?', [user.email], (err, rows) => {
      if (err) {
        errorRows.push({ ...user, error: err.message });
        checkDone();
        return;
      }
      if (rows.length > 0) {
        // update
        pool.query(
          'UPDATE user SET name=?, role=?, grade=?, class=?, number=?, phone=?, subject=?, position=?, department=?, course=? WHERE email=?',
          [user.name, user.role, user.grade, user.class, user.number, user.phone, user.subject, user.position, user.department, user.course, user.email],
          (err2) => {
            if (err2) errorRows.push({ ...user, error: err2.message });
            else results.push({ ...user, status: 'updated' });
            checkDone();
          }
        );
      } else {
        // insert
        pool.query(
          'INSERT INTO user (password, name, email, role, grade, class, number, phone, subject, position, department, course) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [user.password || '', user.name, user.email, user.role, user.grade, user.class, user.number, user.phone, user.subject, user.position, user.department, user.course],
          (err2) => {
            if (err2) errorRows.push({ ...user, error: err2.message });
            else results.push({ ...user, status: 'inserted' });
            checkDone();
          }
        );
      }
    });
  });
  function checkDone() {
    completed++;
    if (completed === users.length) {
      res.json({ results, errorRows });
    }
  }
};
