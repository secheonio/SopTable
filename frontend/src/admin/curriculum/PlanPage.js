import React from 'react';

export default function PlanPage() {
  return (
    <div style={{ width: '100%', maxWidth: 1200, margin: '0 auto', padding: 24 }}>
      <div style={{ display: 'flex', gap: 16, marginBottom: 32, justifyContent: 'center' }}>
        <button
          style={{ background: '#f0f0f0', color: '#1976d2', border: '1px solid #1976d2', borderRadius: 8, padding: '12px 32px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer' }}
          onClick={() => window.location.href = '/admin/curriculum'}
        >교육과정 안내</button>
        <button
          style={{ background: '#f0f0f0', color: '#1976d2', border: '1px solid #1976d2', borderRadius: 8, padding: '12px 32px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer' }}
          onClick={() => window.location.href = '/admin/curriculum/survey'}
        >수업 조사표</button>
        <button
          style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 32px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer' }}
        >수업 계획표</button>
      </div>
      <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: 8, padding: 24, minHeight: 400 }}>
        <div>수업 계획서 관리 영역</div>
      </div>
    </div>
  );
}
