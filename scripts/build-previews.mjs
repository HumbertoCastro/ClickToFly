import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderClientContentRuntime } from './render-client-content-runtime.mjs';
import { renderAdminIndex } from './render-admin-index.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const configPath = path.join(rootDir, 'preview.config.json');
const config = JSON.parse(await readFile(configPath, 'utf8'));
const basePath = normalizeBasePath(config.basePath);
const feedbackBasePath = normalizeBasePath(config.feedback?.basePath || '/feedback');
const feedbackDir = path.resolve(rootDir, config.feedback?.dir || 'client-feedback');
const outputDir = path.resolve(rootDir, config.outputDir || 'preview-dist');

assertInsideRoot(outputDir);

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  printUsage();
  process.exit(0);
}

const requestedSlugs = parseProjectArgs(process.argv.slice(2));
const projects = config.projects.filter((project) => project.enabled !== false);
const fullBuild = requestedSlugs.length === 0;

for (const project of projects) {
  validateProject(project);
}

const selectedProjects = fullBuild
  ? projects
  : projects.filter((project) => requestedSlugs.includes(project.slug));
const missingSlugs = requestedSlugs.filter(
  (slug) => !projects.some((project) => project.slug === slug),
);

if (missingSlugs.length > 0) {
  throw new Error(
    `Projeto(s) nao encontrado(s): ${missingSlugs.join(', ')}. Disponiveis: ${projects
      .map((project) => project.slug)
      .join(', ')}`,
  );
}

if (fullBuild) {
  await rm(outputDir, { recursive: true, force: true });
}

await mkdir(outputDir, { recursive: true });
await mkdir(path.join(outputDir, trimSlashes(basePath)), { recursive: true });

for (const project of selectedProjects) {
  const projectDir = path.resolve(rootDir, project.dir);
  const projectBase = `${basePath}/${project.slug}/`;
  const targetDir = path.join(outputDir, trimSlashes(projectBase));
  const relativeOutDir = toPosixPath(path.relative(projectDir, targetDir));

  assertInsideRoot(projectDir);
  assertInsideRoot(targetDir);

  if (shouldInstall(projectDir)) {
    run('npm', ['ci', '--prefix', projectDir]);
  }

  await rm(targetDir, { recursive: true, force: true });
  await mkdir(targetDir, { recursive: true });

  run('npm', [
    'run',
    'build',
    '--prefix',
    projectDir,
    '--',
    `--base=${projectBase}`,
    `--outDir=${relativeOutDir}`,
    '--emptyOutDir',
  ]);

  await materializeProjectRoutes(project, targetDir);
  await installClientContentRuntime(project, targetDir, projectBase);
}

await buildFeedbackApp();

await writeFile(path.join(outputDir, 'index.html'), renderAdminIndex({ projects, basePath }), 'utf8');
await writeFile(path.join(outputDir, trimSlashes(basePath), 'index.html'), renderAdminIndex({ projects, basePath }), 'utf8');
await writeFile(path.join(outputDir, 'robots.txt'), 'User-agent: *\nDisallow: /\n', 'utf8');
await writeFile(path.join(outputDir, '_headers'), renderHeaders(), 'utf8');
await writeFile(path.join(outputDir, '_redirects'), renderRedirects(basePath, projects, feedbackBasePath), 'utf8');

console.log(
  `Preview build complete: ${path.relative(rootDir, outputDir)} (${fullBuild ? 'all projects' : selectedProjects.map((project) => project.slug).join(', ')})`,
);

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

function validateProject(project) {
  if (!project.slug || !/^[a-z0-9-]+$/.test(project.slug)) {
    throw new Error(`Invalid preview slug: ${project.slug}`);
  }

  if (!project.name || !project.dir) {
    throw new Error(`Preview project "${project.slug}" needs "name" and "dir".`);
  }

  if (project.routes && !Array.isArray(project.routes)) {
    throw new Error(`Preview project "${project.slug}" routes must be an array.`);
  }

  for (const route of project.routes || []) {
    validateRoute(project, route);
  }
}

function validateRoute(project, route) {
  if (!route || typeof route !== 'string' || !route.startsWith('/')) {
    throw new Error(`Preview route for "${project.slug}" must start with "/": ${route}`);
  }

  if (route.includes('..') || route.includes('*') || route.includes(':')) {
    throw new Error(`Invalid preview route for "${project.slug}": ${route}`);
  }
}

function parseProjectArgs(args) {
  const slugs = [];

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (!arg || arg === '--') {
      continue;
    }

    if (arg === '--all') {
      return [];
    }

    if (arg === '--project' || arg === '--projects' || arg === '--slug') {
      const value = args[index + 1];

      if (!value) {
        throw new Error(`${arg} precisa receber um slug.`);
      }

      slugs.push(...splitSlugs(value));
      index += 1;
      continue;
    }

    if (arg.startsWith('--project=') || arg.startsWith('--projects=') || arg.startsWith('--slug=')) {
      slugs.push(...splitSlugs(arg.split('=')[1]));
      continue;
    }

    if (arg.startsWith('--')) {
      throw new Error(`Opcao desconhecida: ${arg}`);
    }

    slugs.push(...splitSlugs(arg));
  }

  return [...new Set(slugs)];
}

function splitSlugs(value) {
  return String(value)
    .split(',')
    .map((slug) => slug.trim())
    .filter(Boolean);
}

function printUsage() {
  console.log(`Uso:
  npm run build:previews
  npm run build:previews -- akatu
  npm run build:previews -- akatu clicktofly
  npm run build:previews -- --project=akatu,clicktofly`);
}

function normalizeBasePath(value) {
  const normalized = `/${trimSlashes(value || 'projetos')}`;
  return normalized === '/' ? '' : normalized;
}

function trimSlashes(value) {
  return String(value).replace(/^\/+|\/+$/g, '');
}

function toPosixPath(value) {
  return value.split(path.sep).join('/');
}

async function buildFeedbackApp() {
  const feedbackPackagePath = path.join(feedbackDir, 'package.json');

  if (!existsSync(feedbackPackagePath)) {
    throw new Error(`Feedback app not found: ${feedbackPackagePath}`);
  }

  const targetDir = path.join(outputDir, trimSlashes(feedbackBasePath));
  const relativeOutDir = toPosixPath(path.relative(feedbackDir, targetDir));

  assertInsideRoot(feedbackDir);
  assertInsideRoot(targetDir);

  if (shouldInstall(feedbackDir)) {
    run('npm', ['ci', '--prefix', feedbackDir]);
  }

  await rm(targetDir, { recursive: true, force: true });
  await mkdir(targetDir, { recursive: true });

  run('npm', [
    'run',
    'build',
    '--prefix',
    feedbackDir,
    '--',
    `--base=${withTrailingSlash(feedbackBasePath)}`,
    `--outDir=${relativeOutDir}`,
    '--emptyOutDir',
  ]);

  await materializeFeedbackRoutes(targetDir);
}

async function materializeProjectRoutes(project, targetDir) {
  const sourceIndex = path.join(targetDir, 'index.html');

  for (const route of project.routes || []) {
    const routePath = trimSlashes(route);

    if (!routePath) {
      continue;
    }

    const routeDir = path.join(targetDir, routePath);
    const routeIndex = path.join(routeDir, 'index.html');

    assertInsideRoot(routeDir);
    await mkdir(routeDir, { recursive: true });
    await copyFile(sourceIndex, routeIndex);
  }
}

async function materializeFeedbackRoutes(targetDir) {
  const sourceIndex = path.join(targetDir, 'index.html');
  const adminDir = path.join(targetDir, 'admin');
  const adminIndex = path.join(adminDir, 'index.html');
  const clientDir = path.join(targetDir, 'client');
  const clientIndex = path.join(clientDir, 'index.html');

  assertInsideRoot(adminDir);
  assertInsideRoot(clientDir);
  await mkdir(adminDir, { recursive: true });
  await mkdir(clientDir, { recursive: true });
  await copyFile(sourceIndex, adminIndex);
  await copyFile(sourceIndex, clientIndex);
}

async function installClientContentRuntime(project, targetDir, projectBase) {
  const runtimeName = 'hc-content-runtime.js';
  const runtimePath = path.join(targetDir, runtimeName);
  const scriptTag = `<script src="${withTrailingSlash(projectBase)}${runtimeName}" defer></script>`;
  const indexPaths = [
    path.join(targetDir, 'index.html'),
    ...(project.routes || []).map((route) =>
      path.join(targetDir, trimSlashes(route), 'index.html'),
    ),
  ];

  await writeFile(runtimePath, renderClientContentRuntime(project.slug), 'utf8');

  for (const indexPath of indexPaths) {
    if (!existsSync(indexPath)) {
      continue;
    }

    const html = await readFile(indexPath, 'utf8');

    if (html.includes(runtimeName)) {
      continue;
    }

    const nextHtml = html.includes('</body>')
      ? html.replace('</body>', `  ${scriptTag}\n  </body>`)
      : `${html}\n${scriptTag}\n`;

    await writeFile(indexPath, nextHtml, 'utf8');
  }
}

function shouldInstall(projectDir) {
  if (process.env.SKIP_PREVIEW_INSTALL === '1') {
    return false;
  }

  if (process.env.FORCE_PREVIEW_INSTALL === '1') {
    return true;
  }

  return !existsSync(path.join(projectDir, 'node_modules'));
}

function assertInsideRoot(targetPath) {
  const relative = path.relative(rootDir, targetPath);

  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Refusing to use path outside workspace: ${targetPath}`);
  }
}

function renderIndex(config, projects) {
  const projectCards = projects
    .map((project, index) => {
      const url = `${basePath}/${project.slug}/`;
      const delay = 70 + index * 55;

      return `
        <article class="project-card" style="--delay: ${delay}ms">
          <div>
            <p class="project-kicker">Preview</p>
            <h2>${escapeHtml(project.name)}</h2>
            <p>${escapeHtml(project.description || 'Prototipo disponivel para revisao.')}</p>
          </div>
          <a class="project-link" href="${url}" aria-label="Abrir preview ${escapeHtml(project.name)}">
            Abrir preview
            <span aria-hidden="true">-></span>
          </a>
        </article>`;
    })
    .join('\n');

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="robots" content="noindex,nofollow,noarchive" />
    <title>Previews | HC Web Solutions</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #f5f7fb;
        --surface: #ffffff;
        --surface-strong: #111827;
        --text: #172033;
        --muted: #667085;
        --line: #d8dee9;
        --accent: #2563eb;
        --accent-strong: #1d4ed8;
        --success: #16a34a;
        --shadow: 0 18px 55px rgba(18, 32, 59, 0.1);
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        min-height: 100vh;
        background:
          radial-gradient(circle at top left, rgba(37, 99, 235, 0.1), transparent 32rem),
          linear-gradient(180deg, #ffffff 0%, var(--bg) 62%);
        color: var(--text);
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      a {
        color: inherit;
      }

      .page {
        width: min(1120px, calc(100% - 32px));
        margin: 0 auto;
        padding: 56px 0;
      }

      .topbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 24px;
        margin-bottom: 58px;
      }

      .brand {
        display: inline-flex;
        align-items: center;
        gap: 12px;
        min-width: 0;
        color: var(--surface-strong);
        font-weight: 800;
      }

      .brand-mark {
        display: grid;
        width: 40px;
        height: 40px;
        place-items: center;
        border-radius: 12px;
        background: var(--surface-strong);
        color: #ffffff;
        font-size: 0.86rem;
        letter-spacing: 0;
      }

      .status {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        min-height: 36px;
        padding: 0 12px;
        border: 1px solid rgba(22, 163, 74, 0.24);
        border-radius: 999px;
        background: rgba(22, 163, 74, 0.08);
        color: #166534;
        font-size: 0.9rem;
        font-weight: 700;
        white-space: nowrap;
      }

      .status::before {
        content: "";
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--success);
      }

      .hero {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(260px, 360px);
        gap: 40px;
        align-items: end;
        margin-bottom: 30px;
      }

      .hero h1 {
        max-width: 820px;
        margin: 0;
        color: var(--surface-strong);
        font-size: clamp(2.35rem, 6vw, 4.8rem);
        line-height: 0.96;
        letter-spacing: 0;
      }

      .hero p {
        margin: 22px 0 0;
        max-width: 680px;
        color: var(--muted);
        font-size: 1.08rem;
        line-height: 1.65;
      }

      .note {
        border: 1px solid var(--line);
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.72);
        padding: 18px;
        color: var(--muted);
        font-size: 0.94rem;
        line-height: 1.55;
      }

      .note strong {
        display: block;
        margin-bottom: 6px;
        color: var(--surface-strong);
      }

      .grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 16px;
        margin-top: 28px;
      }

      .project-card {
        display: flex;
        min-height: 240px;
        flex-direction: column;
        justify-content: space-between;
        gap: 28px;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.86);
        padding: 24px;
        box-shadow: var(--shadow);
        opacity: 0;
        transform: translateY(14px);
        animation: enter 560ms cubic-bezier(.22, 1, .36, 1) forwards;
        animation-delay: var(--delay);
      }

      .project-card:focus-within,
      .project-card:hover {
        border-color: rgba(37, 99, 235, 0.42);
        transform: translateY(-2px);
      }

      .project-kicker {
        margin: 0 0 12px;
        color: var(--accent);
        font-size: 0.78rem;
        font-weight: 800;
        text-transform: uppercase;
      }

      .project-card h2 {
        margin: 0;
        color: var(--surface-strong);
        font-size: 1.45rem;
        line-height: 1.2;
      }

      .project-card p:not(.project-kicker) {
        margin: 12px 0 0;
        color: var(--muted);
        line-height: 1.55;
      }

      .project-link {
        display: inline-flex;
        width: fit-content;
        align-items: center;
        gap: 10px;
        min-height: 42px;
        border-radius: 8px;
        background: var(--accent);
        color: #ffffff;
        padding: 0 15px;
        font-size: 0.94rem;
        font-weight: 800;
        text-decoration: none;
      }

      .project-link:hover {
        background: var(--accent-strong);
      }

      .project-link:focus-visible {
        outline: 3px solid rgba(37, 99, 235, 0.26);
        outline-offset: 3px;
      }

      @keyframes enter {
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        *,
        *::before,
        *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          scroll-behavior: auto !important;
        }
      }

      @media (max-width: 820px) {
        .page {
          width: min(100% - 24px, 680px);
          padding: 28px 0;
        }

        .topbar,
        .hero {
          grid-template-columns: 1fr;
        }

        .topbar {
          align-items: flex-start;
          margin-bottom: 40px;
        }

        .status {
          width: fit-content;
        }

        .grid {
          grid-template-columns: 1fr;
        }
      }
    </style>
  </head>
  <body>
    <main class="page">
      <header class="topbar">
        <div class="brand" aria-label="HC Web Solutions">
          <span class="brand-mark" aria-hidden="true">HC</span>
          <span>HC Web Solutions</span>
        </div>
        <div class="status">Ambiente de preview</div>
      </header>

      <section class="hero" aria-labelledby="page-title">
        <div>
          <h1 id="page-title">Projetos em homologacao</h1>
          <p>Links de validacao para clientes revisarem estrutura, conteudo e experiencia antes da publicacao no dominio final.</p>
        </div>
        <aside class="note">
          <strong>Area nao indexada</strong>
          Os previews gerados aqui recebem regras para evitar indexacao e manter a separacao do site institucional.
        </aside>
      </section>

      <section class="grid" aria-label="Projetos disponiveis">
        ${projectCards}
      </section>
    </main>
  </body>
</html>`;
}

function renderHeaders() {
  return `/*
  X-Robots-Tag: noindex, nofollow, noarchive
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
`;
}

function renderRedirects(basePath, projects, feedbackPath) {
  const lines = [
    `${basePath} ${basePath}/ 301`,
    `${feedbackPath} ${feedbackPath}/ 301`,
    ...projects.map((project) => `${basePath}/${project.slug} ${basePath}/${project.slug}/ 301`),
    `${feedbackPath}/* ${feedbackPath}/index.html 200`,
    ...projects.map((project) => `${basePath}/${project.slug}/* ${basePath}/${project.slug}/index.html 200`),
  ];

  return `${lines.join('\n')}\n`;
}

function withTrailingSlash(value) {
  return value.endsWith('/') ? value : `${value}/`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
