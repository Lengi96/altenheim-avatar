import type { SafetyDecision, SafetySeverity } from './types.js';
import { detectSafetySignals } from './triggers.js';

const ESCALATION_RESPONSE =
  'Das klingt nach einer Situation, bei der sofort Pflegepersonal helfen sollte. Bitte sage einer Pflegekraft direkt Bescheid oder nutze den Hilfe-Knopf.';

const MEDICAL_REFUSAL_RESPONSE =
  'Ich kann keine Diagnose stellen und keine Medikamente oder Dosierungen empfehlen. Bitte sprich dazu direkt mit Pflegepersonal oder aerztlichem Fachpersonal.';

function maxSeverity(current: SafetySeverity, next: SafetySeverity): SafetySeverity {
  const rank: Record<SafetySeverity, number> = {
    low: 0,
    medium: 1,
    high: 2,
    critical: 3,
  };
  return rank[next] > rank[current] ? next : current;
}

export function evaluateSafety(inputText: string): SafetyDecision {
  const signals = detectSafetySignals(inputText);

  if (signals.length === 0) {
    return {
      action: 'allow',
      severity: 'low',
      signals: [],
      response: null,
    };
  }

  let severity: SafetySeverity = 'low';
  for (const signal of signals) {
    severity = maxSeverity(severity, signal.severity);
  }

  const hasEscalationSignal = signals.some((signal) =>
    ['emergency', 'self_harm', 'abuse', 'severe_distress', 'confusion'].includes(signal.category),
  );

  if (hasEscalationSignal) {
    return {
      action: 'escalate',
      severity,
      signals,
      response: ESCALATION_RESPONSE,
    };
  }

  return {
    action: 'refuse',
    severity,
    signals,
    response: MEDICAL_REFUSAL_RESPONSE,
  };
}
