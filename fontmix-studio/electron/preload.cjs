const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("fontmixDesktop", {
  platform: process.platform,
});
