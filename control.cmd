@echo off
set ADB="%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe"
if not exist evidencias_celular mkdir evidencias_celular
%ADB% shell input tap 900 2300
powershell -NoProfile -Command "Start-Sleep -Milliseconds 3000"
set NOMBRE=cel_%RANDOM%%RANDOM%.png
%ADB% exec-out screencap -p > evidencias_celular\%NOMBRE%
echo Captura guardada: evidencias_celular\%NOMBRE%
