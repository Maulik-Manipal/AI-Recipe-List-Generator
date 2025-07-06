@echo off
echo Starting Python food recognition service...
start "Food Recognition Service" cmd /c "cd backend\food-service && python app.py"

echo Waiting for Python service to initialize...
timeout /t 8 >nul

echo Starting Node.js server...
start "Node.js Server" cmd /k "cd backend && node server.js"

echo Opening web browser to http://localhost:3000...
start http://localhost:3000

echo Both services are now running!
pause
