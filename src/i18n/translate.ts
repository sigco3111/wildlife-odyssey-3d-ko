/** Pure translation helpers (no React, no store) so any module can use them. */
import type { Lang } from '../data/species';
import { en, type TextKey } from './en';
import { vi } from './vi';
import { ko } from './ko';

export type { TextKey } from './en';
export type Params = Record<string, string | number>;

export const DICTIONARIES: Record<Lang, Record<TextKey, string>> = { en, vi, ko };
export const LANGUAGES: { id: Lang; label: string }[] = [
  { id: 'ko', label: '한국어' },
  { id: 'vi', label: 'Tiếng Việt' },
  { id: 'en', label: 'English' },
];

export function translate(lang: Lang, key: TextKey, params?: Params): string {
  let text: string = DICTIONARIES[lang][key] ?? en[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) text = text.split(`{${k}}`).join(String(v));
  }
  return text;
}

/** Type guard for dynamically built keys such as `biome.${id}`. */
export function isTextKey(key: string): key is TextKey {
  return key in en;
}

/** Translate a dynamically built key, falling back to the raw key if it is missing. */
export function translateDynamic(lang: Lang, key: string, params?: Params): string {
  return isTextKey(key) ? translate(lang, key, params) : key;
}

export function formatDate(ts: number, lang: Lang): string {
  try {
    return new Intl.DateTimeFormat(lang === 'ko' ? 'ko-KR' : lang === 'vi' ? 'vi-VN' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(ts));
  } catch {
    return new Date(ts).toISOString();
  }
}

/** Eight-point compass direction key for a heading vector (x east, z south). */
export function directionKey(dx: number, dz: number): TextKey {
  const deg = ((Math.atan2(dx, -dz) * 180) / Math.PI + 360) % 360;
  const names = ['dir.n', 'dir.ne', 'dir.e', 'dir.se', 'dir.s', 'dir.sw', 'dir.w', 'dir.nw'] as const;
  return names[Math.round(deg / 45) % 8]!;
}
