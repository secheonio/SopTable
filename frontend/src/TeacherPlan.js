import React from 'react';

function TeacherPlan() {
  const navigate = require('react-router-dom').useNavigate();
  return (
    <div style={{ marginTop: 32, width: '80%', marginLeft: 'auto', marginRight: 'auto' }}>
      <h1 style={{ fontSize: '40pt', fontWeight: 800, margin: '0 0 18px 0', textAlign: 'center', letterSpacing: '-1px' }}>수업계획서</h1>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 24 }}>
        <button
          type="button"
          style={{ cursor: 'pointer', background: '#1976d2', color: '#fff', borderRadius: 4, border: 'none', padding: '6px 18px', fontWeight: 'bold' }}
          onClick={() => navigate('/teacher')}
        >
          대시보드로 이동
        </button>
        <button
          type="button"
          style={{ cursor: 'pointer', background: '#388e3c', color: '#fff', borderRadius: 4, border: 'none', padding: '6px 18px', fontWeight: 'bold' }}
          onClick={() => navigate('/teacher/survey')}
        >
          수업 조사표로 이동
        </button>
        <button
          type="button"
          style={{ cursor: 'pointer', background: '#1976d2', color: '#fff', borderRadius: 4, border: 'none', padding: '6px 18px', fontWeight: 'bold' }}
          onClick={() => navigate('/teacher/report')}
        >
          통지표로 이동
        </button>
      </div>
      <div style={{ textAlign: 'center', marginTop: 40, fontSize: 18, color: '#555' }}>
        이 페이지는 교사용 수업계획서 기능을 위한 공간입니다.<br />
        필요한 기능이나 양식을 추가해 주세요.
      </div>
    </div>
  );
}

export default TeacherPlan;
