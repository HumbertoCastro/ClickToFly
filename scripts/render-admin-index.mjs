export function renderAdminIndex({ projects, basePath }) {
  const adminProjects = projects.map((project) => ({
    slug: project.slug,
    name: project.name,
    description: project.description || 'Preview disponivel para revisao.',
    url: `${basePath}/${project.slug}/`,
    routes: uniqueRoutes(['/', ...(project.routes || [])]),
  }));

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="robots" content="noindex,nofollow,noarchive" />
    <title>Admin de Previews | HC Web Solutions</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #f3f5f8;
        --surface: #ffffff;
        --surface-soft: #f8fafc;
        --ink: #111316;
        --text: #202631;
        --muted: #677282;
        --line: #d8dee8;
        --blue: #235ed8;
        --blue-soft: #dce8ff;
        --teal: #0f766e;
        --teal-soft: #d9f2ee;
        --danger: #b91c1c;
        --shadow: 0 24px 70px rgba(17, 19, 22, 0.12);
      }

      * {
        box-sizing: border-box;
      }

      [hidden] {
        display: none !important;
      }

      body {
        margin: 0;
        min-height: 100vh;
        background:
          linear-gradient(90deg, rgba(17, 19, 22, 0.045) 1px, transparent 1px),
          linear-gradient(0deg, rgba(17, 19, 22, 0.045) 1px, transparent 1px),
          var(--bg);
        background-size: 28px 28px;
        color: var(--text);
        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      button,
      input,
      select {
        font: inherit;
      }

      button {
        cursor: pointer;
      }

      .page {
        width: min(1180px, calc(100% - 32px));
        margin: 0 auto;
        padding: 28px 0 54px;
      }

      .topbar,
      .login-card,
      .project-card,
      .modal-panel {
        border: 1px solid var(--line);
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.88);
        box-shadow: var(--shadow);
      }

      .topbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        min-height: 72px;
        padding: 14px;
      }

      .brand {
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 0;
      }

      .brand-mark {
        display: grid;
        width: 42px;
        height: 42px;
        flex: 0 0 auto;
        place-items: center;
        border-radius: 8px;
        background: var(--ink);
        color: #ffffff;
        font-size: 0.85rem;
        font-weight: 900;
        letter-spacing: 0;
      }

      .brand p,
      .brand strong,
      .section-kicker,
      .project-kicker,
      label span {
        display: block;
        margin: 0;
      }

      .brand p,
      .section-kicker,
      .project-kicker,
      label span {
        color: var(--muted);
        font-size: 0.74rem;
        font-weight: 850;
        letter-spacing: 0;
        text-transform: uppercase;
      }

      .brand strong {
        margin-top: 2px;
        color: var(--ink);
        font-size: 1rem;
      }

      .logout-button,
      .primary-button,
      .secondary-button,
      .copy-button,
      .icon-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        min-height: 42px;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: var(--surface);
        color: var(--ink);
        padding: 0 14px;
        font-weight: 850;
        text-decoration: none;
      }

      .primary-button {
        border-color: var(--blue);
        background: var(--blue);
        color: #ffffff;
      }

      .copy-button {
        border-color: rgba(15, 118, 110, 0.34);
        background: var(--teal);
        color: #ffffff;
      }

      button:disabled {
        cursor: not-allowed;
        opacity: 0.62;
      }

      button:focus-visible,
      input:focus,
      select:focus,
      a:focus-visible {
        border-color: var(--blue);
        outline: 3px solid rgba(35, 94, 216, 0.18);
        outline-offset: 2px;
      }

      .login-wrap {
        display: grid;
        min-height: calc(100vh - 130px);
        place-items: center;
        padding: 34px 0;
      }

      .login-card {
        width: min(420px, 100%);
        padding: 22px;
      }

      .login-card h1,
      .dashboard-head h1 {
        margin: 8px 0 0;
        color: var(--ink);
        font-size: clamp(2rem, 5vw, 3.5rem);
        line-height: 0.98;
        letter-spacing: 0;
      }

      .login-card form,
      .modal-form {
        display: grid;
        gap: 14px;
        margin-top: 22px;
      }

      label {
        display: grid;
        gap: 7px;
      }

      input,
      select {
        width: 100%;
        min-height: 44px;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: #ffffff;
        color: var(--ink);
        outline: none;
        padding: 0 12px;
      }

      .error-text {
        min-height: 20px;
        margin: 0;
        color: var(--danger);
        font-size: 0.88rem;
      }

      .dashboard-head {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 20px;
        align-items: end;
        padding: 42px 0 24px;
      }

      .dashboard-head p:not(.section-kicker) {
        max-width: 720px;
        margin: 16px 0 0;
        color: var(--muted);
        font-size: 1rem;
        line-height: 1.58;
      }

      .project-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 16px;
      }

      .project-card {
        display: flex;
        min-height: 230px;
        flex-direction: column;
        justify-content: space-between;
        gap: 22px;
        padding: 22px;
      }

      .project-card h2 {
        margin: 8px 0 0;
        color: var(--ink);
        font-size: 1.35rem;
        line-height: 1.2;
      }

      .project-card p:not(.project-kicker) {
        margin: 10px 0 0;
        color: var(--muted);
        line-height: 1.5;
      }

      .route-pills {
        display: flex;
        flex-wrap: wrap;
        gap: 7px;
        margin-top: 14px;
      }

      .route-pills span {
        display: inline-flex;
        min-height: 28px;
        align-items: center;
        border: 1px solid var(--line);
        border-radius: 999px;
        background: var(--surface-soft);
        padding: 0 9px;
        color: var(--muted);
        font-size: 0.78rem;
        font-weight: 750;
      }

      .card-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }

      .modal-backdrop {
        position: fixed;
        inset: 0;
        z-index: 10;
        display: grid;
        place-items: center;
        background: rgba(17, 19, 22, 0.48);
        padding: 18px;
      }

      .modal-panel {
        width: min(560px, 100%);
        padding: 20px;
      }

      .modal-top {
        display: flex;
        justify-content: space-between;
        gap: 14px;
      }

      .modal-top h2 {
        margin: 6px 0 0;
        color: var(--ink);
        font-size: 1.5rem;
      }

      .icon-button {
        width: 40px;
        height: 40px;
        flex: 0 0 auto;
        padding: 0;
      }

      .generated-link {
        display: grid;
        gap: 8px;
        margin-top: 14px;
      }

      .generated-link input {
        font-size: 0.86rem;
      }

      .modal-message {
        min-height: 20px;
        margin: 10px 0 0;
        color: var(--muted);
        font-size: 0.88rem;
      }

      .modal-message.error {
        color: var(--danger);
      }

      .modal-message.success {
        color: var(--teal);
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
          padding-top: 12px;
        }

        .topbar,
        .dashboard-head {
          grid-template-columns: 1fr;
          align-items: stretch;
        }

        .topbar {
          flex-direction: column;
          align-items: stretch;
        }

        .project-grid {
          grid-template-columns: 1fr;
        }

        .card-actions > * {
          width: 100%;
        }
      }
    </style>
  </head>
  <body>
    <script>
      window.__HC_PREVIEW_PROJECTS__ = ${escapeScriptJson(adminProjects)};
    </script>

    <main class="page">
      <header class="topbar">
        <div class="brand" aria-label="HC Web Solutions">
          <span class="brand-mark" aria-hidden="true">HC</span>
          <div>
            <p>Admin</p>
            <strong>HC Web Solutions</strong>
          </div>
        </div>
        <button class="logout-button" id="logout-button" type="button" hidden>Sair</button>
      </header>

      <section class="login-wrap" id="login-view" hidden>
        <div class="login-card">
          <p class="section-kicker">Acesso privado</p>
          <h1>Admin de previews</h1>
          <form id="login-form">
            <label>
              <span>Senha</span>
              <input id="password-input" name="password" type="password" autocomplete="current-password" required />
            </label>
            <button class="primary-button" id="login-button" type="submit">Entrar</button>
            <p class="error-text" id="login-error" aria-live="polite"></p>
          </form>
        </div>
      </section>

      <section id="dashboard-view" hidden>
        <div class="dashboard-head">
          <div>
            <p class="section-kicker">Previews em homologacao</p>
            <h1>Links de feedback</h1>
            <p>Escolha o projeto, informe o cliente e copie uma URL assinada para revisao.</p>
          </div>
        </div>
        <section class="project-grid" id="project-grid" aria-label="Projetos disponiveis"></section>
      </section>
    </main>

    <div class="modal-backdrop" id="link-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" hidden>
      <div class="modal-panel">
        <div class="modal-top">
          <div>
            <p class="section-kicker">Emitir link</p>
            <h2 id="modal-title">Feedback</h2>
          </div>
          <button class="icon-button" id="modal-close" type="button" aria-label="Fechar">x</button>
        </div>

        <form class="modal-form" id="link-form">
          <label>
            <span>Nome do cliente</span>
            <input id="client-input" name="client" type="text" autocomplete="off" required />
          </label>
          <label>
            <span>Rota</span>
            <select id="route-select" name="route"></select>
          </label>
          <label>
            <span>Validade em dias</span>
            <input id="days-input" name="days" type="number" min="1" max="60" value="14" required />
          </label>
          <button class="primary-button" id="generate-button" type="submit">Gerar link</button>
        </form>

        <div class="generated-link" id="generated-link" hidden>
          <label>
            <span>URL para o cliente</span>
            <input id="url-output" readonly />
          </label>
          <button class="copy-button" id="copy-button" type="button">Copiar link</button>
        </div>

        <p class="modal-message" id="modal-message" aria-live="polite"></p>
      </div>
    </div>

    <script>
      const projects = window.__HC_PREVIEW_PROJECTS__ || [];
      const state = {
        currentProject: null,
        generatedUrl: ''
      };
      const els = {
        loginView: document.getElementById('login-view'),
        dashboardView: document.getElementById('dashboard-view'),
        loginForm: document.getElementById('login-form'),
        loginButton: document.getElementById('login-button'),
        loginError: document.getElementById('login-error'),
        passwordInput: document.getElementById('password-input'),
        logoutButton: document.getElementById('logout-button'),
        projectGrid: document.getElementById('project-grid'),
        modal: document.getElementById('link-modal'),
        modalTitle: document.getElementById('modal-title'),
        modalClose: document.getElementById('modal-close'),
        linkForm: document.getElementById('link-form'),
        clientInput: document.getElementById('client-input'),
        routeSelect: document.getElementById('route-select'),
        daysInput: document.getElementById('days-input'),
        generateButton: document.getElementById('generate-button'),
        generatedLink: document.getElementById('generated-link'),
        urlOutput: document.getElementById('url-output'),
        copyButton: document.getElementById('copy-button'),
        modalMessage: document.getElementById('modal-message')
      };

      init();

      async function init() {
        bindEvents();
        renderProjects();
        await loadSession();
      }

      function bindEvents() {
        els.loginForm.addEventListener('submit', login);
        els.logoutButton.addEventListener('click', logout);
        els.modalClose.addEventListener('click', closeModal);
        els.linkForm.addEventListener('submit', generateLink);
        els.copyButton.addEventListener('click', copyLink);
        els.modal.addEventListener('click', function (event) {
          if (event.target === els.modal) {
            closeModal();
          }
        });
        document.addEventListener('keydown', function (event) {
          if (event.key === 'Escape' && !els.modal.hidden) {
            closeModal();
          }
        });
        els.projectGrid.addEventListener('click', function (event) {
          const button = event.target.closest('[data-link-project]');

          if (!button) {
            return;
          }

          openModal(button.getAttribute('data-link-project'));
        });
      }

      async function loadSession() {
        try {
          const response = await fetch('/api/admin/session', {
            headers: { Accept: 'application/json' },
            credentials: 'same-origin'
          });
          const payload = await response.json().catch(function () { return {}; });

          if (!response.ok || !payload.authenticated) {
            showLogin();
            return;
          }

          showDashboard();
        } catch {
          showLogin();
        }
      }

      async function login(event) {
        event.preventDefault();
        els.loginButton.disabled = true;
        els.loginError.textContent = '';

        try {
          const response = await fetch('/api/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({ password: els.passwordInput.value })
          });
          const payload = await response.json().catch(function () { return {}; });

          if (!response.ok) {
            throw new Error(payload.error || 'Nao foi possivel entrar.');
          }

          els.passwordInput.value = '';
          showDashboard();
        } catch (error) {
          els.loginError.textContent = error instanceof Error ? error.message : 'Nao foi possivel entrar.';
        } finally {
          els.loginButton.disabled = false;
        }
      }

      async function logout() {
        await fetch('/api/admin/logout', {
          method: 'POST',
          credentials: 'same-origin'
        }).catch(function () {});
        showLogin();
      }

      function showLogin() {
        els.loginView.hidden = false;
        els.dashboardView.hidden = true;
        els.logoutButton.hidden = true;
      }

      function showDashboard() {
        els.loginView.hidden = true;
        els.dashboardView.hidden = false;
        els.logoutButton.hidden = false;
      }

      function renderProjects() {
        els.projectGrid.innerHTML = projects
          .map(function (project) {
            const routes = project.routes
              .map(function (route) { return '<span>' + escapeHtml(route) + '</span>'; })
              .join('');

            return '<article class="project-card">' +
              '<div>' +
                '<p class="project-kicker">Preview</p>' +
                '<h2>' + escapeHtml(project.name) + '</h2>' +
                '<p>' + escapeHtml(project.description) + '</p>' +
                '<div class="route-pills">' + routes + '</div>' +
              '</div>' +
              '<div class="card-actions">' +
                '<a class="secondary-button" href="' + escapeAttr(project.url) + '" target="_blank" rel="noreferrer">Abrir preview</a>' +
                '<button class="primary-button" type="button" data-link-project="' + escapeAttr(project.slug) + '">Emitir link</button>' +
              '</div>' +
            '</article>';
          })
          .join('');
      }

      function openModal(slug) {
        const project = projects.find(function (entry) { return entry.slug === slug; });

        if (!project) {
          return;
        }

        state.currentProject = project;
        state.generatedUrl = '';
        els.modalTitle.textContent = project.name;
        els.clientInput.value = '';
        els.daysInput.value = '14';
        els.routeSelect.innerHTML = project.routes
          .map(function (route) {
            return '<option value="' + escapeAttr(route) + '">' + escapeHtml(route) + '</option>';
          })
          .join('');
        els.generatedLink.hidden = true;
        els.urlOutput.value = '';
        setModalMessage('', '');
        els.modal.hidden = false;
        window.setTimeout(function () { els.clientInput.focus(); }, 30);
      }

      function closeModal() {
        els.modal.hidden = true;
        state.currentProject = null;
      }

      async function generateLink(event) {
        event.preventDefault();

        if (!state.currentProject) {
          return;
        }

        els.generateButton.disabled = true;
        setModalMessage('', '');

        try {
          const response = await fetch('/api/admin/feedback-link', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({
              projectSlug: state.currentProject.slug,
              projectName: state.currentProject.name,
              route: els.routeSelect.value,
              client: els.clientInput.value,
              days: els.daysInput.value
            })
          });
          const payload = await response.json().catch(function () { return {}; });

          if (!response.ok || !payload.url) {
            throw new Error(payload.error || 'Nao foi possivel gerar o link.');
          }

          state.generatedUrl = payload.url;
          els.urlOutput.value = payload.url;
          els.generatedLink.hidden = false;
          setModalMessage('Link gerado.', 'success');
          await copyLink();
        } catch (error) {
          setModalMessage(error instanceof Error ? error.message : 'Nao foi possivel gerar o link.', 'error');
        } finally {
          els.generateButton.disabled = false;
        }
      }

      async function copyLink() {
        if (!state.generatedUrl) {
          return;
        }

        try {
          if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(state.generatedUrl);
          } else {
            els.urlOutput.focus();
            els.urlOutput.select();
            document.execCommand('copy');
          }

          setModalMessage('Link copiado.', 'success');
        } catch {
          setModalMessage('Link gerado. Copie pelo campo acima.', 'success');
        }
      }

      function setModalMessage(message, kind) {
        els.modalMessage.textContent = message;
        els.modalMessage.className = 'modal-message' + (kind ? ' ' + kind : '');
      }

      function escapeHtml(value) {
        return String(value || '')
          .replaceAll('&', '&amp;')
          .replaceAll('<', '&lt;')
          .replaceAll('>', '&gt;')
          .replaceAll('"', '&quot;')
          .replaceAll("'", '&#039;');
      }

      function escapeAttr(value) {
        return escapeHtml(value).replaceAll('\`', '&#096;');
      }
    </script>
  </body>
</html>`;
}

function uniqueRoutes(routes) {
  return [...new Set(routes.map(normalizeRoute))];
}

function normalizeRoute(route) {
  const value = String(route || '/').trim();
  return value.startsWith('/') ? value : `/${value}`;
}

function escapeScriptJson(value) {
  return JSON.stringify(value)
    .replaceAll('<', '\\u003c')
    .replaceAll('>', '\\u003e')
    .replaceAll('&', '\\u0026')
    .replaceAll('\u2028', '\\u2028')
    .replaceAll('\u2029', '\\u2029');
}
