@echo off
REM =============================================
REM Script para compilar y preparar el proyecto Next.js para despliegue
REM =============================================

SETLOCAL

REM Configuración
SET "PROJECT_DIR=%~dp0"
SET "OUTPUT_DIR=%PROJECT_DIR%output"
SET "NEXT_DIR=%PROJECT_DIR%.next"
SET "PUBLIC_DIR=%PROJECT_DIR%public"
SET "PACKAGE_JSON=%PROJECT_DIR%package.json"
SET "PACKAGE_LOCK=%PROJECT_DIR%package-lock.json"
SET "NEXT_CONFIG=%PROJECT_DIR%next.config.js"
SET "NEXT_CONFIG_TS=%PROJECT_DIR%next.config.ts"
SET "NEXT_ENV=%PROJECT_DIR%.env*"
SET "NODE_MODULES=%PROJECT_DIR%node_modules"

REM Mostrar información
echo =============================================
echo  Compilando y preparando el proyecto Next.js
echo =============================================

REM Crear directorio de salida
echo Creando directorio de salida...
mkdir "%OUTPUT_DIR%"

REM Copiar archivos necesarios
echo Copiando archivos necesarios para el despliegue...

REM Copiar carpeta .next
xcopy "%NEXT_DIR%" "%OUTPUT_DIR%\.next" /E /I /Y

REM Copiar carpeta public
xcopy "%PUBLIC_DIR%" "%OUTPUT_DIR%\public" /E /I /Y

REM Copiar archivos de configuración
if exist "%PACKAGE_JSON%" copy "%PACKAGE_JSON%" "%OUTPUT_DIR%\"
if exist "%PACKAGE_LOCK%" copy "%PACKAGE_LOCK%" "%OUTPUT_DIR%\"
if exist "%NEXT_CONFIG%" (
    copy "%NEXT_CONFIG%" "%OUTPUT_DIR%\"
) else if exist "%NEXT_CONFIG_TS%" (
    copy "%NEXT_CONFIG_TS%" "%OUTPUT_DIR%\"
)

REM Copiar archivos de entorno (opcional, ten en cuenta la seguridad)
copy "%NEXT_ENV%" "%OUTPUT_DIR%\" 2>nul


echo =============================================
echo ¡Proceso completado con éxito!
echo Los archivos de despliegue están en: %OUTPUT_DIR%
echo =============================================

REM Mostrar información de despliegue
echo.
echo Para desplegar en producción:
echo 1. Copie la carpeta "output" a su servidor
echo 2. Ejecute "npm install --production" en el servidor
echo 3. Inicie la aplicación con "npm start" o "node server.js"
echo.
echo Si está usando Vercel, simplemente suba la carpeta "output"

ENDLOCAL
