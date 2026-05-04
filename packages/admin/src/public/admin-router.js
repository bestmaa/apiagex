const ROUTES = {
  audit: {
    breadcrumb: 'Governance / Audit log',
    title: 'Audit log',
  },
  backups: {
    breadcrumb: 'Operations / Backups',
    title: 'Backups',
  },
  dashboard: {
    breadcrumb: 'Workspace / Dashboard',
    title: 'Dashboard',
  },
  docs: {
    breadcrumb: 'Help / Documentation',
    title: 'Docs',
  },
  roles: {
    breadcrumb: 'Governance / Roles',
    title: 'Roles',
  },
  realtime: {
    breadcrumb: 'Operations / Realtime',
    title: 'Realtime',
  },
  entries: {
    breadcrumb: 'Content / Entries',
    title: 'Entries',
  },
  media: {
    breadcrumb: 'Assets / Media library',
    title: 'Media library',
  },
  migrations: {
    breadcrumb: 'Operations / Migrations',
    title: 'Migrations',
  },
  schema: {
    breadcrumb: 'Content / Content model',
    title: 'Content model',
  },
  webhooks: {
    breadcrumb: 'Operations / Webhooks',
    title: 'Webhooks',
  },
};

const DEFAULT_ROUTE = 'dashboard';

export function createAdminRouter() {
  const refs = {
    breadcrumb: document.getElementById('route-breadcrumb'),
    links: Array.from(document.querySelectorAll('[data-route-link]')),
    title: document.getElementById('route-title'),
  };

  init();

  return {
    current,
    go,
    render,
  };

  function init() {
    refs.links.forEach((link) => {
      link.addEventListener('click', (event) => {
        event.preventDefault();
        go(link.dataset.routeLink);
      });
    });
    window.addEventListener('hashchange', render);
    window.addEventListener('apiagex:content-type-selected', () => go('entries'));
    render();
  }

  function current() {
    const value = window.location.hash.replace(/^#\/?/, '');
    return ROUTES[value] ? value : DEFAULT_ROUTE;
  }

  function go(route) {
    const safeRoute = ROUTES[route] ? route : DEFAULT_ROUTE;

    if (current() === safeRoute) {
      render();
      return;
    }

    window.location.hash = `/${safeRoute}`;
  }

  function render() {
    const route = current();
    const meta = ROUTES[route];

    if (!window.location.hash || !ROUTES[window.location.hash.replace(/^#\/?/, '')]) {
      window.history.replaceState(null, '', `#/${route}`);
    }

    document.querySelectorAll('[data-route-section]').forEach((section) => {
      const active = section.dataset.routeSection === route;
      section.classList.toggle('route-hidden', !active);
      section.classList.toggle('hidden', !active);
    });
    refs.links.forEach((link) => {
      link.classList.toggle('active', link.dataset.routeLink === route);
    });

    if (refs.title) {
      refs.title.textContent = meta.title;
    }

    if (refs.breadcrumb) {
      refs.breadcrumb.textContent = meta.breadcrumb;
    }

    document.querySelector('.admin-main')?.scrollTo({ top: 0 });
    window.scrollTo({ top: 0 });
  }
}
