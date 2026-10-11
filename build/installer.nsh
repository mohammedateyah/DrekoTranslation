!macro customInstall
  ${If} $LANGUAGE == 1025
    WriteRegStr HKCU "Software\Dreko Translation" "InstallerLanguage" "ar"
  ${Else}
    WriteRegStr HKCU "Software\Dreko Translation" "InstallerLanguage" "en"
  ${EndIf}
!macroend
