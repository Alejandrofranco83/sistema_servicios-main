import { Request, Response } from 'express';
import { getRepository } from 'typeorm';
import { User } from '../models/User';
import { compare } from 'bcryptjs';
import { sign } from 'jsonwebtoken';

export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    const userRepository = getRepository(User);

    const user = await userRepository.findOne({ 
      where: { username: username.toUpperCase() }
    });

    if (!user) {
      return res.status(401).json({ message: 'Usuario no encontrado' });
    }

    const isValidPassword = await compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ message: 'Contraseña incorrecta' });
    }

    const token = sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1d' }
    );

    return res.json({
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        branchId: user.branchId,
      },
      token,
    });
  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
}; 