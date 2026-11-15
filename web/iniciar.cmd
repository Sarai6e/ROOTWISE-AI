@echo off
setlocal
cd /d "%~dp0"
if exist ".venv\Scripts\python.exe" goto arrancar
py -3 -m venv .venv
if errorlevel 1 (
    python -m venv .venv
    if errorlevel 1 goto error
)
:arrancar
".venv\Scripts\python.exe" -c "import tensorflow, PIL" >nul 2>nul
if errorlevel 1 (
    echo Instalando TensorFlow y Pillow ^(solo la primera vez^)...
    ".venv\Scripts\python.exe" -m pip install -r requirements.txt
    if errorlevel 1 goto error
)
".venv\Scripts\python.exe" servidor.py
if errorlevel 1 goto error
exit /b 0
:error
echo.
echo No se pudo iniciar AgroVision. Revisa el mensaje anterior.
pause
exit /b 1
