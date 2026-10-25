const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const JSZip = require('jszip');
const { initLogger, getLogger } = require('./logger');

let mainWindow;

function createWindow() {
  const logger = initLogger(app.getPath('userData'));
  logger.log('info', 'APP', 'Создание главного окна Electron');

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 850,
    minWidth: 1000,
    minHeight: 700,
    icon: path.join(__dirname, 'assets', 'localis.ico'),
    backgroundColor: '#05060f',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    autoHideMenuBar: true,
    frame: true
  });

  mainWindow.removeMenu();
  mainWindow.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  const logger = getLogger();
  if (logger) logger.log('info', 'APP', 'Все окна закрыты');
  if (process.platform !== 'darwin') app.exit(0);
});

// Перехват всех логов из рендерера (UI)
ipcMain.handle('log:action', (event, { level, type, message, details }) => {
  const logger = getLogger();
  if (logger) {
    logger.log(level || 'info', type || 'UI', message, details);
  }
  return true;
});

function getLangTargetFileName(targetLang) {
  switch (targetLang) {
    case 'de': return 'de_de.json';
    case 'zh': return 'zh_cn.json';
    case 'en': return 'en_us.json';
    case 'ru': default: return 'ru_ru.json';
  }
}

function getLocksFilePath(backupDir) {
  return path.join(backupDir, '.backup_locks.json');
}

function loadBackupLocks(backupDir) {
  const p = getLocksFilePath(backupDir);
  if (fs.existsSync(p)) {
    try {
      return JSON.parse(fs.readFileSync(p, 'utf8'));
    } catch (e) {}
  }
  return {};
}

function saveBackupLocks(backupDir, locks) {
  const p = getLocksFilePath(backupDir);
  try {
    fs.writeFileSync(p, JSON.stringify(locks, null, 2), 'utf8');
  } catch (e) {}
}

function cleanupOldBackups(backupDir) {
  if (!fs.existsSync(backupDir)) return;
  const locks = loadBackupLocks(backupDir);
  const now = Date.now();
  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

  const files = fs.readdirSync(backupDir);
  files.forEach(file => {
    if (file === '.backup_locks.json' || !file.endsWith('.bak')) return;
    const fullPath = path.join(backupDir, file);
    if (locks[file]) return;

    try {
      const stats = fs.statSync(fullPath);
      const parts = file.split('.');
      const timestamp = parseInt(parts[parts.length - 2]) || stats.mtimeMs;
      if (now - timestamp > THIRTY_DAYS_MS) {
        fs.unlinkSync(fullPath);
      }
    } catch (e) {}
  });
}

ipcMain.handle('dialog:select-directory', async () => {
  const logger = getLogger();
  if (logger) logger.log('info', 'USER', 'Открытие диалога выбора папки');
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  if (result.canceled) {
    if (logger) logger.log('info', 'USER', 'Выбор папки отменен пользователем');
    return null;
  }
  if (logger) logger.log('info', 'USER', 'Выбрана папка', { path: result.filePaths[0] });
  return result.filePaths[0];
});

ipcMain.handle('mod:scan-folder', async (event, { folderPath, targetLang }) => {
  const logger = getLogger();
  if (logger) logger.log('info', 'SYSTEM', 'Начало сканирования папки модов', { folderPath, targetLang });
  try {
    if (!fs.existsSync(folderPath)) {
      if (logger) logger.log('error', 'SYSTEM', 'Папка не существует', { folderPath });
      return { error: 'Folder does not exist' };
    }
    const backupDir = path.join(folderPath, '.backups');
    cleanupOldBackups(backupDir);

    const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.jar'));
    let mods = [];

    const targetFileName = getLangTargetFileName(targetLang);

    for (const file of files) {
      const fullPath = path.join(folderPath, file);
      try {
        const data = fs.readFileSync(fullPath);
        const zip = await JSZip.loadAsync(data);
        
        const modMap = {};

        for (const [entryName, zipEntry] of Object.entries(zip.files)) {
          const parts = entryName.split('/');
          if (parts.length < 4) continue;
          if (parts[0] !== 'assets' || parts[2] !== 'lang') continue;
          if (!entryName.endsWith('.json')) continue;

          const modId = parts[1];
          const fileName = parts[parts.length - 1].toLowerCase();

          if (!modMap[modId]) {
            modMap[modId] = { en: {}, target: {}, enPath: '', targetPath: '' };
          }

          try {
            const contentStr = await zipEntry.async('text');
            const content = JSON.parse(contentStr);
            if (typeof content !== 'object' || content === null) continue;

            if (fileName === 'en_us.json' || fileName === 'en_en.json') {
              Object.assign(modMap[modId].en, content);
              modMap[modId].enPath = entryName;
            } else if (fileName === targetFileName) {
              Object.assign(modMap[modId].target, content);
              modMap[modId].targetPath = entryName;
            }
          } catch (e) {}
        }

        let totalKeys = 0;
        let translatedKeys = 0;
        let placeholderErrors = 0;
        let hasLang = Object.keys(modMap).length > 0;
        let targetFileFound = false;
        let targetIsEmpty = true;

        const placeholderRegex = /%(?:\d+\$)?[sdif]|\${[^}]*}/g;

        for (const [modId, mData] of Object.entries(modMap)) {
          const sourceEntries = Object.entries(mData.en).filter(([, value]) => typeof value === 'string');
          totalKeys += sourceEntries.length;

          if (mData.targetPath) {
            targetFileFound = true;
          }

          const targetKeysCount = Object.keys(mData.target).length;
          if (targetKeysCount > 0) {
            targetIsEmpty = false;
          }
          for (const [k, v] of sourceEntries) {
            const trans = mData.target[k];
            if (typeof trans === 'string' && trans.trim()) {
              const enMatches = (v.match(placeholderRegex) || []).sort().join(',');
              const trMatches = (trans.match(placeholderRegex) || []).sort().join(',');
              if (enMatches !== trMatches) {
                placeholderErrors++;
              } else if (trans !== v) {
                translatedKeys++;
              }
            }
          }
        }

        let reason = null;
        if (!hasLang || totalKeys === 0) {
          reason = 'no_lang';
        } else if (!targetFileFound) {
          reason = 'no_target_file';
        } else if (targetIsEmpty || translatedKeys === 0) {
          reason = 'target_empty';
        }

        mods.push({
          name: file,
          path: fullPath,
          modMap,
          hasLang,
          reason,
          placeholderErrors,
          totalKeys,
          translatedKeys
        });
      } catch (err) {
        mods.push({
          name: file,
          path: fullPath,
          modMap: {},
          hasLang: false,
          reason: 'read_error',
          placeholderErrors: 0,
          totalKeys: 0,
          translatedKeys: 0
        });
      }
    }
    if (logger) logger.log('info', 'SYSTEM', 'Сканирование папки завершено', { totalModsFound: mods.length });
    return { mods };
  } catch (e) {
    if (logger) logger.log('error', 'SYSTEM', 'Ошибка сканирования папки', { error: e.message });
    return { error: e.message };
  }
});

ipcMain.handle('mod:save-jar', async (event, { jarPath, targetPath, targetData, modId, targetLang }) => {
  const logger = getLogger();
  if (logger) logger.log('info', 'USER', 'Сохранение изменений в JAR мода', { jarPath, modId, targetLang });
  try {
    const fullPath = path.resolve(jarPath);
    const backupDir = path.join(path.dirname(fullPath), '.backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    cleanupOldBackups(backupDir);

    const backupFileName = `${path.basename(fullPath)}.${Date.now()}.bak`;
    const backupPath = path.join(backupDir, backupFileName);
    fs.copyFileSync(fullPath, backupPath);

    const data = fs.readFileSync(fullPath);
    const zip = await JSZip.loadAsync(data);

    const targetFileName = getLangTargetFileName(targetLang);
    const finalTargetPath = targetPath || `assets/${modId}/lang/${targetFileName}`;
    zip.file(finalTargetPath, JSON.stringify(targetData, null, 2));

    const content = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
    fs.writeFileSync(fullPath, content);

    if (logger) logger.log('info', 'SYSTEM', 'Файл JAR успешно сохранен', { backupPath });
    return { success: true, backupPath };
  } catch (e) {
    if (logger) logger.log('error', 'SYSTEM', 'Ошибка сохранения JAR мода', { error: e.message });
    return { success: false, error: e.message };
  }
});

ipcMain.handle('mod:list-backups', (event, jarPath) => {
  const logger = getLogger();
  if (logger) logger.log('info', 'USER', 'Запрос списка бэкапов', { jarPath });
  try {
    const fullPath = path.resolve(jarPath);
    const backupDir = path.join(path.dirname(fullPath), '.backups');
    if (!fs.existsSync(backupDir)) return [];

    cleanupOldBackups(backupDir);
    const locks = loadBackupLocks(backupDir);

    const baseName = path.basename(fullPath);
    const files = fs.readdirSync(backupDir).filter(f => f.startsWith(baseName) && f.endsWith('.bak'));
    
    return files.map(f => {
      const parts = f.split('.');
      const timestamp = parseInt(parts[parts.length - 2]) || Date.now();
      return {
        fileName: f,
        fullBackupPath: path.join(backupDir, f),
        dateStr: new Date(timestamp).toLocaleString(),
        isLocked: !!locks[f]
      };
    }).sort((a, b) => b.fileName.localeCompare(a.fileName));
  } catch (e) {
    if (logger) logger.log('error', 'SYSTEM', 'Ошибка получения бэкапов', { error: e.message });
    return [];
  }
});

ipcMain.handle('mod:toggle-backup-lock', (event, { backupPath, isLocked }) => {
  const logger = getLogger();
  if (logger) logger.log('info', 'USER', 'Переключение блокировки бэкапа', { backupPath, isLocked });
  try {
    const backupDir = path.dirname(backupPath);
    const fileName = path.basename(backupPath);
    const locks = loadBackupLocks(backupDir);
    
    if (isLocked) {
      locks[fileName] = true;
    } else {
      delete locks[fileName];
    }
    
    saveBackupLocks(backupDir, locks);
    return { success: true };
  } catch (e) {
    if (logger) logger.log('error', 'SYSTEM', 'Ошибка блокировки бэкапа', { error: e.message });
    return { success: false, error: e.message };
  }
});

ipcMain.handle('mod:restore-backup', (event, { jarPath, backupPath }) => {
  const logger = getLogger();
  if (logger) logger.log('info', 'USER', 'Восстановление бэкапа', { jarPath, backupPath });
  try {
    fs.copyFileSync(backupPath, jarPath);
    if (logger) logger.log('info', 'SYSTEM', 'Бэкап успешно восстановлен', { jarPath });
    return { success: true };
  } catch (e) {
    if (logger) logger.log('error', 'SYSTEM', 'Ошибка восстановления бэкапа', { error: e.message });
    return { success: false, error: e.message };
  }
});

ipcMain.handle('notif:load', () => {
  const logger = getLogger();
  if (logger) logger.log('info', 'NOTIFICATIONS', 'Запрошена загрузка уведомлений');
  const notifPath = path.join(app.getPath('userData'), 'notifications.json');
  if (fs.existsSync(notifPath)) {
    try {
      const notifications = JSON.parse(fs.readFileSync(notifPath, 'utf8'));
      if (logger) logger.log('info', 'NOTIFICATIONS', 'Уведомления загружены', { count: notifications.length });
      return notifications;
    } catch (e) { if (logger) logger.log('error', 'NOTIFICATIONS', 'Ошибка чтения уведомлений', { error: e.message }); }
  }
  if (logger) logger.log('info', 'NOTIFICATIONS', 'Файл уведомлений отсутствует, возвращён пустой список');
  return [];
});

ipcMain.handle('notif:save', (event, notifications) => {
  const logger = getLogger();
  if (logger) logger.log('info', 'NOTIFICATIONS', 'Сохранение уведомлений', { count: Array.isArray(notifications) ? notifications.length : null });
  const notifPath = path.join(app.getPath('userData'), 'notifications.json');
  try {
    fs.writeFileSync(notifPath, JSON.stringify(notifications, null, 2), 'utf8');
    if (logger) logger.log('info', 'NOTIFICATIONS', 'Уведомления успешно сохранены');
    return true;
  } catch (e) {
    if (logger) logger.log('error', 'NOTIFICATIONS', 'Ошибка сохранения уведомлений', { error: e.message });
    return false;
  }
});

ipcMain.handle('config:load', () => {
  const cfgPath = path.join(app.getPath('userData'), 'ai_config.json');
  if (fs.existsSync(cfgPath)) {
    try {
      return JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
    } catch (e) {}
  }
  return {
    mode: "",
    cloud_name: "",
    cloud_base_url: "",
    cloud_models_url: "",
    cloud_api_key: "",
    cloud_active_model: "",
    ollama_name: "Ollama",
    ollama_base_url: "http://127.0.0.1:11434/v1",
    ollama_models_url: "http://127.0.0.1:11434/v1/models",
    ollama_active_model: "llama3"
  };
});

ipcMain.handle('config:save', (event, cfg) => {
  const logger = getLogger();
  if (logger) logger.log('info', 'USER', 'Сохранение настроек ИИ', { mode: cfg.mode });
  const cfgPath = path.join(app.getPath('userData'), 'ai_config.json');
  try {
    fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2), 'utf8');
    return true;
  } catch (e) {
    if (logger) logger.log('error', 'SYSTEM', 'Ошибка сохранения настроек ИИ', { error: e.message });
    return false;
  }
});

ipcMain.handle('term:load', () => {
  const termPath = path.join(app.getPath('userData'), 'terminology.json');
  if (fs.existsSync(termPath)) {
    try {
      return JSON.parse(fs.readFileSync(termPath, 'utf8'));
    } catch (e) {}
  }
  return {};
});

ipcMain.handle('term:save', (event, data) => {
  const logger = getLogger();
  if (logger) logger.log('info', 'USER', 'Сохранение правил терминологии');
  const termPath = path.join(app.getPath('userData'), 'terminology.json');
  try {
    fs.writeFileSync(termPath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (e) {
    if (logger) logger.log('error', 'SYSTEM', 'Ошибка сохранения терминологии', { error: e.message });
    return false;
  }
});
