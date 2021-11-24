import chalk from 'chalk';
import * as fs from 'fs/promises';
import yaml from 'js-yaml';
import * as path from 'path';
import { debug, mkdirp } from './src/utils.mjs';

const PATHS = {
  dist: path.resolve('./dist'),
  listFilterImages: path.resolve('./dist/List Filter Images'),
  static: path.resolve('./src/static'),
  parrotBase: path.resolve('./node_modules/cultofthepartyparrot.com'),
};

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

// const a = {
// "imagefile":"parrot.gif",
// "title":"Parrot",
// "arg":"https://cultofthepartyparrot.com/parrots/hd/parrot.gif",
// "subtitle":"Parrot"
// };

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
// await files.map((f) => fs.copyFile(path.resolve(__dirname, './src/static', f), path.resolve(__dirname, './dist', f)));
