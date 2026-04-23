/* ========================================
   App Principal - Orquestração
   ======================================== */

const App = {
    modules: {
        dashboard: ModuleDashboard,
        leads: ModuleLeads,
        alunos: ModuleAlunos,
        turmas: ModuleTurmas,
        professores: ModuleProfessores,
        financeiro: ModuleFinanceiro,
        tarefas: ModuleTarefas,
        metodo: ModuleMetodo,
        aniversariantes: ModuleAniversariantes,
        calendar: ModuleCalendar,
        marketing: ModuleMarketing,
        templates: ModuleTemplates,
        config: ModuleConfig
    },

    currentModule: 'dashboard',

    async init() {
        // Inicializa Supabase (o script @supabase/supabase-js expõe `supabase` globalmente)
        try {
            const sbLib = (typeof window.supabase !== 'undefined' && window.supabase) ? window.supabase : null;
            if (sbLib && typeof sbLib.createClient === 'function' && APP_CONFIG.USE_SUPABASE) {
                window.sb = sbLib.createClient(APP_CONFIG.SUPABASE_URL, APP_CONFIG.SUPABASE_ANON_KEY);
                console.log('✅ Supabase conectado em', APP_CONFIG.SUPABASE_URL);
            } else {
                console.warn('⚠️ supabase-js não disponível — modo demo ativado');
            }
        } catch (e) {
            console.warn('⚠️ Erro ao inicializar Supabase (modo demo):', e.message);
            window.sb = null;
        }

        // Registra Service Worker (PWA)
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js').catch(() => {});
        }

        // Setup navegação
        this.setupNavigation();

        // Setup mobile menu
        document.getElementById('menu-toggle')?.addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('open');
            document.getElementById('sidebar-overlay').classList.toggle('hidden');
        });
        document.getElementById('sidebar-overlay')?.addEventListener('click', () => {
            document.getElementById('sidebar').classList.remove('open');
            document.getElementById('sidebar-overlay').classList.add('hidden');
        });

        // Hash routing
        window.addEventListener('hashchange', () => this.handleRoute());

        // Esconde loading
        setTimeout(() => {
            document.getElementById('loading-screen').style.display = 'none';
            document.getElementById('app').classList.remove('hidden');
        }, 600);

        // Carrega módulo inicial
        await this.handleRoute();

        // Atualiza badges periodicamente
        this.updateBadges();
        setInterval(() => this.updateBadges(), 30000);
    },

    setupNavigation() {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                // Fecha menu mobile
                document.getElementById('sidebar').classList.remove('open');
                document.getElementById('sidebar-overlay').classList.add('hidden');
            });
        });
    },

    async handleRoute() {
        const hash = window.location.hash.replace('#', '') || 'dashboard';
        const module = this.modules[hash];
        if (!module) {
            window.location.hash = 'dashboard';
            return;
        }

        // Atualiza active state
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        const activeLink = document.querySelector(`[data-module="${hash}"]`);
        if (activeLink) activeLink.classList.add('active');

        // Scroll topo
        window.scrollTo(0, 0);

        // Renderiza
        try {
            await module.render();
            this.currentModule = hash;
        } catch (e) {
            console.error(`Erro ao renderizar módulo ${hash}:`, e);
            document.getElementById('module-content').innerHTML = `
                <div class="bg-red-50 border-2 border-red-200 rounded-2xl p-6">
                    <h3 class="font-bold text-red-800 mb-2">❌ Erro ao carregar módulo</h3>
                    <p class="text-sm text-red-700">${e.message}</p>
                </div>`;
        }
    },

    async updateBadges() {
        try {
            const [leads, financeiro, tarefas, alunos] = await Promise.all([
                API.list('leads'), API.list('financeiro'), API.list('tarefas'), API.list('alunos')
            ]);

            // Leads quentes sem follow-up ou com atraso
            const leadsBadge = leads.filter(l => {
                if (l.etapa === 'Fechado') return false;
                const dias = Utils.daysUntil(l.follow_up);
                return l.temperatura === 'Quente' || (dias !== null && dias <= 1);
            }).length;
            this.setBadge('badge-leads', leadsBadge);

            // Financeiro atrasado
            const finBadge = financeiro.filter(f => f.status === 'Atrasado').length;
            this.setBadge('badge-financeiro', finBadge);

            // Tarefas urgentes (alta prioridade + não concluídas)
            const tfBadge = tarefas.filter(t => t.status !== 'Concluída' && t.prioridade === 'Alta').length;
            this.setBadge('badge-tarefas', tfBadge);

            // Aniversariantes do mês
            const aniversariantesBadge = [...alunos, ...leads].filter(p => Utils.isBirthdayThisMonth(p.data_nascimento)).length;
            this.setBadge('badge-aniversariantes', aniversariantesBadge);
        } catch (e) {}
    },

    setBadge(id, count) {
        const el = document.getElementById(id);
        if (el) el.textContent = count > 0 ? count : '';
    }
};

// Bootstrap
document.addEventListener('DOMContentLoaded', () => App.init());
