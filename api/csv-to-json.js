import Papa from 'papaparse';

export default async function handler(req, res) {
  // Configuración de cabeceras HTTP anti-caché y CORS
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  // Permitir pasar una URL personalizada por parametro query ?url=... o usar la por defecto
  const defaultUrl = 'https://masatletismocrono.com/wp-content/uploads/CEUS_UCO.csv';
  const targetUrl = req.query.url || defaultUrl;

  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({
        ok: false,
        error: `El servidor remoto devolvió el código HTTP ${response.status}`
      });
    }

    const csvText = await response.text();
    const textoLimpio = csvText.trim();

    if (textoLimpio.startsWith('<')) {
      return res.status(404).json({
        ok: false,
        error: 'El recurso remoto devolvió una página HTML en lugar de un archivo CSV.'
      });
    }

    // Papa.parse con header: true convierte cada fila en un Objeto JSON { Columna: Valor }
    const parsed = Papa.parse(textoLimpio, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true // Convierte números y booleano automáticamente
    });

    return res.status(200).json({
      ok: true,
      total_registros: parsed.data.length,
      datos: parsed.data
    });

  } catch (error) {
    console.error('Error procesando CSV a JSON:', error);
    return res.status(500).json({
      ok: false,
      error: error.message || 'Error interno del servidor'
    });
  }
}