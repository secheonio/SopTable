import React, { useState } from 'react';
import axios from 'axios';

export default function AdminUserForm({
	onUserAdded, defaultRole, vertical,
	editMode, form: editForm, setForm: setEditForm, onSubmit, onCancel, error: editError
}) {
	// 등록 모드일 때만 내부 상태 사용
	const [form, setForm] = useState({
		username: '',
		name: '',
		email: '',
		password: '',
		role: defaultRole || 'student',
		grade: '',
		class: '',
		number: '',
		phone: '',
		subject: '',
		position: '',
		department: '',
		course: '',
		level: '1',
	});
	const [error, setError] = useState(null);
	const [success, setSuccess] = useState(null);
	const [showPw, setShowPw] = useState(false);

	// 입력값/이벤트 핸들러 분기
	const isEdit = !!editMode;
	const curForm = isEdit ? editForm : form;
	const curSetForm = isEdit ? setEditForm : setForm;
	const curError = isEdit ? editError : error;

	const handleChange = e => {
		curSetForm({ ...curForm, [e.target.name]: e.target.value });
	};

	const validate = (f) => {
		if (!f.name) return '이름을 입력하세요.';
		if (!f.email) return '이메일을 입력하세요.';
		if (!/^\S+@\S+\.\S+$/.test(f.email)) return '이메일 형식이 올바르지 않습니다.';
		if (f.phone && !/^01[016789][0-9]{7,8}$/.test(f.phone.replace(/-/g, ''))) return '휴대폰 번호는 숫자만 10~11자리로 입력하세요.';
		if (!isEdit && (!f.password || f.password.length < 8 || !/[a-zA-Z]/.test(f.password) || !/[0-9]/.test(f.password))) return '비밀번호는 8자 이상, 영문+숫자를 포함해야 합니다.';
		return null;
	};

	// 등록 모드: 직접 등록, 수정 모드: props.onSubmit 호출
	const handleSubmit = async e => {
		e.preventDefault();
		const v = validate(curForm);
		if (v) {
			setError(v);
			return;
		}
		if (isEdit) {
			onSubmit(curForm);
			return;
		}
		setError(null);
		setSuccess(null);
		// 숫자 필드가 빈 문자열이면 null로 변환
		const patch = { ...curForm };
		['grade', 'class', 'number', 'level'].forEach(f => {
			if (patch[f] === '') patch[f] = null;
		});
		try {
			await axios.post('http://localhost:4000/api/users', patch);
			setSuccess('등록 완료!');
			setForm({
				username: '', name: '', email: '', password: '', role: defaultRole || 'student', grade: '', class: '', number: '', phone: '', subject: '', position: '', department: '', course: '', level: '1',
			});
			if (onUserAdded) onUserAdded();
		} catch (err) {
			setError(err.response?.data?.error || err.message);
		}
	};

	// 필드 구성은 role에 따라 다르게 표시
	const isStudent = form.role === 'student';
	const isProfessor = form.role === 'professor';

			// vertical prop이 true면 세로 배치, 아니면 기존 2줄 배치
					if (vertical) {
						return (
							<form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'stretch', width: '100%' }}>
								<select name="role" value={curForm.role} onChange={handleChange} disabled={isEdit}>
									<option value="student">학생</option>
									<option value="professor">교사</option>
								</select>
								<input name="name" value={curForm.name} onChange={handleChange} placeholder="이름" required />
								<input name="phone" value={curForm.phone} onChange={handleChange} placeholder="휴대폰" />
								<input name="email" value={curForm.email} onChange={handleChange} placeholder="email" required />
								<div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
									<input
										name="password"
										type={showPw ? 'text' : 'password'}
										value={curForm.password}
										onChange={handleChange}
										placeholder="password"
										required={!isEdit}
										style={{ flex: 1 }}
									/>
									<button type="button" onClick={() => setShowPw(v => !v)} style={{ position: 'absolute', right: 4, background: 'none', border: 'none', cursor: 'pointer', color: '#888', fontSize: 15, padding: 0 }} tabIndex={-1}>
										{showPw ? '숨김' : '보기'}
									</button>
								</div>
								<input name="position" value={curForm.position} onChange={handleChange} placeholder="직위" />
								{curForm.role === 'student' && <>
									<input name="grade" value={curForm.grade || ''} onChange={handleChange} placeholder="학년" />
									<input name="class" value={curForm.class || ''} onChange={handleChange} placeholder="반" />
									<input name="number" value={curForm.number || ''} onChange={handleChange} placeholder="번호" />
								</>}
								{curForm.role === 'professor' && <>
									<input name="subject" value={curForm.subject || ''} onChange={handleChange} placeholder="과목" />
									<input name="course" value={curForm.course || ''} onChange={handleChange} placeholder="과정" />
									<input name="department" value={curForm.department || ''} onChange={handleChange} placeholder="부서" />
								</>}
								<select name="level" value={curForm.level || '1'} onChange={handleChange}>
									<option value="1">1</option>
									<option value="2">2</option>
									<option value="3">3</option>
									<option value="4">4</option>
									<option value="5">부관리자</option>
								</select>
								<div style={{ display: 'flex', gap: 8 }}>
									<button type="submit">{isEdit ? '수정완료' : '등록'}</button>
									{isEdit && <button type="button" onClick={onCancel}>취소</button>}
								</div>
								<div style={{ minHeight: 20 }}>
									{curError && <span style={{ color: 'red' }}>{curError}</span>}
									{!isEdit && success && <span style={{ color: 'green' }}>{success}</span>}
								</div>
							</form>
						);
					}
			{/* 메뉴별 접근권한(확장용) */}
			{isEdit && (
				<div style={{ margin: '10px 0 0 0', padding: '10px', border: '1px dashed #bbb', borderRadius: 6, background: '#fafbfc' }}>
					<div style={{ fontWeight: 'bold', marginBottom: 6, color: '#205080' }}>메뉴별 접근권한 (향후 확장 가능)</div>
					<div style={{ color: '#888', fontSize: '0.97rem' }}>
						<span>예시: 학생관리, 교사관리, 엑셀업로드, 통계 등 각 메뉴별 체크박스 UI 추가 가능</span>
					</div>
				</div>
			)}
			{/* 기존 2줄 배치 코드... */}
}
