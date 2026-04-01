const XLSX = require('xlsx');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const aiService = require('../services/aiService');
const fileService = require('../services/fileService');
const { fileStore, saveFileStore, incrementFileCounter } = require('../services/storage');

const uploadsDir = path.join(__dirname, '../uploads');

exports.getChatContextRoute = (req, res) => {
  try {
    const { fileId, sheet } = req.body;
    const context = aiService.getChatContext(fileId, sheet, fileStore);
    res.json({ systemPrompt: context.systemPrompt });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.saveResultsRoute = (req, res) => {
  try {
    const { sessionId, mode, markdownTable, prompt } = req.body;
    if (!markdownTable) return res.status(400).json({ error: 'No table found' });

    const lines = markdownTable.split('\n').filter(l => l.trim().startsWith('|'));
    if (lines.length < 3) return res.status(400).json({ error: 'Invalid markdown table' });

    const headers = lines[0].split('|').map(h => h.trim()).filter(h => h !== '');
    const dataRows = [];
    for (let i = 2; i < lines.length; i++) {
      const cells = lines[i].split('|').map(c => c.trim()).slice(1, -1);
      const row = {};
      headers.forEach((h, idx) => {
        const val = cells[idx] || '';
        row[h] = !isNaN(parseFloat(val)) && val !== '' ? parseFloat(val) : val;
      });
      dataRows.push(row);
    }

    if (dataRows.length === 0) return res.status(400).json({ error: 'No data extracted' });

    const finalSheetName = (prompt || 'Result').replace(/[\\/?*\[\]:]/g, ' ').substring(0, 31).trim();
    const originalName = `${mode.toUpperCase()}_results.xlsx`;
    
    let fileEntry = Array.from(fileStore.values()).find(e => e.sessionId === sessionId && e.originalName === originalName);

    let wb;
    let filePath;

    if (fileEntry) {
      filePath = fileEntry.filePath;
      wb = XLSX.readFile(filePath);
      let sn = finalSheetName;
      let counter = 1;
      while (wb.SheetNames.includes(sn)) { sn = `${finalSheetName.substring(0, 27)} (${counter++})`; }
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dataRows), sn);
      XLSX.writeFile(wb, filePath);
    } else {
      wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dataRows), finalSheetName);
      filePath = path.join(uploadsDir, `${uuidv4()}-${originalName}`);
      XLSX.writeFile(wb, filePath);
      
      const fileIdNum = incrementFileCounter();
      
      fileEntry = {
        id: uuidv4(),
        fileId: String(fileIdNum).padStart(3, '0'),
        sessionId,
        originalName,
        fileName: path.basename(filePath),
        filePath,
        uploadedAt: new Date().toISOString()
      };
    }

    const parsed = fileService.parseExcelFile(filePath);
    fileEntry.sheetNames = parsed.sheetNames;
    fileEntry.sheets = parsed.sheets;
    fileEntry.stats = fileService.getFileStats(parsed);
    
    fileStore.set(fileEntry.id, fileEntry);
    saveFileStore();

    res.json({ success: true, fileId: fileEntry.id, sheetName: finalSheetName });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.transformFileRoute = (req, res) => {
  try {
    const { sessionId, mode, fileId, sheet, transformJson, prompt } = req.body;
    const entry = fileStore.get(fileId);
    if (!entry) return res.status(404).json({ error: 'File not found' });

    const sourceSheetName = sheet || entry.sheetNames[0];
    const sourceSheet = entry.sheets[sourceSheetName];
    
    const result = aiService.applyTransformation(transformJson, {
      headers: sourceSheet.headers,
      rows: sourceSheet.rows,
      fileStore
    });

    const exportData = [result.headers, ...result.rows.map(r => result.headers.map(h => r[h] ?? ''))];
    const ws = XLSX.utils.aoa_to_sheet(exportData);
    
    const actionSheetName = (prompt || result.actionName).replace(/[\\/?*\[\]:]/g, ' ').substring(0, 31).trim();
    const originalName = `${mode.toUpperCase()}_results_${entry.fileId}_${entry.originalName}`;
    
    let targetEntry = Array.from(fileStore.values()).find(e => e.sessionId === sessionId && e.originalName === originalName);
    let wb;
    let filePath;

    if (targetEntry) {
      filePath = targetEntry.filePath;
      wb = XLSX.readFile(filePath);
      let sn = actionSheetName;
      let counter = 1;
      while (wb.SheetNames.includes(sn)) { sn = `${actionSheetName.substring(0, 27)} (${counter++})`; }
      XLSX.utils.book_append_sheet(wb, ws, sn);
      XLSX.writeFile(wb, filePath);
    } else {
      wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, actionSheetName);
      filePath = path.join(uploadsDir, `${uuidv4()}-${originalName}`);
      XLSX.writeFile(wb, filePath);
      
      const fileIdNum = incrementFileCounter();

      targetEntry = {
        id: uuidv4(),
        fileId: String(fileIdNum).padStart(3, '0'),
        sessionId,
        originalName,
        fileName: path.basename(filePath),
        filePath,
        uploadedAt: new Date().toISOString()
      };
    }

    const parsed = fileService.parseExcelFile(filePath);
    targetEntry.sheetNames = parsed.sheetNames;
    targetEntry.sheets = parsed.sheets;
    targetEntry.stats = fileService.getFileStats(parsed);
    fileStore.set(targetEntry.id, targetEntry);
    saveFileStore();

    res.json({ success: true, fileId: targetEntry.id, sheetName: actionSheetName, actionLabel: result.actionName });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
