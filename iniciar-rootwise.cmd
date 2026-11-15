@echo off
setlocal
cd /d "%~dp0backend"

set "ML_ENABLED=1"
set "PORT=5055"
set "HOST=127.0.0.1"

set "PYTHON=%~dp0..\..\web\.venv\Scripts\python.exe"
if not exist "%PYTHON%" set "PYTHON=python"

echo.
echo  ROOTWISE AI
echo  Iniciando servidor en http://127.0.0.1:5055
echo  Usuario demo: demo / rootwise2026
echo  Admin: admin / rootwise2026
echo  Ctrl+C para detener.
echo.

start "" /b cmd /c "timeout /t 4 >nul & start "" http://127.0.0.1:5055"

"%PYTHON%" -u wsgi.py

if errorlevel 1 (
  echo.
  echo No se pudo iniciar con "%PYTHON%".
  echo Instala Python 3.11+ o ejecuta manualmente:
  echo   cd backend
  echo   python wsgi.py
  pause
)
endlocal
