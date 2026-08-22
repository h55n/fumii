import { Tray, Menu, nativeImage } from 'electron';
import { checkForUpdatesManual } from './updater';

let tray: Tray | null = null;

const TRAY_ICON_DATA_URI =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAf1JREFUWEdj/Pfv33+GAQSMow4YDYHREBgNgdEQwBYCh6+9BxfOtlqCFBXSMHNE+dkZXn/8idVMjKI4btI1hvUnX4EVVwYpMFQFK5DtCJADvFovgs05euMDw+FrHxg+LXVAMQ/DAbzRB8AaNGW4wApFeFnhLof5CNkEUCiBxEG+1JDmArNVpbgZJATYGD59+8Ow+thLBgNFXoaHr38wyItyMBgr8+F2AEjzp+9/GSZsfcyQ6ykDVhg94So8JGA+2latz9C+/iHD0nwdBrn0I2B1XkYiDLleMgyeLRfA/KYIJQY/UxEGg+JTDO3RygwXHnxhWHX0Jf4QgFkAcyIoJNrXPcDpgHgHSYYDV94zqElxMdStuMdgrSHAsKPWgEG/6CQDOysTw/JCbRQHbD37huH5XFv8UdC29gHYUpAvQcELixJQWkAPgXP3PjOc7DBluPTwM0NUPyKkShfdYZix8wnDhV4z6jjAXI2fYU+9IUPRgtsMs3c/BTsOFAUgsK3aAO4wWKKFeYIqDkiZdp1hy9k3DEZKvAyqElwM8/Y9I9sBBNMAyEcg14PLAE1+cBTsuvCWYc2J1wxP3v5g6IhRYdhy5g1Y7vD1j2B1sKhB5sPMCLcWY+jb/JhBU5qL4frTb2D1U1PV8acBsjM9mRpH24SjITAaAqMhMBoCAx4CAFTSkFDWcy9ZAAAAAElFTkSuQmCC';

export function setupTray(handlers: {
  onOpenChat: () => void;
  onOpenDashboard: () => void;
  onQuit: () => void;
}) {
  try {
    const image = nativeImage.createFromDataURL(TRAY_ICON_DATA_URI);

    tray = new Tray(image);
    tray.setToolTip("fumii — you're never really alone");

    const menu = Menu.buildFromTemplate([
      { label: 'Open chat', click: handlers.onOpenChat },
      { label: 'Open dashboard', click: handlers.onOpenDashboard },
      { type: 'separator' },
      {
        label: 'Check for updates',
        click: () => checkForUpdatesManual()
      },
      { type: 'separator' },
      { label: 'Quit fumii', click: handlers.onQuit }
    ]);

    tray.setContextMenu(menu);
    tray.on('click', handlers.onOpenDashboard);
    tray.on('double-click', handlers.onOpenDashboard);
    console.log('[tray] System tray successfully created');
    return tray;
  } catch (err) {
    console.error('[tray] Failed to setup tray:', err);
    return null;
  }
}

export function getTray() {
  return tray;
}
