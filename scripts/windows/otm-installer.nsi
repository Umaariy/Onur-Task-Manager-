Unicode true
!include "MUI2.nsh"
!define APPDIR "$LOCALAPPDATA\Programs\ONUR Task Manager"
!define STAGE "..\..\work\installer-stage"
!define UNINSTALL_KEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\ONURTaskManager"

Name "ONUR Task Manager"
OutFile "..\..\..\ONUR-Task-Manager-Setup.exe"
InstallDir "${APPDIR}"
RequestExecutionLevel user
SetCompressor /SOLID lzma
Icon "${STAGE}\onur.ico"
UninstallIcon "${STAGE}\onur.ico"
VIProductVersion "1.0.1.0"
VIAddVersionKey "ProductName" "ONUR Task Manager"
VIAddVersionKey "FileDescription" "ONUR Task Manager installer"
VIAddVersionKey "CompanyName" "ONUR"

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "Uzbek"
!insertmacro MUI_LANGUAGE "Russian"
!insertmacro MUI_LANGUAGE "English"

Section "ONUR Task Manager"
  SetShellVarContext current
  StrCpy $INSTDIR "${APPDIR}"
  IfFileExists "$INSTDIR\scripts\windows\stop.ps1" 0 +2
    ExecWait '"$SYSDIR\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "$INSTDIR\scripts\windows\stop.ps1"'
  SetOutPath "$INSTDIR"
  File "${STAGE}\node.exe"
  File "${STAGE}\onur.ico"
  File "${STAGE}\package.json"
  SetOutPath "$INSTDIR\node_modules"
  File /r "${STAGE}\node_modules\*"
  SetOutPath "$INSTDIR\dist"
  File /r "${STAGE}\dist\*"
  SetOutPath "$INSTDIR\drizzle"
  File "${STAGE}\drizzle\*.sql"
  SetOutPath "$INSTDIR\scripts\windows"
  File "launch.ps1"
  File "stop.ps1"
  SetOutPath "$INSTDIR"
  WriteUninstaller "$INSTDIR\Uninstall.exe"

  CreateDirectory "$SMPROGRAMS\ONUR Task Manager"
  CreateShortCut "$SMPROGRAMS\ONUR Task Manager\ONUR Task Manager.lnk" "$SYSDIR\WindowsPowerShell\v1.0\powershell.exe" '-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "$INSTDIR\scripts\windows\launch.ps1"' "$INSTDIR\onur.ico"
  CreateShortCut "$SMPROGRAMS\ONUR Task Manager\Uninstall.lnk" "$INSTDIR\Uninstall.exe"
  CreateShortCut "$DESKTOP\ONUR Task Manager.lnk" "$SYSDIR\WindowsPowerShell\v1.0\powershell.exe" '-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "$INSTDIR\scripts\windows\launch.ps1"' "$INSTDIR\onur.ico"

  WriteRegStr HKCU "${UNINSTALL_KEY}" "DisplayName" "ONUR Task Manager"
  WriteRegStr HKCU "${UNINSTALL_KEY}" "DisplayVersion" "1.0.1"
  WriteRegStr HKCU "${UNINSTALL_KEY}" "Publisher" "ONUR"
  WriteRegStr HKCU "${UNINSTALL_KEY}" "InstallLocation" "$INSTDIR"
  WriteRegStr HKCU "${UNINSTALL_KEY}" "DisplayIcon" "$INSTDIR\onur.ico"
  WriteRegStr HKCU "${UNINSTALL_KEY}" "UninstallString" '"$INSTDIR\Uninstall.exe"'
  WriteRegDWORD HKCU "${UNINSTALL_KEY}" "NoModify" 1
  WriteRegDWORD HKCU "${UNINSTALL_KEY}" "NoRepair" 1

  IfSilent +2
    Exec '"$SYSDIR\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "$INSTDIR\scripts\windows\launch.ps1"'
SectionEnd

Section "Uninstall"
  SetShellVarContext current
  StrCmp $INSTDIR "${APPDIR}" +2 0
    Abort "Unexpected installation directory."
  ExecWait '"$SYSDIR\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "$INSTDIR\scripts\windows\stop.ps1"'
  Delete "$DESKTOP\ONUR Task Manager.lnk"
  Delete "$SMPROGRAMS\ONUR Task Manager\ONUR Task Manager.lnk"
  Delete "$SMPROGRAMS\ONUR Task Manager\Uninstall.lnk"
  RMDir "$SMPROGRAMS\ONUR Task Manager"
  DeleteRegKey HKCU "${UNINSTALL_KEY}"
  Delete "$INSTDIR\dist\server\.dev.vars"
  RMDir /r "$INSTDIR\node_modules"
  RMDir /r "$INSTDIR\dist"
  RMDir /r "$INSTDIR\drizzle"
  RMDir /r "$INSTDIR\scripts"
  Delete "$INSTDIR\node.exe"
  Delete "$INSTDIR\onur.ico"
  Delete "$INSTDIR\package.json"
  Delete "$INSTDIR\Uninstall.exe"
  RMDir "$INSTDIR"
SectionEnd
