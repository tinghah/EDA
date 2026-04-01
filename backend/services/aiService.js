const vm = require('vm');

function getChatContext(fileId, sheet, fileStore) {
  let dataContext = '';
  if (fileId) {
    const entry = fileStore.get(fileId);
    if (entry) {
      const sheetName = sheet || entry.sheetNames[0];
      const sheetData = entry.sheets[sheetName];
      if (sheetData) {
        const sampleRows = sheetData.rows.slice(0, 50);
        dataContext = `
The user has an Excel file loaded: "${entry.originalName}" (File_ID:${entry.fileId})
Sheet: "${sheetName}"
Available Sheets: ${entry.sheetNames.join(', ')}
Columns: ${sheetData.headers.join(', ')}
Total Rows: ${sheetData.rows.length}
Total Columns: ${sheetData.headers.length}

Here are the first ${sampleRows.length} rows as a sample:
${JSON.stringify(sampleRows, null, 2)}
`;
      }

      const otherFiles = [];
      fileStore.forEach(e => {
        otherFiles.push(`File_ID:${e.fileId} - "${e.originalName}" (${e.stats.totalRows} rows, ${e.stats.totalCols} cols)`);
      });
      dataContext += `\n\nAll uploaded files:\n${otherFiles.join('\n')}`;
    }
  }

  const allFilesList = [];
  fileStore.forEach(e => {
    allFilesList.push(`File_ID:${e.fileId} - "${e.originalName}" (${e.stats.totalRows} rows, ${e.stats.totalCols} cols, sheets: ${e.sheetNames.join(', ')})`);
  });

  return {
    dataContext,
    allFilesList,
    systemPrompt: `You are an Excel Data Analyst AI assistant in the EDA application.
Help users analyze their Excel/CSV data.

CRITICAL INSTRUCTION:
For ANY data transformation, query, or summary, output ONLY a JSON code block in this format:
\`\`\`json
{
  "type": "transform",
  "action": "ACTION_NAME",
  ...parameters
}
\`\`\`

Available actions:
- rename_columns: {"mapping": {"Old": "New"}}
- calculate_column: {"column": "NewCol", "expression": "MATHJS_EXPRESSION"}
- filter_rows: {"expression": "MATHJS_CONDITION"}
- merge_files: {"file_ids": ["001", "002"]}

Data Context:
${dataContext}

All files in the system:
${allFilesList.join('\n')}`
  };
}

/**
 * Executes transformation logic safely in a sandbox.
 */
function applyTransformation(transformJson, context) {
  const { headers, rows, fileStore } = context;
  let newHeaders = [...headers];
  let newRows = JSON.parse(JSON.stringify(rows || []));
  let actionName = 'Transformed';

  const sandboxMode = {
    Number,
    String,
    Boolean,
    Math,
    JSON,
    Array,
    Object,
    Date,
    console: { log: () => {} } // Disable console output from sandbox
  };

  try {
    switch (transformJson.action) {
      case 'rename_columns':
        actionName = 'Header Translation';
        const map = transformJson.mapping;
        newHeaders = headers.map(h => map[h] || h);
        newRows = newRows.map(r => {
          const newRow = { _rowIndex: r._rowIndex };
          Object.keys(r).forEach(k => {
            if (k !== '_rowIndex') {
              newRow[map[k] || k] = r[k];
            }
          });
          return newRow;
        });
        break;

      case 'calculate_column':
        actionName = 'Calculated Column';
        if (!newHeaders.includes(transformJson.column)) newHeaders.push(transformJson.column);
        const mathjsCalc = require('mathjs');
        const compiledCalc = mathjsCalc.compile(transformJson.expression);
        
        newRows = newRows.map(r => {
          try {
            r[transformJson.column] = compiledCalc.evaluate(r);
          } catch(e) {
            r[transformJson.column] = null;
          }
          return r;
        });
        break;

      case 'filter_rows':
        actionName = 'Filtered Data';
        const mathjsFilter = require('mathjs');
        const compiledFilter = mathjsFilter.compile(transformJson.expression);
        
        newRows = newRows.filter(r => {
          try {
            return !!compiledFilter.evaluate(r);
          } catch(e) {
            return false;
          }
        });
        break;

      case 'merge_files':
        actionName = 'Merged Data';
        let fileIds = transformJson.file_ids || [];
        let allMergedRows = [];
        let allHeadersSet = new Set();

        fileIds.forEach(fid => {
          const entry = Array.from(fileStore.values()).find(e => e.fileId === fid);
          if (entry) {
            const sheet = entry.sheets[entry.sheetNames[0]];
            if (sheet) {
              sheet.headers.forEach(h => allHeadersSet.add(h));
              allMergedRows = allMergedRows.concat(JSON.parse(JSON.stringify(sheet.rows || [])));
            }
          }
        });
        newHeaders = Array.from(allHeadersSet);
        newRows = allMergedRows;
        break;

      default:
        throw new Error(`Unknown transform action: ${transformJson.action}`);
    }

    return { headers: newHeaders, rows: newRows, actionName };
  } catch (err) {
    console.error('Transformation error:', err);
    throw new Error('Action failed: ' + err.message);
  }
}

module.exports = {
  getChatContext,
  applyTransformation
};
