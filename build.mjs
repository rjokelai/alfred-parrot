import chalk from 'chalk';
import * as fs from 'fs/promises';
import yaml from 'js-yaml';
import * as path from 'path';
import { debug, mkdirp } from './src/utils.mjs';
import * as cp from 'child_process';
import * as util from 'util';

const exec = util.promisify(cp.exec);

const PATHS = {
  dist: path.resolve('./dist'),
  listFilterImages: path.resolve('./dist/List Filter Images'),
  static: path.resolve('./src/static'),
  parrotBase: path.resolve('./node_modules/cultofthepartyparrot.com'),
};

// {
//   "imagefile":"parrot.gif",
//   "title":"Parrot",
//   "arg":"https://cultofthepartyparrot.com/parrots/hd/parrot.gif",
//   "subtitle":"Parrot"
// };
const mapToPlist =
  (root) =>
  ({ name, tip, gif, hd }) => {
    const fn = hd || gif;
    const arg = `https://cultofthepartyparrot.com/${root}/${fn}`;
    return {
      imagefile: `${root}/${fn}`,
      arg,
      title: name,
      subtitle: tip || name,
    };
  };

const images = {
  parrots: yaml
    .load(
      await fs.readFile(
        path.resolve(PATHS.parrotBase, './parrots.yaml'),
        'utf-8'
      )
    )
    .map(mapToPlist('parrots')),
  flags: yaml
    .load(
      await fs.readFile(path.resolve(PATHS.parrotBase, './flags.yaml'), 'utf-8')
    )
    .map(mapToPlist('flags')),
  guests: yaml
    .load(
      await fs.readFile(
        path.resolve(PATHS.parrotBase, './guests.yaml'),
        'utf-8'
      )
    )
    .map(mapToPlist('guests')),
};
// CREATE DIRS
await mkdirp(PATHS.listFilterImages);
await mkdirp(PATHS.listFilterImages + '/parrots/hd');
await mkdirp(PATHS.listFilterImages + '/flags/hd');
await mkdirp(PATHS.listFilterImages + '/guests/hd');

// COPY statics
const files = await fs.readdir('./src/static');
debug(chalk.blue('Copying static files'));
await Promise.all(
  files.map((f) => {
    const src = path.resolve(PATHS.static, f);
    const dst = path.resolve(PATHS.dist, f);
    debug('\t', src, '\n\t\t=>', dst);
    return fs.copyFile(src, dst);
  })
);

// COPY parrots
await Promise.all(
  Object.entries(images).map(async ([key, parrots]) => {
    debug(chalk.blue(`Copying parrots with key ${key}`));
    await Promise.all(
      parrots.map((parrot) => {
        const src = path.resolve(PATHS.parrotBase, parrot.imagefile);
        const dst = path.resolve(PATHS.listFilterImages, parrot.imagefile);
        debug('\t', src, '\n\t\t=>', dst);
        return fs.copyFile(src, dst);
      })
    );
  })
);

// CREATE info.plist
const allParrots = [...images.parrots, ...images.guests, ...images.flags].sort(
  (a, b) => (a.title < b.title ? -1 : a.title > b.title ? 1 : 0)
);

debug(chalk.blue('Writing info.plist'));
const plist = await fs.readFile('./src/info.plist.template', 'utf-8');
const plistWithParrots = plist.replace(
  'REPLACE_ME_WITH_PARROTS_JSON',
  JSON.stringify(allParrots)
);
await fs.writeFile(
  path.resolve(PATHS.dist, 'Info.plist'),
  plistWithParrots,
  'utf-8'
);

// ZIP IT
exec('zip -r parrots.alfredworkflow .', { cwd: PATHS.dist });

// Done
debug(chalk.green('Done :)'));
console.log('Archive at ', path.resolve(PATHS.dist, 'parrots.alfredworkflow'));
