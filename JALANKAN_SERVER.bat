@echo off
echo ========================================
echo   E-Office Django Development Server
echo ========================================
echo.
echo Starting server...
echo.
echo Server akan berjalan di:
echo   - Local (hanya komputer ini): http://127.0.0.1:8000/
echo   - Network (lewat HP/komputer lain): http://172.16.0.86:8000/  (atau IP Wi-Fi Anda saat ini)
echo.
echo Halaman Login: http://127.0.0.1:8000/accounts/login/
echo.
echo Tekan CTRL+C untuk menghentikan server
echo ========================================
echo.

cd /d "%~dp0"
call .venv\Scripts\activate.bat
python manage.py runserver 0.0.0.0:8000

pause
