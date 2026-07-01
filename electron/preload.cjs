const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("fontmixDesktop", {
  platform: process.platform,
  listFonts: () => ipcRenderer.invoke("fontmix:list-fonts"),
});
