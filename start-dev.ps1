# GOHIP Platform Development Startup Script
# ==========================================
# This script ensures consistent port configuration across restarts.
#
# Standard Ports:
#   Backend API: http://localhost:8000
#   Frontend:    http://localhost:5173
#
# Usage:
#   .\start-dev.ps1           # Start backend only
#   .\start-dev.ps1 -All      # Start both backend and frontend
#   .\start-dev.ps1 -Frontend # Start frontend only

param(
    [switch]$All,
    [switch]$Frontend,
    [switch]$Backend
)

$ErrorActionPreference = "Continue"

# Configuration
$BACKEND_PORT = 8000
$FRONTEND_PORT = 5173
$ROOT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$SERVER_DIR = Join-Path $ROOT_DIR "server"
$CLIENT_DIR = Join-Path $ROOT_DIR "client"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  GOHIP Platform Development Server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Function to start backend
function Start-Backend {
    Write-Host "[Backend] Starting on port $BACKEND_PORT..." -ForegroundColor Green
    
    # Kill any existing Python processes on the port
    $existingProcess = Get-NetTCPConnection -LocalPort $BACKEND_PORT -ErrorAction SilentlyContinue | 
        Select-Object -ExpandProperty OwningProcess -ErrorAction SilentlyContinue
    
    if ($existingProcess) {
        Write-Host "[Backend] Port $BACKEND_PORT is in use, stopping existing process..." -ForegroundColor Yellow
        Stop-Process -Id $existingProcess -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
    }
    
    Push-Location $SERVER_DIR
    
    # Check if virtual environment exists
    if (Test-Path ".venv\Scripts\Activate.ps1") {
        Write-Host "[Backend] Activating virtual environment..." -ForegroundColor Gray
        & .\.venv\Scripts\Activate.ps1
    }
    
    Write-Host "[Backend] Starting uvicorn server..." -ForegroundColor Gray
    Start-Process -FilePath "uvicorn" -ArgumentList "app.main:app", "--reload", "--host", "127.0.0.1", "--port", $BACKEND_PORT -NoNewWindow
    
    Pop-Location
    
    Write-Host "[Backend] Server started at http://localhost:$BACKEND_PORT" -ForegroundColor Green
    Write-Host "[Backend] API Docs: http://localhost:$BACKEND_PORT/docs" -ForegroundColor Gray
}

# Function to start frontend
function Start-Frontend {
    Write-Host "[Frontend] Starting on port $FRONTEND_PORT..." -ForegroundColor Blue
    
    # Kill any existing process on the frontend port
    $existingFrontendProcess = Get-NetTCPConnection -LocalPort $FRONTEND_PORT -ErrorAction SilentlyContinue |
        Select-Object -ExpandProperty OwningProcess -ErrorAction SilentlyContinue

    if ($existingFrontendProcess) {
        Write-Host "[Frontend] Port $FRONTEND_PORT is in use, stopping existing process..." -ForegroundColor Yellow
        Stop-Process -Id $existingFrontendProcess -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
    }

    Push-Location $CLIENT_DIR
    
    # Ensure .env has correct API URL
    $envFile = Join-Path $CLIENT_DIR ".env"
    $envContent = "VITE_API_URL=http://localhost:$BACKEND_PORT"
    Write-Host "[Frontend] Overwriting .env with VITE_API_URL=http://localhost:$BACKEND_PORT" -ForegroundColor Yellow
    Set-Content -Path $envFile -Value $envContent
    
    Write-Host "[Frontend] Starting Vite dev server..." -ForegroundColor Gray
    Start-Process -FilePath "npm" -ArgumentList "run", "dev" -NoNewWindow
    
    Pop-Location
    
    Write-Host "[Frontend] Server started at http://localhost:$FRONTEND_PORT" -ForegroundColor Blue
}

# Determine what to start
$startBackend = $Backend -or $All -or (-not $Frontend)
$startFrontend = $Frontend -or $All

if ($startBackend) {
    Start-Backend
}

if ($startFrontend) {
    Start-Sleep -Seconds 2  # Give backend time to start
    Start-Frontend
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Development servers are running!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Backend:  http://localhost:$BACKEND_PORT" -ForegroundColor Green
Write-Host "  Frontend: http://localhost:$FRONTEND_PORT" -ForegroundColor Blue
Write-Host "  API Docs: http://localhost:$BACKEND_PORT/docs" -ForegroundColor Gray
Write-Host "  Login:   http://localhost:$FRONTEND_PORT/login" -ForegroundColor Blue
Write-Host ""
Write-Host "  Press Ctrl+C to stop all servers." -ForegroundColor Yellow
