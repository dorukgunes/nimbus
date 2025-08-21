import { BrowserWindow, ipcMain } from "electron";
import {
  WIN_CLOSE_CHANNEL,
  WIN_MAXIMIZE_CHANNEL,
  WIN_MINIMIZE_CHANNEL,
} from "./window-channels";

export function addWindowEventListeners(mainWindow: BrowserWindow) {
  // Remove any existing handlers before registering new ones
  ipcMain.removeHandler(WIN_MINIMIZE_CHANNEL);
  ipcMain.handle(WIN_MINIMIZE_CHANNEL, () => {
    mainWindow.minimize();
  });
  
  ipcMain.removeHandler(WIN_MAXIMIZE_CHANNEL);
  ipcMain.handle(WIN_MAXIMIZE_CHANNEL, () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  });
  
  ipcMain.removeHandler(WIN_CLOSE_CHANNEL);
  ipcMain.handle(WIN_CLOSE_CHANNEL, () => {
    mainWindow.close();
  });
}
