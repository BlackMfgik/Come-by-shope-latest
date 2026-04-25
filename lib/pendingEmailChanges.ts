interface PendingChange {
  userId: number;
  newEmail: string;
  code: string;
  expiresAt: number;
}

const globalStore = globalThis as typeof globalThis & {
  _emailChangePending?: Map<number, PendingChange>;
};

if (!globalStore._emailChangePending) {
  globalStore._emailChangePending = new Map();
}

export const pendingEmailChanges = globalStore._emailChangePending;
export type { PendingChange };
