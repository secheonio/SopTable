// db/data.json 파일 경로

// ...existing code...



// Swagger(OpenAPI) 문서화

// 1. require 구문 (맨 위)
const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const pool = require('./db');
const swaggerUi = require('swagger-ui-express');
const swaggerJSDoc = require('swagger-jsdoc');
const batchUpsert = require('./batchUpsert');

// 2. 변수 선언
const dbDataPath = path.join(__dirname, '../db/data.json');
const roleMenuPath = path.join(__dirname, 'roleMenuStore.json');

// 3. Swagger 설정
const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SopTable API',
      version: '1.0.0',
      description: 'SopTable 백엔드 API 문서 (자동 생성)',
    },
    servers: [{ url: 'http://localhost:4000' }],
  },
  apis: [__filename],
});

// 4. app/PORT 선언
const app = express();
const PORT = 4000;

// 5. 미들웨어/라우트 선언
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(cors());
app.use(express.json());
app.use('/api/survey-title', require('./surveyTitleRoute'));
app.use('/api/plan-title', require('./planTitleRoute'));
app.use('/api/timetable-title', require('./timetableTitleRoute'));
app.use('/api/enroll-title', require('./enrollTitleRoute'));
app.use('/api/record-title', require('./recordTitleRoute'));
// batchUpsertRoute 등록
const batchUpsertRoute = require('./batchUpsertRoute');
batchUpsertRoute(app, pool);

/**
 * @swagger
 * /api/db-data:
 *   get:
 *     summary: db 폴더의 data.json 데이터 조회
 *     responses:
 *       200:
 *         description: 데이터 목록
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
app.get('/api/db-data', (req, res) => {
  fs.readFile(dbDataPath, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'db/data.json 파일을 읽을 수 없습니다.' });
    try {
      const json = JSON.parse(data);
      res.json(json);
    } catch {
      res.status(500).json({ error: 'db/data.json 파일 파싱 오류' });
    }
  });
});

/**
 * @swagger
 * /api/db-data:
 *   post:
 *     summary: db 폴더의 data.json 데이터 저장
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *     responses:
 *       200:
 *         description: 저장 성공
 */
app.post('/api/db-data', (req, res) => {
  const newData = req.body;
  fs.writeFile(dbDataPath, JSON.stringify(newData, null, 2), 'utf8', err => {
    if (err) return res.status(500).json({ error: 'db/data.json 파일 저장 오류' });
    res.json({ success: true });
  });
});

// ...기존의 나머지 app.get/app.post 라우트 및 기능 이어서...

/**
 * @swagger
 * /api/role-menu:
 *   get:
 *     summary: 권한별 메뉴 설정 조회
 *     description: 권한별 메뉴(메뉴별 세부권한) 설정을 반환합니다.
 *     responses:
 *       200:
 *         description: 권한별 메뉴 설정
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */

// 6. 서버 실행
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
app.post('/api/role-menu', (req, res) => {
  const config = req.body;
  const logPath = path.join(__dirname, 'roleMenuLog.json');
  // 1. 기존 설정 읽기
  fs.readFile(roleMenuPath, 'utf8', (err, oldData) => {
    let oldConfig = {};
    if (!err && oldData) {
      try { oldConfig = JSON.parse(oldData); } catch (e) { console.error('[기존 설정 파싱 오류]', e); }
    }
    // 2. 변경 diff 계산
    const changes = [];
    try {
      Object.keys(config).forEach(role => {
        Object.keys(config[role]).forEach(menu => {
          const newPerm = config[role][menu] || {};
          const oldPerm = (oldConfig[role] && oldConfig[role][menu]) || {};
          Object.keys(newPerm).forEach(key => {
            if (newPerm[key] !== oldPerm[key]) {
              changes.push({ role, menu, key, before: oldPerm[key] ?? false, after: newPerm[key] });
            }
          });
        });
      });
    } catch (e) {
      console.error('[변경 diff 계산 오류]', e);
      return res.status(400).json({ error: '입력 데이터 구조 오류', detail: e.message });
    }
    if (changes.length > 0) {
      // 3. 로그 파일에 append
      const logEntry = {
        time: new Date().toISOString(),
        // user: req.user?.email || null, // 추후 프론트에서 전달 시 기록
        changes
      };
      fs.readFile(logPath, 'utf8', (err, logData) => {
        let logs = [];
        if (!err && logData) {
          try { logs = JSON.parse(logData); } catch (e) { console.error('[로그 파일 파싱 오류]', e); }
        }
        logs.push(logEntry);
        fs.writeFile(logPath, JSON.stringify(logs, null, 2), (err) => {
          if (err) console.error('[로그 파일 저장 오류]', err);
        });
      });
    }
    // 4. 실제 저장
    fs.writeFile(roleMenuPath, JSON.stringify(config, null, 2), err => {
      if (err) {
        console.error('[권한별 메뉴 저장 오류]', err);
        return res.status(500).json({ error: '저장 실패', detail: err.message });
      }
      res.json({ success: true });
    });
  });
});

app.get('/', (req, res) => {
  res.send('Backend 서버가 정상적으로 동작합니다!');
});

// 로그인 엔드포인트 (email 기반)
/**
 * @swagger
 * /api/login:
 *   post:
 *     summary: 로그인
 *     description: 이메일과 비밀번호로 로그인합니다.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: 로그인 성공 (사용자 정보 반환)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       401:
 *         description: 로그인 실패
 */
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  if (!email) {
    return res.status(400).json({ error: '이메일을 입력하세요.' });
  }
  // admin 예외 처리: email이 'admin'이면 email='admin' 또는 email='admin@example.com' 모두 허용
  let query, params;
  if (email === 'admin') {
    query = 'SELECT id, name, email, role FROM user WHERE (email = ? OR email = ?) AND password = ?';
    params = ['admin', 'admin@example.com', password ?? ''];
  } else {
    query = 'SELECT id, name, email, role FROM user WHERE email = ? AND password = ?';
    params = [email, password ?? ''];
  }
  pool.query(
    query,
    params,
    (err, results) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (results.length === 0) {
        return res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' });
      }
      res.json(results[0]);
    }
  );
});
/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: 전체 사용자 목록 조회
 *     description: 전체 사용자(학생/교사/관리자) 목록을 반환합니다.
 *     responses:
 *       200:
 *         description: 사용자 목록
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
app.get('/api/users', (req, res) => {
  pool.query(
  'SELECT id, name, email, password, role, level, grade, class, number, phone, subject, position, department, course, created_at FROM user',
  (err, results) => {
    if (err) {
      console.error('DB Error:', err); // 이 줄을 추가
      return res.status(500).json({ error: err.message });
    }
    // 모든 계정에 학생/교사 관련 컬럼이 항상 포함되도록 undefined일 경우 빈 문자열로 보정
    const users = results.map(u => ({
      id: u.id,
      name: u.name || '',
      email: u.email || '',
      password: u.password || '',
      role: u.role || '',
      level: u.level || '',
      grade: (u.grade === null || typeof u.grade === 'undefined') ? '' : String(u.grade),
      class: (u.class === null || typeof u.class === 'undefined') ? '' : String(u.class),
      number: u.number || '',
      phone: u.phone || '',
      subject: u.subject || '',
      position: u.position || '',
      department: u.department || '',
      course: u.course || '',
      created_at: u.created_at
    }));
    res.json(users);
  });
});
// 특정 사용자 조회
/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: 특정 사용자 조회
 *     description: 사용자 ID로 특정 사용자를 조회합니다.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 사용자 정보
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       404:
 *         description: 사용자를 찾을 수 없음
 */
app.get('/api/users/:id', (req, res) => {
  const userId = req.params.id;
  pool.query('SELECT id, name, email, password, role, level, grade, class, number, phone, subject, position, department, course, created_at FROM user WHERE id = ?', [userId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    // 모든 컬럼이 항상 포함되도록 undefined일 경우 빈 문자열로 보정
    const u = results[0];
    res.json({
      id: u.id,
      name: u.name || '',
      email: u.email || '',
      password: u.password || '',
      role: u.role || '',
      level: u.level || '',
      grade: (u.grade === null || typeof u.grade === 'undefined') ? '' : String(u.grade),
      class: (u.class === null || typeof u.class === 'undefined') ? '' : String(u.class),
      number: u.number || '',
      phone: u.phone || '',
      subject: u.subject || '',
      position: u.position || '',
      department: u.department || '',
      course: u.course || '',
      created_at: u.created_at
    });
  });
});

// 사용자 등록 (email 기반)
/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: 사용자 등록
 *     description: 새로운 사용자를 등록합니다.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: 등록 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       409:
 *         description: 중복 이메일
 */
app.post('/api/users', (req, res) => {
  const { password, name, email, role, grade, class: classNum, phone, subject, position, department, course } = req.body;
  // 중복 이메일 체크
  pool.query('SELECT id FROM user WHERE email = ?', [email], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (results.length > 0) {
      return res.status(409).json({ error: '이미 사용 중인 이메일입니다.' });
    }
    // 실제 등록
    pool.query(
      'INSERT INTO user (password, name, email, role, grade, class, phone, subject, position, department, course) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [password, name, email, role, grade, classNum, phone, subject, position, department, course],
      (err2, result) => {
        if (err2) {
          return res.status(500).json({ error: err2.message });
        }
        res.status(201).json({ id: result.insertId, name, email, role, grade, class: classNum, phone, subject, position, department, course });
      }
    );
  });
});

// 사용자 수정 (email 기반)
/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: 사용자 정보 수정
 *     description: 사용자 ID로 사용자 정보를 수정합니다.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: 수정 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       404:
 *         description: 사용자를 찾을 수 없음
 */
app.put('/api/users/:id', (req, res) => {
  const userId = req.params.id;
  const { password, name, email, role, grade, class: classNum, number, phone, subject, position, department, course, level } = req.body;
  // password, level이 undefined가 아니면 업데이트, 아니면 기존값 유지
  let fields = ['name', 'email', 'role', 'grade', 'class', 'number', 'phone', 'subject', 'position', 'department', 'course'];
  let values = [name, email, role, grade, classNum, number, phone, subject, position, department, course];
  if (typeof password !== 'undefined') {
    fields.unshift('password');
    values.unshift(password);
  }
  if (typeof level !== 'undefined') {
    fields.push('level');
    values.push(level);
  }
  const setClause = fields.map(f => `${f} = ?`).join(', ');
  values.push(userId);
  pool.query(
    `UPDATE user SET ${setClause} WHERE id = ?`,
    values,
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json({ id: userId, name, email, role, grade, class: classNum, phone, subject, position, department, course, level });
    }
  );
});

// 사용자 삭제
/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: 사용자 삭제
 *     description: 사용자 ID로 사용자를 삭제합니다.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 삭제 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       404:
 *         description: 사용자를 찾을 수 없음
 */
app.delete('/api/users/:id', (req, res) => {
  const userId = req.params.id;
  pool.query('DELETE FROM user WHERE id = ?', [userId], (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User deleted' });
  });
});

// 전체 사용자 데이터 복원(덮어쓰기)
/**
 * @swagger
 * /api/users/restore:
 *   post:
 *     summary: 전체 사용자 데이터 복원(엑셀)
 *     description: 엑셀로 전체 사용자 데이터를 덮어씁니다. (기존 데이터 삭제 후 일괄 삽입)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *     responses:
 *       200:
 *         description: 복원 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: 잘못된 입력
 */
app.post('/api/users/restore', (req, res) => {
  const users = req.body;
  if (!Array.isArray(users)) {
    return res.status(400).json({ error: '입력 데이터가 배열이 아닙니다.' });
  }
  // 트랜잭션 시작
  pool.getConnection((err, connection) => {
    if (err) return res.status(500).json({ error: 'DB 연결 실패', detail: err.message });
    connection.beginTransaction(async (err) => {
      if (err) { connection.release(); return res.status(500).json({ error: '트랜잭션 시작 실패', detail: err.message }); }
      try {
        // 1. 기존 데이터 전체 삭제
        await new Promise((resolve, reject) => {
          connection.query('DELETE FROM user', (err) => err ? reject(err) : resolve());
        });
        // 2. 새 데이터 일괄 삽입
        if (users.length > 0) {
          const fields = ['id','name','email','password','role','level','grade','class','number','phone','subject','position','department','course'];
          const values = users.map(u => fields.map(f => u[f] ?? ''));
          // id가 0/빈값이면 auto_increment, 아니면 지정
          const sql = 'INSERT INTO user (id, name, email, password, role, level, grade, class, number, phone, subject, position, department, course) VALUES ?';
          await new Promise((resolve, reject) => {
            connection.query(sql, [values], (err) => err ? reject(err) : resolve());
          });
        }
        connection.commit((err) => {
          connection.release();
          if (err) return res.status(500).json({ error: '커밋 실패', detail: err.message });
          res.json({ success: true });
        });
      } catch (e) {
        connection.rollback(() => {
          connection.release();
          res.status(500).json({ error: '복원 실패', detail: e.message });
        });
      }
    });
  });
});
// DB 연결 테스트용 API
app.get('/api/test-db', (req, res) => {
  pool.query('SELECT NOW() AS now', (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ serverTime: results[0].now });
  });
});

/**
 * @swagger
 * /api/role-menu:
 *   get:
 *     summary: 권한별 메뉴 설정 조회
 *     description: 권한별 메뉴(메뉴별 세부권한) 설정을 반환합니다.
 *     responses:
 *       200:
 *         description: 권한별 메뉴 설정
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
app.get('/api/role-menu', (req, res) => {
  fs.readFile(roleMenuPath, 'utf8', (err, data) => {
    if (err) {
      console.error('[권한별 메뉴 설정 파일 읽기 오류]', err);
      return res.status(500).json({ error: '권한별 메뉴 설정 파일을 읽을 수 없습니다.', detail: err.message });
    }
    try {
      const json = JSON.parse(data);
      res.json(json);
    } catch (e) {
      console.error('[권한별 메뉴 설정 파일 파싱 오류]', e);
      res.status(500).json({ error: '권한별 메뉴 설정 파일 파싱 오류', detail: e.message });
    }
  });
});

// 6. 서버 실행
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
app.post('/api/role-menu', (req, res) => {
  const config = req.body;
  const logPath = path.join(__dirname, 'roleMenuLog.json');
  // 1. 기존 설정 읽기
  fs.readFile(roleMenuPath, 'utf8', (err, oldData) => {
    let oldConfig = {};
    if (!err && oldData) {
      try { oldConfig = JSON.parse(oldData); } catch (e) { console.error('[기존 설정 파싱 오류]', e); }
    }
    // 2. 변경 diff 계산
    const changes = [];
    try {
      Object.keys(config).forEach(role => {
        Object.keys(config[role]).forEach(menu => {
          const newPerm = config[role][menu] || {};
          const oldPerm = (oldConfig[role] && oldConfig[role][menu]) || {};
          Object.keys(newPerm).forEach(key => {
            if (newPerm[key] !== oldPerm[key]) {
              changes.push({ role, menu, key, before: oldPerm[key] ?? false, after: newPerm[key] });
            }
          });
        });
      });
    } catch (e) {
      console.error('[변경 diff 계산 오류]', e);
      return res.status(400).json({ error: '입력 데이터 구조 오류', detail: e.message });
    }
    if (changes.length > 0) {
      // 3. 로그 파일에 append
      const logEntry = {
        time: new Date().toISOString(),
        // user: req.user?.email || null, // 추후 프론트에서 전달 시 기록
        changes
      };
      fs.readFile(logPath, 'utf8', (err, logData) => {
        let logs = [];
        if (!err && logData) {
          try { logs = JSON.parse(logData); } catch (e) { console.error('[로그 파일 파싱 오류]', e); }
        }
        logs.push(logEntry);
        fs.writeFile(logPath, JSON.stringify(logs, null, 2), (err) => {
          if (err) console.error('[로그 파일 저장 오류]', err);
        });
      });
    }
    // 4. 실제 저장
    fs.writeFile(roleMenuPath, JSON.stringify(config, null, 2), err => {
      if (err) {
        console.error('[권한별 메뉴 저장 오류]', err);
        return res.status(500).json({ error: '저장 실패', detail: err.message });
      }
      res.json({ success: true });
    });
  });
});

app.get('/', (req, res) => {
  res.send('Backend 서버가 정상적으로 동작합니다!');
});

// 로그인 엔드포인트 (email 기반)
/**
 * @swagger
 * /api/login:
 *   post:
 *     summary: 로그인
 *     description: 이메일과 비밀번호로 로그인합니다.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: 로그인 성공 (사용자 정보 반환)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       401:
 *         description: 로그인 실패
 */
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  if (!email) {
    return res.status(400).json({ error: '이메일을 입력하세요.' });
  }
  // admin 예외 처리: email이 'admin'이면 email='admin' 또는 email='admin@example.com' 모두 허용
  let query, params;
  if (email === 'admin') {
    query = 'SELECT id, name, email, role FROM user WHERE (email = ? OR email = ?) AND password = ?';
    params = ['admin', 'admin@example.com', password ?? ''];
  } else {
    query = 'SELECT id, name, email, role FROM user WHERE email = ? AND password = ?';
    params = [email, password ?? ''];
  }
  pool.query(
    query,
    params,
    (err, results) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (results.length === 0) {
        return res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' });
      }
      res.json(results[0]);
    }
  );
});
/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: 전체 사용자 목록 조회
 *     description: 전체 사용자(학생/교사/관리자) 목록을 반환합니다.
 *     responses:
 *       200:
 *         description: 사용자 목록
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
app.get('/api/users', (req, res) => {
  pool.query(
  'SELECT id, name, email, password, role, level, grade, class, number, phone, subject, position, department, course, created_at FROM user',
  (err, results) => {
    if (err) {
      console.error('DB Error:', err); // 이 줄을 추가
      return res.status(500).json({ error: err.message });
    }
    // 모든 계정에 학생/교사 관련 컬럼이 항상 포함되도록 undefined일 경우 빈 문자열로 보정
    const users = results.map(u => ({
      id: u.id,
      name: u.name || '',
      email: u.email || '',
      password: u.password || '',
      role: u.role || '',
      level: u.level || '',
      grade: (u.grade === null || typeof u.grade === 'undefined') ? '' : String(u.grade),
      class: (u.class === null || typeof u.class === 'undefined') ? '' : String(u.class),
      number: u.number || '',
      phone: u.phone || '',
      subject: u.subject || '',
      position: u.position || '',
      department: u.department || '',
      course: u.course || '',
      created_at: u.created_at
    }));
    res.json(users);
  });
});
// 특정 사용자 조회
/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: 특정 사용자 조회
 *     description: 사용자 ID로 특정 사용자를 조회합니다.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 사용자 정보
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       404:
 *         description: 사용자를 찾을 수 없음
 */
app.get('/api/users/:id', (req, res) => {
  const userId = req.params.id;
  pool.query('SELECT id, name, email, password, role, level, grade, class, number, phone, subject, position, department, course, created_at FROM user WHERE id = ?', [userId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    // 모든 컬럼이 항상 포함되도록 undefined일 경우 빈 문자열로 보정
    const u = results[0];
    res.json({
      id: u.id,
      name: u.name || '',
      email: u.email || '',
      password: u.password || '',
      role: u.role || '',
      level: u.level || '',
      grade: (u.grade === null || typeof u.grade === 'undefined') ? '' : String(u.grade),
      class: (u.class === null || typeof u.class === 'undefined') ? '' : String(u.class),
      number: u.number || '',
      phone: u.phone || '',
      subject: u.subject || '',
      position: u.position || '',
      department: u.department || '',
      course: u.course || '',
      created_at: u.created_at
    });
  });
});

// 사용자 등록 (email 기반)
/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: 사용자 등록
 *     description: 새로운 사용자를 등록합니다.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: 등록 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       409:
 *         description: 중복 이메일
 */
app.post('/api/users', (req, res) => {
  const { password, name, email, role, grade, class: classNum, phone, subject, position, department, course } = req.body;
  // 중복 이메일 체크
  pool.query('SELECT id FROM user WHERE email = ?', [email], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (results.length > 0) {
      return res.status(409).json({ error: '이미 사용 중인 이메일입니다.' });
    }
    // 실제 등록
    pool.query(
      'INSERT INTO user (password, name, email, role, grade, class, phone, subject, position, department, course) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [password, name, email, role, grade, classNum, phone, subject, position, department, course],
      (err2, result) => {
        if (err2) {
          return res.status(500).json({ error: err2.message });
        }
        res.status(201).json({ id: result.insertId, name, email, role, grade, class: classNum, phone, subject, position, department, course });
      }
    );
  });
});

// 사용자 수정 (email 기반)
/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: 사용자 정보 수정
 *     description: 사용자 ID로 사용자 정보를 수정합니다.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: 수정 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       404:
 *         description: 사용자를 찾을 수 없음
 */
app.put('/api/users/:id', (req, res) => {
  const userId = req.params.id;
  const { password, name, email, role, grade, class: classNum, number, phone, subject, position, department, course, level } = req.body;
  // password, level이 undefined가 아니면 업데이트, 아니면 기존값 유지
  let fields = ['name', 'email', 'role', 'grade', 'class', 'number', 'phone', 'subject', 'position', 'department', 'course'];
  let values = [name, email, role, grade, classNum, number, phone, subject, position, department, course];
  if (typeof password !== 'undefined') {
    fields.unshift('password');
    values.unshift(password);
  }
  if (typeof level !== 'undefined') {
    fields.push('level');
    values.push(level);
  }
  const setClause = fields.map(f => `${f} = ?`).join(', ');
  values.push(userId);
  pool.query(
    `UPDATE user SET ${setClause} WHERE id = ?`,
    values,
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json({ id: userId, name, email, role, grade, class: classNum, phone, subject, position, department, course, level });
    }
  );
});

// 사용자 삭제
/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: 사용자 삭제
 *     description: 사용자 ID로 사용자를 삭제합니다.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 삭제 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       404:
 *         description: 사용자를 찾을 수 없음
 */
app.delete('/api/users/:id', (req, res) => {
  const userId = req.params.id;
  pool.query('DELETE FROM user WHERE id = ?', [userId], (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User deleted' });
  });
});

// 전체 사용자 데이터 복원(덮어쓰기)
/**
 * @swagger
 * /api/users/restore:
 *   post:
 *     summary: 전체 사용자 데이터 복원(엑셀)
 *     description: 엑셀로 전체 사용자 데이터를 덮어씁니다. (기존 데이터 삭제 후 일괄 삽입)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *     responses:
 *       200:
 *         description: 복원 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: 잘못된 입력
 */
app.post('/api/users/restore', (req, res) => {
  const users = req.body;
  if (!Array.isArray(users)) {
    return res.status(400).json({ error: '입력 데이터가 배열이 아닙니다.' });
  }
  // 트랜잭션 시작
  pool.getConnection((err, connection) => {
    if (err) return res.status(500).json({ error: 'DB 연결 실패', detail: err.message });
    connection.beginTransaction(async (err) => {
      if (err) { connection.release(); return res.status(500).json({ error: '트랜잭션 시작 실패', detail: err.message }); }
      try {
        // 1. 기존 데이터 전체 삭제
        await new Promise((resolve, reject) => {
          connection.query('DELETE FROM user', (err) => err ? reject(err) : resolve());
        });
        // 2. 새 데이터 일괄 삽입
        if (users.length > 0) {
          const fields = ['id','name','email','password','role','level','grade','class','number','phone','subject','position','department','course'];
          const values = users.map(u => fields.map(f => u[f] ?? ''));
          // id가 0/빈값이면 auto_increment, 아니면 지정
          const sql = 'INSERT INTO user (id, name, email, password, role, level, grade, class, number, phone, subject, position, department, course) VALUES ?';
          await new Promise((resolve, reject) => {
            connection.query(sql, [values], (err) => err ? reject(err) : resolve());
          });
        }
        connection.commit((err) => {
          connection.release();
          if (err) return res.status(500).json({ error: '커밋 실패', detail: err.message });
          res.json({ success: true });
        });
      } catch (e) {
        connection.rollback(() => {
          connection.release();
          res.status(500).json({ error: '복원 실패', detail: e.message });
        });
      }
    });
  });
});
// DB 연결 테스트용 API
app.get('/api/test-db', (req, res) => {
  pool.query('SELECT NOW() AS now', (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ serverTime: results[0].now });
  });
});

/**
 * @swagger
 * /api/role-menu:
 *   get:
 *     summary: 권한별 메뉴 설정 조회
 *     description: 권한별 메뉴(메뉴별 세부권한) 설정을 반환합니다.
 *     responses:
 *       200:
 *         description: 권한별 메뉴 설정
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
app.get('/api/role-menu', (req, res) => {
  fs.readFile(roleMenuPath, 'utf8', (err, data) => {
    if (err) {
      console.error('[권한별 메뉴 설정 파일 읽기 오류]', err);
      return res.status(500).json({ error: '권한별 메뉴 설정 파일을 읽을 수 없습니다.', detail: err.message });
    }
    try {
      const json = JSON.parse(data);
      res.json(json);
    } catch (e) {
      console.error('[권한별 메뉴 설정 파일 파싱 오류]', e);
      res.status(500).json({ error: '권한별 메뉴 설정 파일 파싱 오류', detail: e.message });
    }
  });
});

// 6. 서버 실행
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
app.post('/api/role-menu', (req, res) => {
  const config = req.body;
  const logPath = path.join(__dirname, 'roleMenuLog.json');
  // 1. 기존 설정 읽기
  fs.readFile(roleMenuPath, 'utf8', (err, oldData) => {
    let oldConfig = {};
    if (!err && oldData) {
      try { oldConfig = JSON.parse(oldData); } catch (e) { console.error('[기존 설정 파싱 오류]', e); }
    }
    // 2. 변경 diff 계산
    const changes = [];
    try {
      Object.keys(config).forEach(role => {
        Object.keys(config[role]).forEach(menu => {
          const newPerm = config[role][menu] || {};
          const oldPerm = (oldConfig[role] && oldConfig[role][menu]) || {};
          Object.keys(newPerm).forEach(key => {
            if (newPerm[key] !== oldPerm[key]) {
              changes.push({ role, menu, key, before: oldPerm[key] ?? false, after: newPerm[key] });
            }
          });
        });
      });
    } catch (e) {
      console.error('[변경 diff 계산 오류]', e);
      return res.status(400).json({ error: '입력 데이터 구조 오류', detail: e.message });
    }
    if (changes.length > 0) {
      // 3. 로그 파일에 append
      const logEntry = {
        time: new Date().toISOString(),
        // user: req.user?.email || null, // 추후 프론트에서 전달 시 기록
        changes
      };
      fs.readFile(logPath, 'utf8', (err, logData) => {
        let logs = [];
        if (!err && logData) {
          try { logs = JSON.parse(logData); } catch (e) { console.error('[로그 파일 파싱 오류]', e); }
        }
        logs.push(logEntry);
        fs.writeFile(logPath, JSON.stringify(logs, null, 2), (err) => {
          if (err) console.error('[로그 파일 저장 오류]', err);
        });
      });
    }
    // 4. 실제 저장
    fs.writeFile(roleMenuPath, JSON.stringify(config, null, 2), err => {
      if (err) {
        console.error('[권한별 메뉴 저장 오류]', err);
        return res.status(500).json({ error: '저장 실패', detail: err.message });
      }
      res.json({ success: true });
    });
  });
});

app.get('/', (req, res) => {
  res.send('Backend 서버가 정상적으로 동작합니다!');
});

// 로그인 엔드포인트 (email 기반)
/**
 * @swagger
 * /api/login:
 *   post:
 *     summary: 로그인
 *     description: 이메일과 비밀번호로 로그인합니다.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: 로그인 성공 (사용자 정보 반환)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       401:
 *         description: 로그인 실패
 */
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  if (!email) {
    return res.status(400).json({ error: '이메일을 입력하세요.' });
  }
  // admin 예외 처리: email이 'admin'이면 email='admin' 또는 email='admin@example.com' 모두 허용
  let query, params;
  if (email === 'admin') {
    query = 'SELECT id, name, email, role FROM user WHERE (email = ? OR email = ?) AND password = ?';
    params = ['admin', 'admin@example.com', password ?? ''];
  } else {
    query = 'SELECT id, name, email, role FROM user WHERE email = ? AND password = ?';
    params = [email, password ?? ''];
  }
  pool.query(
    query,
    params,
    (err, results) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (results.length === 0) {
        return res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' });
      }
      res.json(results[0]);
    }
  );
});
/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: 전체 사용자 목록 조회
 *     description: 전체 사용자(학생/교사/관리자) 목록을 반환합니다.
 *     responses:
 *       200:
 *         description: 사용자 목록
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
app.get('/api/users', (req, res) => {
  pool.query(
  'SELECT id, name, email, password, role, level, grade, class, number, phone, subject, position, department, course, created_at FROM user',
  (err, results) => {
    if (err) {
      console.error('DB Error:', err); // 이 줄을 추가
      return res.status(500).json({ error: err.message });
    }
    // 모든 계정에 학생/교사 관련 컬럼이 항상 포함되도록 undefined일 경우 빈 문자열로 보정
    const users = results.map(u => ({
      id: u.id,
      name: u.name || '',
      email: u.email || '',
      password: u.password || '',
      role: u.role || '',
      level: u.level || '',
      grade: (u.grade === null || typeof u.grade === 'undefined') ? '' : String(u.grade),
      class: (u.class === null || typeof u.class === 'undefined') ? '' : String(u.class),
      number: u.number || '',
      phone: u.phone || '',
      subject: u.subject || '',
      position: u.position || '',
      department: u.department || '',
      course: u.course || '',
      created_at: u.created_at
    }));
    res.json(users);
  });
});
// 특정 사용자 조회
/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: 특정 사용자 조회
 *     description: 사용자 ID로 특정 사용자를 조회합니다.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 사용자 정보
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       404:
 *         description: 사용자를 찾을 수 없음
 */
app.get('/api/users/:id', (req, res) => {
  const userId = req.params.id;
  pool.query('SELECT id, name, email, password, role, level, grade, class, number, phone, subject, position, department, course, created_at FROM user WHERE id = ?', [userId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    // 모든 컬럼이 항상 포함되도록 undefined일 경우 빈 문자열로 보정
    const u = results[0];
    res.json({
      id: u.id,
      name: u.name || '',
      email: u.email || '',
      password: u.password || '',
      role: u.role || '',
      level: u.level || '',
      grade: (u.grade === null || typeof u.grade === 'undefined') ? '' : String(u.grade),
      class: (u.class === null || typeof u.class === 'undefined') ? '' : String(u.class),
      number: u.number || '',
      phone: u.phone || '',
      subject: u.subject || '',
      position: u.position || '',
      department: u.department || '',
      course: u.course || '',
      created_at: u.created_at
    });
  });
});

// 사용자 등록 (email 기반)
/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: 사용자 등록
 *     description: 새로운 사용자를 등록합니다.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: 등록 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       409:
 *         description: 중복 이메일
 */
app.post('/api/users', (req, res) => {
  const { password, name, email, role, grade, class: classNum, phone, subject, position, department, course } = req.body;
  // 중복 이메일 체크
  pool.query('SELECT id FROM user WHERE email = ?', [email], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (results.length > 0) {
      return res.status(409).json({ error: '이미 사용 중인 이메일입니다.' });
    }
    // 실제 등록
    pool.query(
      'INSERT INTO user (password, name, email, role, grade, class, phone, subject, position, department, course) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [password, name, email, role, grade, classNum, phone, subject, position, department, course],
      (err2, result) => {
        if (err2) {
          return res.status(500).json({ error: err2.message });
        }
        res.status(201).json({ id: result.insertId, name, email, role, grade, class: classNum, phone, subject, position, department, course });
      }
    );
  });
});

// 사용자 수정 (email 기반)
/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: 사용자 정보 수정
 *     description: 사용자 ID로 사용자 정보를 수정합니다.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: 수정 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       404:
 *         description: 사용자를 찾을 수 없음
 */
app.put('/api/users/:id', (req, res) => {
  const userId = req.params.id;
  const { password, name, email, role, grade, class: classNum, number, phone, subject, position, department, course, level } = req.body;
  // password, level이 undefined가 아니면 업데이트, 아니면 기존값 유지
  let fields = ['name', 'email', 'role', 'grade', 'class', 'number', 'phone', 'subject', 'position', 'department', 'course'];
  let values = [name, email, role, grade, classNum, number, phone, subject, position, department, course];
  if (typeof password !== 'undefined') {
    fields.unshift('password');
    values.unshift(password);
  }
  if (typeof level !== 'undefined') {
    fields.push('level');
    values.push(level);
  }
  const setClause = fields.map(f => `${f} = ?`).join(', ');
  values.push(userId);
  pool.query(
    `UPDATE user SET ${setClause} WHERE id = ?`,
    values,
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json({ id: userId, name, email, role, grade, class: classNum, phone, subject, position, department, course, level });
    }
  );
});

// 사용자 삭제
/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: 사용자 삭제
 *     description: 사용자 ID로 사용자를 삭제합니다.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 삭제 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       404:
 *         description: 사용자를 찾을 수 없음
 */
app.delete('/api/users/:id', (req, res) => {
  const userId = req.params.id;
  pool.query('DELETE FROM user WHERE id = ?', [userId], (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User deleted' });
  });
});

// 전체 사용자 데이터 복원(덮어쓰기)
/**
 * @swagger
 * /api/users/restore:
 *   post:
 *     summary: 전체 사용자 데이터 복원(엑셀)
 *     description: 엑셀로 전체 사용자 데이터를 덮어씁니다. (기존 데이터 삭제 후 일괄 삽입)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *     responses:
 *       200:
 *         description: 복원 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: 잘못된 입력
 */
app.post('/api/users/restore', (req, res) => {
  const users = req.body;
  if (!Array.isArray(users)) {
    return res.status(400).json({ error: '입력 데이터가 배열이 아닙니다.' });
  }
  // 트랜잭션 시작
  pool.getConnection((err, connection) => {
    if (err) return res.status(500).json({ error: 'DB 연결 실패', detail: err.message });
    connection.beginTransaction(async (err) => {
      if (err) { connection.release(); return res.status(500).json({ error: '트랜잭션 시작 실패', detail: err.message }); }
      try {
        // 1. 기존 데이터 전체 삭제
        await new Promise((resolve, reject) => {
          connection.query('DELETE FROM user', (err) => err ? reject(err) : resolve());
        });
        // 2. 새 데이터 일괄 삽입
        if (users.length > 0) {
          const fields = ['id','name','email','password','role','level','grade','class','number','phone','subject','position','department','course'];
          const values = users.map(u => fields.map(f => u[f] ?? ''));
          // id가 0/빈값이면 auto_increment, 아니면 지정
          const sql = 'INSERT INTO user (id, name, email, password, role, level, grade, class, number, phone, subject, position, department, course) VALUES ?';
          await new Promise((resolve, reject) => {
            connection.query(sql, [values], (err) => err ? reject(err) : resolve());
          });
        }
        connection.commit((err) => {
          connection.release();
          if (err) return res.status(500).json({ error: '커밋 실패', detail: err.message });
          res.json({ success: true });
        });
      } catch (e) {
        connection.rollback(() => {
          connection.release();
          res.status(500).json({ error: '복원 실패', detail: e.message });
        });
      }
    });
  });
});
// DB 연결 테스트용 API
app.get('/api/test-db', (req, res) => {
  pool.query('SELECT NOW() AS now', (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ serverTime: results[0].now });
  });
});

/**
 * @swagger
 * /api/role-menu:
 *   get:
 *     summary: 권한별 메뉴 설정 조회
 *     description: 권한별 메뉴(메뉴별 세부권한) 설정을 반환합니다.
 *     responses:
 *       200:
 *         description: 권한별 메뉴 설정
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
app.get('/api/role-menu', (req, res) => {
  fs.readFile(roleMenuPath, 'utf8', (err, data) => {
    if (err) {
      console.error('[권한별 메뉴 설정 파일 읽기 오류]', err);
      return res.status(500).json({ error: '권한별 메뉴 설정 파일을 읽을 수 없습니다.', detail: err.message });
    }
    try {
      const json = JSON.parse(data);
      res.json(json);
    } catch (e) {
      console.error('[권한별 메뉴 설정 파일 파싱 오류]', e);
      res.status(500).json({ error: '권한별 메뉴 설정 파일 파싱 오류', detail: e.message });
    }
  });
});

// 6. 서버 실행
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
app.post('/api/role-menu', (req, res) => {
  const config = req.body;
  const logPath = path.join(__dirname, 'roleMenuLog.json');
  // 1. 기존 설정 읽기
  fs.readFile(roleMenuPath, 'utf8', (err, oldData) => {
    let oldConfig = {};
    if (!err && oldData) {
      try { oldConfig = JSON.parse(oldData); } catch (e) { console.error('[기존 설정 파싱 오류]', e); }
    }
    // 2. 변경 diff 계산
    const changes = [];
    try {
      Object.keys(config).forEach(role => {
        Object.keys(config[role]).forEach(menu => {
          const newPerm = config[role][menu] || {};
          const oldPerm = (oldConfig[role] && oldConfig[role][menu]) || {};
          Object.keys(newPerm).forEach(key => {
            if (newPerm[key] !== oldPerm[key]) {
              changes.push({ role, menu, key, before: oldPerm[key] ?? false, after: newPerm[key] });
            }
          });
        });
      });
    } catch (e) {
      console.error('[변경 diff 계산 오류]', e);
      return res.status(400).json({ error: '입력 데이터 구조 오류', detail: e.message });
    }
    if (changes.length > 0) {
      // 3. 로그 파일에 append
      const logEntry = {
        time: new Date().toISOString(),
        // user: req.user?.email || null, // 추후 프론트에서 전달 시 기록
        changes
      };
      fs.readFile(logPath, 'utf8', (err, logData) => {
        let logs = [];
        if (!err && logData) {
          try { logs = JSON.parse(logData); } catch (e) { console.error('[로그 파일 파싱 오류]', e); }
        }
        logs.push(logEntry);
        fs.writeFile(logPath, JSON.stringify(logs, null, 2), (err) => {
          if (err) console.error('[로그 파일 저장 오류]', err);
        });
      });
    }
    // 4. 실제 저장
    fs.writeFile(roleMenuPath, JSON.stringify(config, null, 2), err => {
      if (err) {
        console.error('[권한별 메뉴 저장 오류]', err);
        return res.status(500).json({ error: '저장 실패', detail: err.message });
      }
      res.json({ success: true });
    });
  });
});

app.get('/', (req, res) => {
  res.send('Backend 서버가 정상적으로 동작합니다!');
});

// 로그인 엔드포인트 (email 기반)
/**
 * @swagger
 * /api/login:
 *   post:
 *     summary: 로그인
 *     description: 이메일과 비밀번호로 로그인합니다.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: 로그인 성공 (사용자 정보 반환)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       401:
 *         description: 로그인 실패
 */
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  if (!email) {
    return res.status(400).json({ error: '이메일을 입력하세요.' });
  }
  // admin 예외 처리: email이 'admin'이면 email='admin' 또는 email='admin@example.com' 모두 허용
  let query, params;
  if (email === 'admin') {
    query = 'SELECT id, name, email, role FROM user WHERE (email = ? OR email = ?) AND password = ?';
    params = ['admin', 'admin@example.com', password ?? ''];
  } else {
    query = 'SELECT id, name, email, role FROM user WHERE email = ? AND password = ?';
    params = [email, password ?? ''];
  }
  pool.query(
    query,
    params,
    (err, results) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (results.length === 0) {
        return res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' });
      }
      res.json(results[0]);
    }
  );
});
/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: 전체 사용자 목록 조회
 *     description: 전체 사용자(학생/교사/관리자) 목록을 반환합니다.
 *     responses:
 *       200:
 *         description: 사용자 목록
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
app.get('/api/users', (req, res) => {
  pool.query(
  'SELECT id, name, email, password, role, level, grade, class, number, phone, subject, position, department, course, created_at FROM user',
  (err, results) => {
    if (err) {
      console.error('DB Error:', err); // 이 줄을 추가
      return res.status(500).json({ error: err.message });
    }
    // 모든 계정에 학생/교사 관련 컬럼이 항상 포함되도록 undefined일 경우 빈 문자열로 보정
    const users = results.map(u => ({
      id: u.id,
      name: u.name || '',
      email: u.email || '',
      password: u.password || '',
      role: u.role || '',
      level: u.level || '',
      grade: (u.grade === null || typeof u.grade === 'undefined') ? '' : String(u.grade),
      class: (u.class === null || typeof u.class === 'undefined') ? '' : String(u.class),
      number: u.number || '',
      phone: u.phone || '',
      subject: u.subject || '',
      position: u.position || '',
      department: u.department || '',
      course: u.course || '',
      created_at: u.created_at
    }));
    res.json(users);
  });
});
// 특정 사용자 조회
/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: 특정 사용자 조회
 *     description: 사용자 ID로 특정 사용자를 조회합니다.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 사용자 정보
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       404:
 *         description: 사용자를 찾을 수 없음
 */
app.get('/api/users/:id', (req, res) => {
  const userId = req.params.id;
  pool.query('SELECT id, name, email, password, role, level, grade, class, number, phone, subject, position, department, course, created_at FROM user WHERE id = ?', [userId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    // 모든 컬럼이 항상 포함되도록 undefined일 경우 빈 문자열로 보정
    const u = results[0];
    res.json({
      id: u.id,
      name: u.name || '',
      email: u.email || '',
      password: u.password || '',
      role: u.role || '',
      level: u.level || '',
      grade: (u.grade === null || typeof u.grade === 'undefined') ? '' : String(u.grade),
      class: (u.class === null || typeof u.class === 'undefined') ? '' : String(u.class),
      number: u.number || '',
      phone: u.phone || '',
      subject: u.subject || '',
      position: u.position || '',
      department: u.department || '',
      course: u.course || '',
      created_at: u.created_at
    });
  });
});

// 사용자 등록 (email 기반)
/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: 사용자 등록
 *     description: 새로운 사용자를 등록합니다.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: 등록 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       409:
 *         description: 중복 이메일
 */
app.post('/api/users', (req, res) => {
  const { password, name, email, role, grade, class: classNum, phone, subject, position, department, course } = req.body;
  // 중복 이메일 체크
  pool.query('SELECT id FROM user WHERE email = ?', [email], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (results.length > 0) {
      return res.status(409).json({ error: '이미 사용 중인 이메일입니다.' });
    }
    // 실제 등록
    pool.query(
      'INSERT INTO user (password, name, email, role, grade, class, phone, subject, position, department, course) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [password, name, email, role, grade, classNum, phone, subject, position, department, course],
      (err2, result) => {
        if (err2) {
          return res.status(500).json({ error: err2.message });
        }
        res.status(201).json({ id: result.insertId, name, email, role, grade, class: classNum, phone, subject, position, department, course });
      }
    );
  });
});

// 사용자 수정 (email 기반)
/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: 사용자 정보 수정
 *     description: 사용자 ID로 사용자 정보를 수정합니다.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: 수정 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       404:
 *         description: 사용자를 찾을 수 없음
 */
app.put('/api/users/:id', (req, res) => {
  const userId = req.params.id;
  const { password, name, email, role, grade, class: classNum, number, phone, subject, position, department, course, level } = req.body;
  // password, level이 undefined가 아니면 업데이트, 아니면 기존값 유지
  let fields = ['name', 'email', 'role', 'grade', 'class', 'number', 'phone', 'subject', 'position', 'department', 'course'];
  let values = [name, email, role, grade, classNum, number, phone, subject, position, department, course];
  if (typeof password !== 'undefined') {
    fields.unshift('password');
    values.unshift(password);
  }
  if (typeof level !== 'undefined') {
    fields.push('level');
    values.push(level);
  }
  const setClause = fields.map(f => `${f} = ?`).join(', ');
  values.push(userId);
  pool.query(
    `UPDATE user SET ${setClause} WHERE id = ?`,
    values,
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json({ id: userId, name, email, role, grade, class: classNum, phone, subject, position, department, course, level });
    }
  );
});

// 사용자 삭제
/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: 사용자 삭제
 *     description: 사용자 ID로 사용자를 삭제합니다.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 삭제 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       404:
 *         description: 사용자를 찾을 수 없음
 */
app.delete('/api/users/:id', (req, res) => {
  const userId = req.params.id;
  pool.query('DELETE FROM user WHERE id = ?', [userId], (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User deleted' });
  });
});

// 전체 사용자 데이터 복원(덮어쓰기)
/**
 * @swagger
 * /api/users/restore:
 *   post:
 *     summary: 전체 사용자 데이터 복원(엑셀)
 *     description: 엑셀로 전체 사용자 데이터를 덮어씁니다. (기존 데이터 삭제 후 일괄 삽입)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *     responses:
 *       200:
 *         description: 복원 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: 잘못된 입력
 */
app.post('/api/users/restore', (req, res) => {
  const users = req.body;
  if (!Array.isArray(users)) {
    return res.status(400).json({ error: '입력 데이터가 배열이 아닙니다.' });
  }
  // 트랜잭션 시작
  pool.getConnection((err, connection) => {
    if (err) return res.status(500).json({ error: 'DB 연결 실패', detail: err.message });
    connection.beginTransaction(async (err) => {
      if (err) { connection.release(); return res.status(500).json({ error: '트랜잭션 시작 실패', detail: err.message }); }
      try {
        // 1. 기존 데이터 전체 삭제
        await new Promise((resolve, reject) => {
          connection.query('DELETE FROM user', (err) => err ? reject(err) : resolve());
        });
        // 2. 새 데이터 일괄 삽입
        if (users.length > 0) {
          const fields = ['id','name','email','password','role','level','grade','class','number','phone','subject','position','department','course'];
          const values = users.map(u => fields.map(f => u[f] ?? ''));
          // id가 0/빈값이면 auto_increment, 아니면 지정
          const sql = 'INSERT INTO user (id, name, email, password, role, level, grade, class, number, phone, subject, position, department, course) VALUES ?';
          await new Promise((resolve, reject) => {
            connection.query(sql, [values], (err) => err ? reject(err) : resolve());
          });
        }
        connection.commit((err) => {
          connection.release();
          if (err) return res.status(500).json({ error: '커밋 실패', detail: err.message });
          res.json({ success: true });
        });
      } catch (e) {
        connection.rollback(() => {
          connection.release();
          res.status(500).json({ error: '복원 실패', detail: e.message });
        });
      }
    });
  });
});
// DB 연결 테스트용 API
app.get('/api/test-db', (req, res) => {
  pool.query('SELECT NOW() AS now', (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ serverTime: results[0].now });
  });
});

/**
 * @swagger
 * /api/role-menu:
 *   get:
 *     summary: 권한별 메뉴 설정 조회
 *     description: 권한별 메뉴(메뉴별 세부권한) 설정을 반환합니다.
 *     responses:
 *       200:
 *         description: 권한별 메뉴 설정
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
app.get('/api/role-menu', (req, res) => {
  fs.readFile(roleMenuPath, 'utf8', (err, data) => {
    if (err) {
      console.error('[권한별 메뉴 설정 파일 읽기 오류]', err);
      return res.status(500).json({ error: '권한별 메뉴 설정 파일을 읽을 수 없습니다.', detail: err.message });
    }
    try {
      const json = JSON.parse(data);
      res.json(json);
    } catch (e) {
      console.error('[권한별 메뉴 설정 파일 파싱 오류]', e);
      res.status(500).json({ error: '권한별 메뉴 설정 파일 파싱 오류', detail: e.message });
    }
  });
});

// 6. 서버 실행
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
app.post('/api/role-menu', (req, res) => {
  const config = req.body;
  const logPath = path.join(__dirname, 'roleMenuLog.json');
  // 1. 기존 설정 읽기
  fs.readFile(roleMenuPath, 'utf8', (err, oldData) => {
    let oldConfig = {};
    if (!err && oldData) {
      try { oldConfig = JSON.parse(oldData); } catch (e) { console.error('[기존 설정 파싱 오류]', e); }
    }
    // 2. 변경 diff 계산
    const changes = [];
    try {
      Object.keys(config).forEach(role => {
        Object.keys(config[role]).forEach(menu => {
          const newPerm = config[role][menu] || {};
          const oldPerm = (oldConfig[role] && oldConfig[role][menu]) || {};
          Object.keys(newPerm).forEach(key => {
            if (newPerm[key] !== oldPerm[key]) {
              changes.push({ role, menu, key, before: oldPerm[key] ?? false, after: newPerm[key] });
            }
          });
        });
      });
    } catch (e) {
      console.error('[변경 diff 계산 오류]', e);
      return res.status(400).json({ error: '입력 데이터 구조 오류', detail: e.message });
    }
    if (changes.length > 0) {
      // 3. 로그 파일에 append
      const logEntry = {
        time: new Date().toISOString(),
        // user: req.user?.email || null, // 추후 프론트에서 전달 시 기록
        changes
      };
      fs.readFile(logPath, 'utf8', (err, logData) => {
        let logs = [];
        if (!err && logData) {
          try { logs = JSON.parse(logData); } catch (e) { console.error('[로그 파일 파싱 오류]', e); }
        }
        logs.push(logEntry);
        fs.writeFile(logPath, JSON.stringify(logs, null, 2), (err) => {
          if (err) console.error('[로그 파일 저장 오류]', err);
        });
      });
    }
    // 4. 실제 저장
    fs.writeFile(roleMenuPath, JSON.stringify(config, null, 2), err => {
      if (err) {
        console.error('[권한별 메뉴 저장 오류]', err);
        return res.status(500).json({ error: '저장 실패', detail: err.message });
      }
      res.json({ success: true });
    });
  });
});

app.get('/', (req, res) => {
  res.send('Backend 서버가 정상적으로 동작합니다!');
});

// 로그인 엔드포인트 (email 기반)
/**
 * @swagger
 * /api/login:
 *   post:
 *     summary: 로그인
 *     description: 이메일과 비밀번호로 로그인합니다.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: 로그인 성공 (사용자 정보 반환)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       401:
 *         description: 로그인 실패
 */
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  if (!email) {
    return res.status(400).json({ error: '이메일을 입력하세요.' });
  }
  // admin 예외 처리: email이 'admin'이면 email='admin' 또는 email='admin@example.com' 모두 허용
  let query, params;
  if (email === 'admin') {
    query = 'SELECT id, name, email, role FROM user WHERE (email = ? OR email = ?) AND password = ?';
    params = ['admin', 'admin@example.com', password ?? ''];
  } else {
    query = 'SELECT id, name, email, role FROM user WHERE email = ? AND password = ?';
    params = [email, password ?? ''];
  }
  pool.query(
    query,
    params,
    (err, results) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (results.length === 0) {
        return res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' });
      }
      res.json(results[0]);
    }
  );
});
/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: 전체 사용자 목록 조회
 *     description: 전체 사용자(학생/교사/관리자) 목록을 반환합니다.
 *     responses:
 *       200:
 *         description: 사용자 목록
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
app.get('/api/users', (req, res) => {
  pool.query(
  'SELECT id, name, email, password, role, level, grade, class, number, phone, subject, position, department, course, created_at FROM user',
  (err, results) => {
    if (err) {
      console.error('DB Error:', err); // 이 줄을 추가
      return res.status(500).json({ error: err.message });
    }
    // 모든 계정에 학생/교사 관련 컬럼이 항상 포함되도록 undefined일 경우 빈 문자열로 보정
    const users = results.map(u => ({
      id: u.id,
      name: u.name || '',
      email: u.email || '',
      password: u.password || '',
      role: u.role || '',
      level: u.level || '',
      grade: (u.grade === null || typeof u.grade === 'undefined') ? '' : String(u.grade),
      class: (u.class === null || typeof u.class === 'undefined') ? '' : String(u.class),
      number: u.number || '',
      phone: u.phone || '',
      subject: u.subject || '',
      position: u.position || '',
      department: u.department || '',
      course: u.course || '',
      created_at: u.created_at
    }));
    res.json(users);
  });
});
// 특정 사용자 조회
/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: 특정 사용자 조회
 *     description: 사용자 ID로 특정 사용자를 조회합니다.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 사용자 정보
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       404:
 *         description: 사용자를 찾을 수 없음
 */
app.get('/api/users/:id', (req, res) => {
  const userId = req.params.id;
  pool.query('SELECT id, name, email, password, role, level, grade, class, number, phone, subject, position, department, course, created_at FROM user WHERE id = ?', [userId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    // 모든 컬럼이 항상 포함되도록 undefined일 경우 빈 문자열로 보정
    const u = results[0];
    res.json({
      id: u.id,
      name: u.name || '',
      email: u.email || '',
      password: u.password || '',
      role: u.role || '',
      level: u.level || '',
      grade: (u.grade === null || typeof u.grade === 'undefined') ? '' : String(u.grade),
      class: (u.class === null || typeof u.class === 'undefined') ? '' : String(u.class),
      number: u.number || '',
      phone: u.phone || '',
      subject: u.subject || '',
      position: u.position || '',
      department: u.department || '',
      course: u.course || '',
      created_at: u.created_at
    });
  });
});

// 사용자 등록 (email 기반)
/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: 사용자 등록
 *     description: 새로운 사용자를 등록합니다.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: 등록 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       409:
 *         description: 중복 이메일
 */
app.post('/api/users', (req, res) => {
  const { password, name, email, role, grade, class: classNum, phone, subject, position, department, course } = req.body;
  // 중복 이메일 체크
  pool.query('SELECT id FROM user WHERE email = ?', [email], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (results.length > 0) {
      return res.status(409).json({ error: '이미 사용 중인 이메일입니다.' });
    }
    // 실제 등록
    pool.query(
      'INSERT INTO user (password, name, email, role, grade, class, phone, subject, position, department, course) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [password, name, email, role, grade, classNum, phone, subject, position, department, course],
      (err2, result) => {
        if (err2) {
          return res.status(500).json({ error: err2.message });
        }
        res.status(201).json({ id: result.insertId, name, email, role, grade, class: classNum, phone, subject, position, department, course });
      }
    );
  });
});

// 사용자 수정 (email 기반)
/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: 사용자 정보 수정
 *     description: 사용자 ID로 사용자 정보를 수정합니다.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: 수정 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       404:
 *         description: 사용자를 찾을 수 없음
 */
app.put('/api/users/:id', (req, res) => {
  const userId = req.params.id;
  const { password, name, email, role, grade, class: classNum, number, phone, subject, position, department, course, level } = req.body;
  // password, level이 undefined가 아니면 업데이트, 아니면 기존값 유지
  let fields = ['name', 'email', 'role', 'grade', 'class', 'number', 'phone', 'subject', 'position', 'department', 'course'];
  let values = [name, email, role, grade, classNum, number, phone, subject, position, department, course];
  if (typeof password !== 'undefined') {
    fields.unshift('password');
    values.unshift(password);
  }
  if (typeof level !== 'undefined') {
    fields.push('level');
    values.push(level);
  }
  const setClause = fields.map(f => `${f} = ?`).join(', ');
  values.push(userId);
  pool.query(
    `UPDATE user SET ${setClause} WHERE id = ?`,
    values,
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json({ id: userId, name, email, role, grade, class: classNum, phone, subject, position, department, course, level });
    }
  );
});

// 사용자 삭제
/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: 사용자 삭제
 *     description: 사용자 ID로 사용자를 삭제합니다.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 삭제 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       404:
 *         description: 사용자를 찾을 수 없음
 */
app.delete('/api/users/:id', (req, res) => {
  const userId = req.params.id;
  pool.query('DELETE FROM user WHERE id = ?', [userId], (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User deleted' });
  });
});

// 전체 사용자 데이터 복원(덮어쓰기)
/**
 * @swagger
 * /api/users/restore:
 *   post:
 *     summary: 전체 사용자 데이터 복원(엑셀)
 *     description: 엑셀로 전체 사용자 데이터를 덮어씁니다. (기존 데이터 삭제 후 일괄 삽입)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *     responses:
 *       200:
 *         description: 복원 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: 잘못된 입력
 */
app.post('/api/users/restore', (req, res) => {
  const users = req.body;
  if (!Array.isArray(users)) {
    return res.status(400).json({ error: '입력 데이터가 배열이 아닙니다.' });
  }
  // 트랜잭션 시작
  pool.getConnection((err, connection) => {
    if (err) return res.status(500).json({ error: 'DB 연결 실패', detail: err.message });
    connection.beginTransaction(async (err) => {
      if (err) { connection.release(); return res.status(500).json({ error: '트랜잭션 시작 실패', detail: err.message }); }
      try {
        // 1. 기존 데이터 전체 삭제
        await new Promise((resolve, reject) => {
          connection.query('DELETE FROM user', (err) => err ? reject(err) : resolve());
        });
        // 2. 새 데이터 일괄 삽입
        if (users.length > 0) {
          const fields = ['id','name','email','password','role','level','grade','class','number','phone','subject','position','department','course'];
          const values = users.map(u => fields.map(f => u[f] ?? ''));
          // id가 0/빈값이면 auto_increment, 아니면 지정
          const sql = 'INSERT INTO user (id, name, email, password, role, level, grade, class, number, phone, subject, position, department, course) VALUES ?';
          await new Promise((resolve, reject) => {
            connection.query(sql, [values], (err) => err ? reject(err) : resolve());
          });
        }
        connection.commit((err) => {
          connection.release();
          if (err) return res.status(500).json({ error: '커밋 실패', detail: err.message });
          res.json({ success: true });
        });
      } catch (e) {
        connection.rollback(() => {
          connection.release();
          res.status(500).json({ error: '복원 실패', detail: e.message });
        });
      }
    });
  });
});
// DB 연결 테스트용 API
app.get('/api/test-db', (req, res) => {
  pool.query('SELECT NOW() AS now', (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ serverTime: results[0].now });
  });
});

/**
 * @swagger
 * /api/role-menu:
 *   get:
 *     summary: 권한별 메뉴 설정 조회
 *     description: 권한별 메뉴(메뉴별 세부권한) 설정을 반환합니다.
 *     responses:
 *       200:
 *         description: 권한별 메뉴 설정
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
app.get('/api/role-menu', (req, res) => {
  fs.readFile(roleMenuPath, 'utf8', (err, data) => {
    if (err) {
      console.error('[권한별 메뉴 설정 파일 읽기 오류]', err);
      return res.status(500).json({ error: '권한별 메뉴 설정 파일을 읽을 수 없습니다.', detail: err.message });
    }
    try {
      const json = JSON.parse(data);
      res.json(json);
    } catch (e) {
      console.error('[권한별 메뉴 설정 파일 파싱 오류]', e);
      res.status(500).json({ error: '권한별 메뉴 설정 파일 파싱 오류', detail: e.message });
    }
  });
});

// 6. 서버 실행
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
app.post('/api/role-menu', (req, res) => {
  const config = req.body;
  const logPath = path.join(__dirname, 'roleMenuLog.json');
  // 1. 기존 설정 읽기
  fs.readFile(roleMenuPath, 'utf8', (err, oldData) => {
    let oldConfig = {};
    if (!err && oldData) {
      try { oldConfig = JSON.parse(oldData); } catch (e) { console.error('[기존 설정 파싱 오류]', e); }
    }
    // 2. 변경 diff 계산
    const changes = [];
    try {
      Object.keys(config).forEach(role => {
        Object.keys(config[role]).forEach(menu => {
          const newPerm = config[role][menu] || {};
          const oldPerm = (oldConfig[role] && oldConfig[role][menu]) || {};
          Object.keys(newPerm).forEach(key => {
            if (newPerm[key] !== oldPerm[key]) {
              changes.push({ role, menu, key, before: oldPerm[key] ?? false, after: newPerm[key] });
            }
          });
        });
      });
    } catch (e) {
      console.error('[변경 diff 계산 오류]', e);
      return res.status(400).json({ error: '입력 데이터 구조 오류', detail: e.message });
    }
    if (changes.length > 0) {
      // 3. 로그 파일에 append
      const logEntry = {
        time: new Date().toISOString(),
        // user: req.user?.email || null, // 추후 프론트에서 전달 시 기록
        changes
      };
      fs.readFile(logPath, 'utf8', (err, logData) => {
        let logs = [];
        if (!err && logData) {
          try { logs = JSON.parse(logData); } catch (e) { console.error('[로그 파일 파싱 오류]', e); }
        }
        logs.push(logEntry);
        fs.writeFile(logPath, JSON.stringify(logs, null, 2), (err) => {
          if (err) console.error('[로그 파일 저장 오류]', err);
        });
      });
    }
    // 4. 실제 저장
    fs.writeFile(roleMenuPath, JSON.stringify(config, null, 2), err => {
      if (err) {
        console.error('[권한별 메뉴 저장 오류]', err);
        return res.status(500).json({ error: '저장 실패', detail: err.message });
      }
      res.json({ success: true });
    });
  });
});

app.get('/', (req, res) => {
  res.send('Backend 서버가 정상적으로 동작합니다!');
});

// 로그인 엔드포인트 (email 기반)
/**
 * @swagger
 * /api/login:
 *   post:
 *     summary: 로그인
 *     description: 이메일과 비밀번호로 로그인합니다.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: 로그인 성공 (사용자 정보 반환)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       401:
 *         description: 로그인 실패
 */
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  if (!email) {
    return res.status(400).json({ error: '이메일을 입력하세요.' });
  }
  // admin 예외 처리: email이 'admin'이면 email='admin' 또는 email='admin@example.com' 모두 허용
  let query, params;
  if (email === 'admin') {
    query = 'SELECT id, name, email, role FROM user WHERE (email = ? OR email = ?) AND password = ?';
    params = ['admin', 'admin@example.com', password ?? ''];
  } else {
    query = 'SELECT id, name, email, role FROM user WHERE email = ? AND password = ?';
    params = [email, password ?? ''];
  }
  pool.query(
    query,
    params,
    (err, results) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (results.length === 0) {
        return res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' });
      }
      res.json(results[0]);
    }
  );
});
/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: 전체 사용자 목록 조회
 *     description: 전체 사용자(학생/교사/관리자) 목록을 반환합니다.
 *     responses:
 *       200:
 *         description: 사용자 목록
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
app.get('/api/users', (req, res) => {
  pool.query(
  'SELECT id, name, email, password, role, level, grade, class, number, phone, subject, position, department, course, created_at FROM user',
  (err, results) => {
    if (err) {
      console.error('DB Error:', err); // 이 줄을 추가
      return res.status(500).json({ error: err.message });
    }
    // 모든 계정에 학생/교사 관련 컬럼이 항상 포함되도록 undefined일 경우 빈 문자열로 보정
    const users = results.map(u => ({
      id: u.id,
      name: u.name || '',
      email: u.email || '',
      password: u.password || '',
      role: u.role || '',
      level: u.level || '',
      grade: (u.grade === null || typeof u.grade === 'undefined') ? '' : String(u.grade),
      class: (u.class === null || typeof u.class === 'undefined') ? '' : String(u.class),
      number: u.number || '',
      phone: u.phone || '',
      subject: u.subject || '',
      position: u.position || '',
      department: u.department || '',
      course: u.course || '',
      created_at: u.created_at
    }));
    res.json(users);
  });
});
// 특정 사용자 조회
/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: 특정 사용자 조회
 *     description: 사용자 ID로 특정 사용자를 조회합니다.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 사용자 정보
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       404:
 *         description: 사용자를 찾을 수 없음
 */
app.get('/api/users/:id', (req, res) => {
  const userId = req.params.id;
  pool.query('SELECT id, name, email, password, role, level, grade, class, number, phone, subject, position, department, course, created_at FROM user WHERE id = ?', [userId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    // 모든 컬럼이 항상 포함되도록 undefined일 경우 빈 문자열로 보정
    const u = results[0];
    res.json({
      id: u.id,
      name: u.name || '',
      email: u.email || '',
      password: u.password || '',
      role: u.role || '',
      level: u.level || '',
      grade: (u.grade === null || typeof u.grade === 'undefined') ? '' : String(u.grade),
      class: (u.class === null || typeof u.class === 'undefined') ? '' : String(u.class),
      number: u.number || '',
      phone: u.phone || '',
      subject: u.subject || '',
      position: u.position || '',
      department: u.department || '',
      course: u.course || '',
      created_at: u.created_at
    });
  });
});

// 사용자 등록 (email 기반)
/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: 사용자 등록
 *     description: 새로운 사용자를 등록합니다.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: 등록 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       409:
 *         description: 중복 이메일
 */
app.post('/api/users', (req, res) => {
  const { password, name, email, role, grade, class: classNum, phone, subject, position, department, course } = req.body;
  // 중복 이메일 체크
  pool.query('SELECT id FROM user WHERE email = ?', [email], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (results.length > 0) {
      return res.status(409).json({ error: '이미 사용 중인 이메일입니다.' });
    }
    // 실제 등록
    pool.query(
      'INSERT INTO user (password, name, email, role, grade, class, phone, subject, position, department, course) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [password, name, email, role, grade, classNum, phone, subject, position, department, course],
      (err2, result) => {
        if (err2) {
          return res.status(500).json({ error: err2.message });
        }
        res.status(201).json({ id: result.insertId, name, email, role, grade, class: classNum, phone, subject, position, department, course });
      }
    );
  });
});

// 사용자 수정 (email 기반)
/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: 사용자 정보 수정
 *     description: 사용자 ID로 사용자 정보를 수정합니다.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: 수정 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       404:
 *         description: 사용자를 찾을 수 없음
 */
app.put('/api/users/:id', (req, res) => {
  const userId = req.params.id;
  const { password, name, email, role, grade, class: classNum, number, phone, subject, position, department, course, level } = req.body;
  // password, level이 undefined가 아니면 업데이트, 아니면 기존값 유지
  let fields = ['name', 'email', 'role', 'grade', 'class', 'number', 'phone', 'subject', 'position', 'department', 'course'];
  let values = [name, email, role, grade, classNum, number, phone, subject, position, department, course];
  if (typeof password !== 'undefined') {
    fields.unshift('password');
    values.unshift(password);
  }
  if (typeof level !== 'undefined') {
    fields.push('level');
    values.push(level);
  }
  const setClause = fields.map(f => `${f} = ?`).join(', ');
  values.push(userId);
  pool.query(
    `UPDATE user SET ${setClause} WHERE id = ?`,
    values,
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json({ id: userId, name, email, role, grade, class: classNum, phone, subject, position, department, course, level });
    }
  );
});

// 사용자 삭제
/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: 사용자 삭제
 *     description: 사용자 ID로 사용자를 삭제합니다.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 삭제 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       404:
 *         description: 사용자를 찾을 수 없음
 */
app.delete('/api/users/:id', (req, res) => {
  const userId = req.params.id;
  pool.query('DELETE FROM user WHERE id = ?', [userId], (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User deleted' });
  });
});

// 전체 사용자 데이터 복원(덮어쓰기)
/**
 * @swagger
 * /api/users/restore:
 *   post:
 *     summary: 전체 사용자 데이터 복원(엑셀)
 *     description: 엑셀로 전체 사용자 데이터를 덮어씁니다. (기존 데이터 삭제 후 일괄 삽입)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *     responses:
 *       200:
 *         description: 복원 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: 잘못된 입력
 */
app.post('/api/users/restore', (req, res) => {
  const users = req.body;
  if (!Array.isArray(users)) {
    return res.status(400).json({ error: '입력 데이터가 배열이 아닙니다.' });
  }
  // 트랜잭션 시작
  pool.getConnection((err, connection) => {
    if (err) return res.status(500).json({ error: 'DB 연결 실패', detail: err.message });
    connection.beginTransaction(async (err) => {
      if (err) { connection.release(); return res.status(500).json({ error: '트랜잭션 시작 실패', detail: err.message }); }
      try {
        // 1. 기존 데이터 전체 삭제
        await new Promise((resolve, reject) => {
          connection.query('DELETE FROM user', (err) => err ? reject(err) : resolve());
        });
        // 2. 새 데이터 일괄 삽입
        if (users.length > 0) {
          const fields = ['id','name','email','password','role','level','grade','class','number','phone','subject','position','department','course'];
          const values = users.map(u => fields.map(f => u[f] ?? ''));
          // id가 0/빈값이면 auto_increment, 아니면 지정
          const sql = 'INSERT INTO user (id, name, email, password, role, level, grade, class, number, phone, subject, position, department, course) VALUES ?';
          await new Promise((resolve, reject) => {
            connection.query(sql, [values], (err) => err ? reject(err) : resolve());
          });
        }
        connection.commit((err) => {
          connection.release();
          if (err) return res.status(500).json({ error: '커밋 실패', detail: err.message });
          res.json({ success: true });
        });
      } catch (e) {
        connection.rollback(() => {
          connection.release();
          res.status(500).json({ error: '복원 실패', detail: e.message });
        });
      }
    });
  });
});
// DB 연결 테스트용 API
app.get('/api/test-db', (req, res) => {
  pool.query('SELECT NOW() AS now', (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ serverTime: results[0].now });
  });
});

/**
 * @swagger
 * /api/role-menu:
 *   get:
 *     summary: 권한별 메뉴 설정 조회
 *     description: 권한별 메뉴(메뉴별 세부권한) 설정을 반환합니다.
 *     responses:
 *       200:
 *         description: 권한별 메뉴 설정
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
app.get('/api/role-menu', (req, res) => {
  fs.readFile(roleMenuPath, 'utf8', (err, data) => {
    if (err) {
      console.error('[권한별 메뉴 설정 파일 읽기 오류]', err);
      return res.status(500).json({ error: '권한별 메뉴 설정 파일을 읽을 수 없습니다.', detail: err.message });
    }
    try {
      const json = JSON.parse(data);
      res.json(json);
    } catch (e) {
      console.error('[권한별 메뉴 설정 파일 파싱 오류]', e);
      res.status(500).json({ error: '권한별 메뉴 설정 파일 파싱 오류', detail: e.message });
    }
  });
});

// 6. 서버 실행
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
