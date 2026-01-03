import fs from 'fs';
import path from 'path';

export function saveJsonToFile(data, filename, outputDir = '.') {
  try {
    // Remove .pdf extension if present and add _extracted.json
    const baseFilename = filename.replace(/\.pdf$/i, '');
    const jsonFilename = `${baseFilename}_extracted.json`;
    
    // Create the full output path
    const outputPath = path.join(outputDir, jsonFilename);
    
    // Ensure the output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Convert data to JSON string with pretty formatting
    const jsonString = JSON.stringify(data, null, 2);
    
    // Write to file
    fs.writeFileSync(outputPath, jsonString, 'utf-8');
    
    console.log(`JSON file saved successfully: ${outputPath}`);
    return outputPath;
    
  } catch (error) {
    console.error('Error saving JSON file:', error);
    throw error;
  }
}