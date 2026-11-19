/**
 * Application and gameplay state (Zustand). Holds everything the UI renders and
 * everything that is saved. High-frequency simulation state lives in `runtime`.
 */
import { create } from 'zustand';
import { PHOTO, SAVE_VERSION, SETTINGS_KEY, type QualityLevel } from '../config';
import { QUESTS, type GameEvent } from '../data/quests/quests';
import { ANIMAL_CATEGORIES, getSpecies, speciesText, type Lang } from '../data/species';
import { translate, type Params, type TextKey } from '../i18n/translate';
import type { PhotoScore } from '../systems/photography/quality';
import type { DiscoveryRecord, PhotoMeta, ResearchRole, SaveData, VideoMeta } from '../systems/persistence/save';
import { applyEvent, initialQuestState, type QuestState } from '../systems/quests/engine';
import { runtime, type WeatherState } from './runtime';

export type Screen = 'loading' | 'menu' | 'role' | 'playing';
export type Overlay = 'none' | 'pause' | 'journal' | 'map' | 'inventory' | 'settings' | 'inspect' | 'video' | 'guide' | 'credits' | 'complete' | 'reader' | 'wheel';
export type Tool = 'none' | 'camera' | 'video' | 'binoculars' | 'scanner' | 'macro';
export type JournalTab = 'encyclopedia' | 'album' | 'videos' | 'map' | 'progress' | 'notes';
export type ViewMode = 'first' | 'third';
export type NoticeKind = 'info' | 'discovery' | 'quest' | 'warn';

export interface Settings {
  language: Lang;
  quality: QualityLevel;
  renderScale: number;
  shadows: 'off' | 'low' | 'high';
  vegetation: number;
  drawDistance: QualityLevel;
  adaptive: boolean;
  showPerf: boolean;
  master: number;
  music: number;
  effects: number;
  sensitivity: number;
  invertY: boolean;
  /** Real minutes per in-game day; 0 pauses the clock. */
  dayMinutes: number;
}

export const DEFAULT_SETTINGS: Settings = {
  language: 'ko',
  quality: 'medium',
  renderScale: 1,
  shadows: 'low',
  vegetation: 0.85,
  drawDistance: 'medium',
  adaptive: true,
  showPerf: false,
  master: 0.8,
  music: 0.5,
  effects: 0.8,
  sensitivity: 1,
  invertY: false,
  dayMinutes: 24,
};

/** Graphics presets applied when the overall quality level changes. */
export const QUALITY_PRESETS: Record<QualityLevel, Pick<Settings, 'renderScale' | 'shadows' | 'vegetation' | 'drawDistance'>> = {
  low: { renderScale: 0.75, shadows: 'off', vegetation: 0.5, drawDistance: 'low' },
  medium: { renderScale: 1, shadows: 'low', vegetation: 0.85, drawDistance: 'medium' },
  high: { renderScale: 1, shadows: 'high', vegetation: 1, drawDistance: 'high' },
};

export function loadSettings(): Settings {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(SETTINGS_KEY) : null;
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<Settings>;
    const merged = { ...DEFAULT_SETTINGS, ...parsed };
    if (merged.language !== 'vi' && merged.language !== 'en' && merged.language !== 'ko') merged.language = DEFAULT_SETTINGS.language;
    if (!(merged.quality in QUALITY_PRESETS)) merged.quality = DEFAULT_SETTINGS.quality;
    if (!(merged.drawDistance in QUALITY_PRESETS)) merged.drawDistance = DEFAULT_SETTINGS.drawDistance;
    return merged;
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function persistSettings(s: Settings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch {
    /* settings simply will not persist */
  }
}

export interface Notice {
  id: number;
  text: string;
  kind: NoticeKind;
  until: number;
}

export interface PendingVideo {
  blob: Blob;
  url: string;
  mime: string;
  seconds: number;
  speciesId: string | null;
  behaviors: string[];
  simScale: number;
}

export interface ReaderContent {
  title: TextKey;
  body: TextKey;
}

export interface InspectTarget {
  speciesId: string;
  behavior?: string;
}

export interface LastShot {
  score: PhotoScore | null;
  speciesId: string | null;
  at: number;
}

interface Progress {
  role: ResearchRole;
  discovered: Record<string, DiscoveryRecord>;
  quest: QuestState;
  photos: PhotoMeta[];
  videos: VideoMeta[];
  visitedBiomes: string[];
  explored: number[];
  landmarks: string[];
  notes: string[];
  artifacts: string[];
  badges: string[];
  behaviorsRecorded: string[];
  feedingObserved: string[];
  waypoint: [number, number] | null;
  stats: { distance: number; playSeconds: number; scans: number };
  completionShown: boolean;
}

const freshProgress = (role: ResearchRole): Progress => ({
  role,
  discovered: {},
  quest: initialQuestState(),
  photos: [],
  videos: [],
  visitedBiomes: [],
  explored: [],
  landmarks: [],
  notes: [],
  artifacts: [],
  badges: [],
  behaviorsRecorded: [],
  feedingObserved: [],
  waypoint: null,
  stats: { distance: 0, playSeconds: 0, scans: 0 },
  completionShown: false,
});

export interface GameState extends Progress {
  screen: Screen;
  overlay: Overlay;
  tool: Tool;
  viewMode: ViewMode;
  settings: Settings;
  storagePersistent: boolean;
  savedAt: number | null;
  corruptSave: string | null;
  notices: Notice[];
  prompt: string | null;
  reader: ReaderContent | null;
  inspect: InspectTarget | null;
  pendingVideo: PendingVideo | null;
  journalTab: JournalTab;
  journalSpecies: string | null;
  mapFocus: [number, number] | null;
  hudHidden: boolean;
  photoRes: number;
  /** Index into GRID_MODES: which composition guide the viewfinder shows. */
  grid: number;
  /** Index into APERTURES. */
  aperture: number;
  /** The species just recorded for the first time; drives the discovery card. */
  discoveryCard: { speciesId: string; method: 'scan' | 'photo'; at: number } | null;
  dof: boolean;
  slowmo: number;
  weatherMode: 'auto' | WeatherState;
  lastShot: LastShot | null;
  recording: boolean;
  /** Bumped whenever something worth saving happened. */
  dirty: number;

  setScreen: (s: Screen) => void;
  setOverlay: (o: Overlay) => void;
  setTool: (t: Tool) => void;
  toggleTool: (t: Tool) => void;
  setViewMode: (v: ViewMode) => void;
  setSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  setQuality: (q: QualityLevel) => void;
  notify: (key: TextKey, params?: Params, kind?: NoticeKind) => void;
  expireNotices: (now: number) => void;
  setPrompt: (p: string | null) => void;
  openReader: (r: ReaderContent) => void;
  openInspect: (t: InspectTarget) => void;
  openJournal: (tab?: JournalTab, speciesId?: string | null) => void;
  setJournalTab: (tab: JournalTab) => void;
  setJournalSpecies: (id: string | null) => void;
  emit: (event: GameEvent) => void;
  discover: (speciesId: string, method: 'scan' | 'photo', location: [number, number, number], biome: string) => boolean;
  markViewed: (speciesId: string) => void;
  recordPhoto: (meta: PhotoMeta, score: PhotoScore | null) => void;
  removePhoto: (id: string) => void;
  addVideo: (meta: VideoMeta) => void;
  removeVideo: (id: string) => void;
  recordBehavior: (speciesId: string, behavior: string, recorded: boolean) => void;
  visitBiome: (biome: string) => void;
  exploreCell: (index: number) => void;
  visitLandmark: (id: string) => boolean;
  revealLandmarks: (ids: string[]) => void;
  collectNote: (id: string) => boolean;
  collectArtifact: (id: string) => boolean;
  setWaypoint: (wp: [number, number] | null) => void;
  setPendingVideo: (v: PendingVideo | null) => void;
  setRecording: (r: boolean) => void;
  patch: (p: Partial<GameState>) => void;
  startNew: (role: ResearchRole) => void;
  applySave: (data: SaveData) => void;
  toSave: () => SaveData;
  resetAll: () => void;
}

let noticeId = 1;

export const useGame = create<GameState>((set, get) => ({
  ...freshProgress('biologist'),
  screen: 'loading',
  overlay: 'none',
  tool: 'none',
  viewMode: 'first',
  settings: loadSettings(),
  storagePersistent: true,
  savedAt: null,
  corruptSave: null,
  notices: [],
  prompt: null,
  reader: null,
  inspect: null,
  pendingVideo: null,
  journalTab: 'encyclopedia',
  journalSpecies: null,
  mapFocus: null,
  hudHidden: false,
  photoRes: 0,
  grid: 0,
  aperture: 1,
  discoveryCard: null,
  dof: true,
  slowmo: 0,
  weatherMode: 'auto',
  lastShot: null,
  recording: false,
  dirty: 0,

  setScreen: (screen) => set({ screen }),
  setOverlay: (overlay) => {
    const prev = get().overlay;
    if (prev === overlay) return;
    set({ overlay });
    if (overlay === 'journal') get().emit({ type: 'journal-open' });
  },
  setTool: (tool) => {
    if (get().tool === tool) return;
    set({ tool, hudHidden: false });
    if (tool !== 'none') get().emit({ type: 'tool', tool });
  },
  toggleTool: (tool) => get().setTool(get().tool === tool ? 'none' : tool),
  setViewMode: (viewMode) => set({ viewMode }),
  setSetting: (key, value) => {
    const settings = { ...get().settings, [key]: value };
    persistSettings(settings);
    set({ settings });
  },
  setQuality: (quality) => {
    const settings = { ...get().settings, quality, ...QUALITY_PRESETS[quality] };
    persistSettings(settings);
    set({ settings });
  },
  notify: (key, params, kind = 'info') => {
    const text = translate(get().settings.language, key, params);
    const notice: Notice = { id: noticeId++, text, kind, until: Date.now() + (kind === 'quest' ? 6500 : 4500) };
    set({ notices: [...get().notices.slice(-4), notice] });
  },
  expireNotices: (now) => {
    const notices = get().notices;
    if (notices.some((n) => n.until <= now)) set({ notices: notices.filter((n) => n.until > now) });
  },
  setPrompt: (prompt) => {
    if (get().prompt !== prompt) set({ prompt });
  },
  openReader: (reader) => set({ reader, overlay: 'reader' }),
  openInspect: (inspect) => set({ inspect, overlay: 'inspect' }),
  openJournal: (tab, speciesId) => {
    set({ journalTab: tab ?? get().journalTab, journalSpecies: speciesId === undefined ? get().journalSpecies : speciesId });
    get().setOverlay('journal');
    if (speciesId) get().markViewed(speciesId);
  },
  setJournalTab: (journalTab) => set({ journalTab }),
  setJournalSpecies: (id) => {
    set({ journalSpecies: id });
    if (id) get().markViewed(id);
  },

  emit: (event) => {
    const s = get();
    const update = applyEvent(s.quest, event);
    if (update.state === s.quest) return;
    set({ quest: update.state, dirty: s.dirty + 1 });
    const lang = s.settings.language;
    for (const done of update.completedObjectives) {
      const quest = QUESTS.find((q) => q.id === done.questId);
      const obj = quest?.objectives.find((o) => o.id === done.objectiveId);
      if (obj) get().notify('notify.objective', { name: translate(lang, obj.text) }, 'quest');
    }
    for (const id of update.completedQuests) {
      const quest = QUESTS.find((q) => q.id === id);
      if (!quest) continue;
      get().notify('notify.quest', { name: translate(lang, quest.title) }, 'quest');
      if (!get().badges.includes(quest.badge)) {
        set({ badges: [...get().badges, quest.badge] });
        get().notify('notify.badge', { name: translate(lang, quest.badgeName) }, 'quest');
      }
    }
    if (update.completedQuests.length > 0) {
      const next = QUESTS[update.state.activeIndex];
      if (next) get().notify('notify.questNext', { name: translate(lang, next.title) }, 'quest');
    }
    if (update.expeditionComplete && !get().completionShown) set({ overlay: 'complete', completionShown: true });
  },

  discover: (speciesId, method, location, biome) => {
    const s = get();
    const species = getSpecies(speciesId);
    if (!species) return false;
    const existing = s.discovered[speciesId];
    if (existing) {
      if (method === 'scan' && !existing.scanned) set({ discovered: { ...s.discovered, [speciesId]: { ...existing, scanned: true } }, dirty: s.dirty + 1 });
      return false;
    }
    const record: DiscoveryRecord = { speciesId, at: Date.now(), location, biome, method, scanned: method === 'scan', bestQuality: 0, behaviors: [], viewed: false };
    set({ discovered: { ...s.discovered, [speciesId]: record }, dirty: s.dirty + 1, discoveryCard: { speciesId, method, at: record.at } });
    get().notify('notify.discovered', { name: speciesText.name(species, s.settings.language) }, 'discovery');
    get().emit({
      type: 'discover',
      speciesId,
      category: species.category,
      group: ANIMAL_CATEGORIES.includes(species.category) ? 'animal' : 'plant',
      biome,
      forest: species.habitats.includes('rainforest'),
    });
    return true;
  },
  markViewed: (speciesId) => {
    const s = get();
    const rec = s.discovered[speciesId];
    if (!rec) return;
    if (!rec.viewed) set({ discovered: { ...s.discovered, [speciesId]: { ...rec, viewed: true } }, dirty: s.dirty + 1 });
    get().emit({ type: 'species-viewed', speciesId });
  },
  recordPhoto: (meta, score) => {
    const s = get();
    set({ photos: [...s.photos, meta], lastShot: { score, speciesId: meta.speciesId, at: Date.now() }, dirty: s.dirty + 1 });
    if (!meta.speciesId) return;
    const species = getSpecies(meta.speciesId);
    const rec = get().discovered[meta.speciesId];
    if (rec && species) {
      const unlocked = rec.bestQuality < PHOTO.highQuality && meta.quality >= PHOTO.highQuality;
      const behaviors = meta.observedBehavior && !rec.behaviors.includes(meta.observedBehavior) ? [...rec.behaviors, meta.observedBehavior] : rec.behaviors;
      set({ discovered: { ...get().discovered, [meta.speciesId]: { ...rec, bestQuality: Math.max(rec.bestQuality, meta.quality), behaviors } } });
      if (unlocked) get().notify('cam.unlocked', { name: speciesText.name(species, s.settings.language) }, 'discovery');
    }
    if (species) {
      get().emit({
        type: 'photo',
        speciesId: meta.speciesId,
        category: species.category,
        group: ANIMAL_CATEGORIES.includes(species.category) ? 'animal' : 'plant',
        quality: meta.quality,
        biome: meta.biome,
      });
    }
  },
  removePhoto: (id) => set({ photos: get().photos.filter((p) => p.id !== id), dirty: get().dirty + 1 }),
  addVideo: (meta) => set({ videos: [...get().videos, meta], dirty: get().dirty + 1 }),
  removeVideo: (id) => set({ videos: get().videos.filter((v) => v.id !== id), dirty: get().dirty + 1 }),
  recordBehavior: (speciesId, behavior, recorded) => {
    const s = get();
    const species = getSpecies(speciesId);
    if (!species) return;
    const feeding = behavior === 'feeding' || behavior === 'drinking';
    const key = `${speciesId}:${behavior}`;
    const rec = s.discovered[speciesId];
    if (rec && !rec.behaviors.includes(behavior)) set({ discovered: { ...s.discovered, [speciesId]: { ...rec, behaviors: [...rec.behaviors, behavior] } } });
    const name = rec ? speciesText.name(species, s.settings.language) : translate(s.settings.language, 'common.unknown');
    let fresh = false;
    if (recorded && !s.behaviorsRecorded.includes(key)) {
      set({ behaviorsRecorded: [...s.behaviorsRecorded, key] });
      get().notify('notify.behaviorRecorded', { name, behavior: translate(s.settings.language, `behavior.${behavior}` as TextKey) }, 'discovery');
      fresh = true;
    }
    if (!recorded && feeding && !s.feedingObserved.includes(speciesId)) {
      set({ feedingObserved: [...s.feedingObserved, speciesId] });
      get().notify('notify.feeding', { name }, 'discovery');
      fresh = true;
    }
    if (!fresh) return;
    set({ dirty: get().dirty + 1 });
    get().emit({ type: 'behavior', speciesId, category: species.category, behavior, feeding, recorded, key });
  },
  visitBiome: (biome) => {
    const s = get();
    if (!s.visitedBiomes.includes(biome)) set({ visitedBiomes: [...s.visitedBiomes, biome], dirty: s.dirty + 1 });
    get().emit({ type: 'biome', biome });
  },
  exploreCell: (index) => {
    const s = get();
    if (!s.explored.includes(index)) set({ explored: [...s.explored, index] });
  },
  visitLandmark: (id) => {
    const s = get();
    if (s.landmarks.includes(id)) return false;
    set({ landmarks: [...s.landmarks, id], dirty: s.dirty + 1 });
    get().emit({ type: 'landmark', id });
    return true;
  },
  revealLandmarks: (ids) => {
    const s = get();
    const add = ids.filter((id) => !s.landmarks.includes(id));
    if (add.length) set({ landmarks: [...s.landmarks, ...add], dirty: s.dirty + 1 });
  },
  collectNote: (id) => {
    const s = get();
    if (s.notes.includes(id)) return false;
    set({ notes: [...s.notes, id], dirty: s.dirty + 1 });
    return true;
  },
  collectArtifact: (id) => {
    const s = get();
    const fresh = !s.artifacts.includes(id);
    if (fresh) set({ artifacts: [...s.artifacts, id], dirty: s.dirty + 1 });
    get().emit({ type: 'artifact', id });
    return fresh;
  },
  setWaypoint: (waypoint) => set({ waypoint, dirty: get().dirty + 1 }),
  setPendingVideo: (pendingVideo) => {
    const prev = get().pendingVideo;
    if (prev && prev !== pendingVideo) URL.revokeObjectURL(prev.url);
    set({ pendingVideo, overlay: pendingVideo ? 'video' : get().overlay === 'video' ? 'none' : get().overlay });
  },
  setRecording: (recording) => set({ recording }),
  patch: (p) => set(p),

  startNew: (role) => {
    set({
      ...freshProgress(role),
      landmarks: role === 'archaeologist' ? ['ruins'] : [],
      screen: 'playing',
      overlay: 'none',
      tool: 'none',
      viewMode: 'first',
      notices: [],
      prompt: null,
      journalSpecies: null,
      journalTab: 'encyclopedia',
      slowmo: 0,
      lastShot: null,
      dirty: 1,
    });
  },
  applySave: (d) => {
    set({
      role: d.role,
      discovered: d.discovered,
      quest: d.quest,
      photos: d.photos,
      videos: d.videos,
      visitedBiomes: d.visitedBiomes,
      explored: d.explored,
      landmarks: d.landmarks,
      notes: d.notes,
      artifacts: d.artifacts,
      badges: d.badges,
      behaviorsRecorded: d.behaviorsRecorded,
      feedingObserved: d.feedingObserved,
      waypoint: d.waypoint,
      stats: d.stats,
      completionShown: d.completionShown,
      savedAt: d.savedAt,
      screen: 'playing',
      overlay: 'none',
      tool: 'none',
      notices: [],
      prompt: null,
      slowmo: 0,
    });
    runtime.player.pos.set(d.player.x, d.player.y, d.player.z);
    runtime.player.vel.set(0, 0, 0);
    runtime.player.yaw = d.player.yaw;
    runtime.player.pitch = d.player.pitch;
    runtime.player.distanceWalked = d.stats.distance;
    runtime.time.hour = d.hour;
    runtime.time.scale = 1;
  },
  toSave: () => {
    const s = get();
    const p = runtime.player;
    return {
      version: SAVE_VERSION,
      savedAt: Date.now(),
      role: s.role,
      player: { x: p.pos.x, y: p.pos.y, z: p.pos.z, yaw: p.yaw, pitch: p.pitch },
      hour: runtime.time.hour,
      discovered: s.discovered,
      quest: s.quest,
      photos: s.photos,
      videos: s.videos,
      visitedBiomes: s.visitedBiomes,
      explored: s.explored,
      landmarks: s.landmarks,
      notes: s.notes,
      artifacts: s.artifacts,
      badges: s.badges,
      behaviorsRecorded: s.behaviorsRecorded,
      feedingObserved: s.feedingObserved,
      waypoint: s.waypoint,
      stats: { ...s.stats, distance: runtime.player.distanceWalked },
      completionShown: s.completionShown,
    };
  },
  resetAll: () => set({ ...freshProgress('biologist'), savedAt: null, corruptSave: null, notices: [], dirty: 0 }),
}));

/** Derived counters for the progress page and quest text. */
export function progressSummary(s: GameState): {
  species: number;
  photos: number;
  hqPhotos: number;
  videos: number;
  tasks: number;
  biomes: number;
  behaviors: number;
} {
  let tasks = 0;
  for (const q of QUESTS) {
    for (const o of q.objectives) {
      if (o.kind === 'summary') continue;
      const p = s.quest.progress[q.id]?.[o.id];
      if (s.quest.completed.includes(q.id) || (p && p.count >= o.count)) tasks++;
    }
  }
  return {
    species: Object.keys(s.discovered).length,
    photos: s.photos.length,
    hqPhotos: s.photos.filter((p) => p.quality >= PHOTO.highQuality).length,
    videos: s.videos.length,
    tasks,
    biomes: s.visitedBiomes.length,
    behaviors: s.behaviorsRecorded.length,
  };
}
