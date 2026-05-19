export function g(id: string): HTMLElement | null {
  return document.getElementById(id);
}

export function gInput(id: string): HTMLInputElement | null {
  return document.getElementById(id) as HTMLInputElement | null;
}

export function gSelect(id: string): HTMLSelectElement | null {
  return document.getElementById(id) as HTMLSelectElement | null;
}
