@echo off
rem Toma una captura de pantalla del celular conectado por USB
set ADB="%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe"
if not exist evidencias_celular mkdir evidencias_celular
set NOMBRE=cel_%RANDOM%%RANDOM%.png
%ADB% exec-out screencap -p > evidencias_celular\%NOMBRE%
echo Captura guardada: evidencias_celular\%NOMBRE%
