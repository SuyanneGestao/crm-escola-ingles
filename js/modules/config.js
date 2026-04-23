/* ========================================
   Módulo: Configurações
   ======================================== */
window.ModuleConfig = {
    async render() {
        const cfg = window.APP_CONFIG;
        const conectado = !!window.sb;

        document.getElementById('module-content').innerHTML = `
        <div class="module-fade">
            ${Components.pageHeader('⚙️ Configurações', 'Integrações e preferências do sistema', '')}

            <div class="space-y-4 max-w-3xl">

                <!-- Supabase -->
                <div class="bg-white rounded-2xl p-6 border border-gray-100">
                    <div class="flex items-center gap-3 mb-4">
                        <div class="w-12 h-12 rounded-xl bg-green-100 text-green-700 flex items-center justify-center text-2xl">🗄️</div>
                        <div>
                            <h3 class="font-bold text-lg">Supabase (Banco de Dados)</h3>
                            <p class="text-sm text-gray-500">PostgreSQL + Auth + Storage</p>
                        </div>
                        <span class="ml-auto pill ${conectado?'pill-green':'pill-yellow'}">${conectado?'✅ Conectado':'⚠️ Modo demo'}</span>
                    </div>
                    <div class="space-y-2 text-sm">
                        <p><strong>URL:</strong> <code class="bg-gray-100 px-2 py-1 rounded">${cfg.SUPABASE_URL}</code></p>
                        <p><strong>Anon Key:</strong> <code class="bg-gray-100 px-2 py-1 rounded">${cfg.SUPABASE_ANON_KEY.slice(0,30)}...</code></p>
                        <p class="text-xs text-gray-500 mt-3">Para alterar, edite <code>js/config.js</code></p>
                    </div>
                </div>

                <!-- Google Calendar -->
                <div class="bg-white rounded-2xl p-6 border border-gray-100">
                    <div class="flex items-center gap-3 mb-4">
                        <div class="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center text-2xl"><i class="fab fa-google"></i></div>
                        <div>
                            <h3 class="font-bold text-lg">Google Calendar</h3>
                            <p class="text-sm text-gray-500">Sincronização de eventos e lembretes</p>
                        </div>
                        <span class="ml-auto pill ${cfg.GOOGLE_CLIENT_ID?'pill-green':'pill-yellow'}">${cfg.GOOGLE_CLIENT_ID?'Configurado':'Pendente'}</span>
                    </div>
                    <p class="text-sm text-gray-600 mb-3">Configure as chaves no Google Cloud Console e edite <code>js/config.js</code>.</p>
                    <a href="#calendar" class="btn btn-primary btn-sm">Ir para o módulo Calendar →</a>
                </div>

                <!-- PWA -->
                <div class="bg-white rounded-2xl p-6 border border-gray-100">
                    <div class="flex items-center gap-3 mb-4">
                        <div class="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center text-2xl">📱</div>
                        <div>
                            <h3 class="font-bold text-lg">App Mobile (PWA)</h3>
                            <p class="text-sm text-gray-500">Instale no celular como um app</p>
                        </div>
                    </div>
                    <p class="text-sm text-gray-600 mb-3">No Chrome/Safari do celular, abra o menu e toque em <strong>"Adicionar à tela inicial"</strong>.</p>
                </div>

                <!-- Ações perigosas -->
                <div class="bg-red-50 rounded-2xl p-6 border-2 border-red-200">
                    <h3 class="font-bold text-red-800 mb-3">⚠️ Zona de Perigo</h3>
                    <button class="btn btn-danger" onclick="ModuleConfig.limparCache()"><i class="fas fa-broom"></i> Limpar cache local</button>
                </div>

                <div class="text-center text-xs text-gray-400 py-4">
                    Central de Gestão v${cfg.APP_VERSION} · Feito com 💜 para Suyanne Gestão
                </div>
            </div>
        </div>`;
    },

    limparCache() {
        Utils.confirm('Limpar cache local? O app vai recarregar.', () => {
            if ('caches' in window) caches.keys().then(k => k.forEach(c => caches.delete(c)));
            localStorage.clear();
            Utils.toast('Cache limpo! Recarregando...', 'success');
            setTimeout(() => location.reload(), 1000);
        });
    }
};
