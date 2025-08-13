// db.js - MySQL 연결 설정 파일
const mysql = require('mysql2');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',      // 본인 MySQL 사용자명
  password: 'gyver@0979',      // 본인 MySQL 비밀번호
  database: 'soptable', // 사용할 데이터베이스명(없으면 생성 필요)
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;
