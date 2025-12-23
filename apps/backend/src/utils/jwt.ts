// backend/src/utils/jwt.ts

import jwt from 'jsonwebtoken';
import { IUsuario } from '../modules/usuarios/Usuario';
import config from '@/config/env';

const JWT_SECRET = config.jwt.secret;
const JWT_EXPIRES_IN = config.jwt.expiresIn;
const JWT_REFRESH_EXPIRES_IN = config.jwt.refreshExpiresIn;

export interface JWTPayload {
  userId: string;
  empresaId: string;
  email: string;
  rol: string;
}

// Generar Access Token
export const generateAccessToken = (user: IUsuario): string => {
  const payload: JWTPayload = {
    userId: String(user._id),
    empresaId: String(user.empresaId),
    email: user.email,
    rol: user.rol,
  };
 
  return jwt.sign(payload, JWT_SECRET, { 
    expiresIn: JWT_EXPIRES_IN 
  } as jwt.SignOptions);
};

// Generar Refresh Token
export const generateRefreshToken = (user: IUsuario): string => {
  const payload: JWTPayload = {
    userId: String(user._id),
    empresaId: String(user.empresaId),
    email: user.email,
    rol: user.rol,
  };
 
  return jwt.sign(payload, JWT_SECRET, { 
    expiresIn: JWT_REFRESH_EXPIRES_IN 
  } as jwt.SignOptions);
};

// Verificar Token
export const verifyToken = (token: string): JWTPayload => {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error: any) {
    console.error('❌ JWT verify error:', error.name, error.message);
    // Preservar el nombre del error para mejor diagnóstico
    if (error.name === 'TokenExpiredError') {
      throw new Error('jwt expired');
    }
    throw new Error(error.message || 'Token inválido o expirado');
  }
};