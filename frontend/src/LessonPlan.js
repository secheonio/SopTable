import React from 'react';

function LessonPlan() {
  const totalRows = 30;
  const totalCols = 16;
  const cellRefs = React.useRef(Array.from({ length: totalRows }, () => Array(totalCols).fill(null)));
  const [title, setTitle] = React.useState(() => localStorage.getItem('lessonPlanTitle') || '2025-2학기 수업 조사표');
  const handleTitleChange = e => {
    setTitle(e.target.value);
    localStorage.setItem('lessonPlanTitle', e.target.value);
  };
  const handleCellKeyDown = (row, col, e) => {
    let nextRow = row, nextCol = col;
    if (e.key === 'ArrowRight') nextCol = col < totalCols - 1 ? col + 1 : col;
    if (e.key === 'ArrowLeft') nextCol = col > 0 ? col - 1 : col;
    };

    return (
      <table style={{ width: '160mm', minWidth: '160mm', maxWidth: '160mm', tableLayout: 'fixed', borderCollapse: 'collapse', margin: '0 auto', background: '#fff', border: '1px solid #205080', borderWidth: '1px' }}>
        <colgroup>
          {Array.from({ length: 16 }).map((_, i) => (
            <col key={i} style={{ width: `${100/16}%` }} />
          ))}
        </colgroup>
        <tbody>
          {/* 헤더 행 */}
          <tr>
            <td colSpan={16} style={{ background: '#e6f0ff', border: '1px solid #4a90e2', borderWidth: '1px', borderLeftWidth: 0, borderRightWidth: 0, textAlign: 'center', fontWeight: 'bold', fontSize: '32pt', height: '48pt', letterSpacing: 2 }}>
              <input
                type="text"
                value={title}
                onChange={handleTitleChange}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  textAlign: 'center',
                  fontWeight: 'bold',
                  fontSize: '32pt',
                  letterSpacing: 2,
                  color: '#205080',
                  height: '48pt',
                  boxSizing: 'border-box',
                }}
                placeholder="표 제목을 입력하세요"
              />
            </td>
          </tr>
          {/* 나머지 29행 */}
          {Array.from({ length: 29 }).map((_, rowIdx) => (
            (rowIdx === 1 || rowIdx === 2)
              ? (
                <tr key={rowIdx+1}>
                  {/* 1~3열 병합 */}
                  <td colSpan={3} style={{ border: '1px solid #cce4ff', borderWidth: '1px', padding: 0, minWidth: 0, minHeight: '22pt', verticalAlign: 'middle', textAlign: 'center', display: 'table-cell' }}>
                    {rowIdx === 1 ? (
                      <span style={{ fontSize: '14pt', fontWeight: 'bold', color: '#205080', display: 'block', width: '100%' }}>담당 교사</span>
                    ) : rowIdx === 2 ? (
                      <input
                        ref={el => {
                          if (!cellRefs.current[rowIdx+1]) cellRefs.current[rowIdx+1] = Array(totalCols).fill(null);
                          cellRefs.current[rowIdx+1][0] = el;
                        }}
                        onKeyDown={e => handleCellKeyDown(rowIdx+1, 0, e)}
                        style={{ width: '99%', border: 'none', outline: 'none', fontSize: '12pt', background: 'transparent', padding: 2, boxSizing: 'border-box', textAlign: 'center', color: '#888' }}
                        placeholder="지혜교사"
                      />
                    ) : (
                      <textarea
                        ref={el => {
                          if (!cellRefs.current[rowIdx+1]) cellRefs.current[rowIdx+1] = Array(totalCols).fill(null);
                          cellRefs.current[rowIdx+1][0] = el;
                        }}
                        onKeyDown={e => handleCellKeyDown(rowIdx+1, 0, e)}
                        style={{ width: '99%', border: 'none', outline: 'none', fontSize: '11pt', background: 'transparent', padding: 2, boxSizing: 'border-box', resize: 'none', minHeight: '22pt', verticalAlign: 'middle', textAlign: 'center', display: 'block' }}
                        rows={2}
                      />
                    )}
                  </td>
                  {/* 4~6열 병합 */}
                  <td colSpan={3} style={{ border: '1px solid #cce4ff', borderWidth: '1px', padding: 0, minWidth: 0, minHeight: '22pt', verticalAlign: 'middle', textAlign: 'center', display: 'table-cell' }}>
                    {rowIdx === 1 ? (
                      <span style={{ fontSize: '14pt', fontWeight: 'bold', color: '#205080', display: 'block', width: '100%' }}>분류</span>
                    ) : rowIdx === 2 ? (
                      <select
                        ref={el => {
                          if (!cellRefs.current[rowIdx+1]) cellRefs.current[rowIdx+1] = Array(totalCols).fill(null);
                          cellRefs.current[rowIdx+1][3] = el;
                        }}
                        defaultValue="필수"
                        style={{ width: '99%', border: 'none', outline: 'none', fontSize: '12pt', background: 'transparent', padding: 2, boxSizing: 'border-box', textAlign: 'center', color: '#205080' }}
                      >
                        <option value="필수">필수</option>
                        <option value="독세">독세</option>
                        <option value="선택">선택</option>
                        <option value="프로젝트">프로젝트</option>
                        <option value="개설">개설</option>
                      </select>
                    ) : (
                      <textarea
                        ref={el => {
                          if (!cellRefs.current[rowIdx+1]) cellRefs.current[rowIdx+1] = Array(totalCols).fill(null);
                          cellRefs.current[rowIdx+1][3] = el;
                        }}
                        onKeyDown={e => handleCellKeyDown(rowIdx+1, 3, e)}
                        style={{ width: '99%', border: 'none', outline: 'none', fontSize: '11pt', background: 'transparent', padding: 2, boxSizing: 'border-box', resize: 'none', minHeight: '22pt', verticalAlign: 'middle', textAlign: 'center', display: 'block' }}
                        rows={2}
                      />
                    )}
                  </td>
                  {/* 7~11열 병합 */}
                  <td colSpan={5} style={{ border: '1px solid #cce4ff', borderWidth: '1px', padding: 0, minWidth: 0, minHeight: '22pt', verticalAlign: 'middle', textAlign: 'center', display: 'table-cell' }}>
                    {rowIdx === 1 ? (
                      <span style={{ fontSize: '14pt', fontWeight: 'bold', color: '#205080', display: 'block', width: '100%' }}>수업명</span>
                    ) : rowIdx === 2 ? (
                      <input
                        ref={el => {
                          if (!cellRefs.current[rowIdx+1]) cellRefs.current[rowIdx+1] = Array(totalCols).fill(null);
                          cellRefs.current[rowIdx+1][6] = el;
                        }}
                        onKeyDown={e => handleCellKeyDown(rowIdx+1, 6, e)}
                        style={{ width: '99%', border: 'none', outline: 'none', fontSize: '12pt', background: 'transparent', padding: 2, boxSizing: 'border-box', textAlign: 'center', color: '#888' }}
                        placeholder="지혜로운 수업"
                      />
                    ) : (
                      <textarea
                        ref={el => {
                          if (!cellRefs.current[rowIdx+1]) cellRefs.current[rowIdx+1] = Array(totalCols).fill(null);
                          cellRefs.current[rowIdx+1][6] = el;
                        }}
                        onKeyDown={e => handleCellKeyDown(rowIdx+1, 6, e)}
                        style={{ width: '99%', border: 'none', outline: 'none', fontSize: '11pt', background: 'transparent', padding: 2, boxSizing: 'border-box', resize: 'none', minHeight: '22pt', verticalAlign: 'middle', textAlign: 'center', display: 'block' }}
                        rows={2}
                      />
                    )}
                  </td>
                  {/* 12~16열 병합 */}
                  <td colSpan={5} style={{ border: '1px solid #cce4ff', borderWidth: '1px', padding: 0, minWidth: 0, minHeight: '22pt', verticalAlign: 'middle', textAlign: 'center', display: 'table-cell' }}>
                    {rowIdx === 1 ? (
                      <span style={{ fontSize: '14pt', fontWeight: 'bold', color: '#205080', display: 'block', width: '100%' }}>대상 학생</span>
                    ) : rowIdx === 2 ? (
                      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap', minHeight: '22pt' }}>
                        {[1,2,3,4,5,6].map(num => (
                          <label key={num} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '12pt', color: '#205080', userSelect: 'none', marginRight: 2 }}>
                            <input
                              type="checkbox"
                              style={{ marginBottom: 2 }}
                            />
                            {num}
                          </label>
                        ))}
                      </div>
                    ) : (
                      <textarea
                        ref={el => {
                          if (!cellRefs.current[rowIdx+1]) cellRefs.current[rowIdx+1] = Array(totalCols).fill(null);
                          cellRefs.current[rowIdx+1][11] = el;
                        }}
                        onKeyDown={e => handleCellKeyDown(rowIdx+1, 11, e)}
                        style={{ width: '99%', border: 'none', outline: 'none', fontSize: '11pt', background: 'transparent', padding: 2, boxSizing: 'border-box', resize: 'none', minHeight: '22pt', verticalAlign: 'middle', textAlign: 'center', display: 'block' }}
                        rows={2}
                      />
                    )}
                  </td>
                </tr>
              ) : (
                <tr key={rowIdx+1}>
                  {Array.from({ length: 16 }).map((_, colIdx) => (
                    <td key={colIdx} style={{ border: '1px solid #cce4ff', borderWidth: '1px', padding: 0, minWidth: 0, minHeight: '22pt', verticalAlign: 'middle', textAlign: 'center', display: 'table-cell' }}>
                      <textarea
                        ref={el => {
                          if (!cellRefs.current[rowIdx+1]) cellRefs.current[rowIdx+1] = Array(totalCols).fill(null);
                          cellRefs.current[rowIdx+1][colIdx] = el;
                        }}
                        onKeyDown={e => handleCellKeyDown(rowIdx+1, colIdx, e)}
                        style={{ width: '99%', border: 'none', outline: 'none', fontSize: '11pt', background: 'transparent', padding: 2, boxSizing: 'border-box', resize: 'none', minHeight: '22pt', verticalAlign: 'middle', textAlign: 'center', display: 'block' }}
                        rows={2}
                      />
                    </td>
                  ))}
                </tr>
              )
          ))}
        </tbody>
      </table>
    );
}

export default LessonPlan;