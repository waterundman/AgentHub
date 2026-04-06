const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // 应用路径
  getAppPath: () => ipcRenderer.invoke('get-app-path'),
  
  // 文件操作
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  writeFile: (filePath, content) => ipcRenderer.invoke('write-file', filePath, content),
  
  // 菜单事件
  onMenuExport: (callback) => ipcRenderer.on('menu-export', callback),
  onMenuImport: (callback) => ipcRenderer.on('menu-import', callback),
  
  // 移除监听器
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
});