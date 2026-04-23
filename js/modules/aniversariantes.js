/* ========================================
   Módulo: Aniversariantes do Mês 🎂
   (melhoria solicitada pela cliente)
   ======================================== */
window.ModuleAniversariantes = {
    mesOffset: 0, // 0 = mês atual, 1 = próximo mês, -1 = anterior

    async render() {
        const [alunos, leads, templates] = await Promise.all([
            API.list('alunos'), API.list('leads'), API.list('templates')
        ]);

        const now = new Date();
        const targetMonth = new Date(now.getFullYear(), now.getMonth() + this.mesOffset, 1);
        const mesNome = Utils.monthName(targetMonth.getMonth());
        const ano = targetMonth.getFullYear();

        // Unir alunos e leads com data de nascimento no mês-alvo
        const pessoas = [
            ...alunos.filter(a => Utils.isBirthdayThisMonth(a.data_nascimento, this.mesOffset))
                .map(a => ({ ...a, tipo: 'aluno' })),
            ...leads.filter(l => Utils.isBirthdayThisMonth(l.data_nascimento, this.mesOffset))
                .map(l => ({ ...l, tipo: 'lead' })),
        ].sort((a, b) => Utils.birthdayDay(a.data_nascimento) - Utils.birthdayDay(b.data_nascimento));

        // Hoje?
        const hoje = now.getDate();
        const aniversarianteHoje = this.mesOffset === 0 ? pessoas.filter(p => Utils.birthdayDay(p.data_nascimento) === hoje) : [];

        const template = templates.find(t => t.categoria === 'Aniversário') ||
            { conteudo: 'Oi {{nome}}! 🎉🎂 Hoje é seu dia! Desejo um feliz aniversário e sucesso na sua jornada com o inglês! 💜' };

        document.getElementById('module-content').innerHTML = `
        <div class="module-fade">
            ${Components.pageHeader(`🎂 Aniversariantes de ${mesNome}`, `${pessoas.length} pessoas fazem aniversário em ${mesNome}/${ano}`, `
                <div class="flex gap-1">
                    <button class="btn btn-secondary btn-sm" onclick="ModuleAniversariantes.setMes(${this.mesOffset-1})"><i class="fas fa-chevron-left"></i></button>
                    <button class="btn btn-secondary btn-sm" onclick="ModuleAniversariantes.setMes(0)">Hoje</button>
                    <button class="btn btn-secondary btn-sm" onclick="ModuleAniversariantes.setMes(${this.mesOffset+1})"><i class="fas fa-chevron-right"></i></button>
                </div>
                <button class="btn btn-primary" onclick="ModuleAniversariantes.exportarLista()"><i class="fas fa-download"></i> Exportar</button>
            `)}

            ${aniversarianteHoje.length > 0 ? `
            <div class="bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-2xl p-6 mb-6 shadow-lg">
                <div class="flex items-center gap-4">
                    <span class="text-6xl animate-bounce">🎉</span>
                    <div>
                        <h3 class="text-2xl font-bold">Hoje é aniversário!</h3>
                        <p class="text-pink-100">${aniversarianteHoje.map(p => p.nome).join(', ')} - não esqueça de mandar uma mensagem! 🎂</p>
                    </div>
                </div>
                <div class="mt-4 flex flex-wrap gap-2">
                    ${aniversarianteHoje.map(p => {
                        const msg = template.conteudo.replace('{{nome}}', p.nome);
                        return `<a href="${Utils.whatsappLink(p.telefone, msg)}" target="_blank" class="btn bg-white text-pink-600 hover:bg-pink-50"><i class="fab fa-whatsapp"></i> Parabenizar ${p.nome.split(' ')[0]}</a>`;
                    }).join('')}
                </div>
            </div>` : ''}

            <!-- KPIs -->
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                ${Components.kpiCard({label:'Total no mês', value: pessoas.length, icon:'birthday-cake', color:'pink'})}
                ${Components.kpiCard({label:'Alunos', value: pessoas.filter(p => p.tipo === 'aluno').length, icon:'user-graduate', color:'brand'})}
                ${Components.kpiCard({label:'Leads', value: pessoas.filter(p => p.tipo === 'lead').length, icon:'magnet', color:'yellow'})}
                ${Components.kpiCard({label:'Hoje', value: aniversarianteHoje.length, icon:'gift', color:'red'})}
            </div>

            <!-- Lista -->
            ${pessoas.length === 0 ? Components.emptyState('birthday-cake', `Nenhum aniversariante em ${mesNome}`, `<p class="text-sm text-gray-500 mt-2">Cadastre a data de nascimento dos alunos e leads para aparecer aqui.</p>`) : `
            <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                ${pessoas.map(p => {
                    const dia = Utils.birthdayDay(p.data_nascimento);
                    const idade = Utils.age(p.data_nascimento) + (this.mesOffset >= 0 ? 1 : 0); // idade que vai completar
                    const ehHoje = this.mesOffset === 0 && dia === hoje;
                    const msg = template.conteudo.replace('{{nome}}', p.nome);
                    return `
                    <div class="${ehHoje?'birthday-card':'bg-white'} rounded-2xl p-5 border-2 ${ehHoje?'':'border-gray-100'} transition hover:shadow-lg">
                        <div class="flex items-start gap-3 mb-3">
                            <div class="relative">
                                ${Components.avatar(p.nome, 48)}
                                ${ehHoje ? '<span class="absolute -top-2 -right-2 text-xl">🎉</span>' : ''}
                            </div>
                            <div class="flex-1 min-w-0">
                                <p class="font-bold truncate">${p.nome}</p>
                                <p class="text-xs text-gray-500">${p.tipo === 'aluno' ? '👩‍🎓 Aluno' : '🧲 Lead'}</p>
                            </div>
                        </div>
                        <div class="space-y-1 text-sm mb-3">
                            <p><strong>📅 Dia:</strong> ${dia} de ${mesNome}</p>
                            <p><strong>🎈 Completa:</strong> ${idade} anos</p>
                            ${p.telefone ? `<p><strong>📞</strong> ${p.telefone}</p>` : ''}
                            ${p.objetivo ? `<p class="text-brand-700"><strong>🎯</strong> ${p.objetivo}</p>` : ''}
                        </div>
                        <div class="flex gap-2">
                            <a href="${Utils.whatsappLink(p.telefone, msg)}" target="_blank" class="btn btn-success btn-sm flex-1 justify-center"><i class="fab fa-whatsapp"></i> Parabenizar</a>
                            <button class="btn btn-secondary btn-sm" onclick="ModuleAniversariantes.verPessoa('${p.tipo}', '${p.id}')"><i class="fas fa-eye"></i></button>
                        </div>
                    </div>`;
                }).join('')}
            </div>`}
        </div>`;
    },

    setMes(offset) { this.mesOffset = offset; this.render(); },

    verPessoa(tipo, id) {
        if (tipo === 'aluno') ModuleAlunos.openDetail(id);
        else ModuleLeads.openDetail(id);
    },

    async exportarLista() {
        const [alunos, leads] = await Promise.all([API.list('alunos'), API.list('leads')]);
        const pessoas = [
            ...alunos.filter(a => Utils.isBirthdayThisMonth(a.data_nascimento, this.mesOffset)).map(a => ({ ...a, tipo: 'aluno' })),
            ...leads.filter(l => Utils.isBirthdayThisMonth(l.data_nascimento, this.mesOffset)).map(l => ({ ...l, tipo: 'lead' })),
        ].sort((a, b) => Utils.birthdayDay(a.data_nascimento) - Utils.birthdayDay(b.data_nascimento));

        if (pessoas.length === 0) { Utils.toast('Nenhum aniversariante para exportar', 'warning'); return; }

        // CSV
        const headers = ['Tipo','Nome','Telefone','Email','Data Nascimento','Dia','Idade','Objetivo'];
        const rows = pessoas.map(p => [
            p.tipo, p.nome, p.telefone||'', p.email||'',
            Utils.formatDate(p.data_nascimento), Utils.birthdayDay(p.data_nascimento),
            Utils.age(p.data_nascimento)||'', p.objetivo||''
        ]);
        const csv = [headers.join(';'), ...rows.map(r => r.map(v => `"${v}"`).join(';'))].join('\n');
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `aniversariantes_${Utils.monthName(new Date().getMonth() + this.mesOffset).toLowerCase()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        Utils.toast('CSV exportado!', 'success');
    }
};
