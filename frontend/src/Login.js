import React, { useState } from 'react';
import axios from 'axios';

function Login({ onLogin, onAdminLogin }) {
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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 60 }}>
      <h2>{mode === 'login' ? '로그인' : '회원가입'}</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 220 }}>
        {mode === 'register' && (
          <select name="role" value={form.role} onChange={handleChange} style={{ marginBottom: 8 }}>
            <option value="student">학생</option>
            <option value="professor">교사</option>
          </select>
        )}
  {/* 아이디 입력란 없이 이메일만 입력 */}
        <input
          name="email"
          type={mode === 'login' && form.email === 'admin' ? 'text' : 'email'}
          placeholder="이메일 주소"
          value={form.email}
          onChange={handleChange}
          required
        />
        <input name="password" type="password" placeholder="비밀번호" value={form.password} onChange={handleChange} required />
        {mode === 'register' && <input name="name" placeholder="이름(본명)" value={form.name} onChange={handleChange} required />}
        {mode === 'register' && form.role === 'student' && (
          <>
            <input name="grade" placeholder="학년" value={form.grade} onChange={handleChange} required />
            <input name="class" placeholder="반" value={form.class} onChange={handleChange} required />
          </>
        )}
        {mode === 'register' && form.role === 'professor' && (
          <input name="subject" placeholder="과목" value={form.subject} onChange={handleChange} required />
        )}
        {mode === 'register' && <input name="phone" placeholder="휴대전화번호" value={form.phone} onChange={handleChange} required />}
        <button type="submit">{mode === 'login' ? '로그인' : '회원가입'}</button>
      </form>
      <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); }} style={{ marginTop: 8 }}>
        {mode === 'login' ? '회원가입' : '로그인 화면으로'}
      </button>
      {error && <div style={{ color: error.includes('완료') ? 'green' : 'red', marginTop: 8 }}>
        {error === '아이디와 비밀번호를 입력하세요.' ? '아이디와 비밀번호를 모두 입력해야 합니다. (학생/교사는 비밀번호를 비워두세요)' : error}
      </div>}
    </div>
  );
}

export default Login;