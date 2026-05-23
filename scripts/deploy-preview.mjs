import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const config = JSON.parse(await readFile(path.join(rootDir, 'preview.config.json'), 'utf8'));
const setupOnly = process.argv.includes('--setup-only');
const buildArgs = process.argv.slice(2).filter((arg) => arg !== '--setup-only');

loadEnvFile(path.join(rootDir, '.env.cloudflare'));

const apiToken = requireEnv('CLOUDFLARE_API_TOKEN');
const accountId = requireEnv('CLOUDFLARE_ACCOUNT_ID');
const zoneId = requireEnv('CLOUDFLARE_ZONE_ID');
const projectName = config.pagesProjectName;
const previousProjectName = config.previousPagesProjectName;
const domain = config.domain;
const outputDir = config.outputDir || 'preview-dist';
const productionBranch = config.productionBranch || 'main';
const pagesTarget = `${projectName}.pages.dev`;

if (!projectName || !domain) {
  throw new Error('preview.config.json precisa de "pagesProjectName" e "domain".');
}

console.log(`Preparing Cloudflare Pages project: ${projectName}`);
await ensurePagesProject();

if (!setupOnly) {
  run('npm', ['run', 'build:previews', '--', ...buildArgs]);
  assertDeployOutputComplete();
  run('wrangler', [
    'pages',
    'deploy',
    outputDir,
    '--project-name',
    projectName,
    '--branch',
    productionBranch,
    '--commit-dirty=true',
  ]);
}

await detachDomainFromPreviousProject();
await ensureDnsRecord();
await ensurePagesDomain();

console.log(`Preview deploy ready: https://${domain}/`);

async function ensurePagesProject() {
  const project = await cfGet(`/accounts/${accountId}/pages/projects/${projectName}`, [404]);

  if (project) {
    console.log(`Pages project already exists: ${projectName}`);
    return;
  }

  await cfPost(`/accounts/${accountId}/pages/projects`, {
    name: projectName,
    production_branch: productionBranch,
  });

  console.log(`Pages project created: ${projectName}`);
}

async function detachDomainFromPreviousProject() {
  if (!previousProjectName || previousProjectName === projectName) {
    return;
  }

  const previousDomain = await cfGet(
    `/accounts/${accountId}/pages/projects/${previousProjectName}/domains/${domain}`,
    [404],
  );

  if (!previousDomain) {
    return;
  }

  await cfDelete(`/accounts/${accountId}/pages/projects/${previousProjectName}/domains/${domain}`);
  console.log(`Detached ${domain} from previous project: ${previousProjectName}`);
}

async function ensureDnsRecord() {
  const records = await cfGet(
    `/zones/${zoneId}/dns_records?type=CNAME&name=${encodeURIComponent(domain)}`,
  );
  const existingRecord = records?.[0];
  const payload = {
    type: 'CNAME',
    name: domain,
    content: pagesTarget,
    proxied: true,
    ttl: 1,
  };

  if (!existingRecord) {
    await cfPost(`/zones/${zoneId}/dns_records`, payload);
    console.log(`DNS CNAME created: ${domain} -> ${pagesTarget}`);
    return;
  }

  if (existingRecord.content === pagesTarget && existingRecord.proxied === true) {
    console.log(`DNS CNAME already configured: ${domain} -> ${pagesTarget}`);
    return;
  }

  await cfPatch(`/zones/${zoneId}/dns_records/${existingRecord.id}`, payload);
  console.log(`DNS CNAME updated: ${domain} -> ${pagesTarget}`);
}

async function ensurePagesDomain() {
  const existingDomain = await cfGet(
    `/accounts/${accountId}/pages/projects/${projectName}/domains/${domain}`,
    [404],
  );

  if (existingDomain) {
    console.log(`Custom domain already attached: ${domain}`);
    return;
  }

  await cfPost(`/accounts/${accountId}/pages/projects/${projectName}/domains`, { name: domain });
  console.log(`Custom domain attached: ${domain}`);
}

async function cfGet(pathname, allowedStatuses = []) {
  return cfRequest('GET', pathname, undefined, allowedStatuses);
}

async function cfPost(pathname, body) {
  return cfRequest('POST', pathname, body);
}

async function cfPatch(pathname, body) {
  return cfRequest('PATCH', pathname, body);
}

async function cfDelete(pathname) {
  return cfRequest('DELETE', pathname);
}

async function cfRequest(method, pathname, body, allowedStatuses = []) {
  const response = await fetch(`https://api.cloudflare.com/client/v4${pathname}`, {
    method,
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await response.json().catch(() => ({}));

  if (allowedStatuses.includes(response.status)) {
    return null;
  }

  if (!response.ok || payload.success === false) {
    const message = payload.errors?.map((error) => error.message).join('; ') || response.statusText;
    throw new Error(`Cloudflare API ${method} ${pathname} failed: ${message}`);
  }

  return payload.result;
}

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: rootDir,
    env: process.env,
    shell: process.platform === 'win32',
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    throw new Error(`Command failed: ${command} ${args.join(' ')}`);
  }
}

function assertDeployOutputComplete() {
  const basePath = normalizeBasePath(config.basePath);
  const distDir = path.resolve(rootDir, outputDir);
  const missingPaths = [
    path.join(distDir, 'index.html'),
    path.join(distDir, '_headers'),
    path.join(distDir, '_redirects'),
    ...config.projects
      .filter((project) => project.enabled !== false)
      .map((project) => path.join(distDir, trimSlashes(basePath), project.slug, 'index.html')),
    ...config.projects
      .filter((project) => project.enabled !== false)
      .flatMap((project) =>
        (project.routes || []).map((route) =>
          path.join(distDir, trimSlashes(basePath), project.slug, trimSlashes(route), 'index.html'),
        ),
      ),
  ].filter((filePath) => !existsSync(filePath));

  if (missingPaths.length === 0) {
    return;
  }

  const relativePaths = missingPaths.map((filePath) => path.relative(rootDir, filePath)).join(', ');
  throw new Error(
    `preview-dist esta incompleto para deploy: ${relativePaths}. Rode um build completo primeiro: npm run build:previews`,
  );
}

function normalizeBasePath(value) {
  const normalized = `/${trimSlashes(value || 'projetos')}`;
  return normalized === '/' ? '' : normalized;
}

function trimSlashes(value) {
  return String(value).replace(/^\/+|\/+$/g, '');
}

function requireEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Defina ${name} em .env.cloudflare ou nas variaveis de ambiente.`);
  }

  return value;
}

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return;
  }

  const lines = readFileSync(filePath, 'utf8').split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim().replace(/^["']|["']$/g, '');

    if (key && !process.env[key]) {
      process.env[key] = value;
    }
  }
}
