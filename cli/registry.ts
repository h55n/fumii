import fetch from 'node-fetch';
import { homedir } from 'os';
import { join } from 'path';
import { existsSync, mkdirSync, writeFileSync } from 'fs';

const REGISTRY_BASE = 'https://codex-pets.net/api/pets';
export const PETS_DIR = join(homedir(), '.fumii', 'pets');

export type RegistryPet = {
  name: string;
  slug: string;
  spritesheet_url: string;
  pet_json_url: string;
};

export async function fetchPetManifest(slug: string): Promise<RegistryPet> {
  const res = await fetch(`${REGISTRY_BASE}/${slug}`);
  if (!res.ok) throw new Error(`pet "${slug}" not found in registry`);
  return (await res.json()) as RegistryPet;
}

export async function fetchAllPets(): Promise<RegistryPet[]> {
  const res = await fetch(REGISTRY_BASE);
  if (!res.ok) throw new Error('could not reach codex-pets.net registry');
  return (await res.json()) as RegistryPet[];
}

export async function downloadPet(manifest: RegistryPet) {
  const dir = join(PETS_DIR, manifest.slug);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  const [sheetRes, jsonRes] = await Promise.all([
    fetch(manifest.spritesheet_url),
    fetch(manifest.pet_json_url)
  ]);
  if (!sheetRes.ok || !jsonRes.ok) throw new Error('failed to download pet assets');

  const sheetBuffer = Buffer.from(await sheetRes.arrayBuffer());
  writeFileSync(join(dir, 'spritesheet.webp'), sheetBuffer);
  writeFileSync(join(dir, 'pet.json'), JSON.stringify(await jsonRes.json(), null, 2));
  writeFileSync(
    join(dir, '.fumii_meta.json'),
    JSON.stringify({ installed_at: new Date().toISOString(), source: 'codex-pets.net' }, null, 2)
  );
}
