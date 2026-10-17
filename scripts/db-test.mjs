#!/usr/bin/env node
// Local database test harness for supabase/v2.
//
// Creates a throwaway Postgres cluster in a temp folder, loads a Supabase stub,
// applies schema.sql + seed.sql TWICE (they must be re-runnable), loads fixtures
// and runs every supabase/tests/*.test.sql file. The cluster is deleted afterwards.
//
// Needs the PostgreSQL binaries (initdb, pg_ctl, psql). Set PG_BIN if they are
// not on PATH. It only ever talks to the cluster it started on 127.0.0.1.

import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { devNull, tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const port = Number(process.env.DB_TEST_PORT ?? 54329);
const host = '127.0.0.1';

const defaultBins = [
  process.env.PG_BIN,
  'C:/Program Files/PostgreSQL/18/bin',
  'C:/Program Files/PostgreSQL/17/bin',
  'C:/Program Files/PostgreSQL/16/bin',
  '/usr/lib/postgresql/16/bin',
].filter(Boolean);
const exe = (name) => {
  const ext = process.platform === 'win32' ? '.exe' : '';
  for (const dir of defaultBins) {
    const p = join(dir, name + ext);
    if (existsSync(p)) return p;
  }
  return name;
};

if (!['127.0.0.1', 'localhost', '::1'].includes(host)) {
  throw new Error('db-test refuses to run against a non-local host');
}

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', ...opts });
  if (r.status !== 0) {
    process.stdout.write(r.stdout ?? '');
    process.stderr.write(r.stderr ?? '');
    throw new Error(`${cmd} ${args.join(' ')} exited with ${r.status}`);
  }
  return r;
}

function psql(file, label) {
  const r = run(exe('psql'), [
    '-h', host, '-p', String(port), '-U', 'postgres', '-d', 'postgres',
    '-v', 'ON_ERROR_STOP=1', '-q', '-o', devNull, '-f', file,
  ]);
  const oks = (r.stderr.match(/NOTICE:\s+ok/g) ?? []).length;
  console.log(`  ✓ ${label}${oks ? ` (${oks} checks)` : ''}`);
  return oks;
}

const dataDir = mkdtempSync(join(tmpdir(), 'amaranth-db-'));
let started = false;
try {
  console.log(`db-test: temp cluster in ${dataDir} on ${host}:${port}`);
  run(exe('initdb'), ['-D', dataDir, '-U', 'postgres', '--auth=trust', '-E', 'UTF8', '--no-locale']);
  // stdio must not be piped: the server inherits the handles and keeps them open
  run(exe('pg_ctl'), ['-D', dataDir, '-o', `-p ${port} -c listen_addresses=${host}`, '-w', '-l', join(dataDir, 'log.txt'), 'start'], { stdio: 'ignore' });
  started = true;

  const sb = join(root, 'supabase');
  psql(join(sb, 'tests', '00_supabase_stub.sql'), 'supabase stub');
  for (const pass of [1, 2]) {
    psql(join(sb, 'v2', 'schema.sql'), `schema.sql (pass ${pass})`);
    psql(join(sb, 'v2', 'seed.sql'), `seed.sql (pass ${pass})`);
  }
  psql(join(sb, 'tests', '01_helpers.sql'), 'test helpers');
  psql(join(sb, 'tests', '02_fixtures.sql'), 'fixtures');
  psql(join(sb, 'tests', '02_fixtures.sql'), 'fixtures (re-run)');

  let total = 0;
  const tests = readdirSync(join(sb, 'tests')).filter((f) => f.endsWith('.test.sql')).sort();
  for (const t of tests) total += psql(join(sb, 'tests', t), t);
  console.log(`db-test: all passed (${total} checks)`);
} catch (err) {
  console.error(`db-test: FAILED — ${err.message}`);
  process.exitCode = 1;
} finally {
  if (started) spawnSync(exe('pg_ctl'), ['-D', dataDir, '-m', 'fast', '-w', 'stop'], { encoding: 'utf8' });
  rmSync(dataDir, { recursive: true, force: true });
}
