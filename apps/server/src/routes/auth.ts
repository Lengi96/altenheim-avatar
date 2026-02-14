import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users, residents, facilities } from '../db/schema.js';
import { signToken } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

// ---- Staff Login (E-Mail + Passwort) ----
const loginSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse.'),
  password: z.string().min(1, 'Passwort ist erforderlich.'),
});

router.post('/login', validate(loginSchema), async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const [user] = await db
    .select()
    .from(users)
    .where(and(eq(users.email, email), eq(users.active, true)))
    .limit(1);

  if (!user) {
    res.status(401).json({ error: 'E-Mail oder Passwort falsch.' });
    return;
  }

  const passwordValid = await bcrypt.compare(password, user.passwordHash);
  if (!passwordValid) {
    res.status(401).json({ error: 'E-Mail oder Passwort falsch.' });
    return;
  }

  const token = signToken(
    {
      userId: user.id,
      facilityId: user.facilityId,
      role: user.role as 'admin' | 'caregiver' | 'family',
    },
    '8h'
  );

  res.json({
    token,
    user: {
      id: user.id,
      facilityId: user.facilityId,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  });
});

// ---- Resident Login (Facility-Slug + PIN) ----
const pinLoginSchema = z.object({
  facilitySlug: z.string().min(1, 'Einrichtung ist erforderlich.'),
  pin: z.string().regex(/^\d{4,6}$/, 'PIN muss 4-6 Ziffern haben.'),
});

function looksLikeBcryptHash(value: string): boolean {
  return /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(value);
}

router.post('/resident-login', validate(pinLoginSchema), async (req: Request, res: Response) => {
  const { facilitySlug, pin } = req.body;
  const normalizedSlug = facilitySlug.trim().toLowerCase();

  // Einrichtung finden
  const [facility] = await db
    .select()
    .from(facilities)
    .where(and(eq(facilities.slug, normalizedSlug), eq(facilities.active, true)))
    .limit(1);

  if (!facility) {
    res.status(401).json({ error: 'Einrichtung nicht gefunden.' });
    return;
  }

  // Alle aktiven Bewohner der Einrichtung prüfen
  const activeResidents = await db
    .select()
    .from(residents)
    .where(and(eq(residents.facilityId, facility.id), eq(residents.active, true)));

  let matchedResident = null;
  for (const resident of activeResidents) {
    if (!resident.pin) {
      continue;
    }

    if (!looksLikeBcryptHash(resident.pin)) {
      console.warn(
        `Resident ${resident.id} hat ungueltiges PIN-Hash-Format. Eintrag wird uebersprungen.`,
      );
      continue;
    }

    try {
      if (await bcrypt.compare(pin, resident.pin)) {
        matchedResident = resident;
        break;
      }
    } catch (error) {
      console.warn(
        `PIN-Hash konnte fuer Resident ${resident.id} nicht geprueft werden.`,
        error,
      );
    }
  }

  if (!matchedResident) {
    res.status(401).json({ error: 'PIN ist falsch.' });
    return;
  }

  const token = signToken(
    {
      residentId: matchedResident.id,
      facilityId: facility.id,
      role: 'resident',
    },
    '24h'
  );

  res.json({
    token,
    resident: {
      id: matchedResident.id,
      facilityId: facility.id,
      firstName: matchedResident.firstName,
      displayName: matchedResident.displayName || matchedResident.firstName,
      avatarName: matchedResident.avatarName,
      addressForm: matchedResident.addressForm,
      language: matchedResident.language,
      cognitiveLevel: matchedResident.cognitiveLevel,
    },
  });
});

export default router;
