@echo off
setlocal
cd /d "%~dp0backend"

set "ML_ENABLED=1"
set "PORT=5055"
set "HOST=127.0.0.1"

set "PYTHON=%~dp0backend\.venv\Scripts\python.exe"
if not exist "%PYTHON%" goto :setup
"%PYTHON%" -c "import flask" >nul 2>&1
if errorlevel 1 goto :setup
"%PYTHON%" -c "import tensorflow" >nul 2>&1
if errorlevel 1 goto :ml
goto :run

:setup
echo.
echo  Preparando entorno de Python...
where python >nul 2>&1
if errorlevel 1 (
  echo  No se encontro Python 3.11+ en el PATH.
  echo  Instalalo desde https://www.python.org/downloads/ y vuelve a ejecutar.
  pause
  exit /b 1
)
if not exist "%PYTHON%" python -m venv "%~dp0backend\.venv"
"%PYTHON%" -m pip install --upgrade pip
"%PYTHON%" -m pip install -r requirements.txt
if errorlevel 1 (
  echo.
  echo  Fallo la instalacion de dependencias.
  pause
  exit /b 1
)

:ml
echo.
echo  Instalando modulo de IA (TensorFlow). Solo la primera vez.
"%PYTHON%" -m pip install -r requirements-ml.txt
if errorlevel 1 (
  echo.
  echo  No se pudo instalar TensorFlow. La app funciona igual, sin diagnostico de hojas.
  echo  Para reintentar: cd backend ^&^& .venv\Scripts\python -m pip install -r requirements-ml.txt
  pause
)

:run
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
  echo Ejecuta manualmente:
  echo   cd backend
  echo   .venv\Scripts\python wsgi.py
  pause
)
endlocal
