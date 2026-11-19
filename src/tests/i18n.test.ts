import { describe, expect, it } from 'vitest';
import { BIOME_IDS } from '../data/biomes/biomes';
import { SPECIES, CATEGORIES } from '../data/species';
import { anatomyNotes } from '../data/species/anatomy';
import { BEHAVIORS } from '../entities/wildlife/types';
import { en } from '../i18n/en';
import { directionKey, isTextKey, translate, translateDynamic } from '../i18n/translate';
import { vi } from '../i18n/vi';
import { ko } from '../i18n/ko';
import { INTERACTABLES } from '../world/structures/structures';
import { LANDMARKS } from '../world/terrain/layout';

const placeholders = (s: string): string[] => (s.match(/\{[a-z]+\}/g) ?? []).sort();

describe('localisation', () => {
  it('has identical key sets in Vietnamese and English', () => {
    expect(Object.keys(vi).sort()).toEqual(Object.keys(en).sort());
  });

  it('has identical key sets in Korean and English', () => {
    expect(Object.keys(ko).sort()).toEqual(Object.keys(en).sort());
  });

  it('has no empty strings and matching placeholders', () => {
    for (const key of Object.keys(en) as (keyof typeof en)[]) {
      expect(en[key].trim(), key).not.toBe('');
      expect(vi[key].trim(), key).not.toBe('');
      expect(placeholders(vi[key]), key).toEqual(placeholders(en[key]));
      expect(ko[key].trim(), key).not.toBe('');
      expect(placeholders(ko[key]), key).toEqual(placeholders(en[key]));
    }
  });

  it('actually translates the interface (Vietnamese differs from English)', () => {
    const keys = Object.keys(en) as (keyof typeof en)[];
    const same = keys.filter((k) => en[k] === vi[k]);
    // Only proper nouns, units and format strings may be identical.
    expect(same.length / keys.length).toBeLessThan(0.06);
  });

  it('interpolates parameters', () => {
    expect(translate('en', 'hud.waypoint', { n: 42 })).toBe('Waypoint 42 m');
    expect(translate('vi', 'journal.discovered', { n: 3, total: 36 })).toBe('Đã khám phá 3 trên 36 loài');
    expect(translate('ko', 'journal.discovered', { n: 3, total: 36 })).toBe('36종 중 3종 발견');
  });

  it('covers every dynamically built key', () => {
    for (const b of BIOME_IDS) expect(isTextKey(`biome.${b}`), b).toBe(true);
    for (const c of CATEGORIES) expect(isTextKey(`category.${c}`), c).toBe(true);
    for (const b of BEHAVIORS) expect(isTextKey(`behavior.${b}`), b).toBe(true);
    for (const l of LANDMARKS) expect(isTextKey(`landmark.${l.id}`), l.id).toBe(true);
    for (const r of ['poor', 'fair', 'good', 'excellent']) expect(isTextKey(`rating.${r}`)).toBe(true);
    for (const t of ['none', 'camera', 'video', 'binoculars', 'scanner', 'macro']) expect(isTextKey(`tool.${t}`)).toBe(true);
    for (const s of ['LC', 'NT', 'VU', 'EN', 'CR', 'DD']) expect(isTextKey(`iucn.${s}`)).toBe(true);
    for (const it of INTERACTABLES) {
      expect(isTextKey(it.title), it.id).toBe(true);
      expect(isTextKey(it.body), it.id).toBe(true);
    }
  });

  it('falls back to the raw key for unknown dynamic keys', () => {
    expect(translateDynamic('en', 'biome.moon')).toBe('biome.moon');
  });

  it('names compass directions (x east, z south)', () => {
    expect(directionKey(0, -1)).toBe('dir.n');
    expect(directionKey(1, 0)).toBe('dir.e');
    expect(directionKey(0, 1)).toBe('dir.s');
    expect(directionKey(-1, 1)).toBe('dir.sw');
  });

  it('has four translated anatomy notes for every species, matched to its group', () => {
    for (const sp of SPECIES) {
      const notes = anatomyNotes(sp);
      expect(notes, sp.id).toHaveLength(4);
      for (const n of notes) {
        expect(isTextKey(n.part), `${sp.id} ${n.part}`).toBe(true);
        expect(isTextKey(n.note), `${sp.id} ${n.note}`).toBe(true);
      }
    }
    // Ferns must not be described as flowering plants, nor animals as plants.
    expect(anatomyNotes(SPECIES.find((x) => x.id === 'asplenium-nidus')!)[1]!.note).toBe('inspect.note.fern.reproduction');
    expect(anatomyNotes(SPECIES.find((x) => x.id === 'rusa-unicolor')!)[0]!.note).toBe('inspect.note.mammal.head');
  });
});
