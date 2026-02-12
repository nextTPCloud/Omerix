@echo off
echo ============================================
echo   MinIO - Almacenamiento S3-compatible local
echo ============================================
echo.
echo   API S3:       http://localhost:9000
echo   Consola Web:  http://localhost:9001
echo   Usuario:      minioadmin
echo   Password:     minioadmin
echo.
echo   Bucket:       tralok-dev
echo ============================================
echo.

set MINIO_ROOT_USER=tralokadmin
set MINIO_ROOT_PASSWORD=tralok%TPCAdmn0509

"%~dp0minio.exe" server "%~dp0data" --console-address ":9001"
