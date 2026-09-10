import * as cheerio from 'cheerio';

export default async function handler(req, res) {
  // Cambia esta URL por la página que quieres consultar
  const TARGET_URL = 'https://masatletismocrono.com/25-04-campeonato-espana-universitario-cxm-uco/';

  try {
    // 1. Descargar el HTML desde los servidores de Vercel (sin restricciones CORS)
    const response = await fetch(TARGET_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });

    if (!response.ok) {
      throw new Error(`Error en la petición: ${response.status}`);
    }

    const html = await response.text();

    // 2. Cargar el HTML en Cheerio
    const $ = cheerio.load(html);

    // 3. Seleccionar la primera tabla que contenga thead/tbody
    const tablaHtml = $('table').first().html();

    if (!tablaHtml) {
      return res.status(404).json({ error: 'No se encontró ninguna tabla.' });
    }

    // 4. Configurar cabeceras de caché (opcional) y responder con el HTML envuelto en la etiqueta <table>
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(`<table>${tablaHtml}</table>`);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}