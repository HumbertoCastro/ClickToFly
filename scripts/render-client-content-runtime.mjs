export function renderClientContentRuntime(projectSlug) {
  return `(() => {
  const projectSlug = ${JSON.stringify(projectSlug)};

  if (!projectSlug || window.__HC_CLIENT_CONTENT_LOADED__) {
    return;
  }

  window.__HC_CLIENT_CONTENT_LOADED__ = true;

  fetch('/api/public/content?project=' + encodeURIComponent(projectSlug), {
    headers: { Accept: 'application/json' },
    credentials: 'omit',
  })
    .then((response) => (response.ok ? response.json() : null))
    .then((payload) => {
      if (!payload || !payload.content || !Array.isArray(payload.fields)) {
        return;
      }

      for (const field of payload.fields) {
        const value = payload.content[field.key];
        const target = field.target;

        if (!value || !target || !target.selector) {
          continue;
        }

        applyContentValue(field, value, target);
      }
    })
    .catch(() => {});

  function applyContentValue(field, value, target) {
    const nodes = queryAll(target.selector);

    if (nodes.length === 0) {
      return;
    }

    if (field.type === 'text' && value.type === 'text') {
      for (const node of nodes) {
        node.textContent = String(value.value || '');
        node.setAttribute('data-hc-content', field.key);
      }
      return;
    }

    if (field.type === 'sectionVisible' && value.type === 'sectionVisible') {
      for (const node of nodes) {
        node.hidden = value.visible === false;
        node.setAttribute('data-hc-content', field.key);
      }
      return;
    }

    if (field.type === 'image' && value.type === 'image' && value.url) {
      for (const node of nodes) {
        const image = node.matches('img') ? node : node.querySelector('img');

        if (image) {
          image.src = value.url;
          image.setAttribute('data-hc-content', field.key);
          continue;
        }

        node.style.backgroundImage = 'url("' + String(value.url).replace(/"/g, '%22') + '")';
        node.setAttribute('data-hc-content', field.key);
      }
    }
  }

  function queryAll(selector) {
    try {
      return Array.from(document.querySelectorAll(selector));
    } catch {
      return [];
    }
  }
})();`;
}
