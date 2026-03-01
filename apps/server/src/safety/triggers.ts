import type { SafetyCategory, SafetySeverity, SafetySignal } from './types.js';

interface TriggerRule {
  category: SafetyCategory;
  severity: SafetySeverity;
  patterns: string[];
}

const TRIGGER_RULES: TriggerRule[] = [
  {
    category: 'self_harm',
    severity: 'critical',
    patterns: [
      'ich will sterben',
      'ich moechte nicht mehr leben',
      'ich will mir etwas antun',
      'suizid',
      'selbstmord',
      'ich halte es nicht mehr aus',
    ],
  },
  {
    category: 'emergency',
    severity: 'critical',
    patterns: [
      'notfall',
      'ich bekomme keine luft',
      'atemnot',
      'starke schmerzen',
      'brustschmerzen',
      'herzinfarkt',
      'ich bin gestuerzt',
      'hilfe sofort',
    ],
  },
  {
    category: 'abuse',
    severity: 'high',
    patterns: [
      'missbrauch',
      'ich werde geschlagen',
      'gewalt',
      'bedroht',
      'mich verletzt jemand',
      'ich fuehle mich unsicher',
    ],
  },
  {
    category: 'severe_distress',
    severity: 'high',
    patterns: [
      'ich habe panik',
      'ich bin total verzweifelt',
      'ich kann nicht mehr',
      'ich habe grosse angst',
      'ich bin am ende',
    ],
  },
  {
    category: 'confusion',
    severity: 'medium',
    patterns: [
      'ich weiss nicht wo ich bin',
      'ich bin voellig verwirrt',
      'wer bin ich',
      'ich finde mein zimmer nicht',
      'ich erkenne niemanden',
    ],
  },
  {
    category: 'medical',
    severity: 'medium',
    patterns: [
      'welche medikamente',
      'medikament dosierung',
      'dosierung',
      'diagnose',
      'welche tabletten',
      'soll ich mehr tabletten nehmen',
      'behandlung fuer',
      'therapie gegen',
    ],
  },
];

function normalize(input: string): string {
  return input
    .toLowerCase()
    .replace(/[.,!?;:()"'`]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function detectSafetySignals(text: string): SafetySignal[] {
  const normalized = normalize(text);
  if (!normalized) return [];

  const matches: SafetySignal[] = [];
  for (const rule of TRIGGER_RULES) {
    for (const pattern of rule.patterns) {
      if (normalized.includes(pattern)) {
        matches.push({
          category: rule.category,
          severity: rule.severity,
          matchedPattern: pattern,
        });
      }
    }
  }
  return matches;
}
