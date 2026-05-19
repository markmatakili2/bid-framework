import type * as consent from './consent';
import type * as assessment from './assessment';
import type * as modals from './modals';

type AppApi = typeof consent & typeof assessment & typeof modals & { print: () => void };

declare global {
  interface Window extends AppApi {}
}

export {};
