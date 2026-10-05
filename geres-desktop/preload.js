const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('TESTE_CASCA', {
  casca: 'geres-desktop',
  versao: () => ipcRenderer.invoke('geres-versao'),
  atualizar: () => ipcRenderer.invoke('geres-atualizar')
});
