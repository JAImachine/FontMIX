const { app, BrowserWindow, ipcMain, session, shell } = require("electron");
const fs = require("node:fs");
const fsp = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const opentype = require("opentype.js");

const APP_URL = process.env.ELECTRON_START_URL || "http://localhost:3000";
const isDev = !app.isPackaged;

let reloadTimer = null;
let restartTimer = null;

const FONT_EXTENSIONS = new Set([".otf", ".ttf", ".ttc", ".otc"]);

function getFontFormatFromBytes(bytes, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".otf") return "otf";
  if (ext === ".ttf" || ext === ".ttc" || ext === ".otc") return "ttf";

  if (!bytes || bytes.length < 4) return "unknown";
  const signature = bytes.subarray(0, 4).toString("latin1");
  if (signature === "OTTO") return "otf";
  if (signature === "true" || signature === "typ1") return "ttf";
  if (bytes[0] === 0x00 && bytes[1] === 0x01 && bytes[2] === 0x00 && bytes[3] === 0x00) return "ttf";
  return "unknown";
}

function getEnglishName(nameRecord) {
  if (!nameRecord) return "";
  return nameRecord.en || Object.values(nameRecord).find(Boolean) || "";
}

function parseFontMetadata(filePath, bytes) {
  const format = getFontFormatFromBytes(bytes, filePath);
  if (format === "unknown") return null;

  try {
    const arrayBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    const parsed = opentype.parse(arrayBuffer);
    const names = parsed.names || {};
    const family = getEnglishName(names.preferredFamily) || getEnglishName(names.fontFamily);
    const subfamily = getEnglishName(names.preferredSubfamily) || getEnglishName(names.fontSubfamily);
    const fullName = getEnglishName(names.fullName) || [family, subfamily].filter(Boolean).join(" ");
    const postscriptName = getEnglishName(names.postScriptName);
    const fallbackName = path.basename(filePath, path.extname(filePath));

    return {
      family: family || fullName || fallbackName,
      fullName: fullName || family || fallbackName,
      postscriptName: postscriptName || undefined,
      style: subfamily || undefined,
      fontFormat: format,
      filePath,
      source: "desktop-scan",
    };
  } catch {
    const fallbackName = path.basename(filePath, path.extname(filePath));
    return {
      family: fallbackName,
      fullName: fallbackName,
      fontFormat: format,
      filePath,
      source: "desktop-scan",
    };
  }
}

async function collectFontFiles(dirPath, files = [], depth = 0) {
  if (depth > 8 || files.length > 5000) return files;

  let entries;
  try {
    entries = await fsp.readdir(dirPath, { withFileTypes: true });
  } catch {
    return files;
  }

  for (const entry of entries) {
    const filePath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      await collectFontFiles(filePath, files, depth + 1);
      continue;
    }

    if (!entry.isFile()) continue;

    const ext = path.extname(entry.name).toLowerCase();
    if (FONT_EXTENSIONS.has(ext) || ext === "") {
      files.push(filePath);
    }
  }

  return files;
}

async function scanDesktopFonts() {
  const homeDir = os.homedir();
  const candidateDirs = [
    path.join(homeDir, "Library", "Fonts"),
    "/Library/Fonts",
    "/System/Library/Fonts",
    path.join(homeDir, "Library", "Application Support", "Adobe", "CoreSync", "plugins", "livetype"),
    path.join(homeDir, "Library", "Application Support", "Adobe", "Fonts"),
    "/Library/Application Support/Adobe/Fonts",
  ];

  const allFiles = [];
  for (const dirPath of candidateDirs) {
    await collectFontFiles(dirPath, allFiles);
  }

  const seenFiles = Array.from(new Set(allFiles));
  const fonts = [];
  const seenFonts = new Set();

  for (const filePath of seenFiles) {
    try {
      const bytes = await fsp.readFile(filePath);
      const font = parseFontMetadata(filePath, bytes);
      if (!font || !font.family || font.family.startsWith(".")) continue;

      const key = font.postscriptName || `${font.fullName}-${font.filePath}`;
      if (seenFonts.has(key)) continue;
      seenFonts.add(key);
      fonts.push(font);
    } catch {
      // Ignore unreadable or unsupported font files.
    }
  }

  return fonts;
}

function debounceReload(window) {
  clearTimeout(reloadTimer);
  reloadTimer = setTimeout(() => {
    if (!window.isDestroyed()) {
      window.webContents.reloadIgnoringCache();
    }
  }, 160);
}

function debounceRestart() {
  clearTimeout(restartTimer);
  restartTimer = setTimeout(() => {
    app.relaunch();
    app.exit(0);
  }, 220);
}

function watchDirectory(dirPath, onChange) {
  if (!fs.existsSync(dirPath)) return null;

  return fs.watch(dirPath, { recursive: true }, (_eventType, fileName) => {
    if (!fileName) return;
    if (fileName.includes("node_modules") || fileName.includes(".vite")) return;
    onChange(fileName);
  });
}

function installDevReload(window) {
  if (!isDev) return;

  const rendererRoot = path.join(__dirname, "..", "src");
  const electronRoot = __dirname;

  watchDirectory(rendererRoot, (fileName) => {
    if (/\.(tsx?|jsx?|css)$/.test(fileName)) {
      debounceReload(window);
    }
  });

  watchDirectory(electronRoot, (fileName) => {
    if (/\.(cjs|js|mjs)$/.test(fileName)) {
      debounceRestart();
    }
  });
}

function installPermissionHandlers() {
  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    if (permission === "local-fonts") {
      callback(true);
      return;
    }

    callback(false);
  });

  session.defaultSession.setPermissionCheckHandler((_webContents, permission) => {
    return permission === "local-fonts";
  });
}

function installIpcHandlers() {
  ipcMain.handle("fontmix:list-fonts", async () => {
    const fonts = await scanDesktopFonts();
    return { fonts };
  });
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 1100,
    minHeight: 720,
    title: "FontMIX Studio",
    backgroundColor: "#fcfaf6",
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.loadURL(APP_URL);
  installDevReload(mainWindow);
}

app.whenReady().then(() => {
  installPermissionHandlers();
  installIpcHandlers();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
