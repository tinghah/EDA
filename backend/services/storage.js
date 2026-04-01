const fs = require('fs');
const path = require('path');

const fileStore = new Map();
const fileStorePath = path.join(__dirname, '../files.json');
let fileCounter = 0;

function saveFileStore() {
  try {
    const files = Array.from(fileStore.values());
    fs.writeFileSync(fileStorePath, JSON.stringify({ fileCounter, files }, null, 2), 'utf8');
  } catch (err) {
    console.warn('Could not save files.json:', err.message);
  }
}

function loadFileStore() {
  try {
    if (fs.existsSync(fileStorePath)) {
      const data = JSON.parse(fs.readFileSync(fileStorePath, 'utf8'));
      fileCounter = data.fileCounter || 0;
      if (data.files && Array.isArray(data.files)) {
        data.files.forEach(f => {
          if (f.filePath && fs.existsSync(f.filePath)) {
            fileStore.set(f.id, f);
          }
        });
        console.log(`Loaded ${fileStore.size} persistent files.`);
      }
    }
  } catch (err) {
    console.warn('Could not load files.json:', err.message);
  }
}

function getFileCounter() {
  return fileCounter;
}

function incrementFileCounter() {
  fileCounter++;
  return fileCounter;
}

module.exports = {
  fileStore,
  saveFileStore,
  loadFileStore,
  getFileCounter,
  incrementFileCounter
};
