/**
 * resize-json-urls.js
 *
 * Reads 'fotos.json', adds a new property 'imageUrlResized'
 * by resizing the dimensions in the existing 'imageurl' property,
 * and saves the result to 'fotos_resized.json'.
 */

const fs = require('fs');
const path = require('path');

const INPUT_PATH = 'fotos.json';
const OUTPUT_PATH = 'fotos.json';

// Target dimensions for the new property
const TARGET_RESIZED_WIDTH = 720;
const TARGET_RESIZED_HEIGHT = 480;

/**
 * Resizes the Google Photos image URL to the new target dimensions.
 * @param {string} url The extracted image URL (e.g., ...=w5184-h3456-no).
 * @param {number} width The target width (720).
 * @param {number} height The target height (480).
 * @returns {string} The resized image URL (e.g., ...=w720-h480-no).
 */
function resizeImageUrl(url, width, height) {
    if (!url) return null;

    // 1. Remove existing size parameters (e.g., "=w5184-h3456-no").
    // The regex looks for '=w' followed by numbers, an optional '-h' and numbers, and optional further parameters like '-no'.
    // This ensures it works regardless of the original size.
    const cleanedUrl = url.replace(/=w\d+(-h\d+)?(-[a-z]+)*\/?$/, '');

    // 2. Append the new size parameters
    return `${cleanedUrl}=w${width}-h${height}-no`;
}

try {
    // 1. Read the input file
    const rawData = fs.readFileSync(path.resolve(INPUT_PATH), 'utf8');
    const data = JSON.parse(rawData);

    if (!Array.isArray(data)) {
        console.error(`ERROR: ${INPUT_PATH} is not a valid JSON array.`);
        process.exit(1);
    }

    // 2. Process each item (child)
    const resizedData = data.map(item => {
        // Use the existing 'imageurl' property
        const originalUrl = item.imageurl;

        // Calculate the new resized URL (720x480)
        const resizedUrl = resizeImageUrl(originalUrl, TARGET_RESIZED_WIDTH, TARGET_RESIZED_HEIGHT);

        // Return a new object with the new property added
        return {
            ...item,
            imageurlresized: resizedUrl
        };
    });

    // 3. Write the output file
    fs.writeFileSync(path.resolve(OUTPUT_PATH), JSON.stringify(resizedData, null, 2), 'utf8');

    console.log(`✅ Successfully added 'imageUrlResized' property to ${data.length} items.`);
    console.log(`Saved output to ${OUTPUT_PATH}`);

} catch (error) {
    console.error(`🚨 Error processing file: ${error.message}`);
    process.exit(1);
}