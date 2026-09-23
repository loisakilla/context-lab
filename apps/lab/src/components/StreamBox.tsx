'use client';

import { useSyncExternalStore } from 'react';

export interface TextStream {
  append(delta: string): void;
  clear(): void;
  subscribe(listener: () => void): () => void;
  read(): string;
}

export function createTextStream(): TextStream {
  let text = '';
  const listeners = new Set<() => void>();
  const notify = () => {
    for (const listener of listeners) listener();
  };
  return {
    append(delta) {
      text += delta;
      notify();
    },
    clear() {
      text = '';
      notify();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    read: () => text,
  };
}

export function StreamBox({ stream, placeholder }: { stream: TextStream; placeholder: string }) {
  const text = useSyncExternalStore(stream.subscribe, stream.read, stream.read);
  return <pre className="codebox max-h-[32rem] overflow-auto">{text || placeholder}</pre>;
}
