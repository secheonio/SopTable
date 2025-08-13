import React, { useState, useContext } from 'react';
import { MenuMatrixContext } from './App';
import * as XLSX from 'xlsx';
import axios from 'axios';

// 헤더명에 해당하는 colMap 키 찾기 (훅 사용 X, 순수 함수)
function getColKeyByHeader(h) {
  if (h === '이름') return 'name';
  if (h === '휴대폰') return 'phone';
  if (h === 'email') return 'email';
  if (h === 'password') return 'password';
  if (h === '구분') return 'role';
  if (h === '직위') return 'position';
  if (h === '학년') return 'grade';
  if (h === '반') return 'class';
  if (h === '번호') return 'number';
  if (h === '권한') return 'level';
  if (h === '과목') return 'subject';
  if (h === '과정') return 'course';
  if (h === '부서') return 'department';
  return h;
}

function ExcelBatchRegister({ fetchUsers }) {
  const menuMatrix = useContext(MenuMatrixContext);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const canExcel = menuMatrix && user && user.role && menuMatrix[user.role] && menuMatrix[user.role].excel;
  const [users, setUsers] = useState([]);
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [header, setHeader] = useState([]); // 엑셀 헤더 저장
  const [report, setReport] = useState(null); // 업로드 결과 리포트

  const handleFile = async e => {
    const f = e.target.files[0];
    setUsers([]);
    setErrors([]);
    if (!f) return;
    setLoading(true);
    try {
      const data = await f.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      const headerRow = rows[0] || [];
      setHeader(headerRow);
      const userRows = rows.slice(1).filter(r => r.length > 0);
      const colMap = {};
      headerRow.forEach((h, i) => {
        if (h === '이름') colMap['name'] = i;
        else if (h === '휴대폰') colMap['phone'] = i;
        else if (h === 'email') colMap['email'] = i;
        else if (h === 'password') colMap['password'] = i;
        else if (h === '구분') colMap['role'] = i;
        else if (h === '직위') colMap['position'] = i;
        else if (h === '학년') colMap['grade'] = i;
        else if (h === '반') colMap['class'] = i;
        else if (h === '번호') colMap['number'] = i;
        else if (h === '권한') colMap['level'] = i;
        else if (h === '과목') colMap['subject'] = i;
        else if (h === '과정') colMap['course'] = i;
        else if (h === '부서') colMap['department'] = i;
      });
      // Required fields for validation
      const required = ['name', 'email', 'password', 'role'];
      const usersToAdd = [];
      const errorList = [];
      userRows.forEach((r, idx) => {
        const u = {};
        Object.keys(colMap).forEach(k => { u[k] = r[colMap[k]] ?? ''; });
        // Validation
        const rowErrors = [];
        required.forEach(field => {
          if (!u[field] || String(u[field]).trim() === '') {
            rowErrors.push(`${field} 필수값 누락`);
          }
        });
        // Email format check (simple)
        if (u.email && !/^\S+@\S+\.\S+$/.test(u.email)) {
          rowErrors.push('email 형식 오류');
        }
        // 번호(학생번호) 숫자 체크 (if present)
        if (u.number && isNaN(Number(u.number))) {
          rowErrors.push('번호는 숫자여야 함');
        }
        if (rowErrors.length > 0) {
          errorList.push({ row: idx + 2, errors: rowErrors, data: u }); // +2 for Excel row number
        }
        usersToAdd.push(u);
      });
      setUsers(usersToAdd);
      setErrors(errorList);
    } catch (err) {
      setReport({ error: '엑셀 처리 오류: ' + (err.message || err) });
      setUsers([]);
      setErrors([]);
    }
    setLoading(false);
  };

  const handleBatch = async () => {
    if (!users.length) return;
    if (errors.length > 0) {
      alert('유효성 오류가 있습니다. 오류를 먼저 해결하세요.');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:4000/api/users/batch-upsert', { users });
      const { inserted, updated, skipped, errors: serverErrors, results } = res.data;
      setReport({
        inserted, updated, skipped, serverErrors, results
      });
      setUsers([]);
      setErrors([]);
      if (fetchUsers) fetchUsers();
    } catch (err) {
      setReport({
        error: err.response?.data?.error || err.message
      });
    }
    setLoading(false);
  };

  // 오류 행만 엑셀로 다운로드하는 실제 구현 (컴포넌트 내부에서 hooks 접근)
  const downloadErrorRows = () => {
    if (!errors.length || !header.length) return;
    const errorRows = errors.map(err => header.map(h => err.data[getColKeyByHeader(h)] ?? ''));
    const exportRows = [header, ...errorRows];
    const ws = XLSX.utils.aoa_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '오류행');
    XLSX.writeFile(wb, '엑셀_오류행_다운로드.xlsx');
  };

  // 리포트 모달 닫기
  const closeReport = () => setReport(null);

  // 예시 엑셀 다운로드
  const downloadSampleExcel = () => {
    const sampleHeader = ['이름', '휴대폰', 'email', 'password', '구분', '직위', '학년', '반', '번호', '권한', '과목', '과정', '부서'];
    const sampleRow = ['홍길동', '010-1234-5678', 'hong@sample.com', '1234', '학생', '대표', '1', '2', '3', 'user', '수학', '정규', '교육부'];
    const ws = XLSX.utils.aoa_to_sheet([sampleHeader, sampleRow]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '예시');
    XLSX.writeFile(wb, '엑셀_업로드_예시.xlsx');
  };

  if (!canExcel) {
    return <div style={{ margin: 40, textAlign: 'center', color: '#b00', fontWeight: 500 }}>엑셀 업로드/다운로드 권한이 없습니다.</div>;
  }
  return (
    <div style={{ marginTop: 18, textAlign: 'center', position: 'relative' }}>
      <label style={{ fontSize: '0.95rem', fontWeight: 500, display: 'block', marginBottom: 6 }}>엑셀 일괄 등록</label>
      <button onClick={downloadSampleExcel} style={{ marginBottom: 8, width: '100%', padding: '6px 0', background: '#e6f7ff', color: '#222', border: '1px solid #91d5ff', borderRadius: 4, fontWeight: 500 }}>
        예시 파일 다운로드
      </button>
      <input type="file" accept=".xlsx,.xls" onChange={handleFile} style={{ width: '100%' }} disabled={loading} />
      {loading && (
        <div style={{ margin: '8px 0', color: '#1890ff', fontWeight: 500 }}>
          <span className="excel-loading-spinner" style={{ display: 'inline-block', width: 18, height: 18, border: '2px solid #91d5ff', borderTop: '2px solid #1890ff', borderRadius: '50%', animation: 'spin 1s linear infinite', marginRight: 8, verticalAlign: 'middle' }} />
          처리중입니다...
        </div>
      )}
      <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
  <button onClick={handleBatch} disabled={!users.length || loading || errors.length > 0} style={{ marginTop: 8, width: '100%', padding: '6px 0' }}>일괄등록</button>
      {errors.length > 0 && (
        <button onClick={downloadErrorRows} style={{ marginTop: 8, width: '100%', padding: '6px 0', background: '#fbb', color: '#222', border: '1px solid #f99', borderRadius: 4, fontWeight: 500 }}>
          오류 행 다운로드
        </button>
      )}
      <div style={{ fontSize: '0.8rem', color: '#888', marginTop: 4 }}>.xlsx 파일, 첫 행은 컬럼명(예: 이름, email 등)</div>

      {/* 업로드 결과 리포트 모달 */}
      {report && (
        <div style={{ position: 'fixed', left: 0, top: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.25)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 8, minWidth: 340, maxWidth: 600, padding: 24, boxShadow: '0 2px 16px #0002', position: 'relative' }}>
            <button onClick={closeReport} style={{ position: 'absolute', right: 16, top: 12, fontSize: 18, background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
            <h3 style={{ margin: 0, marginBottom: 12, fontWeight: 700, fontSize: '1.1rem' }}>엑셀 업로드 결과</h3>
            {report.error ? (
              <div style={{ color: '#b00', marginBottom: 12 }}>오류: {report.error}</div>
            ) : (
              <>
                <div style={{ marginBottom: 10 }}>
                  <b>추가:</b> {report.inserted}명 &nbsp; <b>수정:</b> {report.updated}명 &nbsp; <b>패스:</b> {report.skipped}명 &nbsp; <b>오류:</b> {report.serverErrors && report.serverErrors.length ? report.serverErrors.length : 0}건
                </div>
                {Array.isArray(report.results) && report.results.length > 0 && (
                  <div style={{ maxHeight: 260, overflowY: 'auto', border: '1px solid #eee', borderRadius: 4 }}>
                    <table style={{ width: '100%', fontSize: '0.97em', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#f6f6f6' }}>
                          <th style={{ padding: 4, borderBottom: '1px solid #eee' }}>행</th>
                          <th style={{ padding: 4, borderBottom: '1px solid #eee' }}>상태</th>
                          <th style={{ padding: 4, borderBottom: '1px solid #eee' }}>메시지</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.results.map((r, i) => (
                          <tr key={i} style={{ background: r.status === 'error' ? '#fff6f6' : '#f9fff6' }}>
                            <td style={{ padding: 4, borderBottom: '1px solid #eee', textAlign: 'center' }}>{r.rowNum ?? i + 2}</td>
                            <td style={{ padding: 4, borderBottom: '1px solid #eee', textAlign: 'center' }}>{r.status}</td>
                            <td style={{ padding: 4, borderBottom: '1px solid #eee', color: r.status === 'error' ? '#b00' : '#222' }}>{r.message || (r.status === 'error' ? '오류' : '')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {report.serverErrors && report.serverErrors.length > 0 && (
                  <div style={{ color: '#b00', marginTop: 10 }}>
                    서버 오류: {report.serverErrors.length}건
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
      {errors.length > 0 && (
        <div style={{ marginTop: 12, color: '#b00', fontSize: '0.92rem', textAlign: 'left', maxHeight: 180, overflowY: 'auto', border: '1px solid #fbb', background: '#fff6f6', padding: 8, borderRadius: 4 }}>
          <b>유효성 오류 ({errors.length}건):</b>
          <ul style={{ margin: '6px 0 0 18px', padding: 0 }}>
            {errors.map((err, i) => (
              <li key={i} style={{ marginBottom: 4 }}>
                <span style={{ fontWeight: 500 }}>엑셀 {err.row}행:</span> {err.errors.join(', ')}
                <div style={{ color: '#888', fontSize: '0.85em', marginLeft: 4 }}>{Object.entries(err.data).filter(([k,v])=>v).map(([k,v])=>`${k}: ${v}`).join(', ')}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default ExcelBatchRegister;