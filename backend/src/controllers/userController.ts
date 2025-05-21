import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import * as bcrypt from 'bcryptjs';

const userRepository = AppDataSource.getRepository(User);

export const createInitialAdmin = async (_req: Request, res: Response): Promise<Response> => {
    try {
        // Verificar si ya existe un administrador
        const adminExists = await userRepository.findOne({
            where: { role: 'ADMIN' }
        });

        if (adminExists) {
            return res.status(400).json({ message: 'Ya existe un administrador en el sistema' });
        }

        // Crear el administrador
        const admin = new User();
        admin.username = 'admin';
        admin.password = await bcrypt.hash('admin123', 10);
        admin.fullName = 'Administrador del Sistema';
        admin.branchId = '001';
        admin.role = 'ADMIN';
        admin.isActive = true;

        await userRepository.save(admin);

        return res.status(201).json({
            message: 'Administrador creado exitosamente',
            username: admin.username
        });
    } catch (error) {
        console.error('Error al crear el administrador:', error);
        return res.status(500).json({ message: 'Error al crear el administrador' });
    }
}; 