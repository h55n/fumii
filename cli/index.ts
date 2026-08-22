#!/usr/bin/env node
import { Command } from 'commander';
import { add } from './commands/add.js';
import { list } from './commands/list.js';
import { use } from './commands/use.js';
import { remove } from './commands/remove.js';
import { reset } from './commands/reset.js';

const program = new Command();

program.name('fumii').description('Install pets for your fumii companion').version('1.0.0');

program
  .command('add <slug>')
  .description('install a pet from the codex-pets registry')
  .action(add);

program
  .command('list')
  .option('--installed', 'show only locally installed pets')
  .description('list available or installed pets')
  .action(list);

program
  .command('use <slug>')
  .description('switch the active pet (fumii hot-swaps if running)')
  .action(use);

program
  .command('remove <slug>')
  .description('remove an installed pet')
  .action(remove);

program
  .command('reset')
  .description('switch back to fumii-default')
  .action(reset);

program.parse();
