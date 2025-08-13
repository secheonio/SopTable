import './App.css';
import Login from './Login';
import React, { useState, useEffect, createContext } from 'react';
import axios from 'axios';
// 불필요한 라우터 관련 import 제거

export const MenuMatrixContext = createContext(null);

function App() {
  // (getDefaultRedirect 함수 제거)

  const [user, setUser] = useState(() => {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  });
  const [menuMatrix, setMenuMatrix] = useState(null);
  useEffect(() => {
    axios.get('/api/role-menu').then(res => {
      if (res.data && typeof res.data === 'object') setMenuMatrix(res.data);
    });
  }, []);
  const [adminMode, setAdminMode] = useState(() => localStorage.getItem('adminMode') === 'true');

  // 로그인/로그아웃/관리자모드 변경 시 localStorage 동기화
  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
    if (adminMode) {
      localStorage.setItem('adminMode', 'true');
    } else {
      localStorage.removeItem('adminMode');
    }
  }, [user, adminMode]);

  if (!user) {
    return <Login onLogin={setUser} onAdminLogin={u => { setUser(u); setAdminMode(true); }} />;
  }

  if (!user) {
    return <Login onLogin={setUser} onAdminLogin={u => { setUser(u); setAdminMode(true); }} />;
  }

  if (!menuMatrix) {
    return <div style={{ margin: 40, textAlign: 'center', color: '#888' }}>권한별 메뉴 정보를 불러오는 중...</div>;
  }

  // TeacherDashboard 변수 제거

  return (
    <MenuMatrixContext.Provider value={menuMatrix}>
      <div className="App">
      <div style={{ textAlign: 'right', margin: 16 }}>
        <span style={{ marginRight: 12 }}>{user.username} ({user.role === 'professor' ? '교사' : user.role === 'student' ? '학생' : user.role})</span>
        <button onClick={() => {
          setUser(null);
          setAdminMode(false);
          localStorage.removeItem('user');
          localStorage.removeItem('adminMode');
        }}>로그아웃</button>
        {user.role === 'admin' && !adminMode && (
          <button style={{ marginLeft: 8 }} onClick={() => setAdminMode(true)}>관리자 모드</button>
        )}
      </div>
      <div style={{ marginTop: 60, textAlign: 'center' }}>
        <h2>환영합니다, {user.name || user.username}!</h2>
        <p>여기에 학생/교사용 화면을 추가할 수 있습니다.</p>
        {user.role === 'admin' && !adminMode && (
          <p>관리자 모드로 전환하려면 '관리자 모드' 버튼을 클릭하세요.</p>
        )}
      </div>
    </div>
    </MenuMatrixContext.Provider>
  );
}

export default App;
