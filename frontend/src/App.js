
import './App.css';
import Login from './Login';
import React, { useState, useEffect, createContext } from 'react';
import axios from 'axios';
import AdminMain from './admin/AdminMain';
import GeneralItemManage from './admin/GeneralItemManage';
import CurriculumManage from './admin/CurriculumManage';
import UserManage from './admin/UserManage';
import TimetableManage from './admin/TimetableManage';
import ReportManage from './admin/ReportManage';
import ExpenseManage from './admin/ExpenseManage';

import TeacherMain from './teacher/TeacherMain';
import StudentMain from './student/StudentMain';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';


export const MenuMatrixContext = createContext(null);


function App() {
  // 모든 훅은 함수 최상단에 선언
  const [user, setUser] = useState(() => {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  });
  const [menuMatrix, setMenuMatrix] = useState(null);
  const [adminMode, setAdminMode] = useState(() => localStorage.getItem('adminMode') === 'true');
  // const [showGeneral, setShowGeneral] = useState(false); // 사용하지 않으므로 제거

  // 메뉴 매트릭스 불러오기
  useEffect(() => {
    axios.get('/api/role-menu').then(res => {
      if (res.data && typeof res.data === 'object') setMenuMatrix(res.data);
    });
  }, []);

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

  const navigate = useNavigate();
  const location = useLocation();

  // 로그인 후 역할별로 자동 이동
  useEffect(() => {
    if (user) {
      if (
        user.role === 'admin' &&
        !(location.pathname === '/admin' || location.pathname.startsWith('/admin/'))
      ) {
        navigate('/admin', { replace: true });
      } else if ((user.role === 'professor' || user.role === 'teacher') && location.pathname !== '/teacher') {
        navigate('/teacher', { replace: true });
      } else if (user.role === 'student' && location.pathname !== '/student') {
        navigate('/student', { replace: true });
      }
    }
  }, [user, navigate, location.pathname]);

  if (!user) {
    return <Login onLogin={setUser} onAdminLogin={u => { setUser(u); setAdminMode(true); }} />;
  }
  if (!menuMatrix) {
    return <div style={{ margin: 40, textAlign: 'center', color: '#888' }}>권한별 메뉴 정보를 불러오는 중...</div>;
  }

  return (
    <MenuMatrixContext.Provider value={menuMatrix}>
      <div className="App">
        {/* 상단 정보/로그아웃 영역: 관리자/교사/학생 메인에서는 숨김 */}
        {!(
          (user.role === 'admin' && location.pathname === '/admin') ||
          ((user.role === 'professor' || user.role === 'teacher') && location.pathname === '/teacher') ||
          (user.role === 'student' && location.pathname === '/student')
        ) && (
          <div style={{ textAlign: 'right', margin: 16 }}>
            <span style={{ marginRight: 12 }}>{user.username} {user.role === 'admin' ? '(admin)' : user.role === 'professor' ? '(교사)' : user.role === 'student' ? '(학생)' : ''}</span>
            <button onClick={() => {
              setUser(null);
              setAdminMode(false);
              localStorage.removeItem('user');
              localStorage.removeItem('adminMode');
              navigate('/');
            }}>로그아웃</button>
            {user.role === 'admin' && !adminMode && (
              <button style={{ marginLeft: 8 }} onClick={() => setAdminMode(true)}>관리자 모드</button>
            )}
          </div>
        )}
        <Routes>
          <Route path="/admin/*" element={
            <AdminMain onLogout={() => {
              setUser(null);
              setAdminMode(false);
              localStorage.removeItem('user');
              localStorage.removeItem('adminMode');
              navigate('/');
            }} />
          }>
            <Route index element={<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: 40 }}>
              <img src="https://cdn.pixabay.com/photo/2017/01/31/13/14/meeting-2029540_1280.png" alt="관리자" style={{ width: 220, marginBottom: 32, borderRadius: 12, boxShadow: '0 2px 12px #b0b8c1' }} />
              <div style={{ fontSize: 22, fontWeight: 500, color: '#333', marginBottom: 12 }}>여기서 관리자 관련 주요 작업을 할 수 있습니다.</div>
            </div>} />
            <Route path="general" element={<GeneralItemManage />} />
            <Route path="curriculum" element={<CurriculumManage />} />
            <Route path="user" element={<UserManage />} />
            <Route path="timetable" element={<TimetableManage />} />
            <Route path="report" element={<ReportManage />} />
            <Route path="expense" element={<ExpenseManage />} />
          </Route>
          <Route path="/teacher" element={<TeacherMain />} />
          <Route path="/student" element={<StudentMain />} />
          <Route path="*" element={<Navigate to={user.role === 'admin' ? '/admin' : (user.role === 'professor' || user.role === 'teacher') ? '/teacher' : user.role === 'student' ? '/student' : '/'} replace />} />
        </Routes>
      </div>
    </MenuMatrixContext.Provider>
  );
}

export default App;
