
import React from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';

function AdminMain({ onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const menuList = [
    { label: '관리자 메인페이지', path: '/admin' },
    { label: '일반항목 관리', path: '/admin/general' },
    { label: '교육과정 관리', path: '/admin/curriculum' },
    { label: '사용자 관리', path: '/admin/user' },
    { label: '시간표 관리', path: '/admin/timetable' },
    { label: '통지표 관리', path: '/admin/report' },
    { label: '지출품의 관리', path: '/admin/expense' },
  ];
  const isDashboard = location.pathname === '/admin';
  return (
    <div style={{ minHeight: '100vh', background: '#f7f9fb' }}>
      {/* 상단 제목 프레임: 항상 노출, 로그아웃 버튼은 /admin에서만 보임 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64, background: '#1976d2', color: '#fff', padding: '0 32px' }}>
        <div style={{ flex: 1 }}></div>
        <div style={{ flex: 2, textAlign: 'center', fontSize: '2.5rem', fontWeight: 'bold', letterSpacing: 2 }}>관리자 대시보드</div>
        <div style={{ flex: 1, textAlign: 'right' }}>
          {isDashboard && (
            <button onClick={onLogout} style={{ background: '#fff', color: '#1976d2', border: 'none', borderRadius: 4, padding: '7px 18px', fontWeight: 'bold', fontSize: 15, cursor: 'pointer' }}>로그아웃</button>
          )}
        </div>
      </div>

      {/* 메뉴 프레임: 항상 노출 */}
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#e3eaf4', padding: '12px 32px', borderBottom: '1px solid #c5d0e6' }}>
        {menuList.map(menu => {
          // /admin/general 등 하위 경로도 활성화로 인식
          const selected = location.pathname === menu.path || location.pathname === '/admin' + menu.path;
          return (
            <button
              key={menu.path}
              onClick={() => navigate(menu.path)}
              style={{
                marginLeft: 12,
                background: selected ? '#1976d2' : '#fff',
                color: selected ? '#fff' : '#1976d2',
                border: selected ? 'none' : '1px solid #1976d2',
                borderRadius: 4,
                padding: '7px 16px',
                fontWeight: 'bold',
                fontSize: 15,
                cursor: 'pointer',
                boxShadow: selected ? '0 2px 8px #b0b8c1' : undefined,
                outline: selected ? '2px solid #1976d2' : undefined,
              }}
            >
              {menu.label}
            </button>
          );
        })}
      </div>

      {/* 본문: Outlet으로 하위 페이지 렌더 */}
      <Outlet />
    </div>
  );
}

export default AdminMain;
