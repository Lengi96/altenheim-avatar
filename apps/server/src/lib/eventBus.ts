import { Response } from 'express';

type ResidentId = string;

interface ReminderEvent {
  type: 'reminder';
  scheduleId: string;
  title: string;
  scheduleType: string;
}

class EventBus {
  private connections = new Map<ResidentId, Response>();

  register(residentId: ResidentId, res: Response): void {
    this.connections.set(residentId, res);
    res.on('close', () => this.connections.delete(residentId));
  }

  send(residentId: ResidentId, event: ReminderEvent): boolean {
    const res = this.connections.get(residentId);
    if (!res) return false;
    try {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
      return true;
    } catch {
      this.connections.delete(residentId);
      return false;
    }
  }

  isConnected(residentId: ResidentId): boolean {
    return this.connections.has(residentId);
  }
}

export const eventBus = new EventBus();
