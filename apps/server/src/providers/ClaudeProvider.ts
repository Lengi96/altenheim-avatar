import Anthropic from '@anthropic-ai/sdk';
import { ConversationProvider, Message, ResidentContext } from './ConversationProvider';
import { env } from '../lib/env';

export class ClaudeProvider implements ConversationProvider {
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  }

  async *stream(messages: Message[], context: ResidentContext): AsyncIterable<string> {
    const systemPrompt = this.buildSystemPrompt(context);

    const stream = await this.client.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    });

    for await (const chunk of stream) {
      if (
        chunk.type === 'content_block_delta' &&
        chunk.delta.type === 'text_delta'
      ) {
        yield chunk.delta.text;
      }
    }
  }

  private buildSystemPrompt(ctx: ResidentContext): string {
    const lang = ctx.language === 'de' ? 'Deutsch' : 'English';
    const scheduleText =
      ctx.todaySchedule.length > 0
        ? ctx.todaySchedule.map(s => `- ${s.time}: ${s.title}`).join('\n')
        : 'Keine besonderen Termine heute.';

    return `Du bist ${ctx.avatarName}, ein freundlicher und einfühlsamer KI-Begleiter für ${ctx.name}, einen Bewohner eines Altenheims.
Sprich immer auf ${lang}. Sei warm, geduldig und unterstützend.
Halte deine Antworten kurz (2-3 Sätze), da ${ctx.name} ältere Person ist.
Bevorzugte Themen: ${JSON.stringify(ctx.preferences)}.

Heutiger Tagesplan von ${ctx.name}:
${scheduleText}

Wenn nach Notfällen oder medizinischen Problemen gefragt wird, empfiehl immer, das Pflegepersonal zu rufen.`;
  }
}
