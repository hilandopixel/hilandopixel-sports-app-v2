import Papa from 'papaparse';

export default async function handler(req, res) {
  const CSV_URL = 'https://hilandopixel-v2.vercel.app/csvtest.csv';

  try {
    // 1. Descargar el archivo CSV directo de la URL original
    const response = await fetch(CSV_URL, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: `El servidor del CSV devolvió el estado HTTP ${response.status}`
      });
    }

    const csvText = await response.text();
    const textoLimpio = csvText.trim();

    // 2. Comprobar que no sea una página HTML de error de WordPress
    if (textoLimpio.startsWith('<')) {
      return res.status(404).json({ 
        error: 'El archivo CSV no está disponible o la URL devolvió una página HTML.' 
      });
    }

    // 3. Convertir el CSV en formato JSON
    const parsed = Papa.parse(textoLimpio, { skipEmptyLines: true });

    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json(parsed.data);

  } catch (error) {
    console.error('Error en la Serverless Function:', error);
    return res.status(500).json({ error: error.message || 'Error interno del servidor' });
  }
}