@echo off
chcp 65001 >nul
title OpenInvTI - Desbloquear e Deploy v1.2.0
color 0A

echo ============================================================
echo   OpenInvTI v1.2.0 - Desbloqueio + Deploy Automatico
echo ============================================================
echo.
echo Este script vai:
echo   1. Desbloquear todos os arquivos em C:\OpenInvTI
echo   2. Confirmar git status (sem api/)
echo   3. Comitar v1.2.0
echo   4. Enviar para o GitHub (git push)
echo.
echo Pressione qualquer tecla para iniciar...
pause >nul
echo.

echo [1/4] Desbloqueando arquivos do Windows Defender...
powershell -ExecutionPolicy Bypass -Command "Get-ChildItem -Path 'C:\OpenInvTI' -Recurse -Force -ErrorAction SilentlyContinue | Unblock-File -ErrorAction SilentlyContinue; Write-Host 'Desbloqueio OK' -ForegroundColor Green"
echo.

cd /d C:\OpenInvTI
if errorlevel 1 (
    echo ERRO: pasta C:\OpenInvTI nao encontrada
    pause
    exit /b 1
)

echo [2/4] Garantindo .gitignore (api/ ignorado)...
powershell -Command "if (-not (Select-String -Path '.gitignore' -Pattern 'api/' -Quiet)) { Add-Content -Path '.gitignore' -Value 'api/' }"
powershell -Command "if (-not (Select-String -Path '.gitignore' -Pattern '\*.tmp' -Quiet)) { Add-Content -Path '.gitignore' -Value '*.tmp' }"
git rm -rf --cached api/ 2>nul
echo.

echo [3/4] Verificando git status...
git status
echo.
echo ATENCAO: confirme acima que NAO aparece 'api/' antes de prosseguir.
echo Se aparecer 'api/', feche essa janela e me chame.
echo.
echo Pressione qualquer tecla para fazer COMMIT + PUSH...
pause >nul
echo.

echo [4/4] Commit e Push...
git add .
git commit -m "v1.2.0: BarcodeDetector + Dashboard + Vision + Importar + Copiloto + Desktop"
echo.
echo Enviando para o GitHub (vai pedir Personal Access Token)...
git push
echo.

echo ============================================================
echo   DEPLOY CONCLUIDO!
echo ============================================================
echo.
echo Em 60 segundos o GitHub Pages atualiza automaticamente em:
echo   https://jeansanabia-ai.github.io/OpenInvTI/
echo.
echo No celular: Configuracoes - Apps - OpenInvTI - Limpar DADOS
echo Depois abra o app - subtitulo deve mostrar v1.2.0
echo.
echo Pressione qualquer tecla para fechar...
pause >nul
