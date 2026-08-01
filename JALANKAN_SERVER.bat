@echo off
echo ========================================
echo   E-Office Django Development Server
echo ========================================
echo.
echo Starting server...
echo.
echo Server akan berjalan di:
echo   - Local (hanya komputer ini): http://127.0.0.1:8000/
echo   - Network (lewat HP/komputer lain): http://0.0.0.0:8000/
echo.
echo Halaman Login: http://127.0.0.1:8000/login/
echo.
echo Tekan CTRL+C untuk menghentikan server
echo ========================================
echo.

cd /d "%~dp0"

REM Coba venv314 dulu, fallback ke .venv, lalu venv
if exist "venv314\Scripts\activate.bat" (
    call venv314\Scripts\activate.bat
) else if exist ".venv\Scripts\activate.bat" (
    call .venv\Scripts\activate.bat
) else if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
) else (
    echo [ERROR] Tidak ditemukan virtual environment (venv314, .venv, atau venv)
    pause
    exit /b 1
)

python manage.py runserver 0.0.0.0:8000

pause
