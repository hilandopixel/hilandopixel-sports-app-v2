const fs = require('fs');
const { Parser } = require('json2csv');

// --- Configuración ---
const INPUT_FILE = 'inscritos-cromowin-processed.json'; // Cambia esto si usaste el archivo modificado 'output_duplicates_replaced.json'
const OUTPUT_FILE = 'inscritos-cromowin-processed.csv'; 

// --- Función principal de conversión ---
function convertJsonToCsv() {
    try {
        // 1. Leer el archivo JSON
        console.log(`Leyendo datos de: ${INPUT_FILE}...`);
        const rawData = fs.readFileSync(INPUT_FILE, 'utf8');
        const jsonData = JSON.parse(rawData);

        if (!Array.isArray(jsonData) || jsonData.length === 0) {
            console.error('❌ Error: El archivo JSON debe contener un array de objetos y no puede estar vacío.');
            return;
        }

        // 2. Determinar los campos (columnas) a partir del primer objeto
        const fields = Object.keys(jsonData[0]);

        const json2csvParser = new Parser({ fields, delimiter: ';', quote: '"' });
        
        console.log('Convirtiendo a CSV y añadiendo UTF-8 BOM...');
        let csv = json2csvParser.parse(jsonData);

        // AÑADIR BOM (Byte Order Mark) al inicio del contenido CSV
        // Esto le indica a Excel y otros programas que la codificación es UTF-8.
        const csvWithBOM = '\uFEFF' + csv;

        // 4. Escribir el archivo CSV usando UTF-8
        fs.writeFileSync(OUTPUT_FILE, csvWithBOM, 'utf8');
        
        console.log(`\n✅ Conversión completada exitosamente.`);
        console.log(`Archivo CSV creado: ${OUTPUT_FILE} (Codificación: UTF-8 + BOM)`);
        console.log(`Se procesaron ${jsonData.length} registros.`);

    } catch (error) {
        console.error(`\n❌ Ha ocurrido un error: ${error.message}`);
        if (error.code === 'ENOENT') {
            console.error(`Asegúrate de que el archivo "${INPUT_FILE}" existe en el mismo directorio.`);
        } else if (error instanceof SyntaxError) {
             console.error('Asegúrate de que el archivo de entrada es un JSON válido.');
        } else {
            console.error(error);
        }
    }
}

// Ejecutar la función
convertJsonToCsv();