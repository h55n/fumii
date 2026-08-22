import chalk from 'chalk';
import { existsSync, writeFileSync } from 'fs';
import { join } from 'path';
import { PETS_DIR } from '../registry.js';

export function use(slug: string) {
  const target = join(PETS_DIR, slug);
  if (slug !== 'fumii-default' && !existsSync(target)) {
    console.log(chalk.red(`"${slug}" isn't installed. run: npx fumii add ${slug}`));
    process.exit(1);
  }
  writeFileSync(join(PETS_DIR, '.active'), slug);
  console.log(chalk.green(`now using ${slug}`));
  console.log(chalk.dim('fumii will hot-swap the sprite if the app is running.'));
}
