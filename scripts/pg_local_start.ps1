# Start Project-Local PostgreSQL Throwaway Cluster (Port 55432)
$PG_BIN = "C:\Program Files\PostgreSQL\18\bin"
$PROJECT_ROOT = Resolve-Path "$PSScriptRoot\.."
$PG_DATA = "$PROJECT_ROOT\.pgdata"
$LOG_FILE = "$PG_DATA\server.log"

if (-not (Test-Path "$PG_DATA\PG_VERSION")) {
    Write-Error "Local PostgreSQL data directory not found at $PG_DATA. Run python backend/scripts/pg_local_init.py first."
    exit 1
}

Write-Host "Starting project-local PostgreSQL on 127.0.0.1:55432 (Data: $PG_DATA)..."
Start-Process -FilePath "$PG_BIN\postgres.exe" -ArgumentList "-D", "$PG_DATA" -RedirectStandardOutput "$LOG_FILE" -RedirectStandardError "$LOG_FILE" -WindowStyle Hidden
Write-Host "Project-local PostgreSQL started successfully. Log file: $LOG_FILE"
