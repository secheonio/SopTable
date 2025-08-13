import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import LessonPlan from './LessonPlan';
import Timetable from './Timetable';
import Enroll from './Enroll';
import Record from './Record';
import Survey from './survey';

function CurriculumManager() {
  // 현재 경로에서 탭 활성화 (react-router-dom)
  const location = useLocation();
  const currentPath = location.pathname;
  // 각 페이지별 제목 상태
  const [surveyTitle, setSurveyTitle] = useState('수업조사표');
  const [planTitle, setPlanTitle] = useState('수업 계획서');
  const [timetableTitle, setTimetableTitle] = useState('시간표');
  const [enrollTitle, setEnrollTitle] = useState('수강신청');
  const [recordTitle, setRecordTitle] = useState('학생부');

  // 페이지 진입 시 서버에서 제목 fetch
  useEffect(() => {
    if (currentPath === '/admin/survey') {
      fetch('/api/survey-title')
        .then(res => res.json())
        .then(data => { if (data.title) setSurveyTitle(data.title); });
    } else if (currentPath === '/admin/curriculum') {
      fetch('/api/plan-title')
        .then(res => res.json())
        .then(data => { if (data.title) setPlanTitle(data.title); });
    } else if (currentPath === '/admin/timetable') {
      fetch('/api/timetable-title')
        .then(res => res.json())
        .then(data => { if (data.title) setTimetableTitle(data.title); });
    } else if (currentPath === '/admin/enroll') {
      fetch('/api/enroll-title')
        .then(res => res.json())
        .then(data => { if (data.title) setEnrollTitle(data.title); });
    } else if (currentPath === '/admin/record') {
      fetch('/api/record-title')
        .then(res => res.json())
        .then(data => { if (data.title) setRecordTitle(data.title); });
    }
  }, [currentPath]);
  // 저장 피드백
  const [saved, setSaved] = useState(false);
  const tabList = [
    { key: 'survey', label: '수업조사표', path: '/admin/survey' },
    { key: 'plan', label: '수업 계획서', path: '/admin/curriculum' },
    { key: 'timetable', label: '시간표', path: '/admin/timetable' },
    { key: 'enroll', label: '수강신청', path: '/admin/enroll' },
    { key: 'record', label: '학생부', path: '/admin/record' },
  ];
  // 5방색(노랑, 파랑, 초록, 분홍, 보라)로 각 버튼 배경색 지정
  const tabBgColors = {
    survey: '#fff9c4',      // 연노랑
    plan: '#bbdefb',        // 연파랑
    timetable: '#c8e6c9',   // 연초록
    enroll: '#f8bbd0',      // 연분홍
    record: '#d1c4e9',      // 연보라
  };
  // 선택된 버튼은 더 진한 색상
  const tabSelectedColors = {
    survey: '#ffe082',      // 진노랑
    plan: '#64b5f6',        // 진파랑
    timetable: '#81c784',   // 진초록
    enroll: '#f06292',      // 진분홍
    record: '#9575cd',      // 진보라
  };
  // 현재 페이지에 따라 제목/핸들러 선택
  let handleSave = () => {};
  if (currentPath === '/admin/survey') {
    handleSave = () => {
      fetch('/api/survey-title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: surveyTitle }),
      })
        .then(() => {
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        });
    };
  } else if (currentPath === '/admin/curriculum') {
    handleSave = () => {
      fetch('/api/plan-title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: planTitle }),
      })
        .then(() => {
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        });
    };
  } else if (currentPath === '/admin/timetable') {
    handleSave = () => {
      fetch('/api/timetable-title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: timetableTitle }),
      })
        .then(() => {
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        });
    };
  } else if (currentPath === '/admin/enroll') {
    handleSave = () => {
      fetch('/api/enroll-title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: enrollTitle }),
      })
        .then(() => {
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        });
    };
  } else if (currentPath === '/admin/record') {
    handleSave = () => {
      fetch('/api/record-title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: recordTitle }),
      })
        .then(() => {
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        });
    };
  }

  return (
  <div style={{ padding: 32, maxWidth: '100vw', margin: '0 auto', fontFamily: 'inherit', lineHeight: 1.6, fontSize: '10pt' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, gap: 16 }}>
        <div style={{ fontWeight: 'bold', fontSize: '40pt', color: '#205080' }}>교육과정 관리</div>
        <button
          style={{ borderRadius: 6, padding: '8px 22px', background: '#e6f0ff', color: '#205080', border: '1px solid #4a90e2', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', marginLeft: 16 }}
          onClick={() => window.location.href = '/'}
        >사용자 관리로 이동</button>
        <button
          onClick={handleSave}
          style={{ fontSize: '1.1rem', padding: '8px 24px', background: '#205080', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', marginLeft: 24 }}>
          저장
        </button>
        {saved && (
          <span style={{ marginLeft: 12, color: '#228B22', fontWeight: 'bold', fontSize: '1.1rem' }}>저장 완료</span>
        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 24 }}>
        {tabList.map(t => {
          const isSelected = currentPath === t.path;
          const bgColor = isSelected ? (tabSelectedColors[t.key] || '#e6f0ff') : (tabBgColors[t.key] || '#fff');
          const color = isSelected ? '#222' : (t.key === 'survey' ? '#b8860b' : '#205080');
          return (
            <button
              key={t.key}
              onClick={() => { if (!isSelected) window.location.href = t.path; }}
              style={{
                fontWeight: isSelected ? 'bold' : 'normal',
                borderRadius: 6,
                padding: '8px 22px',
                border: isSelected ? '2px solid #4a90e2' : '1px solid #aaa',
                background: bgColor,
                color,
                fontSize: '1rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >{t.label}</button>
          );
        })}
      </div>
  <hr style={{ border: 0, borderTop: '2px solid #e0e0e0', margin: '0 0 24px 0' }} />
  {/* 각 페이지별 제목 input을 구분선 아래에 렌더링 */}
  {currentPath === '/admin/survey' && <input type="text" value={surveyTitle} onChange={e => setSurveyTitle(e.target.value)} style={{ fontSize: '40pt', fontWeight: 'bold', textAlign: 'center', margin: '24px 0 16px 0', width: '100%', border: 'none', outline: 'none', background: 'transparent', color: '#205080', display: 'block' }} />}
  {currentPath === '/admin/curriculum' && <input type="text" value={planTitle} onChange={e => setPlanTitle(e.target.value)} style={{ fontSize: '40pt', fontWeight: 'bold', textAlign: 'center', margin: '24px 0 16px 0', width: '100%', border: 'none', outline: 'none', background: 'transparent', color: '#205080', display: 'block' }} />}
  {currentPath === '/admin/timetable' && <input type="text" value={timetableTitle} onChange={e => setTimetableTitle(e.target.value)} style={{ fontSize: '40pt', fontWeight: 'bold', textAlign: 'center', margin: '24px 0 16px 0', width: '100%', border: 'none', outline: 'none', background: 'transparent', color: '#205080', display: 'block' }} />}
  {currentPath === '/admin/enroll' && <input type="text" value={enrollTitle} onChange={e => setEnrollTitle(e.target.value)} style={{ fontSize: '40pt', fontWeight: 'bold', textAlign: 'center', margin: '24px 0 16px 0', width: '100%', border: 'none', outline: 'none', background: 'transparent', color: '#205080', display: 'block' }} />}
  {currentPath === '/admin/record' && <input type="text" value={recordTitle} onChange={e => setRecordTitle(e.target.value)} style={{ fontSize: '40pt', fontWeight: 'bold', textAlign: 'center', margin: '24px 0 16px 0', width: '100%', border: 'none', outline: 'none', background: 'transparent', color: '#205080', display: 'block' }} />}
  {/* 본문 렌더링 */}
  {currentPath === '/admin/survey' && <Survey />}
  {currentPath === '/admin/curriculum' && <LessonPlan />}
  {currentPath === '/admin/timetable' && <Timetable />}
  {currentPath === '/admin/enroll' && <Enroll />}
  {currentPath === '/admin/record' && <Record />}
    </div>
  );
}

export default CurriculumManager;
