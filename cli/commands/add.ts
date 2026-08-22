import chalk from 'chalk';
import ora from 'ora';
import { fetchPetManifest, downloadPet } from '../registry.js';

export async function add(slug: string) {
  const spinner = ora(`fetching ${slug}...`).start();
  try {
    const manifest = await fetchPetManifest(slug);
    spinner.text = `downloading ${manifest.name}...`;
    await downloadPet(manifest);
    spinner.succeed(chalk.green(`${manifest.slug} installed`));
    console.log(chalk.dim(`  → run \`npx fumii use ${manifest.slug}\` to activate`));
    console.log(chalk.dim('  or open fumii and go to the Pets page'));
  } catch (err: any) {
    spinner.fail(chalk.red(err.message));
    process.exit(1);
  }
}
