'use strict'

import { app, protocol, BrowserWindow } from 'electron'


let mainWindow
const winURL = `file://${__dirname}/index.html`
protocol.registerStandardSchemes(['app'], { secure: true })
function createWindow() {
  mainWindow = new BrowserWindow({
    height: 480,
    useContentSize: true,
    width: 1000
  })

  mainWindow.loadURL(winURL)
  mainWindow.webContents.openDevTools()
  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})
