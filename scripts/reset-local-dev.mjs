import { existsSync } from 'node:fs';
import { mkdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export const RESET_TARGETS = [
  'data/content-types.db',
  'data/content-types.db-shm',
  'data/content-types.db-wal',
  'data/uploads',
];

export function createResetPlan(rootDir = process.cwd()) {
  const root = resolve(rootDir);
  const dataRoot = resolve(root, 'data');

  return RESET_TARGETS.map((target) => {
    const absolutePath = resolve(root, target);

    if (!isInside(absolutePath, dataRoot)) {
      throw new Error(`Unsafe reset target: ${target}`);
    }

    return {
      absolutePath,
      exists: existsSync(absolutePath),
      target,
    };
  });
}

export async function runLocalReset(options = {}) {
  const rootDir = options.rootDir ?? process.cwd();
  const apply = options.apply ?? false;
  const plan = createResetPlan(rootDir);

  if (apply) {
    for (const item of plan) {
      await rm(item.absolutePath, { force: true, recursive: true });
    }

    await mkdir(resolve(rootDir, 'data/uploads'), { recursive: true });
  }

  return {
    applied: apply,
    items: plan,
  };
}

function isInside(child, parent) {
  const normalizedParent = parent.endsWith('/') ? parent : `${parent}/`;

  return child === parent || child.startsWith(normalizedParent);
}

function hasApplyFlag(argv) {
  return argv.includes('--apply') || argv.includes('--yes');
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = await runLocalReset({ apply: hasApplyFlag(process.argv.slice(2)) });
  const mode = result.applied ? 'applied' : 'dry-run';

  console.log(`Apiagex local reset ${mode}`);

  for (const item of result.items) {
    console.log(`${item.exists ? 'found' : 'missing'} ${item.target}`);
  }

  if (!result.applied) {
    console.log('Run `npm run reset:local -- --apply` to delete these local dev files.');
  }
}
