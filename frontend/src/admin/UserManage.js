import React, { useState } from 'react';
import axios from 'axios';

function UserManage() {

	// 모든 상태 선언을 최상단에 위치
	// tab: 'student' | 'teacher' | 'all'
	const [tab, setTab] = useState('student');
	const [users, setUsers] = useState([]);
	const [editedRows, setEditedRows] = useState({});
	// 신규등록 시 id 자동 부여용 임시 id
	const [nextTempId, setNextTempId] = useState(-1);

       // 학생/교사 데이터 로드 (탭 변경 시)
       React.useEffect(() => {
	       axios.get('http://localhost:4000/api/users')
		       .then(res => {
			       if (Array.isArray(res.data)) {
				       if (tab === 'student') {
					       setUsers(res.data.filter(u => u.role === 'student'));
				       } else if (tab === 'teacher') {
					       setUsers(res.data.filter(u => u.role === 'teacher'));
				       } else {
					       setUsers(res.data); // 전체관리
				       }
			       }
		       })
		       .catch(() => {});
       }, [tab]);
	// (이전 단계로 복귀: editingRowIndex 상태 제거)
	// 저장 핸들러 분리
	const handleSave = async (user, userIndex) => {
	       if (!user.name || !user.userid) {
		       // 이름과 아이디는 필수 입력값입니다. (토스트 메시지 제거)
		       return;
	       }
	       try {
		       await axios.put(`http://localhost:4000/api/users/${user.id}`, user);
		       setEditedRows(rows => ({ ...rows, [userIndex]: false }));
		       // 저장되었습니다. (토스트 메시지 제거)
	       } catch (err) {
		       // 저장에 실패했습니다. (토스트 메시지 제거)
	       }
	};
	// 삭제 핸들러 분리
	const handleDelete = async (user, userIndex) => {
		if (!window.confirm('정말로 삭제하시겠습니까?')) return;
		if (!user.id) {
			setUsers(users => users.filter((_, i) => i !== userIndex));
			return;
		}
		try {
			await axios.delete(`http://localhost:4000/api/users/${user.id}`);
			setUsers(users => users.filter((u, i) => i !== userIndex));
		} catch (err) {
			alert('삭제에 실패했습니다.');
		}
	};


       // 신규등록 버튼 클릭 핸들러
       const handleAddRow = () => {
	       // 현재 users의 id 중 최대값(숫자) + 1 또는 음수 temp id 사용
	       let newId = nextTempId;
	       setNextTempId(id => id - 1);
	       // role은 현재 탭에 따라 자동 지정
	       let role = tab === 'student' ? 'student' : (tab === 'teacher' ? 'teacher' : 'student');
	       setUsers(users => ([
		       ...users,
		       { id: newId, name: '', userid: '', role, subject: '', position: '', department: '', course: '', phone: '', created_at: '' }
	       ]));
       };

       // 관리 유형별 컬럼 정의
       let columns;
       if (tab === 'student') {
	       columns = [
		       { key: 'id', label: 'ID' },
		       { key: 'name', label: '이름' },
		       { key: 'email', label: '이메일' },
		       { key: 'password', label: '비밀번호' },
		       { key: 'role', label: '구분' },
		       { key: 'level', label: '레벨' },
		       { key: 'grade', label: '학년' },
		       { key: 'class', label: '반' },
		       { key: 'number', label: '번호' },
		       { key: 'phone', label: '휴대폰' },
		       { key: 'created_at', label: '등록일' },
	       ];
       } else if (tab === 'teacher') {
	       columns = [
		       { key: 'id', label: 'ID' },
		       { key: 'name', label: '이름' },
		       { key: 'email', label: '이메일' },
		       { key: 'password', label: '비밀번호' },
		       { key: 'role', label: '구분' },
		       { key: 'subject', label: '과목' },
		       { key: 'position', label: '직위' },
		       { key: 'department', label: '부서' },
		       { key: 'course', label: '과정' },
		       { key: 'phone', label: '휴대폰' },
		       { key: 'created_at', label: '등록일' },
	       ];
       } else {
	       columns = [
		       { key: 'id', label: 'ID' },
		       { key: 'name', label: '이름' },
		       { key: 'email', label: '이메일' },
		       { key: 'password', label: '비밀번호' },
		       { key: 'role', label: '구분' },
		       { key: 'level', label: '레벨' },
		       { key: 'grade', label: '학년' },
		       { key: 'class', label: '반' },
		       { key: 'number', label: '번호' },
		       { key: 'subject', label: '과목' },
		       { key: 'position', label: '직위' },
		       { key: 'department', label: '부서' },
		       { key: 'course', label: '과정' },
		       { key: 'phone', label: '휴대폰' },
		       { key: 'created_at', label: '등록일' },
	       ];
       }

       // 관리 유형별 필터링
       const filtered = tab === 'student'
	       ? users.filter(u => u.role === 'student')
	       : tab === 'teacher'
	       ? users.filter(u => u.role === 'teacher')
	       : users;

       return (
	       <div>
					   <h3 style={{ margin: '32px 0 16px 0', color: '#205080', fontWeight: 'bold', fontSize: '1.25rem' }}>회원 관리</h3>
		       <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
			       {/* 왼쪽: 관리 유형 버튼 */}
			       <div>
				       <button
					       onClick={() => setTab('student')}
					       style={{
						       fontWeight: tab === 'student' ? 'bold' : 'normal',
						       background: tab === 'student' ? '#e6f0ff' : '#fff',
						       color: tab === 'student' ? '#205080' : '#222',
						       border: '1px solid #1976d2',
						       borderRadius: 6,
						       padding: '6px 18px',
						       marginRight: 8,
						       cursor: 'pointer',
					       }}
				       >학생관리</button>
				       <button
					       onClick={() => setTab('teacher')}
					       style={{
						       fontWeight: tab === 'teacher' ? 'bold' : 'normal',
						       background: tab === 'teacher' ? '#e6f0ff' : '#fff',
						       color: tab === 'teacher' ? '#205080' : '#222',
						       border: '1px solid #1976d2',
						       borderRadius: 6,
						       padding: '6px 18px',
						       marginRight: 8,
						       cursor: 'pointer',
					       }}
				       >교사관리</button>
				       <button
					       onClick={() => setTab('all')}
					       style={{
						       fontWeight: tab === 'all' ? 'bold' : 'normal',
						       background: tab === 'all' ? '#e6f0ff' : '#fff',
						       color: tab === 'all' ? '#205080' : '#222',
						       border: '1px solid #1976d2',
						       borderRadius: 6,
						       padding: '6px 18px',
						       cursor: 'pointer',
					       }}
				       >전체관리</button>
			       </div>
			       {/* 오른쪽: 신규등록/저장/엑셀 버튼 */}
		       <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
		       <button 
			       style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 18px', fontWeight: 'bold', marginRight: 8, cursor: 'pointer' }}
			       onClick={handleAddRow}
		       >신규등록</button>
				       <button style={{ background: '#388e3c', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 18px', fontWeight: 'bold', marginRight: 24, cursor: 'pointer' }}>저장</button>
				       <button style={{ background: '#e6f0ff', color: '#205080', border: '1px solid #1976d2', borderRadius: 6, padding: '6px 18px', fontWeight: 'bold', marginRight: 8, cursor: 'pointer' }}>엑셀로 업로드</button>
				       <button style={{ background: '#fffbe6', color: '#b8860b', border: '1px solid #e2c04a', borderRadius: 6, padding: '6px 18px', fontWeight: 'bold', cursor: 'pointer' }}>엑셀로 내보내기</button>
			       </div>
		       </div>
		       <table style={{ borderCollapse: 'collapse', width: '100%' }}>
			       <thead>
				       <tr style={{background: '#f0f0f0'}}>
					       {columns.map(col => (
						       <th key={col.key} style={{border: '1px solid #ccc', padding: 8}}>{col.label}</th>
					       ))}
					       <th style={{border: '1px solid #ccc', padding: 8}}>수정</th>
					       <th style={{border: '1px solid #ccc', padding: 8}}>삭제</th>
				       </tr>
			       </thead>
			       <tbody>
				       {filtered.map((user, idx) => {
					       const userIndex = users.findIndex(u => u === user);
					       return (
						       <tr key={user.id || 'new-' + idx}>
							       {columns.map(col => (
								       <td key={col.key} style={{border: '1px solid #ccc', padding: 8}}>
				       <input
					       value={user[col.key] || ''}
					       onChange={e => {
						       const value = e.target.value;
						       setUsers(users => users.map((u, i) =>
							       i === userIndex ? { ...u, [col.key]: value } : u
						       ));
						       setEditedRows(rows => ({ ...rows, [userIndex]: true }));
					       }}
					       style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none' }}
				       />
								       </td>
							       ))}
							       <td style={{border: '1px solid #ccc', padding: 8}}>
					<button
						disabled={
							 !editedRows[userIndex] || !user.id ||
							 !user.name || !user.userid
						}
						onClick={() => handleSave(user, userIndex)}
						style={{ color: '#1976d2', border: '1px solid #1976d2', background: '#fff', borderRadius: 4, padding: '2px 10px', cursor: (editedRows[userIndex] && user.id && user.name && user.userid) ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}
					>
						수정
					</button>
							       </td>
							       <td style={{border: '1px solid #ccc', padding: 8}}>
								       <button
									       onClick={() => handleDelete(user, userIndex)}
									       style={{ color: '#d32f2f', border: '1px solid #d32f2f', background: '#fff', borderRadius: 4, padding: '2px 10px', cursor: 'pointer', fontWeight: 'bold' }}
								       >
									       삭제
								       </button>
							       </td>
						       </tr>
					       );
				       })}
			       </tbody>
		       </table>
	       </div>
       );
}

export default UserManage;
