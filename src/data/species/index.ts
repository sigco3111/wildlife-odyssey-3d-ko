/**
 * Species encyclopedia: typed access to the JSON catalog plus its verification
 * ledger. Biological text lives in JSON; nothing here is rendering-specific.
 */
import animals from './animals.json';
import plants from './plants.json';
import verification from './verification.json';

export const CATEGORIES = ['mammal', 'bird', 'fish', 'reptile', 'amphibian', 'insect', 'tree', 'flower', 'fern', 'plant'] as const;
export type Category = (typeof CATEGORIES)[number];
export const ANIMAL_CATEGORIES: readonly Category[] = ['mammal', 'bird', 'fish', 'reptile', 'amphibian', 'insect'];

export type VerificationState = 'verified' | 'unverified';

export interface SourceRef {
  label: string;
  url: string;
}

export interface Verification {
  /** Scientific name and classification checked against a cited source. */
  taxonomy: VerificationState;
  /** IUCN category checked against a cited source ('n/a' when no status is claimed). */
  conservation: VerificationState | 'n/a';
  sources: SourceRef[];
  note?: string;
}

export interface SpeciesRecord {
  id: string;
  category: Category;
  commonNameEn: string;
  commonNameVi: string;
  commonNameKo: string;
  scientificName: string;
  kingdom: string;
  phylum: string;
  className: string;
  order: string;
  family: string;
  genus: string;
  descriptionEn: string;
  descriptionVi: string;
  descriptionKo: string;
  habitats: string[];
  diet?: string[];
  dietVi?: string[];
  dietKo?: string[];
  lifespan?: string;
  lifespanVi?: string;
  lifespanKo?: string;
  size?: string;
  sizeVi?: string;
  sizeKo?: string;
  /** IUCN Red List category code (LC, NT, VU, EN, CR). Omitted when not claimed. */
  conservationStatus?: string;
  behaviorEn?: string;
  behaviorVi?: string;
  behaviorKo?: string;
  adaptationsEn?: string[];
  adaptationsVi?: string[];
  adaptationsKo?: string[];
  ecologicalRoleEn?: string;
  ecologicalRoleVi?: string;
  ecologicalRoleKo?: string;
  interestingFactsEn?: string[];
  interestingFactsVi?: string[];
  interestingFactsKo?: string[];
  /** Key of the procedural model. */
  model: string;
  modelAsset?: string;
  audioAsset?: string;
  thumbnailAsset?: string;
  verification: Verification;
}

type RawRecord = Omit<SpeciesRecord, 'verification'>;
const ledger = verification as Record<string, Verification | undefined>;

const UNVERIFIED: Verification = {
  taxonomy: 'unverified',
  conservation: 'unverified',
  sources: [],
  note: 'Compiled from general reference knowledge; not yet checked against a cited source.',
};

export const SPECIES: readonly SpeciesRecord[] = ([...animals, ...plants] as RawRecord[]).map((r) => ({
  ...r,
  verification: ledger[r.id] ?? UNVERIFIED,
}));

const byId = new Map<string, SpeciesRecord>(SPECIES.map((s) => [s.id, s]));

export function getSpecies(id: string): SpeciesRecord | undefined {
  return byId.get(id);
}

export function requireSpecies(id: string): SpeciesRecord {
  const s = byId.get(id);
  if (!s) throw new Error(`Unknown species id "${id}"`);
  return s;
}

export const isAnimal = (s: SpeciesRecord): boolean => ANIMAL_CATEGORIES.includes(s.category);

export function speciesByCategory(cat: Category): SpeciesRecord[] {
  return SPECIES.filter((s) => s.category === cat);
}

export function searchSpecies(query: string): SpeciesRecord[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...SPECIES];
  return SPECIES.filter((s) =>
    [s.commonNameEn, s.commonNameVi, s.commonNameKo, s.scientificName, s.family, s.order].some((v) => v.toLowerCase().includes(q)),
  );
}

const IUCN = new Set(['LC', 'NT', 'VU', 'EN', 'CR', 'DD']);
const BINOMIAL = /^[A-Z][a-z]+ [a-z]+$/;

/** Returns a list of schema problems (empty when the record is valid). */
export function validateSpecies(s: SpeciesRecord): string[] {
  const errors: string[] = [];
  const need = (key: keyof SpeciesRecord): void => {
    const v = s[key];
    if (typeof v !== 'string' || v.trim() === '') errors.push(`${s.id}: missing ${String(key)}`);
  };
  (['id', 'commonNameEn', 'commonNameVi', 'commonNameKo', 'scientificName', 'kingdom', 'phylum', 'className', 'order', 'family', 'genus', 'descriptionEn', 'descriptionVi', 'descriptionKo', 'model'] as const).forEach(need);
  if (!CATEGORIES.includes(s.category)) errors.push(`${s.id}: bad category`);
  if (!BINOMIAL.test(s.scientificName)) errors.push(`${s.id}: scientificName is not a binomial`);
  if (s.scientificName.split(' ')[0] !== s.genus) errors.push(`${s.id}: genus does not match scientificName`);
  if (s.habitats.length === 0) errors.push(`${s.id}: no habitats`);
  if (s.conservationStatus && !IUCN.has(s.conservationStatus)) errors.push(`${s.id}: unknown IUCN code`);
  const pairs: [keyof SpeciesRecord, keyof SpeciesRecord][] = [
    ['adaptationsEn', 'adaptationsVi'],
    ['interestingFactsEn', 'interestingFactsVi'],
    ['diet', 'dietVi'],
    ['adaptationsEn', 'adaptationsKo'],
    ['interestingFactsEn', 'interestingFactsKo'],
    ['diet', 'dietKo'],
  ];
  for (const [a, b] of pairs) {
    const x = s[a] as string[] | undefined;
    const y = s[b] as string[] | undefined;
    if ((x?.length ?? 0) !== (y?.length ?? 0)) errors.push(`${s.id}: ${String(a)} / ${String(b)} length mismatch`);
  }
  if (Boolean(s.behaviorEn) !== Boolean(s.behaviorVi)) errors.push(`${s.id}: behaviour missing a language`);
  if (s.verification.taxonomy === 'verified' && s.verification.sources.length === 0) errors.push(`${s.id}: verified without a source`);
  return errors;
}

export type Lang = 'en' | 'vi' | 'ko';

/** Localised field helpers so UI code never branches on language itself. */
const pick = <T>(l: Lang, en: T, vi: T, ko: T): T => (l === 'ko' ? ko : l === 'vi' ? vi : en);

export const speciesText = {
  name: (s: SpeciesRecord, l: Lang): string => pick(l, s.commonNameEn, s.commonNameVi, s.commonNameKo),
  /** The original-language name shown alongside the localised one (English for Korean players). */
  altName: (s: SpeciesRecord, l: Lang): string => pick(l, s.commonNameVi, s.commonNameEn, s.commonNameEn),
  description: (s: SpeciesRecord, l: Lang): string => pick(l, s.descriptionEn, s.descriptionVi, s.descriptionKo),
  behavior: (s: SpeciesRecord, l: Lang): string | undefined => pick(l, s.behaviorEn, s.behaviorVi, s.behaviorKo),
  role: (s: SpeciesRecord, l: Lang): string | undefined => pick(l, s.ecologicalRoleEn, s.ecologicalRoleVi, s.ecologicalRoleKo),
  adaptations: (s: SpeciesRecord, l: Lang): string[] => pick(l, s.adaptationsEn, s.adaptationsVi, s.adaptationsKo) ?? [],
  facts: (s: SpeciesRecord, l: Lang): string[] => pick(l, s.interestingFactsEn, s.interestingFactsVi, s.interestingFactsKo) ?? [],
  diet: (s: SpeciesRecord, l: Lang): string[] => pick(l, s.diet, s.dietVi, s.dietKo) ?? [],
  size: (s: SpeciesRecord, l: Lang): string | undefined => pick(l, s.size, s.sizeVi, s.sizeKo),
  lifespan: (s: SpeciesRecord, l: Lang): string | undefined => pick(l, s.lifespan, s.lifespanVi, s.lifespanKo),
};
