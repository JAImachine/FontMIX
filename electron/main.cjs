const { app, BrowserWindow, shell } = require("electron");
const fs = require("node:fs");
const path = require("node:path");

const APP_URL = process.env.ELECTRON_START_URL || "http://localhost:3000";
const isDev = !app.isPackaged;

let reloadTimer = null;
let restartTimer = null;

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
