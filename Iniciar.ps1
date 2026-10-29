$ErrorActionPreference = 'Stop'
Push-Location $PSScriptRoot
try {
    Write-Host 'NEXA - Frontend conectado a NexaBack'
    Write-Host 'Frontend: http://localhost:5199/. NexaBack debe estar activo.'
    if ($env:NEXA_API_URL) {
        Write-Host ('API: ' + $env:NEXA_API_URL)
    } else {
        Write-Host 'API: https://localhost:44388'
    }
    dotnet run --project NEXA.csproj --urls http://localhost:5199
} finally {
    Pop-Location
}
