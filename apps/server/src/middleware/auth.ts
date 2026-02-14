import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export interface JwtPayload {
  // Staff login
  userId?: string;
  // Resident login
  residentId?: string;
  // Both
  facilityId: string;
  role: 'admin' | 'caregiver' | 'family' | 'resident';
}

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      auth?: JwtPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Nicht authentifiziert.' });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.auth = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Ungültiger oder abgelaufener Token.' });
  }
}

export function requireRole(...roles: JwtPayload['role'][]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.auth) {
      res.status(401).json({ error: 'Nicht authentifiziert.' });
      return;
    }
    if (!roles.includes(req.auth.role)) {
      res.status(403).json({ error: 'Keine Berechtigung für diese Aktion.' });
      return;
    }
    next();
  };
}

export function signToken(payload: JwtPayload, expiresIn: string = '8h'): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn } as jwt.SignOptions);
}
