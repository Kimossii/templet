# Inventário para migração Vue + Vite

Este documento mapeia vendors, pontos de entrada HTML e ordem de carga de scripts para substituição gradual por pacotes npm e componentes Vue.

## Entradas HTML (Vite MPA)

| Ficheiro | Conteúdo principal | Scripts |
|----------|-------------------|---------|
| [`index.html`](../index.html) | Dashboard Metronic + layout builder + drawers/modais globais | [`partials/layout/scripts.html`](../partials/layout/scripts.html) → base + dashboard |
| [`pages/dashboard.html`](../pages/dashboard.html) | Igual ao index (mesmos includes) | Idem |
| [`pages/users.html`](../pages/users.html) | Shell com `main-users` + conteúdo [`users-content.html`](../partials/sections/users-content.html) | [`partials/layout/scripts-users.html`](../partials/layout/scripts-users.html) → base + users |

## Partials de layout (mapeamento futuro → SFC)

| Partial | Futuro componente Vue |
|---------|----------------------|
| `partials/layout/head.html` | `AppHead.vue` / uso de `useHead` |
| `partials/layout/body-open.html` | atributos de `<body>` + bootstrap de tema |
| `partials/layout/shell.html` | `AppShell.vue` |
| `partials/layout/shell-users.html` | variante de shell (ou slot no mesmo SFC) |
| `partials/layout/header.html` | `Header.vue` |
| `partials/layout/sidebar.html` | `Sidebar.vue` |
| `partials/layout/main.html` / `main-users.html` | `RouterView` / layout slots |
| `partials/layout/toolbar.html` | `Toolbar.vue` |
| `partials/layout/footer.html` | `Footer.vue` |
| `partials/sections/dashboard-*.html` | widgets como `DashboardTopWidgets.vue`, etc. |

## Scripts: ordem de carga e ficheiros

### Globais (todas as páginas)

Ordem em [`scripts-base.html`](../partials/layout/scripts-base.html):

1. [`assets/js/core/host-url.js`](../assets/js/core/host-url.js) — define `hostUrl` para bundles Metronic.
2. [`assets/plugins/global/plugins.bundle.js`](../assets/plugins/global/plugins.bundle.js) — jQuery, Bootstrap 5.3-alpha, Moment, Select2, Axios, Lozad, Popper, etc.
3. [`assets/js/scripts.bundle.js`](../assets/js/scripts.bundle.js) — inicialização `data-kt-*` Metronic.

### Core extraído (sem HTML inline)

| Ficheiro | Origem | Notas Vue |
|----------|--------|-----------|
| [`assets/js/core/theme-boot.js`](../assets/js/core/theme-boot.js) | Tema no primeiro paint | `useColorMode` / `useDark` |
| [`assets/js/core/frame-guard.js`](../assets/js/core/frame-guard.js) | Anti clickjacking | middleware ou layout SSR |

### Dashboard apenas

[`scripts-page-dashboard.html`](../partials/layout/scripts-page-dashboard.html):

| Recurso | Caminho | Uso |
|---------|---------|-----|
| FullCalendar | `assets/plugins/custom/fullcalendar/fullcalendar.bundle.js` | Calendários no conteúdo / widgets |
| AmCharts 5 | `https://cdn.amcharts.com/lib/5/*.js` | Gráficos (substituídos URLs relativas antigas `../../../cdn.amcharts.com`) |
| DataTables | `assets/plugins/custom/datatables/datatables.bundle.js` | Tabelas |
| Widgets bundle | `assets/js/widgets.bundle.js` | Widgets Metronic |
| UI custom | `assets/js/components/**` (ex-modais, chat) | Migrar para componentes Vue |
| Página | [`assets/js/pages/dashboard.js`](../assets/js/pages/dashboard.js) | Hook mínimo por rota |

### Página Users

[`scripts-page-users.html`](../partials/layout/scripts-page-users.html): DataTables + modais utilitários + [`assets/js/pages/users.js`](../assets/js/pages/users.js).

## CSS (mantidos como bundles)

| Ficheiro | Função |
|----------|--------|
| `assets/plugins/custom/fullcalendar/fullcalendar.bundle.css` | FullCalendar |
| `assets/plugins/custom/datatables/datatables.bundle.css` | DataTables |
| `assets/plugins/global/plugins.bundle.css` | estilos globais vendors |
| `assets/css/style.bundle.css` | tema Metronic |

## Dependências críticas

1. **Ordem**: `plugins.bundle.js` antes de `scripts.bundle.js`; jQuery implícito no bundle global antes de código que usa `$`.
2. **`hostUrl`**: deve apontar para a pasta de assets publicados (`assets/`); alinhar com `base` do Vite na migração.
3. **`<base href="/" />`**: em [`head.html`](../partials/layout/head.html) para que `assets/...` funcione a partir de `/pages/*.html`.
4. **IDs `kt_*`**: muitos widgets dependem de IDs estáveis; ao migrar para Vue, preservar IDs ou refazer init com `onMounted` + APIs do vendor.

## Checklist pós-Vue

- [ ] Remover `var hostUrl` global; usar `import.meta.env.BASE_URL`.
- [ ] Substituir bundles por imports ESM e code-splitting por rota.
- [ ] Isolar GTM e analytics em plugin Vue ou layout raiz.
- [ ] Eliminar dependência de jQuery onde Select2/DataTables tiverem alternativa Vue.
