import React, { useState } from 'react';

export default function CurriculumManage() {
  const [tab, setTab] = useState('survey');

  return (
    <div style={{ width: '100%', maxWidth: 1200, margin: '0 auto', padding: 24 }}>
      <div style={{ display: 'flex', borderBottom: '2px solid #1976d2', marginBottom: 24 }}>
        <button
          onClick={() => setTab('survey')}
          style={{
            border: 'none',
            background: tab === 'survey' ? '#1976d2' : '#f0f0f0',
            color: tab === 'survey' ? '#fff' : '#1976d2',
            fontWeight: 'bold',
            fontSize: '1.1rem',
            padding: '12px 32px',
            borderRadius: '8px 8px 0 0',
            cursor: 'pointer',
            marginRight: 8
          }}
        >수업 조사표</button>
        <button
          onClick={() => setTab('plan')}
          style={{
            border: 'none',
            background: tab === 'plan' ? '#1976d2' : '#f0f0f0',
            color: tab === 'plan' ? '#fff' : '#1976d2',
            fontWeight: 'bold',
            fontSize: '1.1rem',
            padding: '12px 32px',
            borderRadius: '8px 8px 0 0',
            cursor: 'pointer'
          }}
        >수업 계획표</button>
      </div>
      <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: 8, padding: 24, minHeight: 400 }}>
        {tab === 'survey' && <div>수업 조사표 관리 영역</div>}
        {tab === 'plan' && <div>수업 계획표 관리 영역</div>}
      </div>
    </div>
  );
}
