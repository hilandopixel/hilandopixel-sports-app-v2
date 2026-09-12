import Papa from 'papaparse';

export default async function handler(req, res) {
  const CSV_URL = 'https://masatletismocrono.com/wp-content/uploads/CEUS_UCO.csv';

  // Desactivar totalmente la caché en las respuestas de Vercel
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  try {
    // Añadir timestamp para obligar al servidor de origen a entregar la última versión del CSV
    const response = await fetch(`${CSV_URL}?t=${Date.now()}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Cache-Control': 'no-cache'
      }
    });

    if (!response.ok) {
      throw new Error(`Error en el servidor remoto: ${response.status}`);
    }

    const csvText = await response.text();
    const parsed = Papa.parse(csvText, { skipEmptyLines: true });

    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json(parsed.data);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}