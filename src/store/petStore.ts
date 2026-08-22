import { create } from 'zustand';

export type PetTheme = {
  bodyBg: string;
  bodyBorder: string;
  eyeColor: string;
  eyeGlow: string;
  earColor: string;
  accentColor: string;
  shape?: string;
};

export type Pet = {
  slug: string;
  name: string;
  category?: string;
  description?: string;
  author?: string;
  tags?: string[];
  theme?: PetTheme;
  spritesheetPath?: string;
  isDefault?: boolean;
};

export type CodexPet = {
  id: string;
  displayName: string;
  description?: string;
  kind?: string;
  tags?: string[];
  spritesheetUrl?: string;
  posterUrl?: string;
  previewUrl?: string;
  shareImageUrl?: string;
  downloadUrl?: string;
  likeCount?: number;
  viewCount?: number;
  commentCount?: number;
  likedByMe?: boolean;
};

interface PetState {
  pets: Pet[];
  registry: Pet[];
  activePet: Pet | null;
  loading: boolean;
  // Live Codex Library State
  libraryPets: CodexPet[];
  libraryTotal: number;
  libraryPage: number;
  libraryPageSize: number;
  libraryTotalPages: number;
  libraryLoading: boolean;
  libraryQuery: string;
  librarySort: string;
  libraryTag: string;

  load: () => Promise<void>;
  setActive: (slug: string) => Promise<void>;
  fetchLibrary: (params?: { page?: number; pageSize?: number; q?: string; tag?: string; sort?: string }) => Promise<void>;
  downloadPet: (petOrId: any) => Promise<void>;
  installPet: (pet: Partial<Pet>) => Promise<void>;
  installCustomPet: (slugOrUrl: string) => Promise<void>;
  removePet: (slug: string) => Promise<void>;
}

export const usePetStore = create<PetState>((set, get) => ({
  pets: [],
  registry: [],
  activePet: null,
  loading: false,

  libraryPets: [],
  libraryTotal: 3036,
  libraryPage: 1,
  libraryPageSize: 30,
  libraryTotalPages: 102,
  libraryLoading: false,
  libraryQuery: '',
  librarySort: 'new',
  libraryTag: '',

  load: async () => {
    try {
      set({ loading: true });
      if (!window?.fumii?.getInstalledPets) {
        set({ loading: false });
        return;
      }
      const [installed, registry, activePet] = await Promise.all([
        window.fumii.getInstalledPets?.()?.catch?.(() => []) ?? [],
        window.fumii.getPetRegistry?.()?.catch?.(() => []) ?? [],
        window.fumii.getActivePet?.()?.catch?.(() => null) ?? null
      ]);
      set({
        pets: Array.isArray(installed) ? installed : [],
        registry: Array.isArray(registry) ? registry : [],
        activePet: activePet || null,
        loading: false
      });
    } catch (e) {
      console.warn('[petStore] load error:', e);
      set({ loading: false });
    }
  },

  fetchLibrary: async (params = {}) => {
    try {
      set({ libraryLoading: true });
      const current = get();
      const page = params.page ?? current.libraryPage;
      const pageSize = params.pageSize ?? current.libraryPageSize;
      const q = params.q !== undefined ? params.q : current.libraryQuery;
      const tag = params.tag !== undefined ? params.tag : current.libraryTag;
      const sort = params.sort ?? current.librarySort;

      if (window?.fumii?.fetchCodexLibrary) {
        const data = await window.fumii.fetchCodexLibrary({ page, pageSize, q, tag, sort });
        if (data && Array.isArray(data.pets)) {
          set({
            libraryPets: data.pets,
            libraryTotal: data.total || 3036,
            libraryPage: data.page || page,
            libraryPageSize: data.pageSize || pageSize,
            libraryTotalPages: data.totalPages || Math.ceil((data.total || 3036) / pageSize),
            libraryQuery: q,
            libraryTag: tag,
            librarySort: sort,
            libraryLoading: false
          });
          return;
        }
      }

      // Fallback via browser fetch if IPC fails
      const url = `https://codex-pets.net/api/pets?page=${page}&pageSize=${pageSize}${q ? `&q=${encodeURIComponent(q)}` : ''}${tag ? `&tag=${encodeURIComponent(tag)}` : ''}&sort=${sort}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data && Array.isArray(data.pets)) {
        set({
          libraryPets: data.pets,
          libraryTotal: data.total || 3036,
          libraryPage: data.page || page,
          libraryPageSize: data.pageSize || pageSize,
          libraryTotalPages: data.totalPages || 102,
          libraryQuery: q,
          libraryTag: tag,
          librarySort: sort,
          libraryLoading: false
        });
      }
    } catch (err) {
      console.warn('[petStore] fetchLibrary error:', err);
      set({ libraryLoading: false });
    }
  },

  downloadPet: async (petOrId: any) => {
    try {
      if (!window?.fumii?.downloadAndInstallPet) return;
      await window.fumii.downloadAndInstallPet(petOrId);
      await get().load();
    } catch (e) {
      console.warn('[petStore] downloadPet error:', e);
    }
  },

  setActive: async (slug) => {
    try {
      const match = get().pets.find((p) => p.slug === slug);
      if (match) set({ activePet: match });
      if (!window?.fumii?.setActivePet) return;
      await window.fumii.setActivePet(slug);
      await get().load();
    } catch (e) {
      console.warn('[petStore] setActive error:', e);
    }
  },
  installPet: async (pet) => {
    try {
      if (!window?.fumii?.installPet) return;
      await window.fumii.installPet(pet);
      await window.fumii?.setActivePet?.(pet.slug!);
      await get().load();
    } catch (e) {
      console.warn('[petStore] installPet error:', e);
    }
  },
  installCustomPet: async (slugOrUrl) => {
    try {
      if (window?.fumii?.downloadAndInstallPet) {
        await window.fumii.downloadAndInstallPet(slugOrUrl);
      } else if (window?.fumii?.installCustomPet) {
        const created = await window.fumii.installCustomPet(slugOrUrl);
        if (created?.slug) await window.fumii?.setActivePet?.(created.slug);
      }
      await get().load();
    } catch (e) {
      console.warn('[petStore] installCustomPet error:', e);
    }
  },
  removePet: async (slug) => {
    try {
      if (!window?.fumii?.removeInstalledPet) return;
      await window.fumii.removeInstalledPet(slug);
      await get().load();
    } catch (e) {
      console.warn('[petStore] removePet error:', e);
    }
  }
}));

