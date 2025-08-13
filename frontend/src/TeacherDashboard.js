import React from 'react';
import { useNavigate } from 'react-router-dom';

function TeacherDashboard({ onLogout }) {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user || user.role !== 'professor') {
    return <div style={{margin:40, textAlign:'center', color:'#b00', fontWeight:'bold'}}>이 페이지는 교사(Professor)만 접근할 수 있습니다.</div>;
  }
  return (
    <div style={{ width: '90%', margin: '32px auto' }}>
      <h1 style={{ fontSize: '40pt', fontWeight: 800, margin: '0 0 18px 0', textAlign: 'center', letterSpacing: '-1px' }}>교사 페이지</h1>
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <button onClick={() => navigate('/teacher/survey')} style={{ fontSize: 16, background:'none', border:'none', cursor:'pointer', padding:'8px 16px', borderBottom: '2px solid #1976d2', fontWeight: 'bold' }}>수업조사표</button>
          <button onClick={() => navigate('/teacher/plan')} style={{ fontSize: 16, background:'none', border:'none', cursor:'pointer', padding:'8px 16px', borderBottom: '2px solid #1976d2', fontWeight: 'bold' }}>수업계획서</button>
          <button onClick={() => navigate('/teacher/report')} style={{ fontSize: 16, background:'none', border:'none', cursor:'pointer', padding:'8px 16px', borderBottom: '2px solid #1976d2', fontWeight: 'bold' }}>교사 통지표</button>
        </div>
        <button onClick={typeof onLogout === 'function' ? onLogout : undefined} style={{ fontSize: 14, color: '#1976d2', background: 'none', border: '1px solid #1976d2', borderRadius: 4, padding: '4px 16px', cursor: 'pointer' }}>로그아웃</button>
      </div>
      <div style={{ padding: 40, color: '#444', textAlign: 'center', fontSize: 18 }}>
        교사님 환영합니다!<br />
        상단 메뉴에서 수업조사표, 수업계획서, 교사 통지표를 선택해 작성/수정할 수 있습니다.<br />
        기타 안내 및 공지사항이 여기에 표시될 수 있습니다.
      </div>
    </div>
  );
}

export default TeacherDashboard;
