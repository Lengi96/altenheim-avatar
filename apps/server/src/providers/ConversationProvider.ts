export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface ResidentContext {
  name: string;
  language: string;
  avatarName: string;
  preferences: Record<string, unknown>;
  todaySchedule: Array<{ title: string; time: string }>;
}

export interface ConversationProvider {
  stream(messages: Message[], context: ResidentContext): AsyncIterable<string>;
}
