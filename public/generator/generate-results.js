const fs = require('fs/promises');
const path = require('path');

const CONFIG_FILE = 'config.json';
const TEMPLATE_RESULTS_FILE = 'results.html';
const TEMPLATE_MENU_FILE = 'menu.html';
const TEMPLATE_INDEX_FILE = 'index.html';
const TEMPLATE_MAIN_FILE = 'main.html';
const TEMPLATE_REDIRECT_FILE = 'redirect.html';
const TEMPLATE_BUTTON_CATEGORY_FILE = 'button-category.html';
const TEMPLATE_BUTTON_RACES_FILE = 'button-races.html';

const OUTPUT_FILENAME = 'resultados.html';
const REPLACE_TAG_TITLE = '[REPLACE_BY_TITLE]';
const REPLACE_TAG_SUBTITLE = '[REPLACE_BY_SUBTITLE]';
const REPLACE_TAG_KEYWORDS = '[REPLACE_BY_KEYWORDS]';
const REPLACE_TAG_ROOT = '[REPLACE_BY_ROOT]';
const REPLACE_TAG_MENU = '[REPLACE_BY_MENU]';
const REPLACE_TAG_BUTTON_CATEGORY = '[REPLACE_BY_BUTTON_CATEGORY]';
const REPLACE_TAG_BUTTON_RACES = '[REPLACE_BY_BUTTON_RACES]';

const OUTPUT_PATH = '../'
/**
 * 1. Reads the config file.
 * 2. Reads the HTML template.
 * 3. Loops through the 'carreras' and 'events' to create folders and files.
 */
async function generateDirectoriesAndFiles() {
  try {
    // --- 1. Get a json file "config.json" and read template ---
    console.log(`Loading ${CONFIG_FILE} and ${TEMPLATE_RESULTS_FILE}...`);
    
    // Read and parse config.json
    const configData = await fs.readFile(CONFIG_FILE, 'utf-8');
    const config = JSON.parse(configData);
    
    // Read the content of the results.html template
    let templateContent = await fs.readFile(TEMPLATE_RESULTS_FILE, 'utf-8');
    let templateMenuContent = await fs.readFile(TEMPLATE_MENU_FILE, 'utf-8');
    let templateRedirectContent = await fs.readFile(TEMPLATE_REDIRECT_FILE, 'utf-8');

    let templateButtonCategoryContent = await fs.readFile(TEMPLATE_BUTTON_CATEGORY_FILE, 'utf-8');
    let templateIndexContent = await fs.readFile(TEMPLATE_INDEX_FILE, 'utf-8');
    let templateMainContent = await fs.readFile(TEMPLATE_MAIN_FILE, 'utf-8');
    let templateButtonRacesContent = await fs.readFile(TEMPLATE_BUTTON_RACES_FILE, 'utf-8');


    // Check if the main array exists
    if (!config.carreras || !Array.isArray(config.carreras)) {
      console.error(`Error: The '${CONFIG_FILE}' file does not contain a valid 'carreras' array.`);
      return;
    }

    // --- 2. Read the json and loop into "carreras" node ---

    let buttonsRaces = "";
    let menuContent = "";
    for (const carrera of config.carreras) {
      var carreraRoot = carrera.root;
      var carreraTitle = carrera.title;
      var carreraKeywords = carrera.keywords;
      if (!carreraRoot) {
        console.warn('Skipping a carrera entry because it is missing the "root" property.');
        continue;
      }

      // Replace the placeholder in the template content
        buttonsRaces = templateButtonRacesContent
        .replaceAll(REPLACE_TAG_ROOT, carreraRoot)
        .replaceAll(REPLACE_TAG_TITLE, carreraTitle) + buttonsRaces;

      // --- 3. For each element in the array, create a folder ---
      const carreraPath = path.join(OUTPUT_PATH, carreraRoot);
      console.log(`\nCreating main directory: ${carreraPath} for ${carreraTitle}`);
      await fs.mkdir(carreraPath, { recursive: true });
      if (!carrera.events || !Array.isArray(carrera.events)) {
        console.warn(`Carrera "${carreraRoot}" has no valid 'events' array. Skipping event creation.`);
        continue;
      }
      
        //redirect
        let redirectContent = templateRedirectContent
        .replaceAll(REPLACE_TAG_KEYWORDS, carreraKeywords)
        .replaceAll(REPLACE_TAG_ROOT, carreraRoot)
        .replaceAll(REPLACE_TAG_TITLE, carreraTitle);

        await fs.writeFile(path.join(carreraPath, '/index.html'), redirectContent, 'utf-8');

        // Replace the placeholder in the template content
         menuContent = templateMenuContent
        .replaceAll(REPLACE_TAG_KEYWORDS, carreraKeywords)
        .replaceAll(REPLACE_TAG_ROOT, carreraRoot)
        .replaceAll(REPLACE_TAG_TITLE, carreraTitle);

         let indexContent = templateIndexContent
        .replaceAll(REPLACE_TAG_KEYWORDS, carreraKeywords)
        .replaceAll(REPLACE_TAG_ROOT, carreraRoot)
        .replaceAll(REPLACE_TAG_TITLE, carreraTitle)
        .replaceAll(REPLACE_TAG_MENU, menuContent);

      let buttons = '';
      // --- 4. Then loop into the "events" array and create subfolders ---
      for (const event of carrera.events) {
        const eventRoot = event.root;
        const eventTitle = event.title;
        
        if (!eventRoot) {
          console.warn(`Skipping an event entry in "${carreraRoot}" because it is missing the "root" property.`);
          continue;
        }

        // The path for the event folder
        const eventPath = path.join(carreraPath, eventRoot);
        console.log(`  Creating event directory: ${eventPath}`);
        await fs.mkdir(eventPath, { recursive: true });

        // --- 5. Create an html file and replace content ---
        
        // Final file path
        const outputPath = path.join(eventPath, OUTPUT_FILENAME);

        const finalContent = templateContent
        .replaceAll(REPLACE_TAG_SUBTITLE, eventTitle)
        .replaceAll(REPLACE_TAG_KEYWORDS, carreraKeywords)
        .replaceAll(REPLACE_TAG_ROOT, carreraRoot)
        .replaceAll(REPLACE_TAG_TITLE, carreraTitle)
        .replaceAll(REPLACE_TAG_MENU, menuContent);
        
        // Write the new content to the output file
        await fs.writeFile(outputPath, finalContent, 'utf-8');
        
        
        // Replace the placeholder in the template content
        buttons = templateButtonCategoryContent
        .replaceAll(REPLACE_TAG_ROOT, eventRoot)
        .replaceAll(REPLACE_TAG_SUBTITLE, eventTitle) + buttons;

        await fs.writeFile(path.join(carreraPath, '/resultados.html'), indexContent, 'utf-8');
        console.log(`    Created file: ${outputPath}"`);
      }
      

      indexContent = indexContent.replaceAll(REPLACE_TAG_BUTTON_CATEGORY, buttons);
      await fs.writeFile(path.join(carreraPath, '/resultados.html'), indexContent, 'utf-8');


    }

    let mainContent = templateMainContent
        .replaceAll(REPLACE_TAG_BUTTON_RACES, buttonsRaces)
        .replaceAll(REPLACE_TAG_MENU, menuContent);

      await fs.writeFile(path.join(OUTPUT_PATH, 'index.html'), mainContent, 'utf-8');
    console.log('\n✅ All directories and files have been successfully created!');

  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error(`\nFatal Error: File not found. Make sure both '${CONFIG_FILE}' and '${TEMPLATE_RESULTS_FILE}' exist in the script's directory.`);
    } else if (error instanceof SyntaxError) {
      console.error(`\nFatal Error: The file '${CONFIG_FILE}' contains invalid JSON.`);
    } else {
      console.error('\nAn unexpected error occurred:', error.message);
    }
  }
}

// Execute the main function
generateDirectoriesAndFiles();