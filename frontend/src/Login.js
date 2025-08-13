import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Login({ onLogin, onAdminLogin }) {
  // 상단 제목/배경이미지 동적 관리
  const [mainTitle, setMainTitle] = useState('지혜로 꽃피우는 삶');
  const [mainBg, setMainBg] = useState('https://images.unsplash.com/photo-1503676382389-4809596d5290?auto=format&fit=crop&w=800&q=80');
  useEffect(() => {
    fetch('/api/db-data').then(r => r.json()).then(arr => {
      const g = arr.find(d => d.type === 'general');
      if (g) {
        if (g.title) setMainTitle(g.title);
        if (g.bgUrl) setMainBg(g.bgUrl);
      }
    });
  }, []);
  const [form, setForm] = useState({
    // username은 내부에서만 사용, 입력받지 않음
    password: '',
    name: '',
    email: '',
    role: 'student',
    grade: '',
    class: '',
    phone: '',
    subject: ''
  });
  const [error, setError] = useState(null);
  const [mode, setMode] = useState('login'); // 'login' or 'register'

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError(null);
    try {
      if (mode === 'login') {
        // admin 예외 처리: 이메일 입력란에 'admin' 입력 시 관리자 로그인
        let loginPayload;
        if (form.email === 'admin') {
          loginPayload = { email: 'admin', password: form.password };
        } else {
          loginPayload = { email: form.email, password: form.password };
        }
        const res = await axios.post('http://localhost:4000/api/login', loginPayload);
        const user = res.data;
        // level이 5(부관리자) 또는 role이 'admin'이면 관리자 모드로 진입
        if (user.role === 'admin' || user.level === 5 || user.level === '5') {
          localStorage.setItem('user', JSON.stringify(user));
          localStorage.setItem('adminMode', 'true');
          onAdminLogin(user);
        } else {
          localStorage.setItem('user', JSON.stringify(user));
          localStorage.removeItem('adminMode');
          onLogin(user);
        }
      } else {
        // 회원가입
        if (form.role === 'student') {
          if (!form.email || !form.name || !form.grade || !form.class || !form.phone || !form.password) {
            setError('모든 필수 항목을 입력하세요.');
            return;
          }
        } else if (form.role === 'professor') {
          if (!form.email || !form.name || !form.subject || !form.phone || !form.password) {
            setError('모든 필수 항목을 입력하세요.');
            return;
          }
        }
        // 회원가입 요청 (admin 예외 없음)
        const payload = {
          password: form.password,
          name: form.name,
          email: form.email,
          role: form.role,
          grade: form.role === 'student' ? form.grade : null,
          class: form.role === 'student' ? form.class : null,
          phone: form.phone,
          subject: form.role === 'professor' ? form.subject : null
        };
        await axios.post('http://localhost:4000/api/users', payload);
        setMode('login');
        setError('회원가입이 완료되었습니다. 로그인해 주세요.');
        setForm({
          password: '', name: '', email: '', role: 'student', grade: '', class: '', phone: '', subject: ''
        });
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f7f9fb' }}>
      {/* 상단 제목 */}
      <header style={{ width: '100%', background: '#1976d2', color: '#fff', padding: '32px 0 18px 0', textAlign: 'center', fontSize: '2.5rem', fontWeight: 900, letterSpacing: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
        {mainTitle}
      </header>
      {/* 메뉴/버튼 영역 */}
      <nav style={{ width: '100%', background: '#e3eaf6', padding: '18px 0', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 12, alignItems: 'center', marginRight: 32 }}>
          <label style={{ fontWeight: 600, fontSize: 15, color: '#333' }}>
            아이디
            <input
              name="email"
              type={mode === 'login' && form.email === 'admin' ? 'text' : 'email'}
              placeholder="이메일"
              value={form.email}
              onChange={handleChange}
              required
              style={{ marginLeft: 6, padding: '6px 12px', borderRadius: 4, border: '1px solid #b0b8c1', fontSize: 16, minWidth: 140 }}
            />
          </label>
          <label style={{ fontWeight: 600, fontSize: 15, color: '#333' }}>
            비밀번호
              <input
                name="password"
                type="password"
                placeholder="비밀번호"
                value={form.password}
                onChange={handleChange}
                required
                style={{ marginLeft: 6, padding: '6px 12px', borderRadius: 4, border: '1px solid #b0b8c1', fontSize: 16, minWidth: 60, maxWidth: 80 }}
            />
          </label>
          <button type="submit" style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 18px', fontWeight: 'bold', fontSize: 16, cursor: 'pointer' }}>
            로그인
          </button>
          <button type="button" onClick={() => { setMode('register'); setError(null); }} style={{ background: '#fff', color: '#1976d2', border: '1.5px solid #1976d2', borderRadius: 4, padding: '6px 18px', fontWeight: 'bold', fontSize: 16, cursor: 'pointer' }}>
            회원가입
          </button>
        </form>
      </nav>
      {/* 본문 안내문구 및 폼 영역 */}
      <main style={{
        maxWidth: 480,
        margin: '48px auto 0 auto',
        borderRadius: 12,
        boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
        padding: '40px 32px',
        minHeight: 220,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        background: `url('${mainBg}') center/cover no-repeat`
      }}>
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(255,255,255,0.72)',
          borderRadius: 12,
          zIndex: 1
        }} />
        <div style={{ fontSize: '1.25rem', color: '#1976d2', fontWeight: 700, marginBottom: 24, position: 'relative', zIndex: 2 }}>
          지혜 학교 통합 관리 시스템입니다.
        </div>
        {mode === 'register' && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 320, position: 'relative', zIndex: 2 }}>
            <select name="role" value={form.role} onChange={handleChange} style={{ marginBottom: 8, padding: '6px 8px', borderRadius: 4, border: '1px solid #b0b8c1', fontSize: 15 }}>
              <option value="student">학생</option>
              <option value="professor">교사</option>
            </select>
            <input name="email" type="email" placeholder="이메일 주소" value={form.email} onChange={handleChange} required style={{ padding: '6px 12px', borderRadius: 4, border: '1px solid #b0b8c1', fontSize: 15 }} />
            <input name="password" type="password" placeholder="비밀번호" value={form.password} onChange={handleChange} required style={{ padding: '6px 12px', borderRadius: 4, border: '1px solid #b0b8c1', fontSize: 15 }} />
            <input name="name" placeholder="이름(본명)" value={form.name} onChange={handleChange} required style={{ padding: '6px 12px', borderRadius: 4, border: '1px solid #b0b8c1', fontSize: 15 }} />
            {form.role === 'student' && (
              <>
                <input name="grade" placeholder="학년" value={form.grade} onChange={handleChange} required style={{ padding: '6px 12px', borderRadius: 4, border: '1px solid #b0b8c1', fontSize: 15 }} />
                <input name="class" placeholder="반" value={form.class} onChange={handleChange} required style={{ padding: '6px 12px', borderRadius: 4, border: '1px solid #b0b8c1', fontSize: 15 }} />
              </>
            )}
            {form.role === 'professor' && (
              <input name="subject" placeholder="과목" value={form.subject} onChange={handleChange} required style={{ padding: '6px 12px', borderRadius: 4, border: '1px solid #b0b8c1', fontSize: 15 }} />
            )}
            <input name="phone" placeholder="휴대전화번호" value={form.phone} onChange={handleChange} required style={{ padding: '6px 12px', borderRadius: 4, border: '1px solid #b0b8c1', fontSize: 15 }} />
            <button type="submit" style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 4, padding: '8px 0', fontWeight: 'bold', fontSize: 16, marginTop: 8, cursor: 'pointer' }}>
              회원가입 완료
            </button>
            <button type="button" onClick={() => { setMode('login'); setError(null); }} style={{ background: '#fff', color: '#1976d2', border: '1.5px solid #1976d2', borderRadius: 4, padding: '8px 0', fontWeight: 'bold', fontSize: 16, marginTop: 4, cursor: 'pointer' }}>
              로그인 화면으로
            </button>
          </form>
        )}
        {error && <div style={{ color: error.includes('완료') ? 'green' : 'red', marginTop: 18, fontWeight: 600 }}>{error}</div>}
      </main>
    </div>
  );
}

export default Login;