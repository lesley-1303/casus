// scripts/convert-rules.js
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Read the Excel file
const workbook = XLSX.readFile(path.join(__dirname, '../data/SRA-checklist[12892].xlsm'));

// Get all sheet names and process each one
const sheetNames = workbook.SheetNames;

sheetNames.forEach(sheetName => {
  const worksheet = workbook.Sheets[sheetName];
  
  // Convert to JSON with options to handle headers properly
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
    defval: '',  // default value for empty cells
    raw: false   // format cells as strings
  });
  
  // Find the header row (the one with "Groot", "Midden", "Klein", etc.)
  let headerRowIndex = -1;
  let headers = null;
  
  for (let i = 0; i < jsonData.length; i++) {
    const row = jsonData[i];
    const values = Object.values(row);
    
    // Check if this row contains the expected headers
    if (values.includes('Groot') && values.includes('Midden') && values.includes('Klein')) {
      headerRowIndex = i;
      headers = row;
      break;
    }
  }
  
  let dataToSave;
  
  if (headerRowIndex !== -1) {
    // Get the proper column mapping
    const columnMapping = {};
    const headerKeys = Object.keys(headers);
    
    headerKeys.forEach(key => {
      const headerValue = headers[key];
      if (headerValue) {
        columnMapping[key] = headerValue;
      }
    });
    
    // Process data rows (after header row)
    const dataRows = jsonData.slice(headerRowIndex + 1).map(row => {
      const newRow = {};
      Object.keys(row).forEach(oldKey => {
        // Only include columns that have a mapping (i.e., were in the header row)
        if (columnMapping[oldKey]) {
          const newKey = columnMapping[oldKey];
          newRow[newKey] = row[oldKey];
        } else if (!oldKey.startsWith('__EMPTY')) {
          // Keep non-empty column names that aren't in the mapping
          newRow[oldKey] = row[oldKey];
        }
        // Skip __EMPTY columns that weren't in the header
      });
      return newRow;
    });
    
    // Filter to only keep rows where Groot, Midden, or Klein is "i+d"
    const filteredRows = dataRows.filter(row => {
      const groot = (row['Groot'] || '').toLowerCase();
      const midden = (row['Midden'] || '').toLowerCase();
      const klein = (row['Klein'] || '').toLowerCase();
      
      return groot === 'i+d' || midden === 'i+d' || klein === 'i+d' || groot === 'i + d' || midden === 'i + d' || klein === 'i + d' || groot === 'i +d' || midden === 'i +d' || klein === 'i +d' || groot === 'i+ d' || midden === 'i+ d' || klein === 'i+ d';
    });
    
    dataToSave = filteredRows;
    console.log(`✅ Processed sheet "${sheetName}": ${dataRows.length} total rows → ${filteredRows.length} i+d rules`);
  } else {
    // If no header row found, use original data but filter out __EMPTY columns
    dataToSave = jsonData.map(row => {
      const newRow = {};
      Object.keys(row).forEach(key => {
        if (!key.startsWith('__EMPTY')) {
          newRow[key] = row[key];
        }
      });
      return newRow;
    });
    console.log(`⚠️  Processed sheet "${sheetName}" with ${dataToSave.length} rows (no header row found)`);
  }
  
  // Only save file if there are rules to save
  if (dataToSave.length > 0) {
    // Create safe filename from sheet name
    const safeFileName = sheetName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const outputPath = path.join(__dirname, `../data/allrules/rules-${safeFileName}.json`);
    
    // Save to separate file
    fs.writeFileSync(outputPath, JSON.stringify(dataToSave, null, 2));
    console.log(`📄 Saved to: rules-${safeFileName}.json`);
  } else {
    console.log(`⏭️  Skipped "${sheetName}" (no i+d rules found)`);
  }
});

console.log(`\n✅ Total sheets processed: ${sheetNames.length}`);