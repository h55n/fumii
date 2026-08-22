import chokidar from 'chokidar';
import { app } from 'electron';
import { join } from 'path';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'fs';

export type PetMetadata = {
  slug: string;
  name: string;
  category: 'companion' | 'animals' | 'cyber' | 'fantasy' | 'cute';
  description: string;
  author: string;
  tags: string[];
  theme: {
    bodyBg: string;
    bodyBorder: string;
    eyeColor: string;
    eyeGlow: string;
    earColor: string;
    accentColor: string;
    shape?: 'circle' | 'cat' | 'dog' | 'bunny' | 'dragon' | 'robot' | 'slime' | 'ghost' | 'panda' | 'fox' | 'axolotl' | 'penguin';
  };
};

export type Pet = {
  slug: string;
  name: string;
  category?: string;
  description?: string;
  author?: string;
  tags?: string[];
  theme?: PetMetadata['theme'];
  spritesheetPath: string;
  isDefault: boolean;
};

const DEFAULT_SLUG = 'fumii-default';

export const CODEX_PETS_REGISTRY: PetMetadata[] = [
  {
    slug: 'fumii-default',
    name: 'Fumii Original',
    category: 'companion',
    description: 'The iconic Fumii porcelain companion with electric cobalt blue eyes.',
    author: 'Fumii Team',
    tags: ['companion', 'porcelain', 'cobalt', 'minimal'],
    theme: {
      bodyBg: 'linear-gradient(145deg, #FFFFFF, #EDEDE5)',
      bodyBorder: 'rgba(37, 99, 235, 0.3)',
      eyeColor: '#2563EB',
      eyeGlow: 'rgba(37, 99, 235, 0.6)',
      earColor: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
      accentColor: '#2563EB',
      shape: 'circle'
    }
  },
  {
    slug: 'shiba-inu',
    name: 'Shiba Inu',
    category: 'animals',
    description: 'A loyal, cheerful Shiba Inu doge that wags its tail and barks happily.',
    author: 'codex-pets / kenji',
    tags: ['dog', 'shiba', 'loyal', 'warm'],
    theme: {
      bodyBg: 'linear-gradient(145deg, #FDE68A, #F59E0B)',
      bodyBorder: 'rgba(217, 119, 6, 0.4)',
      eyeColor: '#1E2022',
      eyeGlow: 'rgba(217, 119, 6, 0.4)',
      earColor: 'linear-gradient(135deg, #B45309, #78350F)',
      accentColor: '#D97706',
      shape: 'dog'
    }
  },
  {
    slug: 'neko-cat',
    name: 'Mochi Neko',
    category: 'animals',
    description: 'A playful Calico kitten with twitchy ears and soft purring animations.',
    author: 'codex-pets / yuki',
    tags: ['cat', 'calico', 'playful', 'kitten'],
    theme: {
      bodyBg: 'linear-gradient(145deg, #FFFFFF, #FEE2E2)',
      bodyBorder: 'rgba(244, 63, 94, 0.3)',
      eyeColor: '#10B981',
      eyeGlow: 'rgba(16, 185, 129, 0.5)',
      earColor: 'linear-gradient(135deg, #FB7185, #E11D48)',
      accentColor: '#F43F5E',
      shape: 'cat'
    }
  },
  {
    slug: 'cyber-bunny',
    name: 'Cyber Bunny',
    category: 'cyber',
    description: 'A neon-lit cyberpunk rabbit with glowing holographic ears and visor blinks.',
    author: 'codex-pets / neonpulse',
    tags: ['cyber', 'bunny', 'neon', 'futuristic'],
    theme: {
      bodyBg: 'linear-gradient(145deg, #1E1B4B, #0F172A)',
      bodyBorder: 'rgba(168, 85, 247, 0.6)',
      eyeColor: '#06B6D4',
      eyeGlow: 'rgba(6, 182, 212, 0.8)',
      earColor: 'linear-gradient(135deg, #A855F7, #EC4899)',
      accentColor: '#A855F7',
      shape: 'bunny'
    }
  },
  {
    slug: 'pixel-dragon',
    name: 'Ignis Dragon',
    category: 'fantasy',
    description: 'A pocket-sized emerald baby dragon that puffs tiny sparks of joy.',
    author: 'codex-pets / mythos',
    tags: ['dragon', 'emerald', 'fantasy', 'mythic'],
    theme: {
      bodyBg: 'linear-gradient(145deg, #064E3B, #022C22)',
      bodyBorder: 'rgba(16, 185, 129, 0.5)',
      eyeColor: '#FBBF24',
      eyeGlow: 'rgba(251, 191, 36, 0.8)',
      earColor: 'linear-gradient(135deg, #059669, #047857)',
      accentColor: '#10B981',
      shape: 'dragon'
    }
  },
  {
    slug: 'retro-bot',
    name: 'Beep-Boop Mech',
    category: 'cyber',
    description: 'A brass and aluminum vintage automaton with spinning antenna radar.',
    author: 'codex-pets / rustlab',
    tags: ['robot', 'mech', 'vintage', 'brass'],
    theme: {
      bodyBg: 'linear-gradient(145deg, #E2E8F0, #94A3B8)',
      bodyBorder: 'rgba(100, 116, 139, 0.4)',
      eyeColor: '#2563EB',
      eyeGlow: 'rgba(37, 99, 235, 0.8)',
      earColor: 'linear-gradient(135deg, #64748B, #475569)',
      accentColor: '#3B82F6',
      shape: 'robot'
    }
  },
  {
    slug: 'slime-blob',
    name: 'Bouncy Slime',
    category: 'cute',
    description: 'A cheerful, wobbly translucent slime that jiggles and bounces on hover.',
    author: 'codex-pets / jelliboy',
    tags: ['slime', 'bouncy', 'blob', 'jelly'],
    theme: {
      bodyBg: 'linear-gradient(145deg, #BAE6FD, #38BDF8)',
      bodyBorder: 'rgba(2, 132, 199, 0.5)',
      eyeColor: '#0369A1',
      eyeGlow: 'rgba(3, 105, 161, 0.6)',
      earColor: 'linear-gradient(135deg, #7DD3FC, #0284C7)',
      accentColor: '#0284C7',
      shape: 'slime'
    }
  },
  {
    slug: 'ghosty',
    name: 'Spooky Spirit',
    category: 'fantasy',
    description: 'A friendly floating ghost that leaves soft ambient glitter trails.',
    author: 'codex-pets / boo',
    tags: ['ghost', 'spirit', 'floating', 'cute'],
    theme: {
      bodyBg: 'linear-gradient(145deg, #F3E8FF, #E9D5FF)',
      bodyBorder: 'rgba(192, 132, 252, 0.4)',
      eyeColor: '#6B21A8',
      eyeGlow: 'rgba(107, 33, 168, 0.6)',
      earColor: 'linear-gradient(135deg, #D8B4FE, #C084FC)',
      accentColor: '#A855F7',
      shape: 'ghost'
    }
  },
  {
    slug: 'panda-bear',
    name: 'Bao Panda',
    category: 'animals',
    description: 'A relaxed, cuddly giant panda munching on bamboo shoots.',
    author: 'codex-pets / bamboo',
    tags: ['panda', 'bear', 'relaxed', 'chubby'],
    theme: {
      bodyBg: 'linear-gradient(145deg, #FFFFFF, #F1F5F9)',
      bodyBorder: 'rgba(15, 23, 42, 0.4)',
      eyeColor: '#0F172A',
      eyeGlow: 'rgba(15, 23, 42, 0.3)',
      earColor: 'linear-gradient(135deg, #1E293B, #0F172A)',
      accentColor: '#10B981',
      shape: 'panda'
    }
  },
  {
    slug: 'fox-kitsune',
    name: 'Kitsune Fox',
    category: 'fantasy',
    description: 'A mystical Japanese spirit fox with graceful fiery ear tufts.',
    author: 'codex-pets / inari',
    tags: ['fox', 'kitsune', 'spirit', 'mystic'],
    theme: {
      bodyBg: 'linear-gradient(145deg, #FFEDD5, #FB923C)',
      bodyBorder: 'rgba(234, 88, 12, 0.4)',
      eyeColor: '#9A3412',
      eyeGlow: 'rgba(154, 52, 18, 0.6)',
      earColor: 'linear-gradient(135deg, #EA580C, #C2410C)',
      accentColor: '#EA580C',
      shape: 'fox'
    }
  },
  {
    slug: 'axolotl-pink',
    name: 'Bubbles Axolotl',
    category: 'cute',
    description: 'A smiling pink aquatic salamander with frilly feathery gills.',
    author: 'codex-pets / marina',
    tags: ['axolotl', 'aquatic', 'pink', 'frilly'],
    theme: {
      bodyBg: 'linear-gradient(145deg, #FCE7F3, #F472B6)',
      bodyBorder: 'rgba(219, 39, 119, 0.4)',
      eyeColor: '#831843',
      eyeGlow: 'rgba(131, 24, 67, 0.5)',
      earColor: 'linear-gradient(135deg, #EC4899, #BE185D)',
      accentColor: '#DB2777',
      shape: 'axolotl'
    }
  },
  {
    slug: 'penguin-pingu',
    name: 'Pebble Penguin',
    category: 'animals',
    description: 'A waddling Antarctic penguin wearing an adorable tiny bowtie.',
    author: 'codex-pets / polaris',
    tags: ['penguin', 'arctic', 'bowtie', 'bird'],
    theme: {
      bodyBg: 'linear-gradient(145deg, #1E293B, #0F172A)',
      bodyBorder: 'rgba(56, 189, 248, 0.3)',
      eyeColor: '#38BDF8',
      eyeGlow: 'rgba(56, 189, 248, 0.7)',
      earColor: 'linear-gradient(135deg, #F59E0B, #D97706)',
      accentColor: '#38BDF8',
      shape: 'penguin'
    }
  }
];

export class PetManager {
  private petsDir: string;
  private watcher: chokidar.FSWatcher | null = null;
  private onUpdate: ((pets: Pet[]) => void) | null = null;

  constructor() {
    const base = app?.getPath ? app.getPath('userData') : '.';
    this.petsDir = join(base, 'pets');
    if (!existsSync(this.petsDir)) mkdirSync(this.petsDir, { recursive: true });
  }

  /** Copies the default pet metadata into ~/.fumii/pets if missing. */
  async ensureDefaultPet() {
    const defaultMeta = CODEX_PETS_REGISTRY.find((p) => p.slug === DEFAULT_SLUG) || CODEX_PETS_REGISTRY[0];
    this.install(defaultMeta);
  }

  getRegistry(): PetMetadata[] {
    return CODEX_PETS_REGISTRY;
  }

  async fetchCodexPets(params: {
    page?: number;
    pageSize?: number;
    q?: string;
    tag?: string;
    sort?: string;
  } = {}) {
    const page = params.page || 1;
    const pageSize = params.pageSize || 30;
    const q = params.q ? encodeURIComponent(params.q) : '';
    const tag = params.tag ? encodeURIComponent(params.tag) : '';
    const sort = params.sort || 'new';

    const url = `https://codex-pets.net/api/pets?page=${page}&pageSize=${pageSize}${q ? `&q=${q}` : ''}${tag ? `&tag=${tag}` : ''}&sort=${sort}`;

    try {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Failed to fetch codex pets (HTTP ${res.status})`);
      }
      const data = await res.json();
      if (Array.isArray(data.pets)) {
        data.pets = data.pets.map((p: any) => {
          const resolveUrl = (u?: string) => {
            if (!u) return null;
            if (u.startsWith('http')) return u;
            return `https://codex-pets.net${u.startsWith('/') ? '' : '/'}${u}`;
          };
          return {
            ...p,
            posterUrl: resolveUrl(p.posterUrl),
            previewUrl: resolveUrl(p.previewUrl),
            spritesheetUrl: resolveUrl(p.spritesheetUrl),
            shareImageUrl: resolveUrl(p.shareImageUrl)
          };
        });
      }
      return data;
    } catch (err: any) {
      console.error('[PetManager] fetchCodexPets error:', err);
      // Fallback response with offline/preset data
      return {
        page: 1,
        pageSize: 30,
        total: CODEX_PETS_REGISTRY.length,
        totalPages: 1,
        pets: CODEX_PETS_REGISTRY.map((p) => ({
          id: p.slug,
          displayName: p.name,
          description: p.description,
          tags: p.tags,
          kind: p.category,
          likeCount: 0,
          viewCount: 0,
          commentCount: 0
        }))
      };
    }
  }

  async downloadAndInstallPet(petIdentifierOrData: any): Promise<Pet> {
    let slug = '';
    let petData: any = null;

    if (typeof petIdentifierOrData === 'string') {
      let raw = petIdentifierOrData.trim();
      // Handle npx command syntax: npx fumii add <slug> OR npx codex-pets add <slug>
      const npxMatch = raw.match(/add\s+([a-zA-Z0-9_\-]+)/i);
      if (npxMatch) {
        raw = npxMatch[1];
      } else if (raw.includes('/pets/')) {
        const urlParts = raw.split('/pets/');
        raw = urlParts[urlParts.length - 1].split('?')[0].split('#')[0];
      } else if (raw.includes('/')) {
        const urlParts = raw.split('/');
        raw = urlParts[urlParts.length - 1].split('?')[0].split('#')[0];
      }

      slug = raw.toLowerCase().trim().replace(/[^a-z0-9-_]/g, '-');
      if (!slug) slug = `custom-pet-${Date.now()}`;

      // Fetch live metadata from codex-pets API
      try {
        const res = await fetch(`https://codex-pets.net/api/pets/${slug}`);
        if (res.ok) {
          const json = await res.json();
          petData = json.pet || json;
        }
      } catch (err) {
        console.warn(`[PetManager] Could not fetch remote pet metadata for ${slug}:`, err);
      }
    } else if (typeof petIdentifierOrData === 'object' && petIdentifierOrData !== null) {
      slug = (petIdentifierOrData.id || petIdentifierOrData.slug || '').toLowerCase().trim();
      petData = petIdentifierOrData;
    }

    if (!slug) {
      throw new Error('Invalid pet identifier');
    }

    const target = join(this.petsDir, slug);
    if (!existsSync(target)) mkdirSync(target, { recursive: true });

    // Download spritesheet.webp if spritesheetUrl is present
    let spritesheetDownloaded = false;
    const spritesheetUrl = petData?.spritesheetUrl;

    if (spritesheetUrl) {
      try {
        const fullUrl = spritesheetUrl.startsWith('http')
          ? spritesheetUrl
          : `https://codex-pets.net${spritesheetUrl.startsWith('/') ? '' : '/'}${spritesheetUrl}`;
        const imgRes = await fetch(fullUrl);
        if (imgRes.ok) {
          const arrayBuffer = await imgRes.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          writeFileSync(join(target, 'spritesheet.webp'), buffer);
          spritesheetDownloaded = true;
        }
      } catch (dlErr) {
        console.warn(`[PetManager] Failed to download spritesheet image from ${spritesheetUrl}:`, dlErr);
      }
    }

    // If spritesheet not yet downloaded, try download endpoint
    if (!spritesheetDownloaded) {
      try {
        const dlRes = await fetch(`https://codex-pets.net/api/pets/${slug}/download`);
        if (dlRes.ok) {
          const arrayBuffer = await dlRes.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          writeFileSync(join(target, 'package.zip'), buffer);
        }
      } catch {}
    }

    // Download preview/poster as well if available
    if (petData?.previewUrl) {
      try {
        const pUrl = petData.previewUrl.startsWith('http')
          ? petData.previewUrl
          : `https://codex-pets.net${petData.previewUrl.startsWith('/') ? '' : '/'}${petData.previewUrl}`;
        const pRes = await fetch(pUrl);
        if (pRes.ok) {
          const buf = Buffer.from(await pRes.arrayBuffer());
          writeFileSync(join(target, 'preview.webp'), buf);
        }
      } catch {}
    }

    const name = petData?.displayName || petData?.name || slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    const meta = {
      id: slug,
      slug,
      name,
      displayName: name,
      description: petData?.description || `Codex pet ${slug}`,
      tags: petData?.tags || ['codex-pets'],
      kind: petData?.kind || 'companion',
      author: petData?.author || 'codex-pets',
      spritesheetPath: 'spritesheet.webp',
      spritesheetUrl: petData?.spritesheetUrl || null,
      posterUrl: petData?.posterUrl || null,
      previewUrl: petData?.previewUrl || null,
      shareImageUrl: petData?.shareImageUrl || null,
      spriteVersionNumber: petData?.spriteVersionNumber || 1
    };

    writeFileSync(join(target, 'pet.json'), JSON.stringify(meta, null, 2));

    this.setActive(slug);
    this.onUpdate?.(this.list());

    const activeList = this.list();
    return activeList.find((p) => p.slug === slug) || {
      slug,
      name,
      description: meta.description,
      tags: meta.tags,
      spritesheetPath: join(target, 'spritesheet.webp'),
      isDefault: slug === DEFAULT_SLUG
    };
  }

  install(petData: Partial<PetMetadata> & { slug: string; name?: string }) {
    const slug = petData.slug.toLowerCase().trim().replace(/[^a-z0-9-_]/g, '-');
    const target = join(this.petsDir, slug);
    if (!existsSync(target)) mkdirSync(target, { recursive: true });

    // Check if registry has preset
    const preset = CODEX_PETS_REGISTRY.find((p) => p.slug === slug);
    const meta: PetMetadata = {
      slug,
      name: petData.name || preset?.name || slug,
      category: (petData.category as any) || preset?.category || 'companion',
      description: petData.description || preset?.description || `Codex pet ${slug}`,
      author: petData.author || preset?.author || 'codex-pets',
      tags: petData.tags || preset?.tags || ['companion', slug],
      theme: petData.theme || preset?.theme || {
        bodyBg: 'linear-gradient(145deg, #FFFFFF, #EDEDE5)',
        bodyBorder: 'rgba(37, 99, 235, 0.3)',
        eyeColor: '#2563EB',
        eyeGlow: 'rgba(37, 99, 235, 0.6)',
        earColor: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
        accentColor: '#2563EB',
        shape: 'circle'
      }
    };

    writeFileSync(join(target, 'pet.json'), JSON.stringify(meta, null, 2));
    this.onUpdate?.(this.list());
    return meta;
  }

  installCustom(slugOrUrl: string) {
    return this.downloadAndInstallPet(slugOrUrl);
  }

  watch(onUpdate: (pets: Pet[]) => void) {
    this.onUpdate = onUpdate;
    this.watcher = chokidar.watch(this.petsDir, { depth: 1 }).on('all', () => {
      this.onUpdate?.(this.list());
    });
  }

  unwatch() {
    this.watcher?.close();
    this.watcher = null;
  }

  list(): Pet[] {
    if (!existsSync(this.petsDir)) return [];
    return readdirSync(this.petsDir)
      .filter((slug) => existsSync(join(this.petsDir, slug, 'pet.json')))
      .map((slug) => {
        try {
          const meta = JSON.parse(readFileSync(join(this.petsDir, slug, 'pet.json'), 'utf-8'));
          const spriteFile = join(this.petsDir, slug, 'spritesheet.webp');
          let spritesheetDataUrl = '';
          if (existsSync(spriteFile)) {
            try {
              const buffer = readFileSync(spriteFile);
              if (buffer.length > 0) {
                spritesheetDataUrl = `data:image/webp;base64,${buffer.toString('base64')}`;
              }
            } catch {}
          }

          const previewFile = join(this.petsDir, slug, 'preview.webp');
          let previewDataUrl = '';
          if (existsSync(previewFile)) {
            try {
              const buffer = readFileSync(previewFile);
              if (buffer.length > 0) {
                previewDataUrl = `data:image/webp;base64,${buffer.toString('base64')}`;
              }
            } catch {}
          }

          return {
            slug,
            name: meta.displayName ?? meta.name ?? slug,
            category: meta.kind ?? meta.category,
            description: meta.description,
            author: meta.author,
            tags: meta.tags,
            theme: meta.theme,
            posterUrl: meta.posterUrl,
            previewUrl: previewDataUrl || meta.previewUrl,
            spritesheetUrl: meta.spritesheetUrl,
            spritesheetPath: spritesheetDataUrl || spriteFile,
            isDefault: slug === DEFAULT_SLUG
          };
        } catch {
          return {
            slug,
            name: slug,
            spritesheetPath: join(this.petsDir, slug, 'spritesheet.webp'),
            isDefault: slug === DEFAULT_SLUG
          };
        }
      });
  }

  getActiveSlug(): string {
    const marker = join(this.petsDir, '.active');
    if (existsSync(marker)) {
      try {
        const content = readFileSync(marker, 'utf-8').trim().toLowerCase();
        if (content && existsSync(join(this.petsDir, content))) return content;
      } catch {}
    }
    return DEFAULT_SLUG;
  }

  getActive(): Pet {
    const slug = this.getActiveSlug();
    const list = this.list();
    const match = list.find((p) => p.slug.toLowerCase() === slug.toLowerCase());
    if (match) return match;
    const defaultMatch = list.find((p) => p.slug === DEFAULT_SLUG);
    if (defaultMatch) return defaultMatch;
    return list[0];
  }

  setActive(slug: string): Pet {
    const normalized = slug.trim().toLowerCase();
    writeFileSync(join(this.petsDir, '.active'), normalized);
    const active = this.getActive();
    this.onUpdate?.(this.list());
    return active;
  }

  remove(slug: string) {
    if (slug === DEFAULT_SLUG) return; // fumii-default cannot be removed
    const target = join(this.petsDir, slug);
    if (existsSync(target)) rmSync(target, { recursive: true, force: true });
    if (this.getActiveSlug() === slug) this.setActive(DEFAULT_SLUG);
    this.onUpdate?.(this.list());
  }
}

