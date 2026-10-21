# 清理占用指定端口的残留 node/vite 进程
# 用法：powershell -ExecutionPolicy Bypass -File scripts/kill-port.ps1 [-Port 2000]
param(
    [int]$Port = 2000
)

$conns = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
if (-not $conns) {
    Write-Host "Port $Port is free." -ForegroundColor Green
    exit 0
}

$pids = $conns | Select-Object -ExpandProperty OwningProcess -Unique
foreach ($procId in $pids) {
    try {
        $proc = Get-Process -Id $procId -ErrorAction Stop
        Stop-Process -Id $procId -Force -ErrorAction Stop
        Write-Host "Killed PID $procId ($($proc.ProcessName)) on port $Port" -ForegroundColor Yellow
    } catch {
        Write-Host "Could not kill PID $procId on port $Port: $_" -ForegroundColor Red
    }
}
Write-Host "Port $Port cleared." -ForegroundColor Green
