import { nativeTheme } from "electron";
import { ipcMain } from "electron";
import {
  THEME_MODE_CURRENT_CHANNEL,
  THEME_MODE_DARK_CHANNEL,
  THEME_MODE_LIGHT_CHANNEL,
  THEME_MODE_SYSTEM_CHANNEL,
  THEME_MODE_TOGGLE_CHANNEL,
} from "./theme-channels";

export function addThemeEventListeners() {
  
  ipcMain.removeHandler(THEME_MODE_CURRENT_CHANNEL);
  ipcMain.handle(THEME_MODE_CURRENT_CHANNEL, () => nativeTheme.themeSource);

  ipcMain.removeHandler(THEME_MODE_TOGGLE_CHANNEL);
  ipcMain.handle(THEME_MODE_TOGGLE_CHANNEL, () => {
    if (nativeTheme.shouldUseDarkColors) {
      nativeTheme.themeSource = "light";
    } else {
      nativeTheme.themeSource = "dark";
    }
    return nativeTheme.shouldUseDarkColors;
  });

  ipcMain.removeHandler(THEME_MODE_DARK_CHANNEL);
  ipcMain.handle(
    THEME_MODE_DARK_CHANNEL,
    () => (nativeTheme.themeSource = "dark"),
  );

  ipcMain.removeHandler(THEME_MODE_LIGHT_CHANNEL);
  ipcMain.handle(
    THEME_MODE_LIGHT_CHANNEL,
    () => (nativeTheme.themeSource = "light"),
  );

  ipcMain.removeHandler(THEME_MODE_SYSTEM_CHANNEL);
  ipcMain.handle(THEME_MODE_SYSTEM_CHANNEL, () => {
    nativeTheme.themeSource = "system";
    return nativeTheme.shouldUseDarkColors;
  });
}
