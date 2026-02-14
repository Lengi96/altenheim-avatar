// dotenv v17 schreibt nicht mehr automatisch in process.env
const dotenvResult = require('dotenv').config();
if (dotenvResult.parsed) {
  for (const [key, val] of Object.entries(dotenvResult.parsed)) {
    process.env[key] = val;
  }
}
const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');

// Phase 2.4: Startup-Validierung
if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'your-api-key-here') {
  console.error('FEHLER: ANTHROPIC_API_KEY ist nicht gesetzt. Bitte .env Datei prüfen.');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Phase 2.3: Helmet Security-Header
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
    },
  },
}));

// Phase 7.3: Compression + Logging
app.use(compression());
app.use(morgan('short'));

// Phase 2.6: Body-Size-Limit
app.use(express.json({ limit: '10kb' }));
app.use(express.static('public', { maxAge: '1h' }));

// Phase 2.1: Rate-Limiting
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  message: { error: 'Zu viele Anfragen. Bitte warte einen Moment.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Phase 5: Verbesserte System-Prompts
const SYSTEM_PROMPTS = {
  bewohner: `Du bist ein freundlicher, warmherziger Begleiter für ältere Menschen in einem Altenheim.
Dein Name ist "Anni". Du bist wie eine liebe Freundin.

Wichtige Regeln für die Kommunikation:
- Sprich in SEHR einfachen, kurzen Sätzen. Maximal 2-3 Sätze pro Antwort.
- Verwende einfache, alltägliche Wörter. Keine Fachbegriffe.
- Sei warm, geduldig und liebevoll.
- Höre aufmerksam zu und zeige echtes Interesse.
- Stelle eine Frage zurück, damit das Gespräch weitergeht.
- Sprich über Themen wie: Familie, Erinnerungen, Wetter, Essen, Hobbys, Musik, Natur.
- Wenn jemand traurig ist, tröste sanft und zeige Verständnis.
- Verwende gelegentlich liebevolle Anreden wie "mein Lieber" oder "meine Liebe".
- Lache auch mal mit und sei fröhlich.
- Sei verständnisvoll bei Tippfehlern und versuche zu verstehen, was gemeint ist.

Sicherheitsregeln:
- Wenn jemand über Medikamente, Schmerzen oder Krankheiten spricht, sage freundlich: "Das ist wichtig. Bitte sprich mit einer Pflegerin oder einem Pfleger darüber. Die können dir am besten helfen."
- Wenn jemand sehr traurig ist oder sagt, dass er nicht mehr leben möchte, sage: "Ich höre dich und ich bin für dich da. Bitte sprich jetzt mit jemandem hier im Heim darüber. Du bist nicht allein."
- Gib KEINE medizinischen Ratschläge, Medikamenten-Informationen oder Diagnosen.
- Empfehle KEINE Behandlungen oder Therapien.

Umgang mit Verwirrtheit und Demenz:
- Wenn jemand verwirrt ist oder sich wiederholt, bleibe geduldig. Wiederhole dich gerne.
- Korrigiere NICHT, wenn jemand Dinge verwechselt oder vergisst.
- Wenn jemand nach verstorbenen Angehörigen fragt als wären sie noch da, spiele liebevoll mit und lenke sanft auf schöne Erinnerungen.
- Stelle keine Fragen, die Wissen erfordern (Datum, Uhrzeit, aktuelle Ereignisse).
- Halte alles einfach und positiv.

Antworte IMMER auf Deutsch.`,

  pfleger: `Du bist ein hilfreicher Assistent für Pflegepersonal in einem Altenheim.
Dein Name ist "Anni" (Pfleger-Modus).

Kommunikationsstil:
- Sprich professionell aber freundlich.
- Formatiere Zusammenfassungen als kurze Stichpunkte.
- Bei Pflegedokumentation nutze wenn möglich das Format: Bewohner | Beobachtung | Empfohlene Maßnahme.
- Antworte strukturiert und klar.

Aufgaben:
- Hilf beim Dokumentieren von Bedürfnissen und Beobachtungen der Bewohner.
- Fasse Informationen klar und strukturiert zusammen.
- Schlage bei Bedarf Pflegemaßnahmen oder Aktivitäten vor.
- Wenn ein Pfleger ein Problem beschreibt, hilf bei der Analyse und schlage Lösungen vor.
- Du kannst auch bei der Tagesplanung und Organisation helfen.
- Hilf bei der Formulierung von Übergabeberichten.

Wichtige Einschränkungen:
- Du bist KEIN medizinisches Fachsystem. Alle Vorschläge sind unverbindlich.
- Stelle KEINE Diagnosen und empfehle KEINE spezifischen Medikamente oder Dosierungen.
- Bei medizinischen Entscheidungen immer ärztlichen Rat empfehlen.
- Behandle alle Patientendaten vertraulich.

Antworte IMMER auf Deutsch.`
};

// Phase 5.4 + 5.5: Mode-abhängige KI-Konfiguration
const MODEL_CONFIG = {
  bewohner: {
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 200,
    temperature: 0.8,
  },
  pfleger: {
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 800,
    temperature: 0.3,
  },
};

// Phase 7.2: Health-Check Endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Streaming Chat-Endpunkt (Phase 7.1)
app.post('/api/chat', chatLimiter, async (req, res) => {
  try {
    const { message, mode, history } = req.body;

    // Phase 2.2: Input-Validierung
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Nachricht muss ein Text sein.' });
    }
    if (!mode || !['bewohner', 'pfleger'].includes(mode)) {
      return res.status(400).json({ error: 'Ungültiger Modus.' });
    }

    const trimmedMessage = message.trim().slice(0, 2000);
    if (!trimmedMessage) {
      return res.status(400).json({ error: 'Nachricht darf nicht leer sein.' });
    }

    const systemPrompt = SYSTEM_PROMPTS[mode];
    const config = MODEL_CONFIG[mode];

    // History validieren und aufbauen
    const messages = [];
    if (history && Array.isArray(history)) {
      for (const msg of history.slice(-20)) {
        if (
          msg &&
          typeof msg.content === 'string' &&
          ['user', 'assistant'].includes(msg.role)
        ) {
          messages.push({
            role: msg.role,
            content: msg.content.slice(0, 2000),
          });
        }
      }
    }
    messages.push({ role: 'user', content: trimmedMessage });

    // SSE-Streaming-Antwort
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let fullReply = '';

    const stream = anthropic.messages.stream({
      model: config.model,
      max_tokens: config.max_tokens,
      temperature: config.temperature,
      system: systemPrompt,
      messages,
    });

    // Sicherheit: Falls der Stream sich aufhängt, nach 35s beenden
    const streamTimeout = setTimeout(() => {
      if (!res.writableEnded) {
        res.write(`data: ${JSON.stringify({ type: 'error', error: 'Die Antwort hat zu lange gedauert.' })}\n\n`);
        res.end();
      }
    }, 35000);

    stream.on('text', (text) => {
      fullReply += text;
      res.write(`data: ${JSON.stringify({ type: 'text', text })}\n\n`);
    });

    stream.on('end', () => {
      clearTimeout(streamTimeout);
      res.write(`data: ${JSON.stringify({ type: 'done', reply: fullReply })}\n\n`);
      res.end();
    });

    stream.on('error', (error) => {
      clearTimeout(streamTimeout);
      console.error('Claude Stream Fehler:', error);
      if (!res.writableEnded) {
        res.write(`data: ${JSON.stringify({ type: 'error', error: 'Es gab ein Problem. Bitte versuche es nochmal.' })}\n\n`);
        res.end();
      }
    });

  } catch (error) {
    console.error('Claude API Fehler:', error);

    // Differenzierte Fehlerbehandlung
    if (error.status === 429) {
      res.status(429).json({ error: 'Zu viele Anfragen. Bitte warte einen Moment.' });
    } else if (error.status === 401) {
      res.status(500).json({ error: 'API-Konfigurationsfehler.' });
    } else {
      res.status(500).json({
        error: 'Es tut mir leid, es gab ein Problem. Bitte versuche es nochmal.',
      });
    }
  }
});

// Graceful Shutdown
const server = app.listen(PORT, () => {
  console.log(`Altenheim Avatar läuft auf http://localhost:${PORT}`);
});

process.on('SIGTERM', () => {
  console.log('Server wird heruntergefahren...');
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('Server wird heruntergefahren...');
  server.close(() => process.exit(0));
});
