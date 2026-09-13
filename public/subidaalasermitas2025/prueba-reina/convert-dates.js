const fs = require('fs');
const path = require('path');

// 1. CONFIGURATION
const INPUT_FILE = 'fotos.json';       // The file created by your scraper
const OUTPUT_FILE = 'fotos_unix.json'; // The new file to save

// 2. SPANISH MONTH MAPPING
// Maps the 3-letter Spanish abbreviation to the JS Month Index (0-11)
const monthMap = {
    'ene': 0, 'feb': 1, 'mar': 2, 'abr': 3, 'may': 4, 'jun': 5,
    'jul': 6, 'ago': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dic': 11
};

function convertToUnix(dateString) {
    if (!dateString || typeof dateString !== 'string') return dateString;

    // REGEX EXPLANATION:
    // We look for the pattern: Day (digits) + Month (letters) + Year (digits) + Time
    // (\d{1,2})   -> Captures Day (e.g., 14)
    // \s+         -> Space
    // ([a-z]{3})  -> Captures Month (e.g., dic)
    // \s+         -> Space
    // (\d{4})     -> Captures Year (e.g., 2025)
    // ,?\s+       -> Optional comma and space
    // (\d{2}):(\d{2}):(\d{2}) -> Captures HH:MM:SS
    const regex = /(\d{1,2})\s+([a-z]{3})\.?\s+(\d{4}),?\s+(\d{2}):(\d{2}):(\d{2})/i;

    const match = dateString.match(regex);

    if (match) {
        const [_, day, monthStr, year, hour, minute, second] = match;
        
        // Convert month text to index (0-11)
        const monthIndex = monthMap[monthStr.toLowerCase().substring(0, 3)];

        if (monthIndex !== undefined) {
            // Create Date object
            const dateObj = new Date(year, monthIndex, day, hour, minute, second);
            return dateObj.getTime(); // Returns Unix Timestamp (milliseconds)
        }
    }

    console.warn(`⚠️  Could not parse date: "${dateString}"`);
    return dateString; // Return original if parsing fails
}

// 3. MAIN EXECUTION
try {
    const filePath = path.resolve(INPUT_FILE);
    
    if (!fs.existsSync(filePath)) {
        console.error(`❌ Error: File '${INPUT_FILE}' not found.`);
        process.exit(1);
    }

    console.log(`📖 Reading ${INPUT_FILE}...`);
    const rawData = fs.readFileSync(filePath, 'utf8');
    const jsonData = JSON.parse(rawData);

    // Process the array
    const updatedData = jsonData.map(item => {
        return {
            ...item,
            date: convertToUnix(item.date) // Update the date field
        };
    });

    // Save result
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(updatedData, null, 2));
    
    console.log(`✅ Success! Converted ${updatedData.length} items.`);
    console.log(`💾 Saved to '${OUTPUT_FILE}'`);

} catch (error) {
    console.error("❌ An error occurred:", error.message);
}node .