import { Express } from 'express';

// Extiende la interfaz Request de Express para incluir la propiedad user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        username?: string;
        rolId?: number;
        rol?: {
          id: number;
          nombre: string;
        };
        [key: string]: any;
      };
    }
  }
}

export {}; 