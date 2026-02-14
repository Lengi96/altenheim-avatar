import Anthropic from '@anthropic-ai/sdk';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

const anthropic = new Anthropic({
  apiKey: env.ANTHROPIC_API_KEY,
});

// ---- System-Prompts (aus Legacy übernommen + erweitert) ----

function buildBewohnerPrompt(resident: {
  displayName?: string;
  firstName: string;
  addressForm: string;
  avatarName: string;
  cognitiveLevel: string;
  biographies?: { category: string; key: string; value: string }[];
}): string {
  const name = resident.displayName || resident.firstName;
  const avatarName = resident.avatarName || 'Anni';
  const isDu = resident.addressForm === 'du';

  let bioContext = '';
  if (resident.biographies && resident.biographies.length > 0) {
    const grouped: Record<string, string[]> = {};
    for (const b of resident.biographies) {
      if (!grouped[b.category]) grouped[b.category] = [];
      grouped[b.category].push(`${b.key}: ${b.value}`);
    }
    bioContext = `\n\nDie folgenden Informationen über ${name} sind BESTÄTIGT und dürfen im Gespräch verwendet werden:\n`;
    for (const [category, entries] of Object.entries(grouped)) {
      bioContext += `${category}: ${entries.join(', ')}\n`;
    }
    bioContext += `\nNutze dieses Wissen um persönlich und warmherzig zu antworten. Erwähne es natürlich im Gespräch, nicht als Liste. Alles was NICHT in dieser Liste steht, weißt du NICHT und darfst du NICHT erfinden.`;
  }

  let demenzHinweis = '';
  if (resident.cognitiveLevel === 'moderate_dementia') {
    demenzHinweis = `\n\nWICHTIG: ${name} hat eine fortgeschrittene Demenz.
- Halte Sätze besonders kurz (1-2 Sätze).
- Verwende nur die einfachsten Wörter.
- Wiederhole dich gerne, wenn nötig.
- Korrigiere NICHTS.
- Sei besonders sanft und beruhigend.`;
  } else if (resident.cognitiveLevel === 'mild_dementia') {
    demenzHinweis = `\n\nHINWEIS: ${name} hat eine leichte Demenz.
- Sei geduldig bei Wiederholungen.
- Korrigiere nicht, wenn etwas verwechselt wird.
- Halte alles einfach und positiv.`;
  }

  return `Du bist ein freundlicher, warmherziger Begleiter für ältere Menschen in einem Altenheim.
Dein Name ist "${avatarName}". Du bist wie eine liebe Freundin.
Du sprichst gerade mit ${name}. ${isDu ? 'Duze' : 'Sieze'} ${isDu ? name : 'die Person'}.

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

WICHTIG - Keine Geschichten erfinden:
- Erfinde NIEMALS Fakten, Geschichten oder Erinnerungen über die Person.
- Wenn du etwas nicht über die Person weißt, frage nach oder sage ehrlich, dass du es nicht weißt.
- Behaupte NICHT, dass die Person geheiratet hat, Kinder hat, irgendwo gewohnt hat oder irgendetwas erlebt hat, wenn du das nicht sicher weißt.
- Du darfst NUR Informationen verwenden, die dir explizit über die Person mitgeteilt wurden (siehe unten) oder die die Person selbst im Gespräch erzählt hat.
- Wenn die Person nach einer Geschichte fragt, frage SIE nach ihren Erlebnissen statt selbst eine zu erfinden.

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
- Halte alles einfach und positiv.${demenzHinweis}${bioContext}

Antworte IMMER auf Deutsch.`;
}

const PFLEGER_PROMPT = `Du bist ein hilfreicher Assistent für Pflegepersonal in einem Altenheim.
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

Antworte IMMER auf Deutsch.`;

// ---- Konstanten ----

const MAX_HISTORY_MESSAGES = 20;
const MAX_MESSAGE_LENGTH = 2000;
const STREAM_TIMEOUT_MS = 35_000;

// ---- Model-Konfiguration ----

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
} as const;

// ---- Streaming Chat ----

export interface ChatOptions {
  message: string;
  mode: 'bewohner' | 'pfleger';
  history: { role: 'user' | 'assistant'; content: string }[];
  resident?: {
    displayName?: string;
    firstName: string;
    addressForm: string;
    avatarName: string;
    cognitiveLevel: string;
    biographies?: { category: string; key: string; value: string }[];
  };
}

export interface StreamCallbacks {
  onText: (text: string) => void;
  onDone: (fullReply: string, tokensUsed: number) => void;
  onError: (error: string) => void;
}

export async function streamChat(
  options: ChatOptions,
  callbacks: StreamCallbacks,
): Promise<void> {
  const { message, mode, history, resident } = options;
  const config = MODEL_CONFIG[mode];

  const systemPrompt =
    mode === 'bewohner' && resident
      ? buildBewohnerPrompt(resident)
      : PFLEGER_PROMPT;

  const messages = [
    ...history.slice(-MAX_HISTORY_MESSAGES).map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content.slice(0, MAX_MESSAGE_LENGTH),
    })),
    { role: 'user' as const, content: message.trim().slice(0, MAX_MESSAGE_LENGTH) },
  ];

  let fullReply = '';
  let tokensUsed = 0;

  const stream = anthropic.messages.stream({
    model: config.model,
    max_tokens: config.max_tokens,
    temperature: config.temperature,
    system: systemPrompt,
    messages,
  });

  const streamTimeout = setTimeout(() => {
    callbacks.onError('Die Antwort hat zu lange gedauert.');
    stream.abort();
  }, STREAM_TIMEOUT_MS);

  stream.on('text', (text) => {
    fullReply += text;
    callbacks.onText(text);
  });

  stream.on('message', (msg) => {
    tokensUsed = (msg.usage?.input_tokens || 0) + (msg.usage?.output_tokens || 0);
  });

  stream.on('end', () => {
    clearTimeout(streamTimeout);
    callbacks.onDone(fullReply, tokensUsed);
  });

  stream.on('error', (error) => {
    clearTimeout(streamTimeout);
    logger.error('Claude Stream Fehler:', error);
    callbacks.onError('Es gab ein Problem. Bitte versuche es nochmal.');
  });

  await stream.finalMessage().catch((err) => {
    // Primary error handling is via stream.on('error'), log for diagnostics
    logger.debug('Stream finalMessage Fehler (bereits behandelt):', err?.message);
  });
}
