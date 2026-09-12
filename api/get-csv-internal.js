import Papa from 'papaparse';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  try {
    // Construir la ruta absoluta hacia la carpeta public
    const filePath = path.join(process.cwd(), 'public', 'csvtest.csv');

    // Leer el contenido del archivo CSV local
    const csvText = fs.readFileSync(filePath, 'utf8');

    // Parsear el CSV a JSON
    const parsed = Papa.parse(csvText.trim(), { skipEmptyLines: true });

    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json(parsed.data);

  } catch (error) {
    console.error('Error al leer el CSV local:', error);
    return res.status(500).json({ 
      error: `No se pudo encontrar o leer el CSV local en public/datos/datos-prueba.csv. Detalles: ${error.message}` 
    });
  }
}