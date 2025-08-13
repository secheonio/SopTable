module.exports = function(app, pool) {
  // 사용자 일괄 등록/수정 (엑셀 업로드, 이메일 기준)
  app.post('/api/users/batch-upsert', (req, res) => {
    const users = req.body.users;
    if (!Array.isArray(users) || users.length === 0) {
      return res.status(400).json({ error: '등록할 사용자 데이터가 없습니다.' });
    }
    let inserted = 0, updated = 0, skipped = 0, errors = [];
    const fields = ['password','name','email','role','grade','class','number','phone','subject','position','department','course','level'];
    const next = (idx) => {
      if (idx >= users.length) {
        return res.json({ inserted, updated, skipped, errors });
      }
      const u = users[idx];
      // 필수값 누락 검사
      if (!u.email || !u.password || !u.name || !u.role) {
        skipped++;
        errors.push({ idx, email: u.email, error: '필수값 누락' });
        return next(idx + 1);
      }
      // 이메일 형식 검사
      if (!/^\S+@\S+\.\S+$/.test(u.email)) {
        skipped++;
        errors.push({ idx, email: u.email, error: '이메일 형식 오류' });
        return next(idx + 1);
      }
      // 번호(학생번호) 숫자 검사 (값이 있을 때만)
      if (u.number && isNaN(Number(u.number))) {
        skipped++;
        errors.push({ idx, email: u.email, error: '번호는 숫자여야 함' });
        return next(idx + 1);
      }
      pool.query('SELECT * FROM user WHERE email = ?', [u.email], (err, results) => {
        if (err) {
          errors.push({ idx, email: u.email, error: err.message });
          return next(idx + 1);
        }
        if (results.length === 0) {
          // 신규 등록
          pool.query(
            'INSERT INTO user (password, name, email, role, grade, class, number, phone, subject, position, department, course, level) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [u.password, u.name, u.email, u.role, u.grade || null, u.class || null, u.number || null, u.phone || '', u.subject || '', u.position || '', u.department || '', u.course || '', u.level || null],
            (err2) => {
              if (err2) {
                errors.push({ idx, email: u.email, error: err2.message });
              } else {
                inserted++;
              }
              next(idx + 1);
            }
          );
        } else {
          // 기존 사용자: 값이 다르면 update
          const dbUser = results[0];
          let changed = false;
          const updateFields = [];
          const updateValues = [];
          fields.forEach(f => {
            if (typeof u[f] !== 'undefined' && String(u[f] ?? '') !== String(dbUser[f] ?? '')) {
              changed = true;
              updateFields.push(f);
              updateValues.push(u[f]);
            }
          });
          if (changed) {
            const setClause = updateFields.map(f => `${f} = ?`).join(', ');
            updateValues.push(dbUser.id);
            pool.query(
              `UPDATE user SET ${setClause} WHERE id = ?`,
              updateValues,
              (err3) => {
                if (err3) {
                  errors.push({ idx, email: u.email, error: err3.message });
                } else {
                  updated++;
                }
                next(idx + 1);
              }
            );
          } else {
            skipped++;
            next(idx + 1);
          }
        }
      });
    };
    next(0);
  });
};