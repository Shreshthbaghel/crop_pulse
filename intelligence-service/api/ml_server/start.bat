@echo off
echo ============================================
echo  CropPulse Intelligence Server - Starting...
echo ============================================
cd /d "%~dp0"
pip install -r requirements.txt --quiet
echo.
echo [CropPulse ML] Starting on http://localhost:8000
echo [CropPulse ML] API Docs at http://localhost:8000/docs
echo.
python main.py
pause
