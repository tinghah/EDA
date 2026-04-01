const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

function parseExcelFile(filePath) {
  try {
    const workbook = XLSX.readFile(filePath, { type: 'binary', codepage: 65001 }); // UTF-8
    const sheets = {};

    workbook.SheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '', raw: false });

      if (jsonData.length === 0) {
        sheets[sheetName] = { headers: [], rows: [] };
        return;
      }

      // First row as headers
      const headers = jsonData[0].map((h, i) => h ? String(h).trim() : `Column_${i + 1}`);
      const rows = jsonData.slice(1).map((row, rowIdx) => {
        const obj = { _rowIndex: rowIdx + 1 };
        headers.forEach((h, i) => {
          obj[h] = row[i] !== undefined ? row[i] : '';
        });
        return obj;
      });

      sheets[sheetName] = { headers, rows };
    });

    return { sheetNames: workbook.SheetNames, sheets };
  } catch (error) {
    console.error('Error parsing Excel file:', error);
    throw new Error('Failed to parse file: ' + error.message);
  }
}

function getFileStats(fileData) {
  const allSheets = Object.keys(fileData.sheets);
  let totalRows = 0;
  let totalCols = 0;
  allSheets.forEach(s => {
    totalRows += fileData.sheets[s].rows.length;
    totalCols = Math.max(totalCols, fileData.sheets[s].headers.length);
  });
  return { sheetCount: allSheets.length, totalRows, totalCols };
}

function getColumnStats(sheetData, column) {
  const values = sheetData.rows.map(r => r[column]);
  const numericValues = values.filter(v => !isNaN(parseFloat(v)) && v !== '').map(v => parseFloat(v));
  const nonEmpty = values.filter(v => v !== '' && v !== null && v !== undefined);
  const uniqueValues = [...new Set(values.map(v => String(v)))];

  const stats = {
    column,
    totalValues: values.length,
    nonEmpty: nonEmpty.length,
    empty: values.length - nonEmpty.length,
    unique: uniqueValues.length,
    isNumeric: numericValues.length > nonEmpty.length * 0.5,
  };

  if (stats.isNumeric && numericValues.length > 0) {
    stats.min = Math.min(...numericValues);
    stats.max = Math.max(...numericValues);
    stats.sum = numericValues.reduce((a, b) => a + b, 0);
    stats.mean = stats.sum / numericValues.length;
    const sorted = [...numericValues].sort((a, b) => a - b);
    stats.median = sorted[Math.floor(sorted.length / 2)];
  }

  const freq = {};
  values.forEach(v => {
    const key = String(v);
    freq[key] = (freq[key] || 0) + 1;
  });
  stats.topValues = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([value, count]) => ({ value, count }));

  return stats;
}

module.exports = {
  parseExcelFile,
  getFileStats,
  getColumnStats
};
