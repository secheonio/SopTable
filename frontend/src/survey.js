import React from 'react';

function Survey() {
  const [tableData, setTableData] = React.useState([
    Array(9).fill(''),
    Array(9).fill(''),
  ]);

  const handleCellChange = (row, col, value) => {
    setTableData(prev => {
      let copy = prev.map(arr => [...arr]);
      copy[row][col] = value;
      return copy;
    });
  };

  const handleRowDelete = (rowIdx) => setTableData(prev => prev.filter((_, idx) => idx !== rowIdx));

  return (
    <div style={{ marginTop: 32, width: '80%', marginLeft: 'auto', marginRight: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', width: '100%' }} border="1">
        <thead>
          <tr>
            {['구분', '수업명', '담당교사', '시수', '대상', '인원', '수업 소개', '희망시간', '요청사항', '삭제'].map((header, colIdx) => (
              <th key={colIdx} style={{ padding: '0.5em 8px', minWidth: 30, height: '1.5em', background: '#f5f5f5', fontSize: 12 }}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tableData.map((row, rowIdx) => (
            <tr key={rowIdx}>
              {row.map((cell, colIdx) => (
                <td key={colIdx} style={{ padding: '0.5em 8px', minWidth: 30, height: '1.5em', verticalAlign: 'top', wordBreak: 'break-all', textAlign: 'center' }}>
                  <textarea
                    value={cell}
                    onChange={e => handleCellChange(rowIdx, colIdx, e.target.value)}
                    style={{ width: '100%', minHeight: '1.5em', border: 'none', outline: 'none', fontSize: 14, background: 'transparent', resize: 'none', overflow: 'hidden', lineHeight: '1.3', boxSizing: 'border-box', wordBreak: 'break-all', whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}
                    rows={1}
                    wrap="hard"
                  />
                </td>
              ))}
              <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                <button type="button" onClick={() => handleRowDelete(rowIdx)}>삭제</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Survey;
import React from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

function Survey({ teacherMode }) {
  // 저장하기 버튼 클릭 시 엑셀로 저장
  const handleSaveAsExcel = () => {
    // editBuffer 기준으로 저장
    const wsData = [
      ['구분', '과목명', '교사명', '학년', '학기', '시수', '수업개요', '시간표', '비고'],
      ...editBuffer
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([wbout], { type: 'application/octet-stream' }), '수업조사표.xlsx');
  };
  // teacherMode prop으로 교사 전용 UI 분기
  const isTeacherMode = !!(typeof teacherMode !== 'undefined' && teacherMode);
  // 교사용: 수업계획서로 이동 버튼
  let navigate;
  if (isTeacherMode) {
    try {
      // useNavigate는 훅이므로 함수 내에서만 호출
      // 아래에서 조건부로 사용
      // eslint-disable-next-line react-hooks/rules-of-hooks
      navigate = require('react-router-dom').useNavigate();
    } catch {}
  }
  // 입력란/자료행: 관리자와 동일 입력란, 자료행은 빈칸 1개만
  const [tableData, setTableData] = React.useState(() => {
    if (isTeacherMode) {
      // 교사용: 빈 행 1개만
      return [Array(9).fill('')];
    }
    // 관리자: 기존 방식
    const saved = localStorage.getItem('surveyTableData');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.every(row => Array.isArray(row) && row.length === 9)) {
          return parsed;
        }
      } catch {}
    }
    // 관리자: 안내행+빈행
    return [
      [
        '독세',
        '지혜롭게 사는 법',
        '나지혜',
        '2',
        '1, 2',
        '8',
        '지혜롭게 사는법을 이야기 한다',
        '화56, 목78',
        '프로젝트,기타'
      ],
      Array(9).fill('')
    ];
  });

  // tableData가 바뀔 때마다 localStorage에 저장
  React.useEffect(() => {
    localStorage.setItem('surveyTableData', JSON.stringify(tableData));
  }, [tableData]);

  // editBuffer 없이 tableData만 사용 (이전 구조)
  // 엑셀 업로드 핸들러
  const [uploadResult, setUploadResult] = React.useState(null);

  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      // 첫 행은 헤더이므로 제외
      const excelRows = rows.slice(1)
        .map(row => (row || []).slice(0, 9).concat(Array(9).fill('')).slice(0, 9))
        .filter(row => row.some(cell => cell && String(cell).trim() !== ''));

      let updatedCount = 0;
      let addedCount = 0;
      setTableData(prev => {
        let updated = [...prev];
        excelRows.forEach(excelRow => {
          if (
            excelRow[0] !== '' &&
            excelRow[1] !== '' &&
            excelRow[2] !== ''
          ) {
            // 1. 기존 행 중 동일(구분/수업명/담당교사)한 것이 있으면 덮어씀
            const idx = updated.findIndex(row => row[0] === excelRow[0] && row[1] === excelRow[1] && row[2] === excelRow[2]);
            if (idx !== -1) {
              updated[idx] = excelRow;
              updatedCount++;
            } else {
              // 2. 빈행(구분/수업명/담당교사 모두 빈칸) 있으면 그 자리에 채움, 없으면 새로 추가
              const emptyIdx = updated.findIndex(row => row[0].trim() === '' && row[1].trim() === '' && row[2].trim() === '' && row.slice(0,9).every(cell => cell.trim() === ''));
              if (emptyIdx !== -1) {
                updated[emptyIdx] = excelRow;
              } else {
                updated.push(excelRow);
              }
              addedCount++;
            }
          }
        });
        // 항상 마지막에 빈행 1개만 남기기
        const nonEmptyRows = updated.filter(rowArr => rowArr.slice(0, 9).some(cell => cell.trim() !== ''));
        return [...nonEmptyRows, Array(9).fill('')];
      });
  // 안내 메시지는 항상 표시 (겹쳐쓴 것만 있어도 안내)
  setUploadResult({ updated: updatedCount, added: addedCount });
// ...existing code...
              <tr>
                {['구분', '수업명', '담당교사', '시수', '대상', '인원', '수업 소개', '희망시간', '요청사항', '삭제'].map((header, colIdx) => (
                  <th key={colIdx} style={{ padding: '0.5em 8px', minWidth: 30, height: '1.5em', background: '#f5f5f5', fontSize: 12 }}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableData.map((row, rowIdx) => (
                <tr key={rowIdx}>
                  {row.map((cell, colIdx) => (
                    <td key={colIdx} style={{ padding: '0.5em 8px', minWidth: 30, height: '1.5em', verticalAlign: 'top', wordBreak: 'break-all', textAlign: 'center' }}>
                      <textarea
                        value={cell}
                        onChange={e => handleCellChange(rowIdx, colIdx, e.target.value)}
                        style={{ width: '100%', minHeight: '1.5em', border: 'none', outline: 'none', fontSize: 14, background: 'transparent', resize: 'none', overflow: 'hidden', lineHeight: '1.3', boxSizing: 'border-box', wordBreak: 'break-all', whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}
                        rows={1}
                        wrap="hard"
                      />
                    </td>
                  ))}
                  <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                    <button type="button" onClick={() => handleRowDelete(rowIdx)}>삭제</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
}

export default Survey;
