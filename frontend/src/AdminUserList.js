import ExcelBatchRegister from './ExcelBatchRegister';
import * as XLSX from 'xlsx';
import React, { useEffect, useState, useCallback, useContext } from 'react';
import { MenuMatrixContext } from './App';
import axios from 'axios';
import AdminUserForm from './AdminUserForm';

// 전체 데이터 백업(엑셀) 함수
async function downloadAllUsersExcel() {
  try {
    const res = await axios.get('http://localhost:4000/api/users');
    if (!Array.isArray(res.data)) throw new Error('데이터 없음');
    const users = res.data;
    // 헤더 및 데이터 구성 (학생/교사 통합)
    const headers = ['id','name','phone','email','password','role','position','grade','class','number','subject','course','department','level'];
    const headerLabels = ['일련번호','이름','휴대폰','email','password','구분','직위','학년','반','번호','과목','과정','부서','권한'];
    const data = users.map(u => headers.map(h => u[h] ?? ''));
    const ws = XLSX.utils.aoa_to_sheet([headerLabels, ...data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '전체사용자');
    XLSX.writeFile(wb, '전체사용자_백업.xlsx');
  } catch (err) {
    alert('백업 실패: ' + (err.response?.data?.error || err.message));
  }
}

// 전체 데이터 복원(엑셀) 함수
async function restoreAllUsersFromExcel(file, setNotify, fetchUsers) {
  try {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        if (!rows || rows.length < 2) throw new Error('엑셀 데이터가 비어있습니다.');
        const header = rows[0];
        const body = rows.slice(1);
        // 헤더 매핑
        const fieldMap = {
          '일련번호': 'id', '이름': 'name', '휴대폰': 'phone', 'email': 'email', 'password': 'password',
          '구분': 'role', '직위': 'position', '학년': 'grade', '반': 'class', '번호': 'number',
          '과목': 'subject', '과정': 'course', '부서': 'department', '권한': 'level'
        };
        const fields = header.map(h => fieldMap[h] || h);
        const users = body.map(row => {
          const u = {};
          fields.forEach((f, i) => { u[f] = row[i]; });
          return u;
        });
        // 서버로 전송 (덮어쓰기)
        await axios.post('http://localhost:4000/api/users/restore', users);
        setNotify({ type: 'success', message: '전체 데이터 복원이 완료되었습니다.' });
        fetchUsers && fetchUsers();
      } catch (err) {
        setNotify({ type: 'error', message: '복원 실패: ' + (err.response?.data?.error || err.message) });
      }
    };
    reader.readAsArrayBuffer(file);
  } catch (err) {
    setNotify({ type: 'error', message: '복원 실패: ' + (err.response?.data?.error || err.message) });
  }
}


function AdminUserList({ user, hideTitle }) {
  const menuMatrixCtx = useContext(MenuMatrixContext);
  // 세부 권한 체크 변수 선언
  const canStudentRead = menuMatrixCtx && user && user.role && menuMatrixCtx[user.role] && menuMatrixCtx[user.role].student && menuMatrixCtx[user.role].student.read;
  const canStudentWrite = menuMatrixCtx && user && user.role && menuMatrixCtx[user.role] && menuMatrixCtx[user.role].student && menuMatrixCtx[user.role].student.write;
  const canStudentDelete = menuMatrixCtx && user && user.role && menuMatrixCtx[user.role] && menuMatrixCtx[user.role].student && menuMatrixCtx[user.role].student.delete;
  // 권한별 메뉴 상태(설정용, 세부 권한 구조와 일치)
  const defaultMenuMatrix = {
    student: {
      student: { read: true, write: true, delete: true },
      grade: { read: true, write: true },
      teacher: { read: false, write: false },
      excel: { upload: false, download: false },
      setting: { config: false },
      info: { read: true }
    },
    professor: {
      student: { read: true, write: true, delete: false },
      grade: { read: true, write: false },
      teacher: { read: false, write: false },
      excel: { upload: true, download: true },
      setting: { config: false },
      info: { read: true }
    },
    admin: {
      student: { read: true, write: true, delete: true },
      grade: { read: true, write: true },
      teacher: { read: true, write: true, delete: true },
      excel: { upload: true, download: true },
      setting: { config: true },
      info: { read: true }
    },
    subadmin: {
      student: { read: true, write: true, delete: false },
      grade: { read: true, write: true },
      teacher: { read: true, write: false, delete: false },
      excel: { upload: true, download: true },
      setting: { config: false },
      info: { read: true }
    }
  };
  const [menuMatrixState, setMenuMatrixState] = useState(defaultMenuMatrix);
  const [menuLoading, setMenuLoading] = useState(false);
  const [menuSaved, setMenuSaved] = useState(false);

  // 메뉴 권한 불러오기
  useEffect(() => {
    setMenuLoading(true);
    axios.get('/api/role-menu').then(res => {
      if (res.data && typeof res.data === 'object') setMenuMatrixState(res.data);
    }).catch(()=>{}).finally(()=>setMenuLoading(false));
  }, []);

  // 메뉴 권한 저장
  const handleMenuSave = async () => {
    setMenuLoading(true);
    setMenuSaved(false);
    try {
      await axios.post('/api/role-menu', menuMatrixState);
      // 저장 후 최신 권한 정보 다시 불러오기
      const res = await axios.get('/api/role-menu');
      if (res.data && typeof res.data === 'object') setMenuMatrixState(res.data);
      setMenuSaved(true);
      setNotify({ type: 'success', message: '권한 설정이 저장되었습니다.' });
    } catch (err) {
      setNotify({ type: 'error', message: '저장 실패: ' + (err.response?.data?.error || err.message) });
    }
    setMenuLoading(false);
  };

  // 체크박스 변경 핸들러
  // 세부 권한 체크박스 변경 핸들러
  const handleDetailMenuCheck = (role, menu, detailKey) => {
    setMenuMatrixState(prev => ({
      ...prev,
      [role]: {
        ...prev[role],
        [menu]: {
          ...prev[role][menu],
          [detailKey]: !prev[role][menu]?.[detailKey]
        }
      }
    }));
    setMenuSaved(false);
  };

  // 필터 상태
  const [filterGrade, setFilterGrade] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterRole, setFilterRole] = useState('');
  // --- State declarations first ---
  const [users, setUsers] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]); // 다중 선택
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({ username: '', name: '', email: '', password: '', role: 'student', grade: '', class: '', phone: '', subject: '', position: '', department: '', course: '', level: '' });
  const [editError, setEditError] = useState(null);
  const [tab, setTab] = useState('student'); // 'student', 'professor', or 'all'
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 15;
  const [bulkLevel, setBulkLevel] = useState('1');
  const [notify, setNotify] = useState(null); // {type: 'success'|'error', message: string}
  const [excelMenuOpen, setExcelMenuOpen] = useState(false);
  const [detailUser, setDetailUser] = useState(null);
  const [pwEditId, setPwEditId] = useState(null);
  const [pwEditValue, setPwEditValue] = useState('');
  const [bulkPw, setBulkPw] = useState('');
  const [bulkPwMode, setBulkPwMode] = useState(false);
  const [bulkGrade, setBulkGrade] = useState('');
  const [bulkClass, setBulkClass] = useState('');
  const [bulkNumberMode, setBulkNumberMode] = useState(false);

  // --- Derived variables below ---
  // 검색/탭 필터링
  const filteredUsers = users.filter(u => {
    // 탭 필터
    if (tab === 'student' && u.role !== 'student') return false;
    if (tab === 'professor' && u.role !== 'professor') return false;
    // 검색 필터
    if (search && !(u.name?.includes(search) || u.email?.includes(search))) return false;
    return true;
  });

  // 페이징
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const pagedUsers = filteredUsers.slice((page - 1) * pageSize, page * pageSize);

  // 전체 선택 체크박스
  const allChecked = pagedUsers.length > 0 && pagedUsers.every(u => selectedIds.includes(u.id));
  const someChecked = pagedUsers.some(u => selectedIds.includes(u.id)) && !allChecked;
  const handleCheckAll = e => {
    if (e.target.checked) {
      // 현재 페이지의 모든 id 추가
      setSelectedIds(prev => Array.from(new Set([...prev, ...pagedUsers.map(u => u.id)])));
    } else {
      // 현재 페이지의 id만 제거
      setSelectedIds(prev => prev.filter(id => !pagedUsers.some(u => u.id === id)));
    }
  };

  const handleDownloadExcel = (mode = 'filtered') => {
    // mode: 'filtered' = 전체(검색/필터 반영), 'page' = 현재페이지, 'all' = 전체원본
    let dataSource = [];
    if (mode === 'filtered') dataSource = filteredUsers;
    else if (mode === 'page') dataSource = pagedUsers;
    else dataSource = users;
    const headers = tab === 'student'
      ? ['id','name','phone','email','password','role','position','grade','class','number','level']
      : ['id','name','phone','email','password','role','position','subject','course','department','level'];
    const headerLabels = tab === 'student'
      ? ['일련번호','이름','휴대폰','email','password','구분','직위','학년','반','번호','권한']
      : ['일련번호','이름','휴대폰','email','password','구분','직위','과목','과정','부서','권한'];
    const data = dataSource.map(u => headers.map(h => u[h] ?? ''));
    const ws = XLSX.utils.aoa_to_sheet([headerLabels, ...data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, tab === 'student' ? '학생목록' : '교사목록');
    XLSX.writeFile(wb, (tab === 'student' ? '학생목록' : '교사목록') + '.xlsx');
    setExcelMenuOpen(false);
  };

  // 역할 필터는 탭에 따라 자동으로 맞춤

  const fetchUsers = useCallback(() => {
    setLoading(true);
    axios.get('http://localhost:4000/api/users')
      .then(res => {
        setUsers(res.data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // 권한 변경 이력(로그) 조회용
  const [roleMenuLogs, setRoleMenuLogs] = useState([]);
  useEffect(() => {
    axios.get('/api/role-menu-log').then(res => {
      if (Array.isArray(res.data)) setRoleMenuLogs(res.data);
    }).catch(() => {});
  }, []);

  // 체크박스 변경 핸들러
  const handleCheckOne = (id) => e => {
    if (e.target.checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(i => i !== id));
    }
  };

  const handleDelete = async (id) => {
    const ok = window.confirm('정말로 이 사용자를 삭제하시겠습니까?\n삭제 후에는 복구할 수 없습니다.');
    if (!ok) return;
    try {
      await axios.delete(`http://localhost:4000/api/users/${id}`);
      setNotify({ type: 'success', message: '삭제가 완료되었습니다.' });
      fetchUsers();
    } catch (err) {
      setNotify({ type: 'error', message: '삭제 실패: ' + (err.response?.data?.error || err.message) });
    }
  };

  // 일괄 삭제
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    const ok = window.confirm(`정말로 ${selectedIds.length}명의 사용자를 삭제하시겠습니까?\n삭제 후에는 복구할 수 없습니다.`);
    if (!ok) return;
    try {
      for (const id of selectedIds) {
        await axios.delete(`http://localhost:4000/api/users/${id}`);
      }
      setNotify({ type: 'success', message: '일괄 삭제가 완료되었습니다.' });
      setSelectedIds([]);
      fetchUsers();
    } catch (err) {
      setNotify({ type: 'error', message: '일괄 삭제 실패: ' + (err.response?.data?.error || err.message) });
    }
  };

  // 일괄 권한 변경
  const handleBulkLevelChange = e => setBulkLevel(e.target.value);
  const handleBulkLevelApply = async () => {
    if (selectedIds.length === 0) return;
    const ok = window.confirm(`선택한 ${selectedIds.length}명의 권한을 ${bulkLevel === '5' ? '부관리자' : bulkLevel}로 변경하시겠습니까?`);
    if (!ok) return;
    try {
      for (const id of selectedIds) {
        await axios.put(`http://localhost:4000/api/users/${id}`, { level: bulkLevel });
      }
      setNotify({ type: 'success', message: '일괄 권한 변경이 완료되었습니다.' });
      setSelectedIds([]);
      fetchUsers();
    } catch (err) {
      setNotify({ type: 'error', message: '일괄 권한 변경 실패: ' + (err.response?.data?.error || err.message) });
    }
  };

  const handleEditClick = (user) => {
    setEditId(user.id);
    setEditForm({
      username: user.username,
      name: user.name,
      email: user.email,
      password: user.password || '',
      role: user.role,
      grade: user.grade || '',
      class: user.class || '',
      number: user.number || '',
      phone: user.phone || '',
      subject: user.subject || '',
      position: user.position || '',
      department: user.department || '',
      course: user.course || '',
      level: user.level || ''
    });
    setEditError(null);
  };

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  // 수정 폼 제출: AdminUserForm에서 form 객체를 직접 받음
  const handleEditSubmit = async (form) => {
    setEditError(null);
    const patch = { ...form };
    ['grade', 'class', 'number', 'level'].forEach(f => {
      if (patch[f] === '') patch[f] = null;
    });
    if (patch.password === '') {
      delete patch.password;
    }
    try {
      await axios.put(`http://localhost:4000/api/users/${editId}`, patch);
      setNotify({ type: 'success', message: '수정이 완료되었습니다.' });
      setEditId(null);
      fetchUsers();
    } catch (err) {
      setNotify({ type: 'error', message: '수정 실패: ' + (err.response?.data?.error || err.message) });
    }
  };

  // 알림바 자동 숨김
  React.useEffect(() => {
    if (notify) {
      const timer = setTimeout(() => setNotify(null), 2500);
      return () => clearTimeout(timer);
    }
  }, [notify]);

  // 전체 권한 일괄 적용 핸들러
  const handleBulkPermission = (detailKey, value) => {
    setMenuMatrixState(prev => {
      const newState = { ...prev };
      Object.keys(newState).forEach(role => {
        Object.keys(newState[role]).forEach(menu => {
          if (newState[role][menu] && Object.prototype.hasOwnProperty.call(newState[role][menu], detailKey)) {
            newState[role][menu] = { ...newState[role][menu], [detailKey]: value };
          }
        });
      });
      return { ...newState };
    });
    setMenuSaved(false);
    setNotify({ type: 'success', message: (value ? '전체 허용' : '전체 해제') + ' 적용됨' });
  };

  if (!canStudentRead) {
    return <div style={{ margin: 40, textAlign: 'center', color: '#b00', fontWeight: 500 }}>학생 관리 메뉴(읽기)에 접근할 권한이 없습니다.</div>;
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: 'inherit', width: '100%', position: 'relative' }}>
      {/* 상단 알림바 */}
      {notify && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          zIndex: 9999,
          background: notify.type === 'success' ? '#2ecc40' : '#e24a4a',
          color: '#fff',
          fontWeight: 'bold',
          textAlign: 'center',
          padding: '12px 0',
          fontSize: '1.1rem',
          boxShadow: '0 2px 8px #0002',
        }}>{notify.message}</div>
      )}
      {/* 로딩 스피너 오버레이 */}
      {loading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(255,255,255,0.5)',
          zIndex: 9998,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            border: '6px solid #e0e0e0',
            borderTop: '6px solid #4a90e2',
            borderRadius: '50%',
            width: 48,
            height: 48,
            animation: 'spin 1s linear infinite',
          }} />
          <style>{`@keyframes spin { 0% { transform: rotate(0deg);} 100% { transform: rotate(360deg);} }`}</style>
        </div>
      )}
      {error && (
        <div style={{
          background: '#ffeaea',
          color: '#c00',
          border: '1px solid #e24a4a',
          borderRadius: 6,
          padding: '10px 18px',
          margin: '12px 0',
          fontWeight: 'bold',
          fontSize: '1rem',
          maxWidth: 600,
          textAlign: 'center',
        }}>
          {error}
        </div>
      )}
  {!hideTitle && <h2 style={{ textAlign: 'center' }}>사용자 관리 (관리자 화면)</h2>}
      {/* 전체 데이터 백업/복원(엑셀) 버튼 및 업로드 */}
      <div style={{ margin: '8px 0 16px 0', textAlign: 'center', display: 'flex', gap: 16, justifyContent: 'center', alignItems: 'center' }}>
        <button
          onClick={downloadAllUsersExcel}
          style={{ borderRadius: 6, padding: '8px 22px', background: '#e6f0ff', color: '#205080', border: '1px solid #4a90e2', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }}
        >전체 데이터 백업(엑셀)</button>
        <label style={{ borderRadius: 6, padding: '8px 22px', background: '#fffbe6', color: '#b8860b', border: '1px solid #e2c04a', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', display: 'inline-block' }}>
          전체 데이터 복원(엑셀)
          <input type="file" accept=".xlsx,.xls" style={{ display: 'none' }}
            onChange={e => {
              const file = e.target.files[0];
              if (file) restoreAllUsersFromExcel(file, setNotify, fetchUsers);
              e.target.value = '';
            }}
          />
        </label>
      </div>
  {/* 권한별 메뉴 관리 실제 UI */}
  <div style={{ background: '#f8fbff', border: '1px solid #b5d3f7', borderRadius: 8, padding: 18, margin: '18px 0', maxWidth: 700 }}>
        <h3 style={{ margin: 0, marginBottom: 10, color: '#205080', fontWeight: 700, fontSize: '1.08rem' }}>권한별 메뉴 관리</h3>
        {menuLoading && <div style={{ color: '#1890ff', marginBottom: 8 }}>로딩중...</div>}
        {/* 일괄 체크/해제 버튼 */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
          {['read','write','delete','upload','download','config'].map(key => (
            <React.Fragment key={key}>
              <button
                style={{ padding: '4px 12px', borderRadius: 5, border: '1px solid #4a90e2', background: '#e6f0ff', color: '#205080', fontWeight: 500, cursor: 'pointer', fontSize: '0.97em' }}
                onClick={() => handleBulkPermission(key, true)}
                type="button"
              >{(key==='read'?'전체 읽기':key==='write'?'전체 쓰기':key==='delete'?'전체 삭제':key==='upload'?'전체 업로드':key==='download'?'전체 다운로드':key==='config'?'전체 설정':key)+' 허용'}</button>
              <button
                style={{ padding: '4px 12px', borderRadius: 5, border: '1px solid #aaa', background: '#fff', color: '#888', fontWeight: 500, cursor: 'pointer', fontSize: '0.97em' }}
                onClick={() => handleBulkPermission(key, false)}
                type="button"
              >{(key==='read'?'전체 읽기':key==='write'?'전체 쓰기':key==='delete'?'전체 삭제':key==='upload'?'전체 업로드':key==='download'?'전체 다운로드':key==='config'?'전체 설정':key)+' 해제'}</button>
            </React.Fragment>
          ))}
        </div>

        <table style={{ width: '100%', fontSize: '0.98em', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#eaf4ff' }}>
              <th style={{ padding: 6, borderBottom: '1px solid #d0e6ff' }}>메뉴</th>
              <th style={{ padding: 6, borderBottom: '1px solid #d0e6ff' }}>세부권한</th>
              {(() => {
                const roles = Object.keys(menuMatrixState);
                const adminIdx = roles.indexOf('admin');
                if (adminIdx !== -1) {
                  roles.push(roles.splice(adminIdx, 1)[0]);
                }
                return roles.map(role => (
                  <th key={role} style={{ padding: 6, borderBottom: '1px solid #d0e6ff' }}>
                    {role === 'student' ? '학생' : role === 'professor' ? '교사' : role === 'admin' ? '관리자' : role === 'subadmin' ? '부관리자' : role}
                  </th>
                ));
              })()}
            </tr>
          </thead>
          <tbody>
            {[
              { key: 'info', label: '내 정보' },
              { key: 'grade', label: '성적 조회' },
              { key: 'student', label: '학생 관리' },
              { key: 'teacher', label: '교사 관리' },
              { key: 'excel', label: '엑셀 업로드/다운로드' },
              { key: 'setting', label: '시스템 설정' },
            ].flatMap(menu => {
              // 세부 권한 키 목록 추출 (모든 role에서 해당 메뉴의 권한 키를 union)
              const detailKeys = Array.from(new Set(
                Object.values(menuMatrixState).map(roleMenus => roleMenus[menu.key] ? Object.keys(roleMenus[menu.key]) : []).flat()
              ));
              return detailKeys.map(detailKey => (
                <tr key={menu.key + '-' + detailKey}>
                  <td style={{ padding: 6 }}>{menu.label}</td>
                  <td style={{ padding: 6 }}
                    title={
                      detailKey === 'read' ? '해당 메뉴의 내용을 볼 수 있습니다.' :
                      detailKey === 'write' ? '해당 메뉴에서 정보를 추가/수정할 수 있습니다.' :
                      detailKey === 'delete' ? '해당 메뉴에서 정보를 삭제할 수 있습니다.' :
                      detailKey === 'upload' ? '엑셀 등 파일 업로드 기능을 사용할 수 있습니다.' :
                      detailKey === 'download' ? '엑셀 등 파일 다운로드 기능을 사용할 수 있습니다.' :
                      detailKey === 'config' ? '시스템 설정을 변경할 수 있습니다.' :
                      detailKey
                    }
                  >
                    {detailKey === 'read' ? '읽기' :
                     detailKey === 'write' ? '쓰기' :
                     detailKey === 'delete' ? '삭제' :
                     detailKey === 'upload' ? '업로드' :
                     detailKey === 'download' ? '다운로드' :
                     detailKey === 'config' ? '설정' : detailKey}
                  </td>
                  {(() => {
                    const roles = Object.keys(menuMatrixState);
                    const adminIdx = roles.indexOf('admin');
                    if (adminIdx !== -1) {
                      roles.push(roles.splice(adminIdx, 1)[0]);
                    }
                    return roles.map(role => (
                      <td key={role} style={{ textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={!!(menuMatrixState[role][menu.key] && menuMatrixState[role][menu.key][detailKey])}
                          onChange={() => handleDetailMenuCheck(role, menu.key, detailKey)}
                          disabled={menuLoading}
                        />
                      </td>
                    ));
                  })()}
                </tr>
              ));
            })}
          </tbody>
        </table>
        <div style={{ marginTop: 10, display: 'flex', gap: 12, alignItems: 'center' }}>
          <button onClick={handleMenuSave} disabled={menuLoading} style={{ borderRadius: 5, padding: '6px 22px', background: '#e6f0ff', color: '#205080', border: '1px solid #4a90e2', fontWeight: 'bold', fontSize: '1rem', cursor: menuLoading ? 'not-allowed' : 'pointer' }}>저장</button>
          {menuSaved && <span style={{ color: '#2ecc40', fontWeight: 500 }}>저장 완료</span>}
        </div>
      </div>
      {/* 필터 UI */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <select value={filterGrade} onChange={e => setFilterGrade(e.target.value)} style={{ minWidth: 80 }}>
          <option value=''>학년 전체</option>
          {[1,2,3,4,5,6].map(g => <option key={g} value={g}>{g}학년</option>)}
        </select>
        <select value={filterClass} onChange={e => setFilterClass(e.target.value)} style={{ minWidth: 80 }}>
          <option value=''>반 전체</option>
          {[1,2,3,4,5,6,7,8,9].map(c => <option key={c} value={c}>{c}반</option>)}
        </select>
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)} style={{ minWidth: 100 }}>
          <option value=''>권한 전체</option>
          <option value='student'>학생</option>
          <option value='professor'>교사</option>
          <option value='admin'>관리자</option>
        </select>
      </div>
      <div style={{
        marginBottom: 16,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        flexWrap: 'wrap',
        width: '100%',
        minWidth: 0
      }}>
        {selectedIds.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f8fbff', border: '1px solid #4a90e2', borderRadius: 6, padding: '6px 12px', marginRight: 12, flexWrap: 'wrap' }}>
            <span style={{ color: '#205080', fontWeight: 'bold' }}>선택: {selectedIds.length}명</span>
            <button onClick={handleBulkDelete} disabled={!canStudentDelete} style={{ borderRadius: 5, padding: '3px 10px', border: '1px solid #e24a4a', background: '#fff', color: '#e24a4a', cursor: !canStudentDelete ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>일괄 삭제</button>
            <select value={bulkLevel} onChange={handleBulkLevelChange} style={{ borderRadius: 5, border: '1px solid #aaa', padding: '2px 6px', marginLeft: 8 }}>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">부관리자</option>
            </select>
            <button onClick={handleBulkLevelApply} disabled={!canStudentWrite} style={{ borderRadius: 5, padding: '3px 10px', border: '1px solid #4a90e2', background: '#e6f0ff', color: '#205080', cursor: !canStudentWrite ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>권한 일괄 변경</button>
            <button onClick={() => setBulkPwMode(v => { if (!v) { setPwEditId(null); setDetailUser(null); setEditId(null); } return !v; })} style={{ borderRadius: 5, padding: '3px 10px', border: '1px solid #aaa', background: '#fff', color: '#205080', cursor: 'pointer', fontWeight: 'bold' }}>비밀번호 일괄 변경</button>
            {bulkPwMode && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <input
                  type="text"
                  value={bulkPw}
                  onChange={e => setBulkPw(e.target.value)}
                  placeholder="새 비밀번호"
                  style={{ width: 100, fontSize: '0.95rem' }}
                />
                <button onClick={async () => {
                  if (!bulkPw || bulkPw.length < 8 || !/[a-zA-Z]/.test(bulkPw) || !/[0-9]/.test(bulkPw)) {
                    setNotify({ type: 'error', message: '비밀번호는 8자 이상, 영문+숫자를 포함해야 합니다.' });
                    return;
                  }
                  try {
                    for (const id of selectedIds) {
                      await axios.put(`http://localhost:4000/api/users/${id}`, { password: bulkPw });
                    }
                    setNotify({ type: 'success', message: '비밀번호가 일괄 변경되었습니다.' });
                    setBulkPw(''); setBulkPwMode(false); setSelectedIds([]);
                    fetchUsers();
                  } catch (err) {
                    setNotify({ type: 'error', message: '일괄 비밀번호 변경 실패: ' + (err.response?.data?.error || err.message) });
                  }
                }} style={{ fontSize: 13, padding: '2px 8px', borderRadius: 4, border: '1px solid #4a90e2', background: '#e6f0ff', color: '#205080', fontWeight: 'bold', cursor: 'pointer' }}>확인</button>
                <button onClick={() => { setBulkPw(''); setBulkPwMode(false); }} style={{ fontSize: 13, padding: '2px 8px', borderRadius: 4, border: '1px solid #bbb', background: '#fff', color: '#888', cursor: 'pointer' }}>취소</button>
              </span>
            )}
            {/* 학년/반 일괄 변경 */}
            <input type="text" value={bulkGrade} onChange={e => setBulkGrade(e.target.value)} placeholder="학년" style={{ width: 48, fontSize: '0.95rem' }} />
            <input type="text" value={bulkClass} onChange={e => setBulkClass(e.target.value)} placeholder="반" style={{ width: 48, fontSize: '0.95rem' }} />
            <button onClick={async () => {
              if (!bulkGrade && !bulkClass) { setNotify({ type: 'error', message: '학년 또는 반을 입력하세요.' }); return; }
              try {
                for (const id of selectedIds) {
                  await axios.put(`http://localhost:4000/api/users/${id}`, {
                    ...(bulkGrade && { grade: bulkGrade }),
                    ...(bulkClass && { class: bulkClass })
                  });
                }
                setNotify({ type: 'success', message: '학년/반이 일괄 변경되었습니다.' });
                setBulkGrade(''); setBulkClass(''); setSelectedIds([]);
                fetchUsers();
              } catch (err) {
                setNotify({ type: 'error', message: '학년/반 일괄 변경 실패: ' + (err.response?.data?.error || err.message) });
              }
            }} disabled={!canStudentWrite} style={{ fontSize: 13, padding: '2px 8px', borderRadius: 4, border: '1px solid #4a90e2', background: '#e6f0ff', color: '#205080', fontWeight: 'bold', cursor: !canStudentWrite ? 'not-allowed' : 'pointer' }}>학년/반 일괄 변경</button>
            {/* 번호 일괄 변경 */}
            <button onClick={async () => {
              try {
                // 선택된 사용자 중 학생만, 이름 가나다순 정렬
                const selectedUsers = users.filter(u => selectedIds.includes(u.id) && u.role === 'student');
                selectedUsers.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ko-KR'));
                for (let i = 0; i < selectedUsers.length; ++i) {
                  await axios.put(`http://localhost:4000/api/users/${selectedUsers[i].id}`, { number: i + 1 });
                }
                setNotify({ type: 'success', message: '번호가 가나다순으로 일괄 변경되었습니다.' });
                setSelectedIds([]);
                fetchUsers();
              } catch (err) {
                setNotify({ type: 'error', message: '번호 일괄 변경 실패: ' + (err.response?.data?.error || err.message) });
              }
            }} disabled={!canStudentWrite} style={{ fontSize: 13, padding: '2px 8px', borderRadius: 4, border: '1px solid #4a90e2', background: '#e6f0ff', color: '#205080', fontWeight: 'bold', cursor: !canStudentWrite ? 'not-allowed' : 'pointer' }}>번호 일괄 변경(가나다순)</button>
          </div>
        )}
        <button onClick={() => setTab('all')} style={{ fontWeight: tab === 'all' ? 'bold' : 'normal', borderRadius: 6, padding: '6px 16px', border: '1px solid #aaa', background: tab === 'all' ? '#e6f0ff' : '#fff', cursor: 'pointer', minWidth: 80 }}>전체</button>
        <button onClick={() => setTab('student')} style={{ fontWeight: tab === 'student' ? 'bold' : 'normal', marginLeft: 8, borderRadius: 6, padding: '6px 16px', border: '1px solid #aaa', background: tab === 'student' ? '#e6f0ff' : '#fff', cursor: 'pointer', minWidth: 80 }}>학생 관리</button>
        <button onClick={() => setTab('professor')} style={{ fontWeight: tab === 'professor' ? 'bold' : 'normal', marginLeft: 8, borderRadius: 6, padding: '6px 16px', border: '1px solid #aaa', background: tab === 'professor' ? '#e6f0ff' : '#fff', cursor: 'pointer', minWidth: 80 }}>교사 관리</button>
        <div style={{ position: 'relative', marginLeft: 16, minWidth: 180, flex: '1 1 180px', maxWidth: 320 }}>
          <input
            type="text"
            placeholder="이름 또는 이메일 검색"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ height: 32, fontSize: '1rem', minWidth: 120, maxWidth: 320, width: '100%', borderRadius: 6, border: '1px solid #aaa', padding: '0 32px 0 10px', boxSizing: 'border-box' }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 4, top: 4, width: 24, height: 24, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 18, color: '#888' }}>×</button>
          )}
        </div>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <button onClick={() => setExcelMenuOpen(v => !v)} style={{ marginLeft: 16, padding: '6px 14px', fontSize: '0.95rem', borderRadius: 6, border: '1px solid #aaa', background: '#f5faff', cursor: 'pointer', minWidth: 100 }}>엑셀 다운로드</button>
          {excelMenuOpen && (
            <div style={{ position: 'absolute', top: 38, right: 0, background: '#fff', border: '1px solid #aaa', borderRadius: 6, boxShadow: '0 2px 8px #0002', zIndex: 10, minWidth: 180 }}>
              <button onClick={() => handleDownloadExcel('filtered')} style={{ width: '100%', padding: '10px 12px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer' }}>전체(검색/필터 반영)</button>
              <button onClick={() => handleDownloadExcel('page')} style={{ width: '100%', padding: '10px 12px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer' }}>현재 페이지만</button>
              <button onClick={() => handleDownloadExcel('all')} style={{ width: '100%', padding: '10px 12px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer' }}>전체(원본)</button>
            </div>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', width: '100%', justifyContent: 'center', flexWrap: 'wrap' }}>
        {/* Main user table */}
        <div style={{ flex: '1 1 0', minWidth: 320, maxWidth: '100%', overflowX: 'auto' }}>
          <table border="1" cellPadding="8" style={{ margin: '0 auto', textAlign: 'center', borderCollapse: 'collapse', border: '1px solid #333', minWidth: 900, width: '100%' }}>
            <thead>
              <tr>
                <th>
                  <input type="checkbox" checked={allChecked} ref={el => { if (el) el.indeterminate = !allChecked && someChecked; }} onChange={handleCheckAll} />
                </th>
                <th>일련번호</th>
                <th>이름</th>
                <th>휴대폰</th>
                <th>email</th>
                <th>password</th>
                <th>구분</th>
                <th>직위</th>
                {tab === 'all' ? <>
                  <th>과목/학년</th>
                  <th>과정/반</th>
                  <th>부서/번호</th>
                </> : tab === 'student' ? <>
                  <th>학년</th>
                  <th>반</th>
                  <th>번호</th>
                </> : <>
                  <th>과목</th>
                  <th>과정</th>
                  <th>부서</th>
                </>}
                <th>권한</th>
              </tr>
            </thead>
            <tbody>
              {pagedUsers.map((user, idx) => (
                <tr key={user.id}
                  style={{ background: idx % 2 === 0 ? '#f8fbff' : '#fff', transition: 'background 0.2s' }}
                  onMouseOver={e => e.currentTarget.style.background = '#e6f0ff'}
                  onMouseOut={e => e.currentTarget.style.background = idx % 2 === 0 ? '#f8fbff' : '#fff'}
                >
                  <td>
                    <input type="checkbox" checked={selectedIds.includes(user.id)} onChange={handleCheckOne(user.id)} />
                  </td>
                  <td>{user.id}</td>
                  <td style={{ color: '#205080', cursor: 'pointer' }} onClick={() => { setDetailUser(user); setPwEditId(null); setBulkPwMode(false); setEditId(null); }}>{user.name || ''}</td>
                  <td>{user.phone || ''}</td>
                  <td>{user.email}</td>
                  <td style={{ textAlign: 'right' }}>
                    {pwEditId === user.id ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <input
                          type="text"
                          value={pwEditValue}
                          onChange={e => setPwEditValue(e.target.value)}
                          placeholder="새 비밀번호"
                          style={{ width: 90, fontSize: '0.95rem', marginRight: 2 }}
                        />
                        <button onClick={async () => {
                          if (!pwEditValue || pwEditValue.length < 8 || !/[a-zA-Z]/.test(pwEditValue) || !/[0-9]/.test(pwEditValue)) {
                            setNotify({ type: 'error', message: '비밀번호는 8자 이상, 영문+숫자를 포함해야 합니다.' });
                            return;
                          }
                          try {
                            await axios.put(`http://localhost:4000/api/users/${user.id}`, { password: pwEditValue });
                            setNotify({ type: 'success', message: '비밀번호가 변경되었습니다.' });
                            setPwEditId(null); setPwEditValue('');
                            fetchUsers();
                          } catch (err) {
                            setNotify({ type: 'error', message: '비밀번호 변경 실패: ' + (err.response?.data?.error || err.message) });
                          }
                        }} style={{ fontSize: 13, padding: '2px 10px', borderRadius: 4, border: '1px solid #4a90e2', background: '#e6f0ff', color: '#205080', fontWeight: 'bold', cursor: 'pointer', marginLeft: 2 }}>확인</button>
                        <button onClick={() => { setPwEditId(null); setPwEditValue(''); }} style={{ fontSize: 13, padding: '2px 10px', borderRadius: 4, border: '1px solid #bbb', background: '#fff', color: '#888', cursor: 'pointer', marginLeft: 2 }}>취소</button>
                      </span>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ minWidth: 60, textAlign: 'right', display: 'inline-block' }}>{user.password || ''}</span>
                        <button onClick={() => { setPwEditId(user.id); setPwEditValue(''); setBulkPwMode(false); setDetailUser(null); setEditId(null); }} style={{ fontSize: 13, padding: '2px 10px', borderRadius: 4, border: '1px solid #aaa', background: '#f5faff', color: '#205080', cursor: 'pointer', marginLeft: 2 }}>변경</button>
                      </span>
                    )}
                  </td>
                  <td>{user.role || ''}</td>
                  <td>{user.position || ''}</td>
                  {/* 통합 컬럼: 과목/학년, 과정/반, 부서/번호 */}
                  <td>{user.role === 'student' ? (user.grade || '') : (user.subject || '')}</td>
                  <td>{user.role === 'student' ? (user.class || '') : (user.course || '')}</td>
                  <td>{user.role === 'student' ? (user.number || '') : (user.department || '')}</td>
                  <td>{user.level === '0' || user.level === 0 ? '관리자' : user.level === '5' || user.level === 5 ? '부관리자' : (user.level || '1')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Right panel: registration and Excel batch, with edit overlay */}
        <div style={{ flex: '0 0 160px', marginLeft: 24, border: '1px solid #ccc', borderRadius: 8, padding: 16, background: '#fafbfc', minWidth: 160, maxWidth: 240, marginTop: 12, position: 'relative' }}>
          {/* Edit overlay */}
          {editId != null && (
            <div style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, zIndex: 2,
              background: 'rgba(255,255,255,0.98)',
              borderRadius: 8, boxShadow: '0 2px 8px #0001', padding: 8
            }}>
              <div style={{ fontSize: '1.45rem', fontWeight: 'bold', marginBottom: 18, textAlign: 'center', letterSpacing: '-1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#e24a4a', width: '100%' }}>사용자 수정중</div>
              <AdminUserForm
                editMode
                form={editForm}
                setForm={setEditForm}
                onSubmit={handleEditSubmit}
                onCancel={() => { setEditId(null); setEditForm({ username: '', name: '', email: '', password: '', role: 'student', grade: '', class: '', number: '', phone: '', subject: '', position: '', department: '', course: '', level: '' }); setEditError(null); }}
                error={editError}
                vertical
              />
            </div>
          )}
          {/* Always visible registration/Excel form */}
          <div style={{ opacity: editId != null ? 0.4 : 1, pointerEvents: editId != null ? 'none' : 'auto' }}>
            <div style={{ fontSize: '1.05rem', fontWeight: 'bold', marginBottom: 18, textAlign: 'center', letterSpacing: '-1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>사용자 직접 등록하기</div>
            <AdminUserForm onUserAdded={fetchUsers} defaultRole={tab} vertical />
            <ExcelBatchRegister fetchUsers={fetchUsers} />
          </div>
        </div>
      </div>
      {/* Pagination UI */}
      <div style={{ margin: '16px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ borderRadius: 5, padding: '3px 10px', border: '1px solid #aaa', background: '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1 }}>이전</button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(pn => (
          <button
            key={pn}
            onClick={() => setPage(pn)}
            style={{
              borderRadius: 5,
              padding: '3px 10px',
              border: pn === page ? '2px solid #4a90e2' : '1px solid #aaa',
              background: pn === page ? '#e6f0ff' : '#fff',
              fontWeight: pn === page ? 'bold' : 'normal',
              color: pn === page ? '#205080' : '#222',
              margin: '0 2px',
              cursor: 'pointer',
              minWidth: 32
            }}
            disabled={pn === page}
          >{pn}</button>
        ))}
        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ borderRadius: 5, padding: '3px 10px', border: '1px solid #aaa', background: '#fff', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.5 : 1 }}>다음</button>
      </div>
      {/* 사용자 상세 모달 */}
      {detailUser && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.25)', zIndex: 10000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={() => setDetailUser(null)}>
          <div style={{ background: '#fff', borderRadius: 10, minWidth: 320, maxWidth: 420, padding: 28, boxShadow: '0 4px 24px #0003', position: 'relative' }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setDetailUser(null)} style={{ position: 'absolute', top: 10, right: 14, background: 'none', border: 'none', fontSize: 22, color: '#888', cursor: 'pointer' }}>×</button>
            <h3 style={{ margin: '0 0 18px 0', color: '#205080', fontWeight: 'bold', fontSize: '1.2rem' }}>사용자 상세정보</h3>
            <table style={{ width: '100%', fontSize: '1rem', borderCollapse: 'collapse' }}>
              <tbody>
                <tr><td style={{ fontWeight: 'bold', width: 90 }}>이름</td><td>{detailUser.name}</td></tr>
                <tr><td style={{ fontWeight: 'bold' }}>ID</td><td>{detailUser.username}</td></tr>
                <tr><td style={{ fontWeight: 'bold' }}>이메일</td><td>{detailUser.email}</td></tr>
                <tr><td style={{ fontWeight: 'bold' }}>휴대폰</td><td>{detailUser.phone}</td></tr>
                <tr><td style={{ fontWeight: 'bold' }}>구분</td><td>{detailUser.role}</td></tr>
                <tr><td style={{ fontWeight: 'bold' }}>직위</td><td>{detailUser.position}</td></tr>
                <tr><td style={{ fontWeight: 'bold' }}>학년/과목</td><td>{detailUser.role === 'student' ? detailUser.grade : detailUser.subject}</td></tr>
                <tr><td style={{ fontWeight: 'bold' }}>반/과정</td><td>{detailUser.role === 'student' ? detailUser.class : detailUser.course}</td></tr>
                <tr><td style={{ fontWeight: 'bold' }}>번호/부서</td><td>{detailUser.role === 'student' ? detailUser.number : detailUser.department}</td></tr>
                <tr><td style={{ fontWeight: 'bold' }}>권한</td><td>{detailUser.level === '0' || detailUser.level === 0 ? '관리자' : detailUser.level === '5' || detailUser.level === 5 ? '부관리자' : detailUser.level}</td></tr>
              </tbody>
            </table>
            {/* 샘플 변경 이력 */}
            <div style={{ marginTop: 32 }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#205080', fontWeight: 600, fontSize: '1.05rem' }}>최근 변경 이력</h4>
              <table style={{ width: '100%', fontSize: '0.97rem', borderCollapse: 'collapse', background: '#f9faff', borderRadius: 6 }}>
                <thead>
                  <tr style={{ background: '#f0f6ff' }}>
                    <th style={{ padding: 4, borderBottom: '1px solid #e0e0e0' }}>일시</th>
                    <th style={{ padding: 4, borderBottom: '1px solid #e0e0e0' }}>구분</th>
                    <th style={{ padding: 4, borderBottom: '1px solid #e0e0e0' }}>내용</th>
                  </tr>
                </thead>
                <tbody>
                  {/* 샘플 이력 데이터 */}
                  <tr><td>2025-08-10 14:22</td><td>수정</td><td>이메일 변경 (hong@sample.com → hong2@sample.com)</td></tr>
                  <tr><td>2025-08-09 09:10</td><td>비밀번호 변경</td><td>관리자에 의해 비밀번호 초기화</td></tr>
                  <tr><td>2025-08-08 17:45</td><td>업로드</td><td>엑셀 일괄등록</td></tr>
                  <tr><td>2025-08-07 11:30</td><td>접속</td><td>웹사이트 로그인</td></tr>
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'center' }}>
              <button onClick={() => { setEditId(detailUser.id); setEditForm({ ...detailUser }); setDetailUser(null); setPwEditId(null); setBulkPwMode(false); }} disabled={!canStudentWrite} style={{ borderRadius: 6, padding: '8px 22px', background: '#e6f0ff', color: '#205080', border: '1px solid #4a90e2', fontWeight: 'bold', fontSize: '1rem', cursor: !canStudentWrite ? 'not-allowed' : 'pointer' }}>수정</button>
              <button onClick={async () => {
                setDetailUser(null);
                const ok = window.confirm('정말로 이 사용자를 삭제하시겠습니까? 삭제 후에는 복구할 수 없습니다.');
                if (ok && canStudentDelete) await handleDelete(detailUser.id);
              }} style={{ borderRadius: 6, padding: '8px 22px', background: '#fff', color: '#e24a4a', border: '1px solid #e24a4a', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }}>삭제</button>
              <button onClick={() => setDetailUser(null)} style={{ borderRadius: 6, padding: '8px 22px', background: '#f5f5f5', color: '#444', border: '1px solid #bbb', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }}>닫기</button>
            </div>
          </div>
        </div>
      )}
      {/* 권한 변경 이력 로그 테이블 */}
      <div style={{ background: '#f8fbff', border: '1px solid #b5d3f7', borderRadius: 8, padding: 18, margin: '18px 0', maxWidth: 700 }}>
        <h3 style={{ margin: 0, marginBottom: 10, color: '#205080', fontWeight: 700, fontSize: '1.08rem' }}>권한 변경 이력</h3>
        <table style={{ width: '100%', fontSize: '0.97em', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#eaf4ff' }}>
              <th style={{ padding: 6, borderBottom: '1px solid #d0e6ff' }}>시각</th>
              <th style={{ padding: 6, borderBottom: '1px solid #d0e6ff' }}>역할</th>
              <th style={{ padding: 6, borderBottom: '1px solid #d0e6ff' }}>메뉴</th>
              <th style={{ padding: 6, borderBottom: '1px solid #d0e6ff' }}>세부권한</th>
              <th style={{ padding: 6, borderBottom: '1px solid #d0e6ff' }}>변경 전</th>
              <th style={{ padding: 6, borderBottom: '1px solid #d0e6ff' }}>변경 후</th>
            </tr>
          </thead>
          <tbody>
            {roleMenuLogs.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: '#888', padding: 12 }}>
                  권한 변경 이력이 없습니다.
                </td>
              </tr>
            ) : (
              roleMenuLogs.slice(-20).reverse().flatMap(log =>
                log.changes.map((chg, i) => (
                  <tr key={log.time + '-' + i}>
                    <td style={{ padding: 6 }}>{new Date(log.time).toLocaleString()}</td>
                    <td style={{ padding: 6 }}>{chg.role}</td>
                    <td style={{ padding: 6 }}>{chg.menu}</td>
                    <td style={{ padding: 6 }}>{chg.key}</td>
                    <td style={{ padding: 6 }}>{String(chg.before)}</td>
                    <td style={{ padding: 6, color: chg.after ? '#2ecc40' : '#e24a4a', fontWeight: 'bold' }}>{String(chg.after)}</td>
                  </tr>
                ))
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminUserList;
