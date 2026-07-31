@echo off
REM ============================================================
REM  Siluar - Inicializador de Producao Local
REM  Sobe a versao de producao (pasta dist/) em segundo plano.
REM ============================================================

cd /d "%~dp0"

REM Verifica se a pasta dist existe; se nao existir, gera a build
if not exist "dist" (
    echo [Siluar] Pasta "dist" nao encontrada. Gerando build de producao...
    call npm install
    call npm run build
)

REM Verifica se o pacote "serve" esta instalado globalmente
where serve >nul 2>nul
if errorlevel 1 (
    echo [Siluar] Instalando dependencia "serve" pela primeira vez...
    call npm install -g serve
)

echo [Siluar] Iniciando servidor em http://localhost:3000
serve -s dist -l 3000
