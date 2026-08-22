import chalk from 'chalk';
import { existsSync, readdirSync } from 'fs';
import { fetchAllPets, PETS_DIR } from '../registry.js';

export async function list(opts: { installed?: boolean }) {
  if (opts.installed) {
    if (!existsSync(PETS_DIR)) {
      console.log(chalk.dim('no pets installed yet.'));
      return;
    }
    const slugs = readdirSync(PETS_DIR);
    slugs.forEach((s) => console.log(`  ${s}`));
    return;
  }

  try {
    const pets = await fetchAllPets();
    pets.forEach((p) => console.log(`  ${chalk.bold(p.slug)} — ${p.name}`));
  } catch (err: any) {
    console.log(chalk.red(err.message));
    process.exit(1);
  }
}
