import React from 'react';


function AdminMain({ onLogout, onShowGeneral }) {
  return (
    <div style={{ minHeight: '100vh', background: '#f7f9fb' }}>
      {/* 상단 프레임 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64, background: '#1976d2', color: '#fff', padding: '0 32px' }}>
        <div style={{ flex: 1 }}></div>
  <div style={{ flex: 2, textAlign: 'center', fontSize: '2.5rem', fontWeight: 'bold', letterSpacing: 2 }}>관리자의 공간</div>
        <div style={{ flex: 1, textAlign: 'right' }}>
          <button onClick={onLogout} style={{ background: '#fff', color: '#1976d2', border: 'none', borderRadius: 4, padding: '7px 18px', fontWeight: 'bold', fontSize: 15, cursor: 'pointer' }}>로그아웃</button>
        </div>
      </div>

      {/* 메뉴 프레임 */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', background: '#e3eaf4', padding: '12px 32px', borderBottom: '1px solid #c5d0e6' }}>
        <button onClick={onShowGeneral} style={{ marginLeft: 12, background: '#1976d2', color: '#fff', border: 'none', borderRadius: 4, padding: '7px 16px', fontWeight: 'bold', fontSize: 15, cursor: 'pointer' }}>일반항목 관리</button>
        <button style={{ marginLeft: 12, background: '#fff', color: '#1976d2', border: '1px solid #1976d2', borderRadius: 4, padding: '7px 16px', fontWeight: 'bold', fontSize: 15, cursor: 'pointer' }}>교육과정 관리</button>
        <button style={{ marginLeft: 12, background: '#fff', color: '#1976d2', border: '1px solid #1976d2', borderRadius: 4, padding: '7px 16px', fontWeight: 'bold', fontSize: 15, cursor: 'pointer' }}>사용자 관리</button>
        <button style={{ marginLeft: 12, background: '#fff', color: '#1976d2', border: '1px solid #1976d2', borderRadius: 4, padding: '7px 16px', fontWeight: 'bold', fontSize: 15, cursor: 'pointer' }}>시간표 관리</button>
  <button style={{ marginLeft: 12, background: '#fff', color: '#1976d2', border: '1px solid #1976d2', borderRadius: 4, padding: '7px 16px', fontWeight: 'bold', fontSize: 15, cursor: 'pointer' }}>통지표 관리</button>
  <button style={{ marginLeft: 12, background: '#fff', color: '#1976d2', border: '1px solid #1976d2', borderRadius: 4, padding: '7px 16px', fontWeight: 'bold', fontSize: 15, cursor: 'pointer' }}>지출품의 관련</button>
      </div>

      {/* 본문 프레임 */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: 40 }}>
        <img src="https://cdn.pixabay.com/photo/2017/01/31/13/14/meeting-2029540_1280.png" alt="관리자" style={{ width: 220, marginBottom: 32, borderRadius: 12, boxShadow: '0 2px 12px #b0b8c1' }} />
        <div style={{ fontSize: 22, fontWeight: 500, color: '#333', marginBottom: 12 }}>여기서 관리자 관련 주요 작업을 할 수 있습니다.</div>
      </div>
    </div>
  );
}

export default AdminMain;
