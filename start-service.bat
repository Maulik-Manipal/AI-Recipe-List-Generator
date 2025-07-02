@echo off
echo Starting Python food recognition service...
start "Food Recognition Service" cmd /c "cd backend\food-service && python app.py"
timeout /t 10 >nul
echo Starting Node.js server...
start "Node.js Server" cmd /k "cd backend && node server.js"
echo Both services are now running!
pause