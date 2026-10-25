const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const MAGIC_HEADER = Buffer.from("LSYST1", 'utf-8');
const PASSWORD = "!WatchDog-SystemLog!";

/**
 * Усиление ключа (Key Stretching) 100 000 итераций SHA-256
 */
function stretchKey(password, salt) {
  let key = Buffer.concat([Buffer.from(password, 'utf-8'), salt]);
  for (let i = 0; i < 100000; i++) {
    key = crypto.createHash('sha256').update(Buffer.concat([key, salt])).digest();
  }
  return key;
}

/**
 * Шифрование по алгоритму lsyst_crypt.py
 */
function encryptData(dataBuf, password) {
  const salt = crypto.randomBytes(16);
  const key = stretchKey(password, salt);
  const keyLen = key.length;

  const encrypted = Buffer.alloc(dataBuf.length);
  for (let i = 0; i < dataBuf.length; i++) {
    const mask = key[i % keyLen] ^ (i & 0xFF);
    encrypted[i] = dataBuf[i] ^ mask;
  }

  const permuted = Buffer.alloc(encrypted.length);
  for (let i = 0; i < encrypted.length; i++) {
    const shift = key[i % keyLen] % 8;
    const b = encrypted[i];
    permuted[i] = ((b << shift) & 0xFF) | (b >> (8 - shift));
  }

  return Buffer.concat([MAGIC_HEADER, salt, permuted]);
}

/**
 * Расшифровка по алгоритму lsyst_crypt.py
 */
function decryptData(fileBuf, password) {
  if (fileBuf.length < MAGIC_HEADER.length + 16 || !fileBuf.subarray(0, MAGIC_HEADER.length).equals(MAGIC_HEADER)) {
    throw new Error("Неверный формат файла .lsyst!");
  }

  const headerLen = MAGIC_HEADER.length;
  const salt = fileBuf.subarray(headerLen, headerLen + 16);
  const encryptedData = fileBuf.subarray(headerLen + 16);

  const key = stretchKey(password, salt);
  const keyLen = key.length;

  const unpermuted = Buffer.alloc(encryptedData.length);
  for (let i = 0; i < encryptedData.length; i++) {
    const shift = key[i % keyLen] % 8;
    const b = encryptedData[i];
    unpermuted[i] = (b >> shift) | ((b << (8 - shift)) & 0xFF);
  }

  const decrypted = Buffer.alloc(unpermuted.length);
  for (let i = 0; i < unpermuted.length; i++) {
    const mask = key[i % keyLen] ^ (i & 0xFF);
    decrypted[i] = unpermuted[i] ^ mask;
  }

  return decrypted;
}

class Logger {
  constructor(filePath) {
    this.filePath = filePath;
    this.logHistory = [];
    this.loadExistingLogs();
  }

  loadExistingLogs() {
    try {
      if (fs.existsSync(this.filePath)) {
        const fileBuf = fs.readFileSync(this.filePath);
        const decryptedBuf = decryptData(fileBuf, PASSWORD);
        const text = decryptedBuf.toString('utf-8');
        this.logHistory = text.split('\n').filter(line => line.trim().length > 0);
      }
    } catch (e) {
      console.error("[LOGGER WARN] Ошибка чтения существующих логов:", e.message);
      this.logHistory = [];
    }
  }

  log(level, type, message, details = null) {
    const timestamp = new Date().toISOString();
    let logLine = `[${timestamp}] [${level.toUpperCase()}] [${type}] ${message}`;
    if (details !== null && details !== undefined) {
      logLine += ` | Details: ${typeof details === 'object' ? JSON.stringify(details) : details}`;
    }

    // Вывод в консоль
    if (level.toLowerCase() === 'error') {
      console.error(logLine);
    } else if (level.toLowerCase() === 'warn') {
      console.warn(logLine);
    } else {
      console.log(logLine);
    }

    // Сохранение и шифрование в logs.lsyst
    this.logHistory.push(logLine);
    this.flush();
  }

  flush() {
    try {
      const fullText = this.logHistory.join('\n') + '\n';
      const rawBuf = Buffer.from(fullText, 'utf-8');
      const encryptedBuf = encryptData(rawBuf, PASSWORD);
      fs.writeFileSync(this.filePath, encryptedBuf);
    } catch (e) {
      console.error("[LOGGER ERROR] Не удалось записать logs.lsyst:", e.message);
    }
  }
}

let loggerInstance = null;

function initLogger(appPath) {
  const logFilePath = path.join(appPath, 'logs.lsyst');
  loggerInstance = new Logger(logFilePath);
  loggerInstance.log('info', 'SYSTEM', 'Логгер успешно инициализирован', { path: logFilePath });
  return loggerInstance;
}

function getLogger() {
  return loggerInstance;
}

module.exports = {
  initLogger,
  getLogger,
  encryptData,
  decryptData
};