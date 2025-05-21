import { Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const login = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { username, password } = req.body;

        console.log('Buscando usuario:', username);

        // Buscar todos los usuarios para depuración
        try {
            const allUsers = await prisma.usuario.findMany();
            console.log(`Total usuarios encontrados: ${allUsers.length}`);
            for (const user of allUsers) {
                console.log(`- Usuario: ${user.username}, ID: ${user.id}`);
            }
        } catch (error) {
            console.error('Error al listar usuarios:', error);
        }

        // Buscar el usuario con sus permisos usando Prisma directamente
        try {
            const usuario = await prisma.usuario.findFirst({
                where: {
                    username: {
                        equals: username.toUpperCase(),
                        mode: 'insensitive'
                    }
                },
                include: {
                    persona: true,
                    rol: {
                        include: {
                            permisos: true
                        }
                    }
                }
            });

            if (!usuario) {
                console.log('Usuario no encontrado');
                return res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
            }

            console.log('Usuario encontrado:', usuario.username);

            // Verificar la contraseña
            // Por ahora compararemos directamente porque en el sistema inicial las contraseñas no están hasheadas
            if (password !== usuario.password) {
                console.log('Contraseña incorrecta');
                return res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
            }

            console.log('Contraseña correcta');

            // Generar el token JWT
            const token = jwt.sign(
                { 
                    id: usuario.id,
                    username: usuario.username,
                    rolId: usuario.rolId
                },
                process.env.JWT_SECRET || 'tu_secreto_muy_seguro',
                { expiresIn: '24h' }
            );

            // Enviar respuesta sin la contraseña
            const { password: _, ...usuarioSinPassword } = usuario;

            return res.json({
                token,
                user: usuarioSinPassword
            });
        } catch (error) {
            console.error('Error al buscar usuario:', error);
            return res.status(500).json({ message: 'Error al iniciar sesión' });
        }
    } catch (error) {
        console.error('Error general en login:', error);
        return res.status(500).json({ message: 'Error al iniciar sesión' });
    }
};

export const cambiarPassword = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { username, oldPassword, newPassword } = req.body;

        if (!username || !oldPassword || !newPassword) {
            return res.status(400).json({ message: 'Todos los campos son obligatorios' });
        }

        // Buscar el usuario con Prisma
        const usuario = await prisma.usuario.findFirst({
            where: {
                username: {
                    equals: username.toUpperCase(),
                    mode: 'insensitive'
                }
            }
        });

        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Verificar la contraseña actual
        if (oldPassword !== usuario.password) {
            return res.status(401).json({ message: 'Contraseña actual incorrecta' });
        }

        // Actualizar la contraseña
        await prisma.usuario.update({
            where: { id: usuario.id },
            data: { password: newPassword }
        });

        return res.json({ message: 'Contraseña actualizada con éxito' });
    } catch (error) {
        console.error('Error al cambiar contraseña:', error);
        return res.status(500).json({ message: 'Error al cambiar la contraseña' });
    }
}; 