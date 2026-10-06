# Stop Project-Local PostgreSQL Throwaway Cluster (Port 55432)
$PG_BIN = "C:\Program Files\PostgreSQL\18\bin"
$PROJECT_ROOT = Resolve-Path "$PSScriptRoot\.."
$PG_DATA = "$PROJECT_ROOT\.pgdata"

if (-not (Test-Path "$PG_DATA\PG_VERSION")) {
    Write-Warning "Local PostgreSQL data directory not found at $PG_DATA."
    exit 0
}

Write-Host "Stopping project-local PostgreSQL on 127.0.0.1:55432..."
& "$PG_BIN\pg_ctl.exe" -D "$PG_DATA" -m fast stop
if ($LASTEXITCODE -eq 0) {
    Write-Host "Project-local PostgreSQL stopped successfully."
} else {
    Write-Error "Failed to stop local PostgreSQL cluster."
}
