import '../config/env.js'; // Lädt .env aus Monorepo-Root
import bcrypt from 'bcrypt';
import { db, pool } from './index.js';
import { facilities, users, residents, biographies } from './schema.js';

async function seed() {
  console.log('Starte Seed-Daten...');

  // ---- Einrichtung anlegen ----
  const [facility] = await db
    .insert(facilities)
    .values({
      name: 'Seniorenresidenz Sonnenschein',
      slug: 'sonnenschein',
      address: 'Musterstraße 42, 80331 München',
      contactEmail: 'info@sonnenschein-heim.de',
      contactPhone: '+49 89 123456',
      plan: 'premium',
      maxResidents: 50,
    })
    .onConflictDoNothing()
    .returning();

  if (!facility) {
    console.log('Einrichtung existiert bereits. Seed wird übersprungen.');
    await pool.end();
    return;
  }

  console.log(`Einrichtung angelegt: ${facility.name} (${facility.slug})`);

  // ---- Admin-Benutzer ----
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const [admin] = await db
    .insert(users)
    .values({
      facilityId: facility.id,
      email: 'admin@sonnenschein-heim.de',
      passwordHash: adminPasswordHash,
      name: 'Maria Schmidt',
      role: 'admin',
    })
    .returning();

  console.log(`Admin angelegt: ${admin.email}`);

  // ---- Pfleger ----
  const pflegerPasswordHash = await bcrypt.hash('pfleger123', 10);
  const [pfleger] = await db
    .insert(users)
    .values({
      facilityId: facility.id,
      email: 'pfleger@sonnenschein-heim.de',
      passwordHash: pflegerPasswordHash,
      name: 'Thomas Müller',
      role: 'caregiver',
    })
    .returning();

  console.log(`Pfleger angelegt: ${pfleger.email}`);

  // ---- Bewohner 1: Gertrud ----
  const pin1Hash = await bcrypt.hash('1234', 10);
  const [gertrud] = await db
    .insert(residents)
    .values({
      facilityId: facility.id,
      firstName: 'Gertrud',
      displayName: 'Trudel',
      pin: pin1Hash,
      birthYear: 1938,
      gender: 'weiblich',
      addressForm: 'du',
      language: 'de',
      cognitiveLevel: 'mild_dementia',
      avatarName: 'Anni',
    })
    .returning();

  console.log(`Bewohnerin angelegt: ${gertrud.firstName} (PIN: 1234)`);

  // Biografie für Gertrud
  await db.insert(biographies).values([
    {
      residentId: gertrud.id,
      category: 'family',
      key: 'Ehemann',
      value: 'Heinrich, verstorben 2015. 52 Jahre verheiratet.',
      source: 'manual',
    },
    {
      residentId: gertrud.id,
      category: 'family',
      key: 'Kinder',
      value: 'Sohn Peter (63) lebt in Hamburg, Tochter Monika (60) lebt in München.',
      source: 'manual',
    },
    {
      residentId: gertrud.id,
      category: 'hobbies',
      key: 'Stricken',
      value: 'Hat ihr ganzes Leben lang gestrickt. Liebt es, Socken für die Enkel zu stricken.',
      source: 'manual',
    },
    {
      residentId: gertrud.id,
      category: 'hobbies',
      key: 'Volksmusik',
      value: 'Hört gerne Volksmusik, besonders "Kein schöner Land".',
      source: 'manual',
    },
    {
      residentId: gertrud.id,
      category: 'hometown',
      key: 'Geburtsort',
      value: 'Berchtesgaden, in den Bayerischen Alpen aufgewachsen.',
      source: 'manual',
    },
    {
      residentId: gertrud.id,
      category: 'memories',
      key: 'Schönstes Erlebnis',
      value: 'Die Hochzeit mit Heinrich im Juni 1963 in der kleinen Dorfkirche.',
      source: 'manual',
    },
    {
      residentId: gertrud.id,
      category: 'preferences',
      key: 'Lieblingsessen',
      value: 'Kaiserschmarrn und Apfelstrudel.',
      source: 'manual',
    },
  ]);

  console.log('Biografie-Daten für Gertrud angelegt.');

  // ---- Bewohner 2: Walter ----
  const pin2Hash = await bcrypt.hash('5678', 10);
  const [walter] = await db
    .insert(residents)
    .values({
      facilityId: facility.id,
      firstName: 'Walter',
      pin: pin2Hash,
      birthYear: 1941,
      gender: 'männlich',
      addressForm: 'sie',
      language: 'de',
      cognitiveLevel: 'normal',
      avatarName: 'Anni',
    })
    .returning();

  console.log(`Bewohner angelegt: ${walter.firstName} (PIN: 5678)`);

  await db.insert(biographies).values([
    {
      residentId: walter.id,
      category: 'career',
      key: 'Beruf',
      value: 'War 40 Jahre lang Schreinermeister mit eigener Werkstatt.',
      source: 'manual',
    },
    {
      residentId: walter.id,
      category: 'hobbies',
      key: 'Schach',
      value: 'Leidenschaftlicher Schachspieler, war im Schachverein.',
      source: 'manual',
    },
    {
      residentId: walter.id,
      category: 'preferences',
      key: 'Lieblingsessen',
      value: 'Schweinebraten mit Knödel und Blaukraut.',
      source: 'manual',
    },
  ]);

  console.log('Biografie-Daten für Walter angelegt.');

  // ---- Bewohner 3: Helga (fortgeschrittene Demenz) ----
  const pin3Hash = await bcrypt.hash('9999', 10);
  const [helga] = await db
    .insert(residents)
    .values({
      facilityId: facility.id,
      firstName: 'Helga',
      displayName: 'Helga',
      pin: pin3Hash,
      birthYear: 1935,
      gender: 'weiblich',
      addressForm: 'du',
      language: 'de',
      cognitiveLevel: 'moderate_dementia',
      avatarName: 'Anni',
    })
    .returning();

  console.log(`Bewohnerin angelegt: ${helga.firstName} (PIN: 9999)`);

  await db.insert(biographies).values([
    {
      residentId: helga.id,
      category: 'family',
      key: 'Tochter',
      value: 'Renate, kommt jeden Sonntag zu Besuch.',
      source: 'manual',
    },
    {
      residentId: helga.id,
      category: 'hobbies',
      key: 'Singen',
      value: 'Hat im Kirchenchor gesungen. Kennt viele alte Volkslieder auswendig.',
      source: 'manual',
    },
  ]);

  console.log('Biografie-Daten für Helga angelegt.');

  console.log('\nSeed abgeschlossen!');
  console.log('---------------------');
  console.log('Login-Daten:');
  console.log(`  Admin:   admin@sonnenschein-heim.de / admin123`);
  console.log(`  Pfleger: pfleger@sonnenschein-heim.de / pfleger123`);
  console.log(`  Bewohner Gertrud: Einrichtung "sonnenschein", PIN 1234`);
  console.log(`  Bewohner Walter:  Einrichtung "sonnenschein", PIN 5678`);
  console.log(`  Bewohner Helga:   Einrichtung "sonnenschein", PIN 9999`);

  await pool.end();
}

seed().catch((err) => {
  console.error('Seed-Fehler:', err);
  process.exit(1);
});
