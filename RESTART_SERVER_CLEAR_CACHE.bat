@echo off
echo ========================================
echo  RESTART SERVER + CLEAR CACHE
echo ========================================
echo.

REM Kill existing Django server
echo [1/3] Menghentikan server yang sedang berjalan...
taskkill /F /IM python.exe 2>nul
timeout /t 2 /nobreak >nul

REM Clear Python cache
echo [2/3] Membersihkan cache Python...
cd /d c:\eoffice
for /d /r %%d in (__pycache__) do @if exist "%%d" rd /s /q "%%d"
del /s /q *.pyc 2>nul

REM Start server
echo [3/3] Menjalankan server...
echo.
echo ========================================
echo  SERVER BERJALAN
echo ========================================
echo.
echo Buka browser dan akses: http://127.0.0.1:8000
echo.
echo PENTING: Setelah browser terbuka, tekan Ctrl+F5
echo untuk hard refresh dan clear cache browser!
echo.
echo Tekan Ctrl+C untuk menghentikan server
echo ========================================
echo.

cd /d c:\eoffice
call .venv\Scripts\activate.bat
python manage.py runserver

pause
