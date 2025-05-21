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
    }
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