import { minutos } from './dates';

export function periodo(hora: string): { icone: string; nome: string } {
  const h = Math.floor(minutos(hora) / 60);
  if (h < 5) return { icone: '✦', nome: 'Madrugada' };
  if (h < 12) return { icone: '🌅', nome: 'Manhã' };
  if (h < 18) return { icone: '☀️', nome: 'Tarde' };
  return { icone: '🌙', nome: 'Noite' };
}

export function horaDe(iso: string): string {
  return iso.slice(11, 16);
}

export function plural(n: number, um: string, varios: string): string {
  return n === 1 ? um : varios;
}
