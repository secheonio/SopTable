@echo off
REM 모든 PowerShell 창 닫기

:killloop
REM 현재 실행 중인 powershell.exe 프로세스가 있으면 종료
for /f "tokens=2 delims==;" %%i in ('tasklist /FI "IMAGENAME eq powershell.exe" /NH') do (
    taskkill /PID %%i /F >nul 2>&1
)
REM 2초 대기
ping 127.0.0.1 -n 3 >nul
REM run-all.bat 실행
start "" "%~dp0run-all.bat"
exit /b
