const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');

const fileService = require('../services/fileService');
const { fileStore, saveFileStore, incrementFileCounter } = require('../services/storage');

exports.getHealth = (req, res) => {
  res.json({ status: 'OK', fileCount: fileStore.size });
};

exports.uploadFiles = (req, res) => {
  try {
    const results = [];
    for (const file of req.files) {
      const fileIdNum = incrementFileCounter();
      const fileId = String(fileIdNum).padStart(3, '0');
      const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
      
      const parsed = fileService.parseExcelFile(file.path);
      const stats = fileService.getFileStats(parsed);

      const fileEntry = {
        id: uuidv4(),
        fileId,
        originalName,
        fileName: file.filename,
        filePath: file.path,
        uploadedAt: new Date().toISOString(),
        size: file.size,
        sheetNames: parsed.sheetNames,
        sheets: parsed.sheets,
        stats
      };

      fileStore.set(fileEntry.id, fileEntry);
      results.push({
        id: fileEntry.id,
        fileId,
        originalName,
        uploadedAt: fileEntry.uploadedAt,
        size: file.size,
        sheetNames: parsed.sheetNames,
        stats
      });
    }
    saveFileStore();
    res.json({ success: true, files: results });
  } catch (err) {
    console.error('Upload Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.listFiles = (req, res) => {
  const files = Array.from(fileStore.values()).map(e => ({
    id: e.id,
    fileId: e.fileId,
    originalName: e.originalName,
    uploadedAt: e.uploadedAt,
    size: e.size,
    sheetNames: e.sheetNames,
    stats: e.stats
  })).sort((a, b) => a.fileId.localeCompare(b.fileId));
  res.json({ files });
};

exports.getFileData = (req, res) => {
  const { id } = req.params;
  const { sheet, page = 1, pageSize = 100 } = req.query;
  const entry = fileStore.get(id);

  if (!entry) return res.status(404).json({ error: 'File not found' });

  const sheetName = sheet || entry.sheetNames[0];
  const sheetData = entry.sheets[sheetName];

  if (!sheetData) return res.status(404).json({ error: `Sheet "${sheetName}" not found` });

  const p = parseInt(page);
  const ps = parseInt(pageSize);
  const rows = sheetData.rows.slice((p - 1) * ps, p * ps);

  res.json({
    id: entry.id,
    fileId: entry.fileId,
    originalName: entry.originalName,
    sheetName,
    sheetNames: entry.sheetNames,
    headers: sheetData.headers,
    rows: rows,
    totalRows: sheetData.rows.length,
    totalCols: sheetData.headers.length,
    page: p,
    pageSize: ps,
    totalPages: Math.ceil(sheetData.rows.length / ps)
  });
};

exports.deleteFile = (req, res) => {
  const { id } = req.params;
  const entry = fileStore.get(id);
  if (!entry) return res.status(404).json({ error: 'File not found' });

  try {
    if (entry.filePath && fs.existsSync(entry.filePath)) {
      fs.unlinkSync(entry.filePath);
    }
  } catch (e) {
    console.warn('Could not delete disk file:', e.message);
  }

  fileStore.delete(id);
  saveFileStore();
  res.json({ success: true, message: `File "${entry.originalName}" removed.` });
};

exports.searchFile = (req, res) => {
  const { fileId, sheet, query, column } = req.body;
  const entry = fileStore.get(fileId);
  if (!entry) return res.status(404).json({ error: 'File not found' });

  const sheetName = sheet || entry.sheetNames[0];
  const sheetData = entry.sheets[sheetName];
  if (!sheetData) return res.status(404).json({ error: 'Sheet not found' });

  const q = String(query).toLowerCase();
  const results = sheetData.rows.filter(row => {
    if (column) return String(row[column] || '').toLowerCase().includes(q);
    return sheetData.headers.some(h => String(row[h] || '').toLowerCase().includes(q));
  });

  res.json({ results, totalResults: results.length });
};

exports.getColumnStats = (req, res) => {
  const { fileId, sheet, column } = req.body;
  const entry = fileStore.get(fileId);
  if (!entry) return res.status(404).json({ error: 'File not found' });

  const sheetName = sheet || entry.sheetNames[0];
  const sheetData = entry.sheets[sheetName];
  if (!sheetData) return res.status(404).json({ error: 'Sheet not found' });

  const stats = fileService.getColumnStats(sheetData, column);
  res.json(stats);
};

exports.exportFile = (req, res) => {
  try {
    const { fileId, sheet, format = 'xlsx', filteredRows } = req.body;
    const entry = fileStore.get(fileId);
    if (!entry) return res.status(404).json({ error: 'File not found' });

    const sheetName = sheet || entry.sheetNames[0];
    const sheetData = entry.sheets[sheetName];
    const rows = filteredRows || sheetData.rows;

    const aoa = [sheetData.headers, ...rows.map(r => sheetData.headers.map(h => r[h] ?? ''))];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    if (format === 'csv') {
      const csv = XLSX.utils.sheet_to_csv(ws);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(entry.originalName)}.csv"`);
      res.send('\uFEFF' + csv);
    } else {
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(entry.originalName)}_export.xlsx"`);
      res.send(buf);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
