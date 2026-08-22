import chalk from 'chalk';
import { existsSync, rmSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { PETS_DIR } from '../registry.js';

export function remove(slug: string) {
  if (slug === 'fumii-default') {
    console.log(chalk.red('fumii-default cannot be removed.'));
    return;
  }
  const target = join(PETS_DIR, slug);
  if (!existsSync(target)) {
    console.log(chalk.dim(`"${slug}" isn't installed.`));
    return;
  }
  rmSync(target, { recursive: true, force: true });

  const activeMarker = join(PETS_DIR, '.active');
  if (existsSync(activeMarker) && readFileSync(activeMarker, 'utf-8').trim() === slug) {
    writeFileSync(activeMarker, 'fumii-default');
  }
  console.log(chalk.green(`${slug} removed`));
}
