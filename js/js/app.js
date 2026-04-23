/**
 * App bootstrap + Router
 */

// Registry global de módulos (precisa estar definido antes dos módulos carregarem)
window.ModuleRegistry = window.ModuleRegistry || {};

const App = {
  currentView: null,

  async init() {
    this.setupSidebar();
    this.setupRouter();
    this.registerServiceWorker();
    await this.updateBadges();
    // Render inicial
    const hash = (location.hash || '#dashboard').replace('#','');
    this.navigate(hash);
  },

  setupSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    document.getElementById('btn-open-sidebar')?.addEventListener('click', () => {
      sidebar.classList.remove('-translate-x-full');
      overlay.classList.remove('hidden');
    });
    const close = () => {
      sidebar.classList.add('-translate-x-full');
      overlay.classList.add('hidden');
    };
    document.getElementById('btn-close-sidebar')?.addEventListener('click', close);
    overlay?.addEventListener('click', close);
    // Mobile quick add
    document.getElementById('btn-quick-add-mobile')?.addEventListener('click', () => {
      this.quickAdd();
    });
  },

  setupRouter() {
    window.addEventListener('hashchange', () => {
      const view = (location.hash || '#dashboard').replace('#','');
      this.navigate(view);
    });
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        // Fecha sidebar no mobile
        if (window.innerWidth < 1024) {
          document.getElementById('sidebar').classList.add('-translate-x-full');
          document.getElementById('sidebar-overlay').classList.add('hidden');
        }
      });
    });
  },

  async navigate(view) {
    this.currentView = view;
    // Marca link ativo
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    document.querySelector(`.nav-link[data-view="${view}"]`)?.classList.add('active');

    const container = document.getElementById('view-container');
    container.innerHTML = `
      <div class="flex items-center justify-center h-64">
        <div class="inline-block w-10 h-10 border-4 border-brand-200 border-t-brand-700 rounded-full animate-spin"></div>
      </div>
    `;

    try {
      const module = ModuleRegistry[view];
      if (module && typeof module.render === 'function') {
        await module.render(container);
        container.classList.add('fade-in');
      } else {
        container.innerHTML = Components.emptyState('🚧', 'Módulo em construção', `Em breve: ${view}`);
      }
      window.scrollTo(0, 0);
    } catch (err) {
      console.error(err);
      container.innerHTML = Components.emptyState('❌', 'Erro ao carregar', err.message);
    }
  },

  async updateBadges() {
    try {
      const [leads, alunos, financeiro, tarefas] = await Promise.all([
        Cache.get('leads'),
        Cache.get('alunos'),
        Cache.get('financeiro'),
        Cache.get('tarefas')
      ]);
      // Badge leads: quentes não matriculados
      const quentes = leads.filter(l => l.temperatura?.includes('Quente') && l.etapa_funil !== 'Matriculado').length;
      document.getElementById('badge-leads').textContent = quentes > 0 ? quentes : '';
      // Alunos risco (faltas >= 3 seguidas)
      const risco = alunos.filter(a => (a.aulas_faltadas_seguidas||0) >= 3).length;
      document.getElementById('badge-alunos').textContent = risco > 0 ? `⚠${risco}` : '';
      // Financeiro atrasado
      const atrasados = financeiro.filter(f => f.status === 'Atrasado').length;
      document.getElementById('badge-financeiro').textContent = atrasados > 0 ? atrasados : '';
      // Tarefas alta prioridade pendentes
      const tarefasAlta = tarefas.filter(t => t.prioridade?.includes('Alta') && t.status !== 'Concluída').length;
      document.getElementById('badge-tarefas').textContent = tarefasAlta > 0 ? tarefasAlta : '';
    } catch (e) { console.warn('Badges:', e); }
  },

  quickAdd() {
    const view = this.currentView;
    const addMap = {
      'leads': () => LeadsModule.openForm(),
      'alunos': () => AlunosModule.openForm(),
      'turmas': () => TurmasModule.openForm(),
      'professores': () => ProfessoresModule.openForm(),
      'financeiro': () => FinanceiroModule.openForm(),
      'tarefas': () => TarefasModule.openForm()
    };
    if (addMap[view]) addMap[view]();
    else LeadsModule.openForm();
  },

  registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch(e => console.warn('SW:', e));
      });
    }
  }
};

// Boot
document.addEventListener('DOMContentLoaded', () => App.init());
