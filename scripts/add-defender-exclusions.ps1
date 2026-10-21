# 将 cargo-target 与项目目录加入 Windows Defender 排除项，避免实时扫描拖慢编译
# 需以管理员身份运行
$paths = @(
    'C:\cargo-target\reward-tauri',
    'F:\fieldOfHarmony\rewardsystem\src-tauri',
    'F:\fieldOfHarmony\rewardsystem\node_modules'
)

foreach ($p in $paths) {
    if (-not (Test-Path $p)) {
        New-Item -ItemType Directory -Path $p -Force | Out-Null
    }
    try {
        Add-MpPreference -ExclusionPath $p -ErrorAction Stop
        Write-Host "Excluded: $p" -ForegroundColor Green
    } catch {
        Write-Host "Failed to exclude $p : $_" -ForegroundColor Yellow
    }
}
