import { createHmac } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const config = JSON.parse(await readFile(path.join(rootDir, 'preview.config.json'), 'utf8'));
const args = parseArgs(process.argv.slice(2));
const secret = args.secret || process.env.FEEDBACK_TOKEN_SECRET;

if (!secret || secret.length < 16) {
  throw new Error('Defina FEEDBACK_TOKEN_SECRET com pelo menos 16 caracteres.');
}

if (!args.project) {
  throw new Error('Use --project <slug>.');
}

const project = config.projects.find(
  (entry) => entry.enabled !== false && entry.slug === args.project,
);

if (!project) {
  throw new Error(
    `Projeto "${args.project}" nao encontrado. Disponiveis: ${config.projects
      .map((entry) => entry.slug)
      .join(', ')}`,
  );
}

const route = normalizeRoute(args.route || '/');
const allowedRoutes = new Set(['/', ...(project.routes || []).map(normalizeRoute)]);

if (!allowedRoutes.has(route)) {
  throw new Error(
    `Rota "${route}" nao esta configurada para ${project.slug}. Rotas: ${[
      ...allowedRoutes,
    ].join(', ')}`,
  );
}

const now = Math.floor(Date.now() / 1000);
const days = Number(args.days || 14);
const payload = {
  v: 1,
  projectSlug: project.slug,
  projectName: project.name,
  client: args.client || project.name,
  route,
  issuedAt: now,
  expiresAt: now + Math.max(1, days) * 24 * 60 * 60,
};
const token = signPayload(payload, secret);
const domain = trimTrailingSlash(args.domain || `https://${config.domain}`);
const feedbackUrl = `${domain}/feedback/?token=${token}`;

if (args.json) {
  console.log(JSON.stringify({ url: feedbackUrl, token, payload }, null, 2));
} else {
  console.log(feedbackUrl);
}

function signPayload(payload, secretValue) {
  const payloadPart = toBase64Url(Buffer.from(JSON.stringify(payload), 'utf8'));
  const signaturePart = toBase64Url(
    createHmac('sha256', secretValue).update(payloadPart).digest(),
  );

  return `${payloadPart}.${signaturePart}`;
}

function toBase64Url(buffer) {
  return buffer
    .toString('base64')
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');
}

function normalizeRoute(value) {
  const route = typeof value === 'string' && value.trim() ? value.trim() : '/';
  const withLeadingSlash = route.startsWith('/') ? route : `/${route}`;
  const clean = withLeadingSlash.replace(/\/{2,}/g, '/');

  if (clean.includes('..') || clean.includes('*') || clean.includes(':')) {
    throw new Error(`Rota invalida: ${value}`);
  }

  return clean;
}

function parseArgs(values) {
  const parsed = {
    project: process.env.npm_config_project,
    route: process.env.npm_config_route,
    client: process.env.npm_config_client,
    domain: process.env.npm_config_domain,
    days: process.env.npm_config_days,
    secret: process.env.npm_config_secret,
    json: process.env.npm_config_json === 'true',
  };
  const positional = [];

  for (let index = 0; index < values.length; index += 1) {
    const arg = values[index];

    if (arg === '--json') {
      parsed.json = true;
      continue;
    }

    if (arg.startsWith('--') && arg.includes('=')) {
      const [key, value] = arg.slice(2).split(/=(.*)/s);
      parsed[toCamel(key)] = value;
      continue;
    }

    if (arg.startsWith('--')) {
      const key = toCamel(arg.slice(2));
      const value = values[index + 1];

      if (!value || value.startsWith('--')) {
        throw new Error(`Opcao ${arg} precisa de valor.`);
      }

      parsed[key] = value;
      index += 1;
      continue;
    }

    positional.push(arg);
  }

  if (!parsed.project || parsed.project === 'true') parsed.project = positional[0];
  if (!parsed.route || parsed.route === 'true') parsed.route = positional[1];
  if (!parsed.client || parsed.client === 'true') parsed.client = positional[2];
  if (!parsed.domain || parsed.domain === 'true') parsed.domain = positional[3];

  return parsed;
}

function toCamel(value) {
  return value.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

function trimTrailingSlash(value) {
  return value.replace(/\/+$/, '');
}
