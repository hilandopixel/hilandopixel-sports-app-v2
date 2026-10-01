param (
    [string]$RutaCarpeta = "C:\ruta\a\tu\carpeta", # Cambia por la ruta de tus imágenes
    [int]$Calidad = 80
)

Add-Type -AssemblyName System.Drawing

# Obtener archivos de imagen
$extensiones = @("*.jpg", "*.jpeg", "*.png")
$imagenes = Get-ChildItem -Path $RutaCarpeta -File | Where-Object { $extensiones -contains "*$($_.Extension.ToLower())" }

# Configurar el compresor JPG
$jpegCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq "image/jpeg" }
$encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
$encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]$Calidad)

# CAMBIO 1: Inicializar como Array en lugar de Hashtable
$resultado = [System.Collections.Generic.List[PSObject]]::new()
$orden = 1

foreach ($imgFile in $imagenes) {
    try {
        $img = [System.Drawing.Image]::FromFile($imgFile.FullName)
        $ms = New-Object System.IO.MemoryStream
        
        # Guardar en stream con compresión JPG
        $img.Save($ms, $jpegCodec, $encoderParams)
        $img.Dispose()

        # Convertir a Base64
        $bytes = $ms.ToArray()
        $ms.Dispose()
        $base64 = [Convert]::ToBase64String($bytes)
        $dataUrl = "data:image/jpeg;base64,$base64"

        # CAMBIO 2: Añadir el objeto directamente al Array
        $resultado.Add([PSCustomObject]@{
            order = $orden
            url   = $dataUrl
        })

        $orden++
    } catch {
        Write-Host "Error procesando $($imgFile.Name): $_" -ForegroundColor Red
    }
}

# CAMBIO 3: Asignar la lista directamente al JSON
$jsonFinal = @{
    imagenes_cabecera = $resultado
}

# Guardar JSON
$rutaJson = Join-Path -Path $RutaCarpeta -ChildPath "imagenes_cabecera.json"
$jsonFinal | ConvertTo-Json -Depth 5 | Set-Content -Path $rutaJson -Encoding UTF8
Write-Host "¡Proceso completado! Guardado en: $rutaJson" -ForegroundColor Green