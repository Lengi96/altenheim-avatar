export type SafetyAction = 'allow' | 'refuse' | 'escalate';

export type SafetyCategory =
  | 'medical'
  | 'emergency'
  | 'self_harm'
  | 'abuse'
  | 'severe_distress'
  | 'confusion';

export type SafetySeverity = 'low' | 'medium' | 'high' | 'critical';

export interface SafetySignal {
  category: SafetyCategory;
  severity: SafetySeverity;
  matchedPattern: string;
}

export interface SafetyDecision {
  action: SafetyAction;
  severity: SafetySeverity;
  signals: SafetySignal[];
  response: string | null;
}
