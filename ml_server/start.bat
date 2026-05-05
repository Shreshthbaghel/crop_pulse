@echo off
echo ============================================
echo  TerraSense ML Server - Starting...
echo ============================================
cd /d "%~dp0"
pip install -r requirements.txt --quiet
echo.
echo [ML Server] Starting on http://localhost:8000
echo [ML Server] Docs at http://localhost:8000/docs
echo.
python main.py
pause
