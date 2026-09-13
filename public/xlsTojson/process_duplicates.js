const fs = require('fs');

/**
 * Finds duplicate values in a specified column (case-insensitive, trim-aware)
 * and modifies the duplicate entries by prepending 'PX-' where X is the
 * occurrence count (starting from 2 for the first duplicate).
 * * @param {Array<Object>} data - The array of objects (JSON data).
 * @param {string} columnName - The name of the column to check for duplicates.
 * @returns {Array<Object>} The modified array.
 */
function replaceDuplicates(data, columnName) {
    if (!data || data.length === 0 || !columnName) {
        console.error("Data or column name is missing.");
        return data;
    }

    const occurrenceMap = {};

    // 1. First pass: Map normalized values to their original value and index
    for (let i = 0; i < data.length; i++) {
        // Ensure the value exists and is a string
        const originalValue = data[i][columnName] ? String(data[i][columnName]) : ""; 
        
        // Normalize the value for comparison (case-insensitive, trim whitespace)
        const normalizedValue = originalValue.toUpperCase().trim();

        if (!occurrenceMap[normalizedValue]) {
            occurrenceMap[normalizedValue] = [];
        }

        // Store the original value and index for later modification
        occurrenceMap[normalizedValue].push({ index: i, original: originalValue });
    }

    // 2. Second pass: Replace the duplicate values with the PX- prefix
    for (const normalizedValue in occurrenceMap) {
        const list = occurrenceMap[normalizedValue];

        // Only process values that are duplicates (length > 1)
        if (list.length > 1) {
            // Start from j=1, which is the SECOND occurrence (the first duplicate)
            for (let j = 1; j < list.length; j++) {
                const item = list[j];
                const occurrenceCount = j + 1; // The counter (2, 3, 4, ...)

                // Create the new value: P{X}-OriginalValue
                const newColumnValue = `P${occurrenceCount}-${item.original}`;

                // Update the data in place using the stored index
                data[item.index][columnName] = newColumnValue;
            }
        }
    }

    return data;
}

// ------------------------------------
// --- Main execution block ---
// ------------------------------------

const INPUT_FILE = 'inscritos-cromowin.json';
const OUTPUT_FILE = 'inscritos-cromowin-processed.json';

// **IMPORTANT**: Replace 'Club' with the exact column name you want to check for duplicates
const DUPLICATE_COLUMN = 'NIF/Pasaporte'; 

try {
    // Read the data from the input JSON file
    const rawData = fs.readFileSync(INPUT_FILE, 'utf8');
    let jsonData = JSON.parse(rawData);

    console.log(`Starting duplicate check on column: "${DUPLICATE_COLUMN}"...`);

    // Process the data
    const modifiedData = replaceDuplicates(jsonData, DUPLICATE_COLUMN);

    // Write the modified data to a new JSON file
    const outputJson = JSON.stringify(modifiedData, null, 2);
    fs.writeFileSync(OUTPUT_FILE, outputJson, 'utf8');

    console.log(`\n✅ Successfully processed ${modifiedData.length} records.`);
    console.log(`Output written to: ${OUTPUT_FILE}`);

} catch (error) {
    console.error(`\n❌ An error occurred: ${error.message}`);
    console.error('Please ensure the input file is named "output.json", is a valid JSON array of objects, and the specified column name is correct.');
}