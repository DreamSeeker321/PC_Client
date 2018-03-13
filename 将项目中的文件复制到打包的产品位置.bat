copy /y "%~dp0\package.json" "D:\TeeProduct\PC_Client\"
copy /y "%~dp0\login.html" "D:\TeeProduct\PC_Client\"
copy /y "%~dp0\login_tmp.html" "D:\TeeProduct\PC_Client\"
copy /y "%~dp0\index.html" "D:\TeeProduct\PC_Client\"
xcopy "%~dp0\src" "D:\TeeProduct\PC_Client\src" /exclude:exclude.txt /s /e
xcopy "%~dp0\dist" "D:\TeeProduct\PC_Client\dist" /exclude:exclude.txt /s /e
xcopy "%~dp0\browser" "D:\TeeProduct\PC_Client\browser" /exclude:exclude.txt /s /e
xcopy "%~dp0\shortCutTool" "D:\TeeProduct\PC_Client\shortCutTool" /exclude:exclude.txt /s /e