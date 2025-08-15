import React, { useState, useCallback, useRef } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';

function UserManage() {
    // 상태 및 참조
    const [searchType, setSearchType] = useState('name');
    const [searchValue, setSearchValue] = useState('');
    const [searchResult, setSearchResult] = useState(null);
    const [excelLoading, setExcelLoading] = useState(false);
    const fileInputRef = useRef();
    const [tab, setTab] = useState('all');
    const [users, setUsers] = useState([]);
    const [editingRows, setEditingRows] = useState({});
    const [savedRows, setSavedRows] = useState({});
    const [nextTempId, setNextTempId] = useState(-1);

    // 검색 핸들러
    const handleSearch = useCallback(() => {
        const val = searchValue.trim();
        if (!val) {
            setSearchResult(null);
            return;
        }
        if (searchType === 'name') {
            const found = users.filter(u => u.name && u.name === val);
            setSearchResult(found.length > 0 ? found : []);
        } else if (searchType === 'email') {
            const found = users.filter(u => u.email && u.email === val);
            setSearchResult(found.length > 0 ? found : []);
        }
    }, [searchType, searchValue, users]);

    // 엑셀 업로드 핸들러
    const handleExcelUpload = (e) => {
        const file = e.target.files[0];
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (!file) return;
        const ext = file.name.split('.').pop().toLowerCase();
        if (!['xlsx', 'xls'].includes(ext)) {
            alert('엑셀 파일(xlsx, xls)만 업로드 가능합니다.');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            alert('파일 용량이 너무 큽니다. (최대 5MB)');
            return;
        }
        setExcelLoading(true);
        try {
            const reader = new FileReader();
            reader.onload = async (evt) => {
                try {
                    const data = new Uint8Array(evt.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const sheet = workbook.Sheets[workbook.SheetNames[0]];
                    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
                    if (!rows || rows.length < 2) {
                        alert('엑셀 데이터가 비어있습니다.');
                        setExcelLoading(false);
                        return;
                    }
                    const header = rows[0];
                    const body = rows.slice(1);
                    const labelToKey = {};
                    columns.forEach(col => {
                        const idx = header.indexOf(col.label);
                        if (idx !== -1) labelToKey[idx] = col.key;
                    });
                    const newUsers = body.map(row => {
                        const u = {};
                        Object.entries(labelToKey).forEach(([colIdx, key]) => {
                            u[key] = row[colIdx] ?? '';
                        });
                        return u;
                    });
                    setUsers(users => {
                        const updated = [...users];
                        const upsertList = [];
                        newUsers.forEach(newUser => {
                            const idx = updated.findIndex(u => u.name === newUser.name && u.email === newUser.email);
                            if (idx !== -1) {
                                updated[idx] = { ...updated[idx], ...newUser };
                                upsertList.push({ ...updated[idx] });
                            } else {
                                updated.push(newUser);
                                upsertList.push({ ...newUser });
                            }
                        });
                        if (upsertList.length > 0) {
                            axios.post('http://localhost:4000/api/users/batch-upsert', { users: upsertList })
                                .then(() => {
                                    alert('엑셀 데이터가 DB에 저장되었습니다.');
                                })
                                .catch(err => {
                                    alert('DB 저장 중 오류 발생: ' + (err?.response?.data?.message || err.message || err));
                                });
                        } else {
                            alert('엑셀 데이터가 반영되었으나, 저장할 데이터가 없습니다.');
                        }
                        return updated;
                    });
                } catch (err) {
                    alert('엑셀 파일 처리 중 오류 발생: ' + (err.message || err));
                } finally {
                    setExcelLoading(false);
                }
            };
            reader.onerror = (err) => {
                alert('파일 읽기 오류: ' + (err.message || err));
                setExcelLoading(false);
            };
            reader.readAsArrayBuffer(file);
        } catch (err) {
            alert('엑셀 업로드 처리 중 오류: ' + (err.message || err));
            setExcelLoading(false);
        }
    };

    // 엑셀로 내보내기
    const handleExportExcel = () => {
        const headers = columns.map(col => col.label);
        const data = users.map(u => columns.map(col => u[col.key] ?? ''));
        const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, '회원목록');
        XLSX.writeFile(wb, '회원목록.xlsx');
    };

    // 데이터 fetch
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
        } catch (e) {}
    }, [tab]);

    React.useEffect(() => {
        fetchUsers();
    }, [tab, fetchUsers]);

    // 저장
    const handleSave = async (user, userIndex) => {
        const emailRegex = /^[\w.-]+@[\w.-]+\.[A-Za-z]{2,}$/;
        if (!user.name || !user.email || !emailRegex.test(user.email)) {
            alert('이름과 이메일(정확한 형식)은 필수 입력값입니다.');
            return false;
        }
        try {
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
        } catch (e) {}
    };

    // 삭제
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

    // 신규등록
    const handleAddRow = () => {
        let newId = nextTempId;
        setNextTempId(id => id - 1);
        let role = tab === 'student' ? 'student' : (tab === 'teacher' ? 'teacher' : 'student');
        setUsers(users => ([
            ...users,
            { id: newId, name: '', userid: '', role, subject: '', position: '', department: '', course: '', phone: '', created_at: '' }
        ]));
    };

    // 컬럼 정의
    const columns = [
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

    // 필터링
    let filtered = tab === 'student'
        ? users.filter(u => u.role === 'student')
        : tab === 'teacher'
        ? users.filter(u => u.role === 'teacher')
        : users;

    // 실시간 가나다순 필터링 (입력값 있을 때만)
    if (searchValue.trim()) {
        const val = searchValue.trim();
        if (searchType === 'name') {
            filtered = filtered
                .filter(u => u.name && u.name.localeCompare(val, 'ko') >= 0)
                .sort((a, b) => a.name.localeCompare(b.name, 'ko'));
        } else if (searchType === 'email') {
            filtered = filtered
                .filter(u => u.email && u.email.localeCompare(val, 'ko') >= 0)
                .sort((a, b) => a.email.localeCompare(b.email, 'ko'));
        }
    } else {
        // 입력값 없으면 가나다순 전체
        if (searchType === 'name') {
            filtered = filtered.sort((a, b) => a.name?.localeCompare(b.name, 'ko'));
        } else if (searchType === 'email') {
            filtered = filtered.sort((a, b) => a.email?.localeCompare(b.email, 'ko'));
        }
    }

    // 엔터키로 정확히 찾은 경우만 searchResult로 대체
    if (searchResult) {
        filtered = searchResult;
    }

    // 컬럼 너비
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {/* 전체관리 버튼 삭제됨 */}
                    <button
                        style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 18px', fontWeight: 'bold', cursor: 'pointer' }}
                        onClick={handleAddRow}
                    >신규등록</button>
                    {/* 찾기 기능 */}
                    <select value={searchType} onChange={e => setSearchType(e.target.value)} style={{ marginLeft: 12, padding: '4px 8px', borderRadius: 4, border: '1px solid #1976d2' }}>
                        <option value="name">이름</option>
                        <option value="email">이메일</option>
                    </select>
                    <input
                        type="text"
                        value={searchValue}
                        onChange={e => {
                            setSearchValue(e.target.value);
                            setSearchResult(null); // 입력 중에는 실시간 필터만 적용
                        }}
                        placeholder={searchType === 'name' ? '이름으로 찾기' : '이메일로 찾기'}
                        style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #1976d2', minWidth: 120 }}
                        onKeyDown={e => {
                            if (e.key === 'Enter') handleSearch();
                        }}
                    />
                </div>
                {/* 오른쪽: 신규등록/저장/엑셀 버튼 */}
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
                    {/* 저장 버튼: 현재 데이터 전체를 DB에 업데이트 */}
                    <button
                        style={{ background: '#e6ffe6', color: '#207520', border: '1px solid #4caf50', borderRadius: 6, padding: '6px 18px', fontWeight: 'bold', marginRight: 8, cursor: 'pointer' }}
                        onClick={async () => {
                            if (!users.length) {
                                alert('저장할 데이터가 없습니다.');
                                return;
                            }
                            try {
                                // created_at 필드 보정
                                const today = new Date();
                                const yyyy = today.getFullYear();
                                const mm = String(today.getMonth() + 1).padStart(2, '0');
                                const dd = String(today.getDate()).padStart(2, '0');
                                const usersToSave = users.map(u => ({
                                    ...u,
                                    created_at: u.created_at || `${yyyy}-${mm}-${dd}`
                                }));
                                // 일괄 저장 API 호출
                                await axios.post('http://localhost:4000/api/users/batch-upsert', { users: usersToSave });
                                alert('전체 데이터가 DB에 저장되었습니다.');
                                // 저장 표시 효과
                                setSavedRows(() => {
                                    const obj = {};
                                    users.forEach((_, i) => { obj[i] = true; });
                                    return obj;
                                });
                                setTimeout(() => {
                                    setSavedRows({});
                                }, 3000);
                                // 편집모드 해제
                                setEditingRows({});
                                // 최신 데이터 fetch
                                await fetchUsers();
                            } catch (err) {
                                alert('저장 중 오류 발생: ' + (err?.response?.data?.message || err.message || err));
                            }
                        }}
                    >저장</button>
                    <label style={{ background: '#e6f0ff', color: '#205080', border: '1px solid #1976d2', borderRadius: 6, padding: '6px 18px', fontWeight: 'bold', marginRight: 8, cursor: excelLoading ? 'wait' : 'pointer', display: 'inline-block', opacity: excelLoading ? 0.6 : 1 }}>
                        {excelLoading ? '업로드 중...' : '엑셀에서 업로드'}
                        <input
                            type="file"
                            accept=".xlsx,.xls"
                            style={{ display: 'none' }}
                            onChange={excelLoading ? undefined : handleExcelUpload}
                            disabled={excelLoading}
                            ref={fileInputRef}
                        />
                    </label>
                    <button style={{ background: '#fffbe6', color: '#b8860b', border: '1px solid #e2c04a', borderRadius: 6, padding: '6px 18px', fontWeight: 'bold', cursor: 'pointer' }} onClick={handleExportExcel}>엑셀로 내보내기</button>
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
                            // userIndex를 항상 users 배열에서 id(혹은 temp id)로 찾음
                            const userIndex = users.findIndex(u => (u.id !== undefined && u.id === user.id));
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
                                                    setUsers(users => {
                                                        const idx = users.findIndex(u => u.id === user.id);
                                                        if (idx === -1) return users;
                                                        const updated = [...users];
                                                        updated[idx] = { ...updated[idx], [col.key]: value };
                                                        return updated;
                                                    });
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
