/* ========================================
   Camada de API - Supabase + Fallback Demo
   ========================================
   Toda comunicação com o banco passa por aqui.
   Se Supabase não responder, cai em dados demo em memória.
   ======================================== */

window.API = (() => {
    const cache = {};
    const CACHE_TTL = 15000; // 15s

    // ------- Dados Demo (fallback quando Supabase não responde) -------
    const demoData = {
        leads: [
            { id: 'l1', nome: 'Mariana Silva', email: 'mariana@email.com', telefone: '11988887777', canal: 'Instagram', etapa: 'Novo', temperatura: 'Quente', objetivo: 'Intercâmbio', data_nascimento: '1998-04-15', follow_up: '2026-04-23', observacoes: 'Quer fazer intercâmbio no Canadá em 2027', created_at: '2026-04-20T10:00:00Z' },
            { id: 'l2', nome: 'Carlos Mendes', email: 'carlos@email.com', telefone: '11977776666', canal: 'Indicação', etapa: 'Contato', temperatura: 'Morno', objetivo: 'Trabalho', data_nascimento: '1985-05-22', follow_up: '2026-04-24', observacoes: 'Indicado pela Joana', created_at: '2026-04-18T14:30:00Z' },
            { id: 'l3', nome: 'Paula Rocha', email: 'paula@email.com', telefone: '11966665555', canal: 'WhatsApp', etapa: 'Proposta', temperatura: 'Quente', objetivo: 'Fluência', data_nascimento: '1992-04-30', follow_up: '2026-04-22', observacoes: 'Quer começar em maio', created_at: '2026-04-15T09:15:00Z' },
            { id: 'l4', nome: 'Rafael Souza', email: 'rafa@email.com', telefone: '11955554444', canal: 'Instagram', etapa: 'Negociação', temperatura: 'Quente', objetivo: 'Viagem', data_nascimento: '1990-06-10', follow_up: '2026-04-22', observacoes: 'Pediu desconto', created_at: '2026-04-12T16:00:00Z' },
            { id: 'l5', nome: 'Juliana Costa', email: 'ju@email.com', telefone: '11944443333', canal: 'Indicação', etapa: 'Novo', temperatura: 'Frio', objetivo: 'Prova', data_nascimento: '2000-11-03', follow_up: '2026-04-25', observacoes: 'IELTS 7.0', created_at: '2026-04-21T11:20:00Z' },
        ],
        alunos: [
            { id: 'a1', nome: 'Ana Beatriz', email: 'ana@email.com', telefone: '11933332222', nivel: 'Intermediário', turno: 'Noite', status: 'Ativo', objetivo: 'Intercâmbio', data_nascimento: '1995-04-25', turma_id: 't1', fase_metodo: 'Fase 2 - Speaking', progresso: 45, data_inicio: '2026-01-15', canal_origem: 'Instagram' },
            { id: 'a2', nome: 'Bruno Lima', email: 'bruno@email.com', telefone: '11922221111', nivel: 'Básico', turno: 'Manhã', status: 'Ativo', objetivo: 'Trabalho', data_nascimento: '1988-05-12', turma_id: 't2', fase_metodo: 'Fase 1 - Fundamentos', progresso: 20, data_inicio: '2026-03-01', canal_origem: 'Indicação' },
            { id: 'a3', nome: 'Camila Duarte', email: 'camila@email.com', telefone: '11911110000', nivel: 'Avançado', turno: 'Noite', status: 'Ativo', objetivo: 'Fluência', data_nascimento: '1993-04-08', turma_id: 't1', fase_metodo: 'Fase 4 - Conversação', progresso: 75, data_inicio: '2025-09-10', canal_origem: 'WhatsApp' },
            { id: 'a4', nome: 'Diego Alves', email: 'diego@email.com', telefone: '11900009999', nivel: 'Intermediário', turno: 'Tarde', status: 'Pausado', objetivo: 'Prova', data_nascimento: '1999-07-20', turma_id: null, fase_metodo: 'Fase 2 - Speaking', progresso: 40, data_inicio: '2025-11-01', canal_origem: 'Instagram' },
            { id: 'a5', nome: 'Eduarda Pinto', email: 'edu@email.com', telefone: '11899998888', nivel: 'Básico', turno: 'Manhã', status: 'Ativo', objetivo: 'Viagem', data_nascimento: '1991-04-18', turma_id: 't2', fase_metodo: 'Fase 1 - Fundamentos', progresso: 15, data_inicio: '2026-04-01', canal_origem: 'Indicação' },
        ],
        turmas: [
            { id: 't1', nome: 'Intermediário Noite', professor_id: 'p1', dias: 'Ter/Qui', horario: '19:00-20:30', nivel: 'Intermediário', status: 'Ativa', capacidade: 8, link_aula: 'https://meet.google.com/abc-def-ghi' },
            { id: 't2', nome: 'Básico Manhã', professor_id: 'p2', dias: 'Seg/Qua/Sex', horario: '08:00-09:00', nivel: 'Básico', status: 'Ativa', capacidade: 10, link_aula: 'https://meet.google.com/xyz-uvw-rst' },
            { id: 't3', nome: 'Avançado Conversação', professor_id: 'p1', dias: 'Sáb', horario: '10:00-12:00', nivel: 'Avançado', status: 'Em formação', capacidade: 6, link_aula: '' },
        ],
        professores: [
            { id: 'p1', nome: 'Prof. Rebecca Santos', email: 'rebecca@email.com', telefone: '11988889999', niveis: ['Intermediário', 'Avançado'], disponibilidade: 'Noite, Sábado manhã', dias: 'Ter, Qui, Sáb', valor_hora: 80 },
            { id: 'p2', nome: 'Prof. Michael Torres', email: 'michael@email.com', telefone: '11977778888', niveis: ['Básico', 'Intermediário'], disponibilidade: 'Manhã, Tarde', dias: 'Seg, Qua, Sex', valor_hora: 70 },
        ],
        financeiro: [
            { id: 'f1', aluno_id: 'a1', descricao: 'Mensalidade Abril', valor: 450, vencimento: '2026-04-10', status: 'Pago', forma: 'PIX', mes_ref: '2026-04' },
            { id: 'f2', aluno_id: 'a2', descricao: 'Mensalidade Abril', valor: 450, vencimento: '2026-04-15', status: 'Pago', forma: 'Cartão', mes_ref: '2026-04' },
            { id: 'f3', aluno_id: 'a3', descricao: 'Mensalidade Abril', valor: 550, vencimento: '2026-04-20', status: 'Pendente', forma: 'PIX', mes_ref: '2026-04' },
            { id: 'f4', aluno_id: 'a5', descricao: 'Mensalidade Abril', valor: 450, vencimento: '2026-04-05', status: 'Atrasado', forma: 'Boleto', mes_ref: '2026-04' },
            { id: 'f5', aluno_id: 'a1', descricao: 'Mensalidade Maio', valor: 450, vencimento: '2026-05-10', status: 'Pendente', forma: 'PIX', mes_ref: '2026-05' },
        ],
        tarefas: [
            { id: 'tk1', titulo: 'Ligar para Rafael (negociação)', categoria: 'Vendas', prioridade: 'Alta', status: 'A fazer', prazo: '2026-04-22', responsavel: 'Suyanne' },
            { id: 'tk2', titulo: 'Enviar material Fase 2 para Ana', categoria: 'Pedagógico', prioridade: 'Média', status: 'Em andamento', prazo: '2026-04-23', responsavel: 'Suyanne' },
            { id: 'tk3', titulo: 'Cobrar Eduarda (atraso)', categoria: 'Financeiro', prioridade: 'Alta', status: 'A fazer', prazo: '2026-04-22', responsavel: 'Suyanne' },
            { id: 'tk4', titulo: 'Post Instagram sobre método', categoria: 'Marketing', prioridade: 'Baixa', status: 'A fazer', prazo: '2026-04-26', responsavel: 'Suyanne' },
            { id: 'tk5', titulo: 'Avaliar progresso turma t1', categoria: 'Pedagógico', prioridade: 'Média', status: 'Concluída', prazo: '2026-04-19', responsavel: 'Prof. Rebecca' },
        ],
        metodo_fases: [
            { id: 'mf1', ordem: 1, nome: 'Fase 1 - Fundamentos', descricao: 'Vocabulário básico, presente simples, pronunciação', duracao_semanas: 8 },
            { id: 'mf2', ordem: 2, nome: 'Fase 2 - Speaking', descricao: 'Conversação guiada, verbos irregulares, past/future', duracao_semanas: 10 },
            { id: 'mf3', ordem: 3, nome: 'Fase 3 - Immersion', descricao: 'Imersão em mídia (séries/podcasts), listening ativo', duracao_semanas: 8 },
            { id: 'mf4', ordem: 4, nome: 'Fase 4 - Conversação', descricao: 'Debates livres, expressões idiomáticas, phrasal verbs', duracao_semanas: 12 },
            { id: 'mf5', ordem: 5, nome: 'Fase 5 - Fluência', descricao: 'Prática em contextos reais, certificação', duracao_semanas: 6 },
        ],
        marketing: [
            { id: 'mk1', canal: 'Instagram', investimento: 800, leads_gerados: 24, alunos_convertidos: 4, mes_ref: '2026-04' },
            { id: 'mk2', canal: 'Indicação', investimento: 150, leads_gerados: 12, alunos_convertidos: 6, mes_ref: '2026-04' },
            { id: 'mk3', canal: 'WhatsApp', investimento: 0, leads_gerados: 8, alunos_convertidos: 3, mes_ref: '2026-04' },
            { id: 'mk4', canal: 'Google Ads', investimento: 500, leads_gerados: 10, alunos_convertidos: 2, mes_ref: '2026-04' },
        ],
        templates: [
            { id: 'tp1', categoria: 'Boas-vindas', nome: 'Novo Lead Instagram', canal: 'WhatsApp', conteudo: 'Oi {{nome}}! 💜 Vi que você se interessou pela nossa mentoria de inglês pelo Instagram. Posso te explicar como funciona o método?' },
            { id: 'tp2', categoria: 'Follow-up', nome: 'Lead sem resposta', canal: 'WhatsApp', conteudo: 'Oi {{nome}}, tudo bem? Passando aqui pra saber se ainda tem interesse em começar seu inglês com a gente 🚀' },
            { id: 'tp3', categoria: 'Cobrança', nome: 'Mensalidade atrasada', canal: 'WhatsApp', conteudo: 'Oi {{nome}}! Sua mensalidade de {{mes}} venceu em {{vencimento}}. Posso te ajudar com o pagamento?' },
            { id: 'tp4', categoria: 'Reengajamento', nome: 'Aluno sumido', canal: 'WhatsApp', conteudo: 'Oi {{nome}}! Senti sua falta nas últimas aulas. Tá tudo bem? Vamos retomar? 💪' },
            { id: 'tp5', categoria: 'Conversão', nome: 'Proposta enviada', canal: 'WhatsApp', conteudo: 'Oi {{nome}}! Acabei de te enviar a proposta com todos os detalhes. Me confirma quando puder olhar?' },
        ],
    };

    // ----------- Helpers -----------
    function genId() { return 'id_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }

    function invalidateCache(table) { delete cache[table]; }

    async function supabaseGet(table) {
        if (!window.sb) throw new Error('Supabase não conectado');
        const { data, error } = await window.sb.from(table).select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
    }

    async function supabaseInsert(table, row) {
        if (!window.sb) throw new Error('Supabase não conectado');
        const { data, error } = await window.sb.from(table).insert(row).select().single();
        if (error) throw error;
        return data;
    }

    async function supabaseUpdate(table, id, row) {
        if (!window.sb) throw new Error('Supabase não conectado');
        const { data, error } = await window.sb.from(table).update(row).eq('id', id).select().single();
        if (error) throw error;
        return data;
    }

    async function supabaseDelete(table, id) {
        if (!window.sb) throw new Error('Supabase não conectado');
        const { error } = await window.sb.from(table).delete().eq('id', id);
        if (error) throw error;
        return true;
    }

    // ----------- API Pública -----------
    async function list(table) {
        // Cache
        const cached = cache[table];
        if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data;

        let data;
        try {
            if (window.sb && APP_CONFIG.USE_SUPABASE) {
                data = await supabaseGet(table);
                // Se banco está vazio, semeia com demo (opcional para dev)
                if (data.length === 0 && demoData[table]) {
                    data = JSON.parse(JSON.stringify(demoData[table]));
                }
                updateConnectionStatus(true);
            } else {
                throw new Error('Sem conexão Supabase');
            }
        } catch (e) {
            console.warn(`[API] Fallback demo para tabela "${table}":`, e.message);
            data = JSON.parse(JSON.stringify(demoData[table] || []));
            updateConnectionStatus(false);
        }
        cache[table] = { data, ts: Date.now() };
        return data;
    }

    async function get(table, id) {
        const all = await list(table);
        return all.find(r => r.id === id);
    }

    async function create(table, row) {
        const newRow = { ...row, id: row.id || genId(), created_at: new Date().toISOString() };
        try {
            if (window.sb && APP_CONFIG.USE_SUPABASE) {
                const saved = await supabaseInsert(table, newRow);
                invalidateCache(table);
                return saved;
            }
        } catch (e) {
            console.warn(`[API] Create offline "${table}":`, e.message);
        }
        // Fallback: adiciona em memória
        demoData[table] = demoData[table] || [];
        demoData[table].unshift(newRow);
        invalidateCache(table);
        return newRow;
    }

    async function update(table, id, row) {
        try {
            if (window.sb && APP_CONFIG.USE_SUPABASE) {
                const saved = await supabaseUpdate(table, id, row);
                invalidateCache(table);
                return saved;
            }
        } catch (e) {
            console.warn(`[API] Update offline "${table}":`, e.message);
        }
        // Fallback
        if (demoData[table]) {
            const idx = demoData[table].findIndex(r => r.id === id);
            if (idx >= 0) demoData[table][idx] = { ...demoData[table][idx], ...row };
        }
        invalidateCache(table);
        return { id, ...row };
    }

    async function remove(table, id) {
        try {
            if (window.sb && APP_CONFIG.USE_SUPABASE) {
                await supabaseDelete(table, id);
            }
        } catch (e) { console.warn(`[API] Delete offline:`, e.message); }
        if (demoData[table]) {
            demoData[table] = demoData[table].filter(r => r.id !== id);
        }
        invalidateCache(table);
        return true;
    }

    function updateConnectionStatus(online) {
        const el = document.getElementById('connection-status');
        if (!el) return;
        if (online) {
            el.innerHTML = '<span class="w-2 h-2 rounded-full bg-green-400"></span><span>Supabase conectado</span>';
        } else {
            el.innerHTML = '<span class="w-2 h-2 rounded-full bg-yellow-400"></span><span>Modo demo (offline)</span>';
        }
    }

    return { list, get, create, update, remove, invalidateCache, updateConnectionStatus };
})();
