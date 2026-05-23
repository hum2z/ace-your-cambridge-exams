import { randomUUID } from 'crypto';

type PdfEntry = {
  qp: Uint8Array;
  ms?: Uint8Array;
  timestamp: number;
};

class PdfStore {
  private store: Map<string, PdfEntry> = new Map();
  private ttlMs: number;
  private cleanupInterval: NodeJS.Timeout;

  constructor(ttlMinutes = 30) {
    this.ttlMs = ttlMinutes * 60 * 1000;
    // Periodic cleanup every minute
    this.cleanupInterval = setInterval(() => this.purgeOld(), 60_000);
  }

  add(entry: { qp: Uint8Array; ms?: Uint8Array }): string {
    const id = randomUUID();
    this.store.set(id, { ...entry, timestamp: Date.now() });
    return id;
  }

  get(id: string): PdfEntry | undefined {
    const entry = this.store.get(id);
    if (entry && Date.now() - entry.timestamp < this.ttlMs) {
      return entry;
    }
    // expired or missing
    this.store.delete(id);
    return undefined;
  }

  purgeOld() {
    const now = Date.now();
    for (const [id, entry] of this.store.entries()) {
      if (now - entry.timestamp > this.ttlMs) {
        this.store.delete(id);
      }
    }
  }

  // Ensure cleanup on process exit
  dispose() {
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }
}

// Export a singleton instance
export const pdfStore = new PdfStore();
