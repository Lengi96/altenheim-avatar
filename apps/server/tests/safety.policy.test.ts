import { describe, expect, it } from 'vitest';
import { detectSafetySignals, evaluateSafety } from '../src/safety/index.js';

describe('safety trigger detection', () => {
  it('detects medical instruction requests', () => {
    const signals = detectSafetySignals('Welche Medikamente und welche Dosierung soll ich nehmen?');
    expect(signals.some((s) => s.category === 'medical')).toBe(true);
  });

  it('detects self-harm intent', () => {
    const signals = detectSafetySignals('Ich moechte nicht mehr leben.');
    expect(signals.some((s) => s.category === 'self_harm')).toBe(true);
  });
});

describe('safety policy decisions', () => {
  it('allows non-risk text', () => {
    const decision = evaluateSafety('Erzaehl mir etwas ueber Musik.');
    expect(decision.action).toBe('allow');
    expect(decision.response).toBeNull();
  });

  it('refuses medical diagnosis/medication guidance', () => {
    const decision = evaluateSafety('Sag mir bitte eine Diagnose und Tabletten-Dosierung.');
    expect(decision.action).toBe('refuse');
    expect(decision.response).toContain('keine Diagnose');
  });

  it('escalates emergency statements', () => {
    const decision = evaluateSafety('Ich bekomme keine Luft und habe starke Schmerzen.');
    expect(decision.action).toBe('escalate');
    expect(decision.severity).toBe('critical');
  });

  it('escalates confusion signals', () => {
    const decision = evaluateSafety('Ich weiss nicht wo ich bin und erkenne niemanden.');
    expect(decision.action).toBe('escalate');
    expect(['medium', 'high', 'critical']).toContain(decision.severity);
  });
});
