import type { Answers } from './types';

export const appState = {
  current: 0,
  answers: {} as Answers,
};

export function resetState(): void {
  appState.current = 0;
  for (const key of Object.keys(appState.answers)) {
    delete appState.answers[key];
  }
}
