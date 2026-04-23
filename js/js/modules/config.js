/**
 * Módulo Config - Templates de mensagens e configurações
 */
const ConfigModule = {
  schema: [
    { name:'nome', label:'Nome do template', type:'text', required:true },
    { name:'categoria', label:'Categoria', type:'text', options:['Boas-vindas','Follow-up','Cobrança','Reengajamento','Indicação','Aniversario','Encerramento','Outro'], required:true },
    { name:'canal', label:'Canal', type:'text', options:['WhatsApp','Instagram','Email','SMS'], required:true },
    { name:'conteudo', label:'Conteúdo (use [NOME], [OBJETIVO], etc.)', type:'textarea', required:true }
  ],

  async render(container) {
    const templates = await Cache.get('templates');

    container.innerHTML = `
      ${Components.pageHeader('⚙️ Templates & Configurações', 'Scripts de mensagens prontos para cada etapa',
        `<button class="btn btn-primary" onclick="ConfigModule.openForm()"><i class="fa-solid fa-plus"></i>Novo Template</button>`
      )}

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        ${templates.map(t => `
          <div class="card p-4">
            <div class="flex items-start justify-between mb-2">
              <div>
                <h3 class="font-bold text-slate-800">${Utils.escape(t.nome)}</h3>
                <div class="flex gap-1 mt-1">${Components.pill(t.categoria)}${Components.pill(t.canal)}</div>
              </div>
              <div class="flex gap-1">
                <button class="btn btn-ghost btn-sm" onclick="ConfigModule.openForm('${t.id}')"><i class="fa-solid fa-pen"></i></button>
                <button class="btn btn-ghost btn-sm" onclick="ConfigModule.copyText('${t.id}')"><i class="fa-solid fa-copy"></i></button>
              </div>
            </div>
            <p class="text-sm text-slate-600 whitespace-pre-line bg-slate-50 p-3 rounded-lg max-h-32 overflow-y-auto">${Utils.escape(t.conteudo||'')}</p>
          </div>
        `).join('') || Components.emptyState('💬','Nenhum template cadastrado')}
      </div>

      <!-- Info sobre migração -->
      <div class="card p-5 md:p-6 mt-8 bg-gradient-to-br from-brand-50 to-purple-50 border-2 border-brand-200">
        <h3 class="font-bold text-lg text-brand-900 mb-3">🚀 Próximos Passos — Deploy</h3>
        <p class="text-sm text-slate-700 mb-3">Para colocar seu CRM em produção com banco próprio:</p>
        <ol class="text-sm text-slate-700 space-y-2 list-decimal list-inside">
          <li><strong>Supabase:</strong> Criar projeto, rodar o SQL de schema, configurar Auth</li>
          <li><strong>GitHub:</strong> Subir o código do projeto</li>
          <li><strong>Vercel:</strong> Conectar o repo GitHub, configurar as env vars do Supabase</li>
        </ol>
        <p class="text-sm text-brand-700 mt-3 font-semibold">📄 Consulte o arquivo <code>README.md</code> para o passo a passo completo.</p>
      </div>
    `;
  },

  async copyText(id) {
    const t = await API.get('templates', id);
    await navigator.clipboard.writeText(t.conteudo||'');
    Toast.success('Copiado para área de transferência!');
  },

  async openForm(id=null) {
    let t = { ativo: true };
    if (id) t = await API.get('templates', id);
    Modal.open(id?'Editar Template':'+ Novo Template', `
      <form id="tpl-form" class="space-y-3">
        ${this.schema.map(f => Components.formField(f, t[f.name])).join('')}
        <p class="text-xs text-slate-500">💡 Use placeholders como [NOME], [OBJETIVO], [MÊS], [CHAVE] para personalizar</p>
      </form>
    `, `
      <button class="btn btn-secondary" onclick="Modal.close()">Cancelar</button>
      ${id?`<button class="btn btn-danger" onclick="ConfigModule.remove('${id}')"><i class="fa-solid fa-trash"></i></button>`:''}
      <button class="btn btn-primary" onclick="ConfigModule.save('${id||''}')">Salvar</button>
    `);
  },

  async save(id) {
    const form = document.getElementById('tpl-form');
    if (!form.reportValidity()) return;
    const data = Components.readForm(form, this.schema);
    data.ativo = true;
    if (id) await API.update('templates', id, data);
    else await API.create('templates', data);
    Cache.invalidate('templates');
    Modal.close();
    Toast.success('Template salvo!');
    App.navigate('config');
  },

  remove(id) {
    Modal.confirm('Excluir template?', 'Ação irreversível.', async () => {
      await API.remove('templates', id);
      Cache.invalidate('templates');
      Modal.close();
      Toast.success('Removido');
      App.navigate('config');
    });
  }
};

ModuleRegistry['config'] = ConfigModule;
