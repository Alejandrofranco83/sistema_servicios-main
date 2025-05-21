import 'reflect-metadata';
import express from 'express';
import { createConnection } from 'typeorm';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { dbConfig } from './config/database';
import { login } from './controllers/authController';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());

// Endpoint de salud para verificar si el servidor está en línea
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
});

// Rutas
app.post('/api/auth/login', login);

// Conexión a la base de datos
createConnection(dbConfig)
  .then(() => {
    console.log('Conectado a la base de datos');
  })
  .catch((error) => {
    console.log('Error al conectar a la base de datos:', error);
  });

// Puerto
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
}); 