# Android USB : contourne l isolation Wi-Fi (pas de tunnel ngrok)
# Branchez le telephone, activez le debogage USB, puis : npm run start:usb
adb reverse tcp:8081 tcp:8081
adb reverse tcp:3001 tcp:3001
Set-Location (Join-Path $PSScriptRoot "..")
npx expo start --localhost
