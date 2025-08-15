
import React, { useRef, useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import axios from 'axios';

export default function SurveyPage() {
  const [editIdx, setEditIdx] = useState(null);
  const [editRow, setEditRow] = useState(null);

  // 수정 버튼 클릭
  const handleEdit = idx => {
    setEditIdx(idx);
    setEditRow({ ...tableData[idx] });
  };

  // 편집 중 입력값 변경
  const handleEditChange = (e, col) => {
    setEditRow(prev => ({ ...prev, [col]: e.target.value }));
  };

  // 편집 저장 (DB 반영)
  const handleEditSave = async idx => {
    const newData = tableData.map((row, i) => i === idx ? editRow : row);
    try {
      await axios.post('http://localhost:4000/api/survey/batch-upsert', { survey: newData });
      setTableData(newData);
      setEditIdx(null);
      setEditRow(null);
      alert('수정 내용이 저장되었습니다.');
    } catch (err) {
      alert('저장 중 오류 발생: ' + (err?.response?.data?.message || err.message || err));
    }
  };

  // 편집 취소
  const handleEditCancel = () => {
    setEditIdx(null);
    setEditRow(null);
  };
  // 저장 기능 (DB 반영)
  const handleSave = async () => {
    try {
      await axios.post('http://localhost:4000/api/survey/batch-upsert', { survey: tableData });
      alert('전체 데이터가 DB에 저장되었습니다.');
    } catch (err) {
      alert('저장 중 오류 발생: ' + (err?.response?.data?.message || err.message || err));
    }
  };
  const [tableData, setTableData] = useState([
    { col1: '', col2: '', col3: '', col4: '', col5: '', col6: '', col7: '', col8: '', col9: '', col10: '', col11: '' }
  ]);

  // 마운트 시 DB에서 데이터 불러오기
  useEffect(() => {
    axios.get('http://localhost:4000/api/survey')
      .then(res => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          setTableData(res.data);
        }
      })
      .catch(() => {});
  }, []);
  const fileInputRef = useRef();

  // 엑셀에서 불러오기
  const handleImportExcel = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      // 첫 행은 헤더이므로 제외
      const rows = json.slice(1).map(row => ({
        col1: row[0] || '', col2: row[1] || '', col3: row[2] || '', col4: row[3] || '', col5: row[4] || '',
        col6: row[5] || '', col7: row[6] || '', col8: row[7] || '', col9: row[8] || '', col10: row[9] || '', col11: row[10] || ''
      }));
      setTableData(rows.length ? rows : [{ col1: '', col2: '', col3: '', col4: '', col5: '', col6: '', col7: '', col8: '', col9: '', col10: '', col11: '' }]);
    };
    reader.readAsArrayBuffer(file);
  };

  // 행 삭제
  const handleDeleteRow = idx => {
    setTableData(prev => prev.length === 1 ? [{ col1: '', col2: '', col3: '', col4: '', col5: '', col6: '', col7: '', col8: '', col9: '', col10: '', col11: '' }] : prev.filter((_, i) => i !== idx));
  };
  // 엑셀로 내보내기
  const handleExportExcel = () => {
    const header = [
      '구분', '필수 수업 명', '담당 교사', '시수', '대상', '인원', '수업소개', '희망 시간', '요청사항/비고', '수정', '삭제'
    ];
    const data = tableData.map(row => [
      row.col1, row.col2, row.col3, row.col4, row.col5, row.col6, row.col7, row.col8, row.col9, '', ''
    ]);
    const ws = XLSX.utils.aoa_to_sheet([header, ...data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, '수업조사표.xlsx');
  };

  return (
    <div style={{ width: '100%', maxWidth: 1200, margin: '0 auto', padding: 24 }}>
      <div style={{ display: 'flex', gap: 16, marginBottom: 32, justifyContent: 'center' }}>
        <button
          style={{ background: '#f0f0f0', color: '#1976d2', border: '1px solid #1976d2', borderRadius: 8, padding: '12px 32px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer' }}
          onClick={() => window.location.href = '/admin/curriculum'}
        >교육과정 안내</button>
        <button
          style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 32px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer' }}
          onClick={() => window.location.href = '/admin/curriculum/survey'}
        >수업 조사표</button>
        <button
          style={{ background: '#f0f0f0', color: '#1976d2', border: '1px solid #1976d2', borderRadius: 8, padding: '12px 32px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer' }}
          onClick={() => window.location.href = '/admin/curriculum/plan'}
        >수업 계획표</button>
      </div>
      <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: 8, padding: 24, minHeight: 400 }}>
        <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
          <button onClick={() => fileInputRef.current.click()} style={{ padding: '6px 16px', borderRadius: 4, border: '1px solid #1976d2', background: '#1976d2', color: '#fff', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.95rem' }}>엑셀에서 불러오기</button>
          <input type="file" accept=".xlsx,.xls" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImportExcel} />
          <button onClick={handleExportExcel} style={{ padding: '6px 16px', borderRadius: 4, border: '1px solid #1976d2', background: '#fff', color: '#1976d2', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.95rem' }}>엑셀로 내보내기</button>
          <button onClick={handleSave} style={{ padding: '6px 16px', borderRadius: 4, border: '1px solid #388e3c', background: '#388e3c', color: '#fff', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.95rem' }}>저장</button>
        </div>
        <div>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '2.7%' }} />
              <col style={{ width: '13.5%' }} />
              <col style={{ width: '4%' }} />
              <col style={{ width: '2.7%' }} />
              <col style={{ width: '5.4%' }} />
              <col style={{ width: '2.7%' }} />
              <col style={{ width: '16.2%' }} />
              <col style={{ width: '6.8%' }} />
              <col style={{ width: '12.2%' }} />
              <col style={{ width: '2.7%' }} />
              <col style={{ width: '2.7%' }} />
            </colgroup>
            <thead>
              <tr>
                <th style={{ border: '1px solid #222', padding: 6 }}>구분</th>
                <th style={{ border: '1px solid #222', padding: 6 }}>필수 수업 명</th>
                <th style={{ border: '1px solid #222', padding: 6 }}>담당 교사</th>
                <th style={{ border: '1px solid #222', padding: 6 }}>시수</th>
                <th style={{ border: '1px solid #222', padding: 6 }}>대상</th>
                <th style={{ border: '1px solid #222', padding: 6 }}>인원</th>
                <th style={{ border: '1px solid #222', padding: 6 }}>수업소개</th>
                <th style={{ border: '1px solid #222', padding: 6 }}>희망 시간</th>
                <th style={{ border: '1px solid #222', padding: 6 }}>요청사항/비고</th>
                <th style={{ border: '1px solid #222', padding: 6 }}>수정</th>
                <th style={{ border: '1px solid #222', padding: 6 }}>삭제</th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((row, idx) => (
                <tr key={idx}>
                  {editIdx === idx ? (
                    <>
                      <td style={{ border: '1px solid #aaa', padding: 6 }}><input value={editRow.col1} onChange={e => handleEditChange(e, 'col1')} style={{ width: '100%' }} /></td>
                      <td style={{ border: '1px solid #aaa', padding: 6 }}><input value={editRow.col2} onChange={e => handleEditChange(e, 'col2')} style={{ width: '100%' }} /></td>
                      <td style={{ border: '1px solid #aaa', padding: 6 }}><input value={editRow.col3} onChange={e => handleEditChange(e, 'col3')} style={{ width: '100%' }} /></td>
                      <td style={{ border: '1px solid #aaa', padding: 6 }}><input value={editRow.col4} onChange={e => handleEditChange(e, 'col4')} style={{ width: '100%' }} /></td>
                      <td style={{ border: '1px solid #aaa', padding: 6 }}><input value={editRow.col5} onChange={e => handleEditChange(e, 'col5')} style={{ width: '100%' }} /></td>
                      <td style={{ border: '1px solid #aaa', padding: 6 }}><input value={editRow.col6} onChange={e => handleEditChange(e, 'col6')} style={{ width: '100%' }} /></td>
                      <td style={{ border: '1px solid #aaa', padding: 6 }}><input value={editRow.col7} onChange={e => handleEditChange(e, 'col7')} style={{ width: '100%' }} /></td>
                      <td style={{ border: '1px solid #aaa', padding: 6 }}><input value={editRow.col8} onChange={e => handleEditChange(e, 'col8')} style={{ width: '100%' }} /></td>
                      <td style={{ border: '1px solid #aaa', padding: 6 }}><input value={editRow.col9} onChange={e => handleEditChange(e, 'col9')} style={{ width: '100%' }} /></td>
                      <td style={{ border: '1px solid #aaa', padding: 6, textAlign: 'center' }}>
                        <button onClick={() => handleEditSave(idx)} style={{ padding: '2px 6px', borderRadius: 3, border: '1px solid #388e3c', background: '#388e3c', color: '#fff', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.8rem', lineHeight: 1, marginRight: 2 }}>저장</button>
                        <button onClick={handleEditCancel} style={{ padding: '2px 6px', borderRadius: 3, border: '1px solid #aaa', background: '#fff', color: '#888', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.8rem', lineHeight: 1 }}>취소</button>
                      </td>
                      <td style={{ border: '1px solid #aaa', padding: 6, textAlign: 'center' }}>
                        <button onClick={() => handleDeleteRow(idx)} style={{ padding: '2px 6px', borderRadius: 3, border: '1px solid #d32f2f', background: '#fff', color: '#d32f2f', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.8rem', lineHeight: 1 }}>삭제</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={{ border: '1px solid #aaa', padding: 6 }}>{row.col1}</td>
                      <td style={{ border: '1px solid #aaa', padding: 6 }}>{row.col2}</td>
                      <td style={{ border: '1px solid #aaa', padding: 6 }}>{row.col3}</td>
                      <td style={{ border: '1px solid #aaa', padding: 6 }}>{row.col4}</td>
                      <td style={{ border: '1px solid #aaa', padding: 6 }}>{row.col5}</td>
                      <td style={{ border: '1px solid #aaa', padding: 6 }}>{row.col6}</td>
                      <td style={{ border: '1px solid #aaa', padding: 6 }}>{row.col7}</td>
                      <td style={{ border: '1px solid #aaa', padding: 6 }}>{row.col8}</td>
                      <td style={{ border: '1px solid #aaa', padding: 6 }}>{row.col9}</td>
                      <td style={{ border: '1px solid #aaa', padding: 6, textAlign: 'center' }}>
                        <button onClick={() => handleEdit(idx)} style={{ padding: '2px 6px', borderRadius: 3, border: '1px solid #1976d2', background: '#fff', color: '#1976d2', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.8rem', lineHeight: 1 }}>수정</button>
                      </td>
                      <td style={{ border: '1px solid #aaa', padding: 6, textAlign: 'center' }}>
                        <button onClick={() => handleDeleteRow(idx)} style={{ padding: '2px 6px', borderRadius: 3, border: '1px solid #d32f2f', background: '#fff', color: '#d32f2f', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.8rem', lineHeight: 1 }}>삭제</button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
