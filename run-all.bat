@echo off
REM --- SopTable 프로젝트 전체 자동 실행 스크립트 ---

REM 관리자 권한 확인 및 재실행
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo 관리자 권한이 필요합니다. 관리자 권한으로 다시 실행합니다...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

REM MySQL 서버 중지 후 재시작
net stop mysql >nul 2>&1
timeout /t 2 >nul
start "MySQL Server" powershell -NoExit -Command "net start mysql; mysql -u root -pgyver@0979"

REM 백엔드 서버 실행 (새 창)
start "SopTable Backend" powershell -NoExit -Command "cd 'C:\SopTable\backend'; node index.js"

REM 프론트엔드 서버 실행 (새 창)
start "SopTable Frontend" powershell -NoExit -Command "cd 'C:\SopTable\frontend'; npm start"

echo MySQL, 백엔드, 프론트엔드 서버가 각각 새 창에서 실행됩니다.
pause