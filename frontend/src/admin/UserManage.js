
import React, { useState, useCallback } from 'react';
import axios from 'axios';

function UserManage() {
	const [tab, setTab] = useState('student');
	const [users, setUsers] = useState([]);
	const [editingRows, setEditingRows] = useState({});
	const [savedRows, setSavedRows] = useState({});
	const [nextTempId, setNextTempId] = useState(-1);

	const fetchUsers = useCallback(async (tabValue = tab) => {
		try {
			const res = await axios.get('http://localhost:4000/api/users');
			if (Array.isArray(res.data)) {
				if (tabValue === 'student') {
					setUsers(res.data.filter(u => u.role === 'student'));
				} else if (tabValue === 'teacher') {
					setUsers(res.data.filter(u => u.role === 'teacher'));
				} else {
					setUsers(res.data);
				}
			}
		} catch {}
	}, [tab]);

	React.useEffect(() => {
		fetchUsers();
	}, [tab, fetchUsers]);

	const handleSave = async (user, userIndex) => {
		const emailRegex = /^[\w.-]+@[\w.-]+\.[A-Za-z]{2,}$/;
		if (!user.name || !user.email || !emailRegex.test(user.email)) {
			alert('이름과 이메일(정확한 형식)은 필수 입력값입니다.');
			return false;
		}
		try {
			// 수정일을 오늘 날짜로 기록
			const today = new Date();
			const yyyy = today.getFullYear();
			const mm = String(today.getMonth() + 1).padStart(2, '0');
			const dd = String(today.getDate()).padStart(2, '0');
			const newUser = { ...user, created_at: `${yyyy}-${mm}-${dd}` };
			await axios.put(`http://localhost:4000/api/users/${user.id}`, newUser);
			await fetchUsers();
			setSavedRows(rows => ({ ...rows, [userIndex]: true }));
			setTimeout(() => {
				setSavedRows(rows => ({ ...rows, [userIndex]: false }));
			}, 3000);
			return true;
		} catch {}
	};

	const handleDelete = async (user, userIndex) => {
		if (!window.confirm('정말로 삭제하시겠습니까?')) return;
		if (!user.id) {
			setUsers(users => users.filter((_, i) => i !== userIndex));
			return;
		}
		try {
			await axios.delete(`http://localhost:4000/api/users/${user.id}`);
			setUsers(users => users.filter((u, i) => i !== userIndex));
		} catch {
			alert('삭제에 실패했습니다.');
		}
	};

	const handleAddRow = () => {
		let newId = nextTempId;
		setNextTempId(id => id - 1);
		let role = tab === 'student' ? 'student' : (tab === 'teacher' ? 'teacher' : 'student');
		setUsers(users => ([
			...users,
			{ id: newId, name: '', userid: '', role, subject: '', position: '', department: '', course: '', phone: '', created_at: '' }
		]));
	};

	let columns;
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
		{ key: 'department', label: '부서' },
		{ key: 'course', label: '과정' },
		{ key: 'position', label: '직위' },
		{ key: 'phone', label: '휴대폰' },
	];

	const filtered = tab === 'student'
		? users.filter(u => u.role === 'student')
		: tab === 'teacher'
		? users.filter(u => u.role === 'teacher')
		: users;

	// 전체관리 탭에서만 비율 기반 유동 너비, 나머지는 기존 방식
	let colWidths;
	if (tab === 'all') {
		const widthRatios = [2,3,8,4,3,2,2,2,2,3,3,3,3,5,2,2];
		const totalRatio = widthRatios.reduce((a,b) => a+b, 0);
		colWidths = widthRatios.map(ratio => (ratio / totalRatio * 100) + '%');
	} else {
		colWidths = columns.map(col => {
			const maxLen = Math.max(
				col.label.length,
				...users.map(u => (u[col.key] ? String(u[col.key]).length : 0))
			);
			return Math.min(Math.max(maxLen * 0.7, 4), 20) + 'em';
		});
	}

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
			<div style={{ width: '100%' }}>
				<table style={{ borderCollapse: 'collapse', width: '100%', maxWidth: '100vw', tableLayout: tab === 'all' ? 'fixed' : 'auto' }}>
				<thead>
					<tr style={{ background: '#f0f0f0' }}>
						{columns.map((col, i) => (
							<th key={col.key} style={{ border: '1px solid #ccc', padding: 8, width: colWidths[i], wordBreak: 'break-all', whiteSpace: 'pre-wrap' }}>{col.label}</th>
						))}
						<th style={{ border: '1px solid #ccc', padding: 8, width: colWidths[0], minWidth: '2em', maxWidth: '4em' }}>수정</th>
						<th style={{ border: '1px solid #ccc', padding: 8, width: colWidths[0], minWidth: '2em', maxWidth: '4em' }}>삭제</th>
					</tr>
				</thead>
				<tbody>
					{filtered.map((user, idx) => {
						const userIndex = users.findIndex(u => u === user);
						return (
									<tr key={user.id || 'new-' + idx} style={savedRows[userIndex] ? { background: '#e0ffe0', transition: 'background 0.5s' } : {}}>
								{columns.map((col, i) => (
									<td key={col.key} style={{
										border: '1px solid #ccc',
										padding: 8,
										width: colWidths[i],
										wordBreak: 'break-all',
										whiteSpace: 'pre-wrap',
										verticalAlign: 'top',
										maxWidth: tab === 'all' ? colWidths[i] : undefined,
										overflowWrap: 'break-word',
									}}>
										<input
											value={user[col.key] || ''}
											onChange={e => {
												const value = e.target.value;
												setUsers(users => users.map((u, idx) =>
													idx === userIndex ? { ...u, [col.key]: value } : u
												));
											}}
											style={{
												width: '100%',
												border: 'none',
												background: editingRows[userIndex] ? '#fffbe6' : 'transparent',
												outline: 'none',
												wordBreak: 'break-all',
												whiteSpace: 'pre-wrap',
												overflowWrap: 'break-word',
												verticalAlign: 'top',
												resize: 'none',
											}}
											readOnly={!editingRows[userIndex]}
										/>
									</td>
								))}
								<td style={{ border: '1px solid #ccc', padding: 8, width: colWidths[0], minWidth: '2em', maxWidth: '4em' }}>
									<button
										onClick={async () => {
											if (!editingRows[userIndex]) {
												setEditingRows(rows => ({ ...rows, [userIndex]: true }));
											} else {
												const result = await handleSave(user, userIndex);
												if (result !== false) {
													setEditingRows(rows => ({ ...rows, [userIndex]: false }));
												}
											}
										}}
										style={{ color: '#1976d2', border: '1px solid #1976d2', background: '#fff', borderRadius: 4, padding: '0px 3px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8em' }}
									>
										{editingRows[userIndex] ? '완료' : '수정'}
									</button>
								</td>
								<td style={{ border: '1px solid #ccc', padding: 8, width: colWidths[0], minWidth: '2em', maxWidth: '4em' }}>
									<button
										onClick={() => handleDelete(user, userIndex)}
										style={{ color: '#d32f2f', border: '1px solid #d32f2f', background: '#fff', borderRadius: 4, padding: '0px 3px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8em' }}
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
		</div>
	);


}
export default UserManage;
