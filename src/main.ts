import { app, BrowserWindow, ipcMain } from "electron";
import registerListeners from "./helpers/ipc/listeners-register";
import path from "path";
import {
  installExtension,
  REACT_DEVELOPER_TOOLS,
} from "electron-devtools-installer";
import { ConnectionStorage } from './utils/connectionStorage';

// Initialize connection storage
const connectionStorage = new ConnectionStorage();

// Register IPC handlers before app is ready
function registerIPCHandlers() {
  ipcMain.handle('connection:getAll', () => {
    return connectionStorage.getAllConnections();
  });

  ipcMain.handle('connection:save', (_, connection) => {
    return connectionStorage.saveConnection(connection);
  });

  ipcMain.handle('connection:update', (_, id, connection) => {
    return connectionStorage.updateConnection(id, connection);
  });

  ipcMain.handle('connection:delete', (_, id) => {
    return connectionStorage.deleteConnection(id);
  });

  ipcMain.handle('connection:test', (_, connection) => {
    return connectionStorage.testConnection(connection);
  });

  ipcMain.handle('connection:updateLastSelectedLogGroup', (_, connectionId, logGroupName) => {
    return connectionStorage.updateLastSelectedLogGroup(connectionId, logGroupName);
  });

  // Saved Queries handlers
  ipcMain.handle('connection:saveQuery', (_, connectionId, query) => {
    return connectionStorage.saveQuery(connectionId, query);
  });

  ipcMain.handle('connection:updateQuery', (_, connectionId, queryId, query) => {
    return connectionStorage.updateQuery(connectionId, queryId, query);
  });

  ipcMain.handle('connection:deleteQuery', (_, connectionId, queryId) => {
    return connectionStorage.deleteQuery(connectionId, queryId);
  });

  ipcMain.handle('connection:getSavedQueries', (_, connectionId) => {
    return connectionStorage.getSavedQueries(connectionId);
  });
}

function createWindow() {
  const preload = path.join(__dirname, "preload.js");
  console.log('Creating window with preload:', preload);
  
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    minHeight: 600,
    minWidth: 800,
    webPreferences: {
      devTools: true, // Always enable dev tools
      contextIsolation: true,
      nodeIntegration: false, // Should be false for security
      nodeIntegrationInSubFrames: false,

      preload: preload,
    },
    titleBarStyle: "hidden",
    icon: path.join(__dirname, "../images/logo.png"),
  });
  registerListeners(mainWindow);

  // Add error handling for page load
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Page failed to load:', errorCode, errorDescription);
  });


  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    console.log('Loading dev server URL:', MAIN_WINDOW_VITE_DEV_SERVER_URL);
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    const rendererPath = path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`);
    console.log('Loading renderer file:', rendererPath);
    mainWindow.loadFile(rendererPath);
  }
}

async function installExtensions() {
  try {
    const result = await installExtension(REACT_DEVELOPER_TOOLS);
    console.log(`Extensions installed successfully: ${result.name}`);
  } catch {
    console.error("Failed to install extensions");
  }
}

// Register handlers before app is ready
registerIPCHandlers();

// Initialize app
app.whenReady()
  .then(createWindow)
  .then(installExtensions)
  .catch(console.error);

//osX only
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
//osX only ends
