#!/usr/bin/env node
/**
 * overlayImages_v2.js
 *
 * Usage:
 * node overlayImages_v2.js <input_directory> <overlay_image.png>
 *
 * Overlays the specified PNG image onto every image found in the input directory.
 * The output images are saved in a subfolder called "processed" inside the 
 * input directory with a "_processed" suffix.
 * Images are saved as PNGs to ensure maximum quality preservation.
 */

const fs = require('fs/promises');
const path = require('path');
const sharp = require('sharp');

// --- Configuration ---
const SUFFIX = '_processed';
const OUTPUT_SUBDIR = 'processed'; // New subfolder name
const SUPPORTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.tiff'];

if (process.argv.length !== 3) {
  console.error('Usage: node overlayImages_v2.js <input_directory>');
  process.exit(1);
}

const inputDir = path.resolve(process.argv[2]);
const overlayPath = path.resolve('marca.png');
const outputDir = path.join(inputDir, OUTPUT_SUBDIR); // Define the output folder path

// --- Core Logic ---

async function checkPrerequisites() {
  try {
    // 1. Check if the input directory exists
    const inputStats = await fs.stat(inputDir);
    if (!inputStats.isDirectory()) {
      throw new Error(`Input directory not found: ${inputDir}`);
    }

    // 2. Check if the overlay file exists and is a PNG
    const overlayStats = await fs.stat(overlayPath);
    if (!overlayStats.isFile()) {
      throw new Error(`Overlay file not found: ${overlayPath}`);
    }
    if (path.extname(overlayPath).toLowerCase() !== '.png') {
        console.warn(`⚠️ Warning: Overlay file is not a PNG. sharp will attempt to use it, but PNG is recommended for transparency.`);
    }

    // 3. Create the output sub-directory if it doesn't exist
    await fs.mkdir(outputDir, { recursive: true });
    console.log(`\nCreated/found output folder: ${outputDir}`);

  } catch (error) {
    console.error(`\n❌ Error during setup: ${error.message}`);
    process.exit(1);
  }
}


/**
 * Processes a single image file by overlaying the PNG.
 * @param {string} filePath - Full path to the base image.
 */
async function processImage(filePath) {
  const fileExtension = path.extname(filePath).toLowerCase();
  const fileName = path.basename(filePath, fileExtension);
  
  // Save as PNG with a processed suffix in the NEW output folder
  const outputFileName = `${fileName}${SUFFIX}.png`; 
  const outputPath = path.join(outputDir, outputFileName); 
  
  try {
    // Use sharp to load the base image
    const baseImage = sharp(filePath);
    
    // Perform the overlay operation
    await baseImage
      .composite([{ 
        input: overlayPath, 
        gravity: 'southeast' // Position remains in the bottom-right corner
      }])
      .png({ 
        quality: 100, 
        compressionLevel: 0 
      }) 
      .toFile(outputPath);

    console.log(`  ✅ Processed: ${path.basename(filePath)} -> ${OUTPUT_SUBDIR}/${outputFileName}`);
  } catch (error) {
    console.error(`  ❌ Failed to process ${path.basename(filePath)}: ${error.message}`);
  }
}

/**
 * Main function to read directory and process all images.
 */
async function main() {
  // Check prerequisites and create the output folder
  await checkPrerequisites(); 
  
  console.log(`Starting image processing in: ${inputDir}`);
  console.log(`Using overlay: ${overlayPath}`);
  
  try {
    const files = await fs.readdir(inputDir);
    let processedCount = 0;
    
    for (const file of files) {
      const filePath = path.join(inputDir, file);
      const ext = path.extname(file).toLowerCase();
      
      // Skip unsupported files, processed files, and the overlay itself
      if (!SUPPORTED_EXTENSIONS.includes(ext)) {
        continue;
      }
      if (file.includes(SUFFIX)) {
        continue;
      }
      if (filePath === overlayPath) {
        continue;
      }
      
      await processImage(filePath);
      processedCount++;
    }
    
    console.log(`\n✨ Finished! Total images processed: ${processedCount}.`);
    console.log(`Output files saved in the new "${OUTPUT_SUBDIR}" subfolder.`);

  } catch (error) {
    console.error(`\nFatal error during file operation: ${error.message}`);
    process.exit(1);
  }
}

main();