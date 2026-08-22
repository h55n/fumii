import chalk from 'chalk';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { PETS_DIR } from '../registry.js';

export function reset() {
  writeFileSync(join(PETS_DIR, '.active'), 'fumii-default');
  console.log(chalk.green('reset to fumii-default'));
}
