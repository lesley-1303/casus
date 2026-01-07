const XLSX = require('xlsx');

import { create as ruleImportCreate } from './DataBaseServices/ruleImportService';
import { create as ruleTypeCreate } from './DataBaseServices/ruleTypesServices';
import { create as ruleCreate } from './DataBaseServices/ruleService';

export async function extractRulesFromExcel(file) {
  const workbook = Buffer.isBuffer(file)
    ? XLSX.read(file, { type: 'buffer' })
    : XLSX.readFile(file);

  const sheetNames = workbook.SheetNames;
  const allRules = [];

  for (const sheetName of sheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '', raw: false });
    let name = "";
    let headerRowIndex = -1;
    let headers = null;

    // Find the row with Groot, Midden, Klein
    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      const values = Object.values(row);
      name = values[0]
      if (values.includes('Groot') && values.includes('Midden') && values.includes('Klein')) {
        headerRowIndex = i;
        headers = row;
        break;
      }
    }

    let dataToSave = [];

    if (headerRowIndex !== -1) {
      // Map column headers
      const columnMapping = {};
      Object.keys(headers).forEach(key => {
        if (headers[key]) columnMapping[key] = headers[key];
      });

      // Only rows after header
      const dataRows = jsonData.slice(headerRowIndex + 1).map(row => {
        const newRow = {};
        Object.keys(row).forEach(oldKey => {
          if (columnMapping[oldKey]) newRow[columnMapping[oldKey]] = row[oldKey];
        });
        return newRow;
      });

      // Filter rows that have Groot, Midden, Klein containing "i+d" variations
      dataToSave = dataRows.filter(row => {
        if (!row['Groot'] && !row['Midden'] && !row['Klein']) return false;
        const groot = (row['Groot'] || '').toLowerCase();
        const midden = (row['Midden'] || '').toLowerCase();
        const klein = (row['Klein'] || '').toLowerCase();

        const matches = ['i+d', 'i + d', 'i+ d'];
        const value = row[name][1];
        const lastChar = row[name][row[name].length - 1];
        return matches.some(m =>
          (groot.includes(m) || midden.includes(m) || klein.includes(m)) && value === value.toLowerCase() && lastChar != ":"
        );
      });
    }

    if (dataToSave.length > 0) {
      allRules.push({ name, rules: dataToSave });
    }
  }

  return allRules;
}

export async function saveRules(rules, fileName, user_id) {
  const importRecord = await ruleImportCreate({
    user_id: user_id,
    file_name: fileName,
  });
  for (const sheet of rules) {
    const ruleType = await ruleTypeCreate({
      name: sheet.name,
      rule_import_id: importRecord.id
    });
    for (const r of sheet.rules) {
      const keys = Object.keys(r);

      await ruleCreate({
        rule: r[keys[0]],
        groot: r.Groot,
        midden: r.Midden,
        klein: r.Klein,
        bron: r.Bron,
        rule_type_id: ruleType.id
      });
    }
  }

}
