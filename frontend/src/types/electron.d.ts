import { App } from 'electron';

declare module 'electron' {
  interface App {
    getPrinters(): Electron.PrinterInfo[];
  }
  
  namespace Electron {
    interface PrinterInfo {
      name: string;
      description: string;
      status: number;
      isDefault: boolean;
      options?: any;
    }
  }
}

// Tipos para electron-store
declare module 'electron-store' {
  interface Options<T> {
    name?: string;
    defaults?: T;
    cwd?: string;
    encryptionKey?: string;
    clearInvalidConfig?: boolean;
    serialize?: (value: T) => string;
    deserialize?: (text: string) => T;
    projectSuffix?: string;
    schema?: any;
  }

  export default class Store<T = Record<string, unknown>> {
    constructor(options?: Options<T>);
    get<K extends keyof T>(key: K): T[K];
    get<K extends keyof T>(key: K, defaultValue: T[K]): T[K];
    set<K extends keyof T>(key: K, value: T[K]): void;
    set(object: Partial<T>): void;
    has<K extends keyof T>(key: K): boolean;
    delete<K extends keyof T>(key: K): void;
    clear(): void;
    reset(...keys: Array<keyof T>): void;
    size: number;
    store: T;
  }
}

declare module '@plick/electron-pos-printer' {
  export interface PosPrintOptions {
    printerName: string;
    width: string;
    margin?: string;
    copies?: number;
    preview?: boolean;
    silent?: boolean;
    timeOutPerLine?: number;
    pageSize?: string;
  }
  
  export interface PosPrintData {
    type: string;
    value?: string;
    style?: string;
    height?: number;
    width?: number;
    displayValue?: boolean;
  }
  
  export class PosPrinter {
    static print(data: PosPrintData[], options: PosPrintOptions): Promise<void>;
  }
}

declare global {
  interface Window {
    printerAPI: {
      getPrinters: () => Promise<{
        success: boolean;
        printers: { name: string; isDefault: boolean }[];
        error?: string;
      }>;
      getPrinterConfig: () => Promise<{
        success: boolean;
        config?: PrinterConfig;
        error?: string;
      }>;
      savePrinterConfig: (config: PrinterConfig) => Promise<{
        success: boolean;
        error?: string;
      }>;
      printReceipt: (ticket: TicketContent) => Promise<{
        success: boolean;
        error?: string;
      }>;
      printTest: () => Promise<{
        success: boolean;
        error?: string;
        message?: string;
      }>;
    };
    
    zoomAPI: {
      /**
       * Obtiene el nivel de zoom actual guardado
       */
      getZoomLevel: () => Promise<number>;
      
      /**
       * Establece un nivel de zoom específico
       * @param zoomLevel Nivel de zoom (-3 a 3, donde 0 es 100%)
       */
      setZoomLevel: (zoomLevel: number) => Promise<number>;
      
      /**
       * Aumenta el zoom en 0.5 niveles
       */
      zoomIn: () => Promise<number>;
      
      /**
       * Disminuye el zoom en 0.5 niveles
       */
      zoomOut: () => Promise<number>;
      
      /**
       * Resetea el zoom al 100% (nivel 0)
       */
      resetZoom: () => Promise<number>;
    };

    electronAPI: {
      checkForUpdates: () => Promise<any>;
      startUpdateDownload: () => Promise<{ success: boolean; error?: string }>;
      installUpdate: () => void;
      onUpdateAvailable: (callback: (info: UpdateInfo) => void) => void;
      onDownloadProgress: (callback: (progress: DownloadProgress) => void) => void;
      onUpdateDownloaded: (callback: (info: UpdateInfo) => void) => void;
    };
  }
}

interface PrinterConfig {
  width: string;
  margin: string;
  printerName: string;
  preview: boolean;
  silent: boolean;
  copies: number;
  timeOutPerLine: number;
}

interface TicketContent {
  header?: string;
  lines: string[];
  qr?: string;
  barcode?: string;
  total?: string;
  footer?: string;
  htmlContent?: any[];
}

interface UpdateInfo {
  version: string;
  releaseDate: string;
  releaseName?: string;
  releaseNotes?: string;
}

interface DownloadProgress {
  bytesPerSecond: number;
  percent: number;
  transferred: number;
  total: number;
}

export {}; 