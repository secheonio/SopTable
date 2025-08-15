import React, { useState } from 'react';
import axios from 'axios';

// 임시 데이터
const initialPosts = [
  { id: 1, title: '2025년 1학기 수업 계획서', author: '관리자', date: '2025-08-01', file: '2025_1학기_계획서.pdf', fileUrl: '/uploads/2025_1학기_계획서.pdf' },
  { id: 2, title: '여름방학 특별수업 계획서', author: '홍길동', date: '2025-08-10', file: '', fileUrl: '' },
];

export default function PlanPage() {
  const [posts, setPosts] = useState(initialPosts);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', author: '', file: null, fileUrl: '' });
  const [selected, setSelected] = useState(null); // 상세보기용
  const [editMode, setEditMode] = useState(false);

  const handleChange = e => {
    const { name, value, files } = e.target;
    if (name === 'file') {
      setForm(f => ({ ...f, file: files[0] || null, fileUrl: '' }));
    } else {
      setForm(f => ({ ...f, [name]: value }));
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.title || !form.author) {
      alert('제목과 작성자를 입력하세요.');
      return;
    }
    let fileUrl = '';
    let fileName = '';
    if (form.file) {
      const data = new FormData();
      data.append('file', form.file);
      try {
        const res = await axios.post('/api/upload', data, { headers: { 'Content-Type': 'multipart/form-data' } });
        fileUrl = res.data.url; // 서버에서 반환하는 파일 URL
        fileName = res.data.name; // 서버에서 반환하는 원본 파일명만 사용
      } catch (err) {
        alert('파일 업로드 실패');
        return;
      }
    }
    setPosts([
      { id: Date.now(), title: form.title, author: form.author, date: new Date().toISOString().slice(0, 10), file: fileName, fileUrl },
      ...posts
    ]);
    setShowForm(false);
    setForm({ title: '', author: '', file: null, fileUrl: '' });
  };

  const handleRowClick = post => setSelected(post);
  const handleDelete = id => {
    setPosts(posts.filter(p => p.id !== id));
    setSelected(null);
  };
  const handleEdit = () => {
    setForm(selected);
    setEditMode(true);
    setShowForm(false);
  };
  const handleUpdate = async e => {
    e.preventDefault();
    let fileUrl = form.fileUrl;
    let fileName = form.file; // 기본값: 기존 파일명
    if (form.file instanceof File) {
      const data = new FormData();
      data.append('file', form.file);
      try {
        const res = await axios.post('/api/upload', data, { headers: { 'Content-Type': 'multipart/form-data' } });
        fileUrl = res.data.url;
        fileName = res.data.name;
      } catch (err) {
        alert('파일 업로드 실패');
        return;
      }
    }
    setPosts(posts.map(p => p.id === form.id ? { ...form, file: fileName, fileUrl } : p));
    setEditMode(false);
    setSelected(null);
    setForm({ title: '', author: '', file: null, fileUrl: '' });
  };

  return (
    <div style={{ width: '100%', maxWidth: 900, margin: '0 auto', padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ color: '#1976d2', margin: 0 }}>수업 계획서 게시판</h2>
        <button
          style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }}
          onClick={() => { setShowForm(true); setEditMode(false); setForm({ title: '', author: '', file: '' }); }}
        >글쓰기</button>
      </div>
      {(showForm || editMode) && (
        <form onSubmit={editMode ? handleUpdate : handleSubmit} style={{ background: '#f9f9f9', border: '1px solid #e0e0e0', borderRadius: 8, padding: 24, marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="제목"
              style={{ flex: 2, padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
              required
            />
            <input
              name="author"
              value={form.author}
              onChange={handleChange}
              placeholder="작성자"
              style={{ flex: 1, padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
              required
            />
            <input
              name="file"
              type="file"
              onChange={handleChange}
              style={{ flex: 2 }}
            />
          </div>
          <div style={{ textAlign: 'right' }}>
            <button type="submit" style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 20px', fontWeight: 'bold', marginRight: 8 }}>{editMode ? '수정' : '등록'}</button>
            <button type="button" style={{ background: '#aaa', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 20px', fontWeight: 'bold' }} onClick={() => { setShowForm(false); setEditMode(false); setForm({ title: '', author: '', file: '' }); }}>취소</button>
          </div>
        </form>
      )}
      <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 8, overflow: 'hidden' }}>
        <thead style={{ background: '#f5f5f5' }}>
          <tr>
            <th style={{ padding: '12px 8px', borderBottom: '1px solid #e0e0e0' }}>번호</th>
            <th style={{ padding: '12px 8px', borderBottom: '1px solid #e0e0e0' }}>제목</th>
            <th style={{ padding: '12px 8px', borderBottom: '1px solid #e0e0e0' }}>작성자</th>
            <th style={{ padding: '12px 8px', borderBottom: '1px solid #e0e0e0' }}>작성일</th>
            <th style={{ padding: '12px 8px', borderBottom: '1px solid #e0e0e0' }}>업로드 파일</th>
          </tr>
        </thead>
        <tbody>
          {posts.length === 0 ? (
            <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32, color: '#888' }}>등록된 게시글이 없습니다.</td></tr>
          ) : (
            posts.map((post, idx) => (
              <tr key={post.id} style={{ cursor: 'pointer' }} onClick={e => { if (e.target.tagName !== 'A') handleRowClick(post); }}>
                <td style={{ padding: '10px 8px', borderBottom: '1px solid #eee', textAlign: 'center' }}>{posts.length - idx}</td>
                <td style={{ padding: '10px 8px', borderBottom: '1px solid #eee' }}>{post.title}</td>
                <td style={{ padding: '10px 8px', borderBottom: '1px solid #eee', textAlign: 'center' }}>{post.author}</td>
                <td style={{ padding: '10px 8px', borderBottom: '1px solid #eee', textAlign: 'center' }}>{post.date}</td>
                <td style={{ padding: '10px 8px', borderBottom: '1px solid #eee', textAlign: 'center', color: post.file ? '#1976d2' : '#aaa' }}>
                  {post.file && post.fileUrl ? (
                    <a href={post.fileUrl.replace('/uploads/', '/api/upload/download/')} download style={{ color: '#1976d2', textDecoration: 'underline' }} onClick={e => e.stopPropagation()}>{post.file}</a>
                  ) : '없음'}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      {/* 상세/수정/삭제 모달 */}
      {selected && !editMode && (
        <div style={{ position: 'fixed', left: 0, top: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.2)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 8, padding: 32, minWidth: 340, boxShadow: '0 2px 16px #bbb', position: 'relative' }}>
            <h3 style={{ marginTop: 0, color: '#1976d2' }}>{selected.title}</h3>
            <div style={{ marginBottom: 8 }}>작성자: {selected.author}</div>
            <div style={{ marginBottom: 8 }}>작성일: {selected.date}</div>
            <div style={{ marginBottom: 16 }}>업로드 파일: {selected.file && selected.fileUrl ? <a href={selected.fileUrl.replace('/uploads/', '/api/upload/download/')} download style={{ color: '#1976d2', textDecoration: 'underline' }}>{selected.file}</a> : '없음'}</div>
            <div style={{ textAlign: 'right' }}>
              <button onClick={handleEdit} style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 18px', fontWeight: 'bold', marginRight: 8 }}>수정</button>
              <button onClick={() => handleDelete(selected.id)} style={{ background: '#e53935', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 18px', fontWeight: 'bold', marginRight: 8 }}>삭제</button>
              <button onClick={() => setSelected(null)} style={{ background: '#aaa', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 18px', fontWeight: 'bold' }}>닫기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
