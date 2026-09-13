const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

// --- Configuración del Script ---
// 1. Define la ruta del archivo Excel de entrada
const EXCEL_FILE_PATH = path.join(__dirname, 'Inscritos_10a-spg-runningseries-aje-cordoba.xlsx'); 

// web
/*
const COLUMNS_TO_EXPORT = ['Dorsal', 'Nombre', 'Apellidos', 'Fecha Nacimiento', 'Sexo', 'Carrera', 'Tipo inscripción', 'Club', 'Nombre de la Empresa que representas:', 'Escoge el nombre que elegís como PAREJA', 'Escoge el nombre que elegís como EQUIPO']; 
const OUTPUT_JSON_PATH = path.join(__dirname, 'inscritos.json');
*/

// 2. Define las columnas que quieres exportar (¡Asegúrate que los nombres coincidan exactamente!)
// cromowin

const COLUMNS_TO_EXPORT = ['Email', 'NIF/Pasaporte', 'Nombre', 'Apellidos', 'Carrera']; 
const OUTPUT_JSON_PATH = path.join(__dirname, 'inscritos-cromowin.json');

// --------------------------------

/**
 * Procesa un archivo de Excel para exportar columnas específicas a un archivo JSON usando ExcelJS.
 * @param {string} excelFilePath - La ruta completa al archivo de Excel.
 * @param {string[]} columnNames - Un array de nombres de columnas a exportar.
 * @param {string} outputJsonPath - La ruta y nombre del archivo JSON de salida.
 */
async function exportColumnsToJsonExcelJS(excelFilePath, columnNames, outputJsonPath) {
    if (!fs.existsSync(excelFilePath)) {
        console.error(`❌ Error: Archivo de Excel no encontrado en la ruta: ${excelFilePath}`);
        return;
    }

    try {
        const workbook = new ExcelJS.Workbook();
        
        // Cargar el archivo de Excel
        await workbook.xlsx.readFile(excelFilePath);
        
        // Asumimos la primera hoja
        const worksheet = workbook.getWorksheet(1);
        
        if (!worksheet) {
            console.warn('⚠️ Advertencia: No se encontró ninguna hoja de cálculo.');
            return;
        }

        const filteredData = [];
        
        // 1. Mapear los nombres de columna a sus índices (número de columna)
        const headerRow = worksheet.getRow(1);
        if (!headerRow) {
             console.warn('⚠️ Advertencia: La hoja no tiene encabezados.');
            return;
        }
        
        const headerMap = {};
        headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
            // Usamos el valor de la celda como clave, y su número de columna como índice
            headerMap[String(cell.value).trim()] = colNumber;
        });

        // 2. Filtrar las columnas deseadas para obtener sus índices
        const columnIndices = columnNames
            .map(name => ({ name: name, index: headerMap[name] }))
            .filter(col => {
                if (!col.index) {
                    console.warn(`⚠️ Advertencia: La columna "${col.name}" no se encontró en el archivo de Excel.`);
                }
                return col.index;
            });
            
        if (columnIndices.length === 0) {
            console.error('❌ Error: Ninguna de las columnas especificadas se encontró. Deteniendo el proceso.');
            return;
        }

        // 3. Iterar sobre las filas de datos (a partir de la fila 2)
        worksheet.eachRow({ includeEmpty: false, firstRow: 2 }, (row, rowNumber) => {
            const newRow = {};
            columnIndices.forEach(col => {
                // Obtener el valor de la celda por su índice (número de columna)
                const cellValue = row.getCell(col.index).value;
                // Asignar el valor usando el nombre de la columna como clave
                newRow[col.name] = cellValue;
            });
            filteredData.push(newRow);
        });

        // 4. Escribir los datos filtrados en un archivo JSON
        const jsonContent = JSON.stringify(filteredData, null, 2); 
        fs.writeFileSync(outputJsonPath, jsonContent);

        console.log(`✅ Éxito: Se exportaron ${filteredData.length} filas.`);
        console.log(`📦 Archivo JSON guardado en: ${outputJsonPath}`);

    } catch (e) {
        console.error('❌ Ocurrió un error durante el procesamiento:', e.message);
    }
}

// Ejecutar la función
exportColumnsToJsonExcelJS(EXCEL_FILE_PATH, COLUMNS_TO_EXPORT, OUTPUT_JSON_PATH);