param([uri]$BackendUrl = 'https://localhost:44388')

$ErrorActionPreference = 'Stop'
if ($BackendUrl.Scheme -ne 'https' -or -not $BackendUrl.IsLoopback) {
    throw 'Este script solo admite un backend HTTPS local.'
}

# La negociación usa la validación normal de Windows; no se omiten errores de certificado.
$tcp = [System.Net.Sockets.TcpClient]::new($BackendUrl.Host, $BackendUrl.Port)
$ssl = [System.Net.Security.SslStream]::new($tcp.GetStream(), $false)
try {
    $ssl.AuthenticateAsClient($BackendUrl.Host)
    $certificate = [System.Security.Cryptography.X509Certificates.X509Certificate2]::new($ssl.RemoteCertificate)
    $directory = Join-Path $PSScriptRoot '.certificates'
    $null = New-Item -ItemType Directory -Path $directory -Force
    $path = Join-Path $directory 'nexaback.local.pem'
    $publicDer = $certificate.Export([System.Security.Cryptography.X509Certificates.X509ContentType]::Cert)
    $base64 = [Convert]::ToBase64String($publicDer, [Base64FormattingOptions]::InsertLineBreaks)
    $pem = "-----BEGIN CERTIFICATE-----`n" + $base64 + "`n-----END CERTIFICATE-----"
    Set-Content -LiteralPath $path -Value $pem -Encoding ascii
    Write-Host 'Certificado público guardado. Reiniciá Vite si ya estaba abierto.'
} finally {
    $ssl.Dispose()
    $tcp.Dispose()
}
