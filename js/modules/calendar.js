/* ========================================
   Módulo: Integração Google Calendar 📅
   (melhoria solicitada pela cliente)
   ======================================== */
window.ModuleCalendar = {
    gapiLoaded: false,
    gisLoaded: false,
    tokenClient: null,
    accessToken: null,
    events: [],

    async render() {
        const cfg = window.APP_CONFIG;
        const configured = cfg.GOOGLE_CLIENT_ID && cfg.GOOGLE_API_KEY;
        const connected = !!this.accessToken;

        document.getElementById('module-content').innerHTML = `
        <div class="module-fade">
            ${Components.pageHeader('📅 Google Calendar', 'Sincronize aulas, follow-ups e vencimentos com sua agenda Google', '')}

            ${!configured ? `
            <div class="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-6 mb-6">
                <div class="flex items-start gap-3">
                    <i class="fas fa-exclamation-triangle text-yellow-600 text-2xl"></i>
                    <div class="flex-1">
                        <h3 class="font-bold text-yellow-800 mb-2">Configuração pendente</h3>
                        <p class="text-sm text-yellow-700 mb-3">Para usar a integração com Google Calendar, você precisa configurar as chaves do Google Cloud Console.</p>
                        <details class="text-sm bg-white rounded-lg p-3 border border-yellow-200">
                            <summary class="cursor-pointer font-semibold text-yellow-800">📖 Ver passo a passo</summary>
                            <ol class="list-decimal list-inside mt-3 space-y-2 text-gray-700">
                                <li>Acesse <a href="https://console.cloud.google.com" target="_blank" class="text-brand-700 underline">Google Cloud Console</a></li>
                                <li>Crie um novo projeto (ex: "Escola Inglês CRM")</li>
                                <li>Vá em <strong>APIs & Services → Library</strong>, busque e habilite <strong>Google Calendar API</strong></li>
                                <li>Em <strong>Credentials</strong>, crie:
                                    <ul class="list-disc list-inside ml-4 mt-1">
                                        <li><strong>API Key</strong> → copie o valor</li>
                                        <li><strong>OAuth 2.0 Client ID</strong> (Web application)
                                            <ul class="list-disc list-inside ml-4">
                                                <li>Authorized JavaScript origins: sua URL do Vercel</li>
                                                <li>Copie o Client ID</li>
                                            </ul>
                                        </li>
                                    </ul>
                                </li>
                                <li>Em <strong>OAuth consent screen</strong>, adicione o escopo <code>.../auth/calendar</code></li>
                                <li>Abra <code>js/config.js</code> no seu projeto e preencha:
                                    <pre class="bg-gray-100 p-2 rounded mt-1 text-xs">GOOGLE_CLIENT_ID: 'seu-client-id.apps.googleusercontent.com',
GOOGLE_API_KEY: 'sua-api-key',</pre>
                                </li>
                                <li>Salve, faça commit e push. Pronto! 🎉</li>
                            </ol>
                        </details>
                    </div>
                </div>
            </div>` : ''}

            <div class="bg-white rounded-2xl p-6 border border-gray-100 mb-6">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <i class="fab fa-google text-3xl text-blue-500"></i>
                        <div>
                            <h3 class="font-bold">${connected ? '✅ Conectado' : 'Google Calendar'}</h3>
                            <p class="text-sm text-gray-500">${connected ? 'Você pode sincronizar eventos' : 'Autorize o acesso à sua agenda'}</p>
                        </div>
                    </div>
                    ${configured ? (connected ?
                        `<button class="btn btn-secondary" onclick="ModuleCalendar.signOut()"><i class="fas fa-sign-out-alt"></i> Desconectar</button>` :
                        `<button class="btn btn-primary" onclick="ModuleCalendar.signIn()"><i class="fab fa-google"></i> Conectar</button>`
                    ) : `<button class="btn btn-secondary" disabled>Configure primeiro</button>`}
                </div>
            </div>

            ${connected ? `
            <div class="grid md:grid-cols-2 gap-4 mb-6">
                <div class="bg-white rounded-2xl p-5 border border-gray-100">
                    <h3 class="font-bold mb-3">📝 Criar evento rápido</h3>
                    <form id="evt-form" class="space-y-3">
                        <input class="input" name="titulo" placeholder="Título do evento" required>
                        <div class="grid grid-cols-2 gap-3">
                            <input type="datetime-local" class="input" name="inicio" required>
                            <input type="datetime-local" class="input" name="fim" required>
                        </div>
                        <textarea class="textarea" name="descricao" rows="2" placeholder="Descrição (opcional)"></textarea>
                        <button type="submit" class="btn btn-primary w-full"><i class="fas fa-plus"></i> Criar no Google Calendar</button>
                    </form>
                </div>
                <div class="bg-white rounded-2xl p-5 border border-gray-100">
                    <h3 class="font-bold mb-3">🔄 Sincronização automática</h3>
                    <p class="text-sm text-gray-600 mb-3">Crie automaticamente eventos no Google Calendar a partir de:</p>
                    <div class="space-y-2">
                        <button class="btn btn-secondary w-full justify-start" onclick="ModuleCalendar.syncTurmas()"><i class="fas fa-chalkboard"></i> Sincronizar aulas das turmas</button>
                        <button class="btn btn-secondary w-full justify-start" onclick="ModuleCalendar.syncFollowUps()"><i class="fas fa-phone"></i> Sincronizar follow-ups de leads</button>
                        <button class="btn btn-secondary w-full justify-start" onclick="ModuleCalendar.syncVencimentos()"><i class="fas fa-dollar-sign"></i> Sincronizar vencimentos</button>
                        <button class="btn btn-secondary w-full justify-start" onclick="ModuleCalendar.syncAniversarios()"><i class="fas fa-birthday-cake"></i> Sincronizar aniversários</button>
                    </div>
                </div>
            </div>

            <div class="bg-white rounded-2xl p-5 border border-gray-100">
                <div class="flex items-center justify-between mb-3">
                    <h3 class="font-bold">📋 Próximos eventos (Google Calendar)</h3>
                    <button class="btn btn-secondary btn-sm" onclick="ModuleCalendar.loadEvents()"><i class="fas fa-sync"></i> Atualizar</button>
                </div>
                <div id="google-events">
                    <p class="text-sm text-gray-500">Clique em "Atualizar" para carregar seus eventos.</p>
                </div>
            </div>
            ` : ''}
        </div>`;

        if (connected) {
            const form = document.getElementById('evt-form');
            if (form) {
                form.onsubmit = async (e) => {
                    e.preventDefault();
                    const d = Utils.getFormData('evt-form');
                    await this.createEvent({ titulo: d.titulo, inicio: d.inicio, fim: d.fim, descricao: d.descricao });
                    form.reset();
                };
            }
            this.loadEvents();
        }
    },

    async loadGapi() {
        if (this.gapiLoaded) return;
        await new Promise((resolve) => {
            const s1 = document.createElement('script');
            s1.src = 'https://apis.google.com/js/api.js';
            s1.onload = () => gapi.load('client', async () => {
                await gapi.client.init({
                    apiKey: APP_CONFIG.GOOGLE_API_KEY,
                    discoveryDocs: [APP_CONFIG.GOOGLE_DISCOVERY_DOC],
                });
                this.gapiLoaded = true;
                resolve();
            });
            document.body.appendChild(s1);
        });
        await new Promise((resolve) => {
            const s2 = document.createElement('script');
            s2.src = 'https://accounts.google.com/gsi/client';
            s2.onload = () => {
                this.tokenClient = google.accounts.oauth2.initTokenClient({
                    client_id: APP_CONFIG.GOOGLE_CLIENT_ID,
                    scope: APP_CONFIG.GOOGLE_SCOPES,
                    callback: (resp) => {
                        if (resp.access_token) {
                            this.accessToken = resp.access_token;
                            Utils.toast('Google Calendar conectado! 🎉', 'success');
                            this.render();
                        }
                    },
                });
                this.gisLoaded = true;
                resolve();
            };
            document.body.appendChild(s2);
        });
    },

    async signIn() {
        try {
            await this.loadGapi();
            this.tokenClient.requestAccessToken({ prompt: 'consent' });
        } catch (e) {
            console.error(e);
            Utils.toast('Erro ao conectar: ' + e.message, 'error');
        }
    },

    signOut() {
        if (this.accessToken) {
            google.accounts.oauth2.revoke(this.accessToken, () => {
                this.accessToken = null;
                Utils.toast('Desconectado', 'info');
                this.render();
            });
        }
    },

    async loadEvents() {
        if (!this.accessToken) return;
        try {
            const resp = await gapi.client.calendar.events.list({
                calendarId: 'primary',
                timeMin: new Date().toISOString(),
                showDeleted: false, singleEvents: true,
                maxResults: 20, orderBy: 'startTime',
            });
            this.events = resp.result.items || [];
            const container = document.getElementById('google-events');
            if (this.events.length === 0) {
                container.innerHTML = '<p class="text-sm text-gray-500">Nenhum evento futuro.</p>';
                return;
            }
            container.innerHTML = this.events.map(e => {
                const start = e.start.dateTime || e.start.date;
                return `
                <div class="flex items-start gap-3 p-3 border-b border-gray-100 last:border-0">
                    <div class="w-12 h-12 rounded-lg bg-brand-100 text-brand-700 flex flex-col items-center justify-center flex-shrink-0">
                        <span class="text-[10px] uppercase font-bold">${new Date(start).toLocaleDateString('pt-BR', { month: 'short' })}</span>
                        <span class="text-lg font-bold">${new Date(start).getDate()}</span>
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="font-semibold text-sm">${e.summary||'(Sem título)'}</p>
                        <p class="text-xs text-gray-500">${Utils.formatDateTime(start)}</p>
                        ${e.description ? `<p class="text-xs text-gray-600 mt-1 truncate">${e.description}</p>` : ''}
                    </div>
                    <a href="${e.htmlLink}" target="_blank" class="text-brand-600 text-sm hover:underline">Abrir</a>
                </div>`;
            }).join('');
        } catch (err) {
            console.error(err);
            Utils.toast('Erro ao carregar eventos', 'error');
        }
    },

    async createEvent({ titulo, inicio, fim, descricao }) {
        if (!this.accessToken) {
            Utils.toast('Conecte o Google Calendar primeiro', 'warning');
            return null;
        }
        try {
            const resp = await gapi.client.calendar.events.insert({
                calendarId: 'primary',
                resource: {
                    summary: titulo,
                    description: descricao || '',
                    start: { dateTime: new Date(inicio).toISOString(), timeZone: 'America/Sao_Paulo' },
                    end: { dateTime: new Date(fim).toISOString(), timeZone: 'America/Sao_Paulo' },
                },
            });
            Utils.toast('Evento criado no Google Calendar! 📅', 'success');
            this.loadEvents();
            return resp.result;
        } catch (err) {
            console.error(err);
            Utils.toast('Erro ao criar evento', 'error');
            return null;
        }
    },

    async createEventFromTask(task) {
        const start = task.prazo ? new Date(task.prazo + 'T09:00:00') : new Date();
        const end = new Date(start.getTime() + 60 * 60 * 1000);
        const evt = await this.createEvent({
            titulo: `📋 ${task.titulo}`,
            inicio: start.toISOString().slice(0,16),
            fim: end.toISOString().slice(0,16),
            descricao: `Tarefa: ${task.titulo}\nCategoria: ${task.categoria}\nPrioridade: ${task.prioridade}\nResponsável: ${task.responsavel||'—'}`
        });
        if (evt) await API.update('tarefas', task.id, { google_event_id: evt.id });
    },

    async syncTurmas() {
        if (!this.accessToken) return Utils.toast('Conecte primeiro', 'warning');
        const turmas = await API.list('turmas');
        const ativas = turmas.filter(t => t.status === 'Ativa' && t.horario);
        if (ativas.length === 0) return Utils.toast('Nenhuma turma ativa com horário', 'warning');

        Utils.toast(`Sincronizando ${ativas.length} turmas...`, 'info');
        let count = 0;
        for (const t of ativas) {
            // Próxima ocorrência (simplificado: amanhã no horário)
            const [h, m] = (t.horario.split('-')[0] || '19:00').split(':');
            const start = new Date();
            start.setDate(start.getDate() + 1);
            start.setHours(parseInt(h)||19, parseInt(m)||0, 0);
            const end = new Date(start.getTime() + 90 * 60 * 1000);
            const evt = await this.createEvent({
                titulo: `📚 Aula: ${t.nome}`,
                inicio: start.toISOString().slice(0,16),
                fim: end.toISOString().slice(0,16),
                descricao: `Turma: ${t.nome}\nDias: ${t.dias}\nHorário: ${t.horario}\n${t.link_aula||''}`
            });
            if (evt) count++;
        }
        Utils.toast(`${count} aulas sincronizadas! ✅`, 'success');
    },

    async syncFollowUps() {
        const leads = await API.list('leads');
        const toSync = leads.filter(l => l.follow_up && l.etapa !== 'Fechado');
        if (toSync.length === 0) return Utils.toast('Nenhum follow-up pendente', 'warning');
        let count = 0;
        for (const l of toSync) {
            const start = new Date(l.follow_up + 'T10:00:00');
            const end = new Date(start.getTime() + 30 * 60 * 1000);
            const evt = await this.createEvent({
                titulo: `📞 Follow-up: ${l.nome}`,
                inicio: start.toISOString().slice(0,16),
                fim: end.toISOString().slice(0,16),
                descricao: `Lead: ${l.nome}\nCanal: ${l.canal}\nObjetivo: ${l.objetivo||'—'}\nTel: ${l.telefone||'—'}\n\nObs: ${l.observacoes||''}`
            });
            if (evt) count++;
        }
        Utils.toast(`${count} follow-ups sincronizados! ✅`, 'success');
    },

    async syncVencimentos() {
        const fin = await API.list('financeiro');
        const toSync = fin.filter(f => f.status === 'Pendente');
        if (toSync.length === 0) return Utils.toast('Nenhum vencimento pendente', 'warning');
        const alunos = await API.list('alunos');
        const alunoMap = Object.fromEntries(alunos.map(a => [a.id, a.nome]));
        let count = 0;
        for (const f of toSync) {
            const start = new Date(f.vencimento + 'T09:00:00');
            const end = new Date(start.getTime() + 30 * 60 * 1000);
            const evt = await this.createEvent({
                titulo: `💰 Venc: ${alunoMap[f.aluno_id]||''} - ${Utils.formatMoney(f.valor)}`,
                inicio: start.toISOString().slice(0,16),
                fim: end.toISOString().slice(0,16),
                descricao: `${f.descricao}\nValor: ${Utils.formatMoney(f.valor)}\nForma: ${f.forma||'—'}`
            });
            if (evt) count++;
        }
        Utils.toast(`${count} vencimentos sincronizados! ✅`, 'success');
    },

    async syncAniversarios() {
        const [alunos, leads] = await Promise.all([API.list('alunos'), API.list('leads')]);
        const pessoas = [...alunos, ...leads].filter(p => p.data_nascimento);
        if (pessoas.length === 0) return Utils.toast('Nenhuma data de nascimento cadastrada', 'warning');
        let count = 0;
        const now = new Date();
        for (const p of pessoas) {
            const dob = new Date(p.data_nascimento);
            const thisYear = new Date(now.getFullYear(), dob.getMonth(), dob.getDate(), 9, 0);
            if (thisYear < now) thisYear.setFullYear(now.getFullYear() + 1);
            const end = new Date(thisYear.getTime() + 30 * 60 * 1000);
            const evt = await this.createEvent({
                titulo: `🎂 Aniversário de ${p.nome}`,
                inicio: thisYear.toISOString().slice(0,16),
                fim: end.toISOString().slice(0,16),
                descricao: `Não esquecer de parabenizar!\nTel: ${p.telefone||'—'}\nObjetivo: ${p.objetivo||'—'}`
            });
            if (evt) count++;
        }
        Utils.toast(`${count} aniversários sincronizados! 🎂`, 'success');
    }
};
