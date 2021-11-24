import * as fs from 'fs/promises';
import chalk from 'chalk';

export async function debug(...args) {
  if (process.env.DEBUG === 'true') {
    console.debug(...args);
  }
}

export async function exists(fn) {
  try {
    await fs.access(fn);
    return true;
  } catch (e) {
    return false;
  }
}

export async function mkdirp(dir) {
  if (!(await exists(dir))) {
    await fs.mkdir(dir, { recursive: true });
    debug(chalk.yellow('Created directory', dir));
  } else {
    debug(chalk.red('Directory exists', dir));
  }
}
