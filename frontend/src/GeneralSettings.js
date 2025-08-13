import React, { useState, useEffect } from 'react';
import axios from 'axios';

function GeneralSettings() {
  const [title, setTitle] = useState('지혜로 꽃피우는 삶');
  const [bgUrl, setBgUrl] = useState('https://images.unsplash.com/photo-1503676382389-4809596d5290?auto=format&fit=crop&w=800&q=80');
  const [saved, setSaved] = useState(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    axios.get('/api/db-data').then(res => {
      const data = res.data.find(d => d.type === 'general');
      if (data) {
        setTitle(data.title || '지혜로 꽃피우는 삶');
        setBgUrl(data.bgUrl || 'https://images.unsplash.com/photo-1503676382389-4809596d5290?auto=format&fit=crop&w=800&q=80');
      }
    });
  }, []);

  const handleSave = async () => {
    // 기존 데이터 불러오기
    const res = await axios.get('/api/db-data');
    let arr = res.data;
    arr = arr.filter(d => d.type !== 'general');
    arr.push({ type: 'general', title, bgUrl });
    await axios.post('/api/db-data', arr);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ maxWidth: 480, margin: '40px auto', background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', padding: '32px' }}>
      <h2 style={{ marginBottom: 24, color: '#1976d2' }}>일반 항목 관리</h2>
      <div style={{ marginBottom: 18 }}>
        <label style={{ fontWeight: 600, color: '#333' }}>상단 제목<br />
          <input value={title} onChange={e => setTitle(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #b0b8c1', fontSize: 16, marginTop: 4 }} />
        </label>
      </div>
      <div style={{ marginBottom: 18 }}>
        <label style={{ fontWeight: 600, color: '#333' }}>배경 이미지 URL<br />
          <input value={bgUrl} onChange={e => setBgUrl(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #b0b8c1', fontSize: 16, marginTop: 4 }} />
        </label>
        <div style={{ marginTop: 8 }}>
          <img src={bgUrl} alt="미리보기" style={{ width: '100%', borderRadius: 8, maxHeight: 120, objectFit: 'cover', border: '1px solid #eee' }} />
        </div>
      </div>
      <button onClick={handleSave} style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 4, padding: '10px 24px', fontWeight: 'bold', fontSize: 16, cursor: 'pointer' }}>
        저장
      </button>
      {saved && <span style={{ color: 'green', marginLeft: 16 }}>저장됨</span>}
    </div>
  );
}

export default GeneralSettings;
