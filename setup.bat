@echo off
echo Setting up Multiplayer Board Game...
echo.

echo Installing backend dependencies...
cd backend
npm install
echo.

echo Installing frontend dependencies...
cd ..\frontend
npm install
echo.

echo Setup complete!
echo.
echo To start the application:
echo 1. Start MongoDB
echo 2. In backend directory: npm run dev
echo 3. In frontend directory: npm start
echo.
echo Make sure to configure your .env file in the backend directory.
pause 