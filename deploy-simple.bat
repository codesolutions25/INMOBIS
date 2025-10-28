@echo off
setlocal enabledelayedexpansion

:: Configuración
set "DEPLOY=deploy"
set "TIMESTAMP=%DATE:/=-%-%TIME::=-%"
set "TIMESTAMP=%TIMESTAMP: =0%"

echo Limpiando directorio de despliegue...
if exist "%DEPLOY%" (
    rmdir /s /q "%DEPLOY%"
)
mkdir "%DEPLOY%"

echo Instalando dependencias...
call npm install

if %ERRORLEVEL% neq 0 (
    echo Error al instalar dependencias. Saliendo...
    exit /b 1
)

echo Construyendo la aplicación...
call npx next build

if %ERRORLEVEL% neq 0 (
    echo Error al construir la aplicación. Saliendo...
    exit /b 1
)

echo Copiando archivos necesarios...

:: Copiar archivos necesarios
robocopy "." "%DEPLOY%" "public" "package.json" "next.config.js" "next-env.d.ts" "tsconfig.json" "/XD" "node_modules" "/E" "/NFL" /NDL /NJH /NJS /NC /NS /NP 

:: Copiar .next (excluyendo cache)
robocopy ".\.next" "%DEPLOY%\.next" "/XD" "cache" "/E" "/NFL" "/NDL" "/NJH" "/NJS" "/NC" "/NS" "/NP"

:: Copiar .env.production si existe
if exist ".env.production" (
    copy ".env.production" "%DEPLOY%\.env.production"
)

echo.
echo Archivos copiados exitosamente a la carpeta: %DEPLOY%
echo.
echo Para desplegar en producción:
echo 1. Copie la carpeta %DEPLOY% al servidor
echo 2. En el servidor, ejecute: npm install --production
echo 3. Luego ejecute: npx next start -p <puerto>