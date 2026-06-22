#!/usr/bin/env node
/**
 * Local integration readiness check — boolean/config indicators only, no secrets.
 * Run: npm run verify:integration
 */
import { existsSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const REQUIRED_ENV = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
];

const REQUIRED_MIGRATIONS = [
  '20250621000000_phase1_platform.sql',
  '20250621100000_realtime_and_policies.sql',
  '20250621120000_rls_hardening.sql',
  '20250621140000_commit_match_update_rpc.sql',
];

const AUTH_ARTIFACTS = [
  'src/features/auth/AuthProvider.tsx',
  'src/features/auth/guest.ts',
  'src/middleware.ts',
  'src/platform/supabase/client.ts',
  'src/platform/supabase/server.ts',
  'src/platform/supabase/service.ts',
  'src/server/auth/resolveActor.ts',
];

const MATCH_API_ROUTES = [
  'src/app/api/matches/route.ts',
  'src/app/api/matches/[matchId]/route.ts',
  'src/app/api/matches/[matchId]/join/route.ts',
  'src/app/api/matches/[matchId]/move/route.ts',
  'src/app/api/matches/[matchId]/resign/route.ts',
  'src/app/api/me/route.ts',
];

const loadEnvLocal = () => {
  const envPath = join(root, '.env.local');
  if (!existsSync(envPath)) {
    return {};
  }
  const parsed = {};
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    const eq = trimmed.indexOf('=');
    if (eq === -1) {
      continue;
    }
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"'))
      || (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    parsed[key] = value;
  }
  return parsed;
};

const envLocal = loadEnvLocal();
const envValue = (key) => process.env[key] ?? envLocal[key];

const checks = [];

const record = (name, ok, detail) => {
  checks.push({ name, ok, detail });
};

for (const key of REQUIRED_ENV) {
  const value = envValue(key);
  record(`env:${key}`, Boolean(value && value.length > 0), value ? 'SET' : 'MISSING');
}

for (const file of REQUIRED_MIGRATIONS) {
  const path = join(root, 'supabase', 'migrations', file);
  record(`migration:${file}`, existsSync(path), existsSync(path) ? 'present' : 'missing');
}

const rlsMigration = join(root, 'supabase', 'migrations', '20250621120000_rls_hardening.sql');
if (existsSync(rlsMigration)) {
  const sql = readFileSync(rlsMigration, 'utf8');
  record('migration:matches.version', sql.includes('version'), sql.includes('version') ? 'documented' : 'not found');
  record('migration:rls_hardening', sql.includes('snapshot_has_player'), 'policy helpers present');
}

const rpcMigration = join(root, 'supabase', 'migrations', '20250621140000_commit_match_update_rpc.sql');
if (existsSync(rpcMigration)) {
  const sql = readFileSync(rpcMigration, 'utf8');
  record('migration:commit_match_update_rpc', sql.includes('commit_match_update'), 'RPC defined');
}

for (const file of AUTH_ARTIFACTS) {
  record(`auth:${file}`, existsSync(join(root, file)), existsSync(join(root, file)) ? 'present' : 'missing');
}

for (const file of MATCH_API_ROUTES) {
  record(`api:${file}`, existsSync(join(root, file)), existsSync(join(root, file)) ? 'present' : 'missing');
}

record(
  'persistence:service_role_configured',
  Boolean(envValue('NEXT_PUBLIC_SUPABASE_URL') && envValue('SUPABASE_SERVICE_ROLE_KEY')),
  envValue('SUPABASE_SERVICE_ROLE_KEY') ? 'ready' : 'service role key missing',
);

const apiBase = process.env.VERIFY_API_BASE_URL ?? envLocal.VERIFY_API_BASE_URL;
if (apiBase) {
  try {
    const response = await fetch(new URL('/api/me', apiBase), { method: 'GET' });
    record('api:reachable', response.status < 500, `GET /api/me → ${response.status}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'request failed';
    record('api:reachable', false, message);
  }
} else {
  record('api:reachable', true, 'skipped (set VERIFY_API_BASE_URL to probe live deploy)');
}

const failed = checks.filter((check) => !check.ok);
const passed = checks.length - failed.length;

console.log('Integration readiness\n');
for (const check of checks) {
  const mark = check.ok ? '✓' : '✗';
  console.log(`  ${mark} ${check.name}: ${check.detail}`);
}
console.log(`\n${passed}/${checks.length} checks passed`);

if (failed.length > 0) {
  process.exit(1);
}
