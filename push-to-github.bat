@echo off
title Push CysterCare to GitHub
set "PATH=%LOCALAPPDATA%\Programs\MinGit\cmd;%PATH%"

echo ===================================================
echo   Pushing CysterCare AI Platform to GitHub...
echo   Repository: https://github.com/rabiyaijaz/-cystercare.git
echo ===================================================
echo.
echo If GitHub asks you to authenticate, a browser window will open.
echo Please click "Sign in with your browser" to authorize.
echo.

git push -u origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ===================================================
    echo [SUCCESS] Code successfully pushed to your repository!
    echo Visit: https://github.com/rabiyaijaz/-cystercare
    echo ===================================================
) else (
    echo.
    echo [NOTE] If you saw an authentication error, you can use a GitHub Personal Access Token (PAT).
)

echo.
pause
