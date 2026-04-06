import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, isAbsolute, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const projectRoot = process.cwd();
const schemaDir = resolve(projectRoot, 'prisma');
const envPath = resolve(projectRoot, '.env');
const sqlPath = resolve(schemaDir, 'init.sql');

const env = readFileSync(envPath, 'utf8')
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith('#'))
  .reduce((acc, line) => {
    const [key, ...rest] = line.split('=');
    acc[key] = rest.join('=').replace(/^"(.*)"$/, '$1');
    return acc;
  }, {});

const databaseUrl = env.DATABASE_URL;
if (!databaseUrl || !databaseUrl.startsWith('file:')) {
  throw new Error('DATABASE_URL must use the sqlite file: format');
}

const rawPath = databaseUrl.slice('file:'.length);
const dbPath = isAbsolute(rawPath) ? rawPath : resolve(schemaDir, rawPath);

mkdirSync(dirname(dbPath), { recursive: true });

const sql = readFileSync(sqlPath, 'utf8');
const result = spawnSync('sqlite3', [dbPath], {
  input: sql,
  stdio: ['pipe', 'pipe', 'pipe'],
  encoding: 'utf8',
});

if (result.status !== 0) {
  process.stderr.write(result.stderr);
  process.exit(result.status ?? 1);
}

process.stdout.write(`Initialized SQLite database at ${dbPath}\n`);
