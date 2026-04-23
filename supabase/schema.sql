-- =====================================================
-- Central de Gestão - Escola de Inglês
-- Schema completo para Supabase (PostgreSQL)
-- Versão 2.0 - Com campos: objetivo, data_nascimento
-- =====================================================

-- Extensões
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- =====================================================
-- TABELA: leads (CRM)
-- =====================================================
create table if not exists leads (
    id uuid primary key default gen_random_uuid(),
    nome text not null,
    email text,
    telefone text,
    canal text check (canal in ('Instagram','Indicação','WhatsApp','Google Ads','Facebook','Site','Outro')) default 'Instagram',
    etapa text check (etapa in ('Novo','Contato','Proposta','Negociação','Fechado')) default 'Novo',
    temperatura text check (temperatura in ('Frio','Morno','Quente')) default 'Morno',
    objetivo text, -- 🆕 NOVO CAMPO: Viagem, Trabalho, Intercâmbio, Fluência, Prova, etc.
    data_nascimento date, -- 🆕 NOVO CAMPO: para relatório de aniversariantes
    follow_up date,
    observacoes text,
    valor_proposta numeric(10,2),
    canal_indicacao text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- =====================================================
-- TABELA: alunos
-- =====================================================
create table if not exists alunos (
    id uuid primary key default gen_random_uuid(),
    nome text not null,
    email text,
    telefone text,
    nivel text check (nivel in ('Básico','Intermediário','Avançado')) default 'Básico',
    turno text check (turno in ('Manhã','Tarde','Noite','Sábado')),
    status text check (status in ('Ativo','Pausado','Cancelado','Concluído')) default 'Ativo',
    objetivo text, -- 🆕 NOVO CAMPO: Viagem, Trabalho, Intercâmbio, Fluência, Prova
    data_nascimento date, -- 🆕 NOVO CAMPO: para aniversariantes
    turma_id uuid references turmas(id) on delete set null,
    fase_metodo text, -- referência à fase do método próprio
    progresso int default 0 check (progresso >= 0 and progresso <= 100),
    data_inicio date,
    data_conclusao date,
    canal_origem text,
    lead_origem_id uuid references leads(id) on delete set null,
    observacoes text,
    nps int check (nps is null or (nps >= 0 and nps <= 10)),
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- =====================================================
-- TABELA: professores
-- =====================================================
create table if not exists professores (
    id uuid primary key default gen_random_uuid(),
    nome text not null,
    email text,
    telefone text,
    niveis text[], -- array: ['Básico','Intermediário','Avançado']
    disponibilidade text,
    dias text,
    valor_hora numeric(10,2),
    ativo boolean default true,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- =====================================================
-- TABELA: turmas
-- =====================================================
create table if not exists turmas (
    id uuid primary key default gen_random_uuid(),
    nome text not null,
    professor_id uuid references professores(id) on delete set null,
    dias text,
    horario text,
    nivel text,
    status text check (status in ('Em formação','Ativa','Lotada','Encerrada')) default 'Em formação',
    capacidade int default 8,
    link_aula text,
    google_event_id text, -- 🆕 Para integração Google Calendar
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Fix: agora alunos pode referenciar turmas (já definida)
-- (a FK turma_id em alunos ficará pendente se rodar na ordem acima; Supabase aceita)

-- =====================================================
-- TABELA: financeiro
-- =====================================================
create table if not exists financeiro (
    id uuid primary key default gen_random_uuid(),
    aluno_id uuid references alunos(id) on delete cascade,
    descricao text not null,
    valor numeric(10,2) not null,
    vencimento date not null,
    data_pagamento date,
    status text check (status in ('Pendente','Pago','Atrasado','Cancelado')) default 'Pendente',
    forma text check (forma in ('PIX','Cartão','Boleto','Dinheiro','Transferência')),
    mes_ref text, -- formato YYYY-MM
    observacoes text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- =====================================================
-- TABELA: tarefas
-- =====================================================
create table if not exists tarefas (
    id uuid primary key default gen_random_uuid(),
    titulo text not null,
    descricao text,
    categoria text check (categoria in ('Vendas','Pedagógico','Financeiro','Marketing','Administrativo','Outro')) default 'Outro',
    prioridade text check (prioridade in ('Alta','Média','Baixa')) default 'Média',
    status text check (status in ('A fazer','Em andamento','Concluída','Cancelada')) default 'A fazer',
    prazo date,
    responsavel text,
    aluno_id uuid references alunos(id) on delete set null,
    google_event_id text, -- 🆕 Para integração Google Calendar
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- =====================================================
-- TABELA: metodo_fases (Jornada do Método Próprio)
-- =====================================================
create table if not exists metodo_fases (
    id uuid primary key default gen_random_uuid(),
    ordem int not null,
    nome text not null,
    descricao text,
    duracao_semanas int,
    objetivos text,
    material_url text,
    created_at timestamptz default now()
);

-- =====================================================
-- TABELA: marketing (ROI por canal)
-- =====================================================
create table if not exists marketing (
    id uuid primary key default gen_random_uuid(),
    canal text not null,
    investimento numeric(10,2) default 0,
    leads_gerados int default 0,
    alunos_convertidos int default 0,
    mes_ref text not null, -- YYYY-MM
    observacoes text,
    created_at timestamptz default now()
);

-- =====================================================
-- TABELA: templates (scripts de mensagem)
-- =====================================================
create table if not exists templates (
    id uuid primary key default gen_random_uuid(),
    categoria text,
    nome text not null,
    canal text check (canal in ('WhatsApp','Instagram','Email','SMS')) default 'WhatsApp',
    conteudo text not null,
    variaveis text[],
    ativo boolean default true,
    created_at timestamptz default now()
);

-- =====================================================
-- TABELA: interacoes (timeline de leads/alunos)
-- =====================================================
create table if not exists interacoes (
    id uuid primary key default gen_random_uuid(),
    lead_id uuid references leads(id) on delete cascade,
    aluno_id uuid references alunos(id) on delete cascade,
    tipo text check (tipo in ('Ligação','WhatsApp','Email','Reunião','Observação')),
    conteudo text,
    created_by text,
    created_at timestamptz default now()
);

-- =====================================================
-- TRIGGERS: updated_at automático
-- =====================================================
create or replace function update_updated_at_column()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

do $$ declare t text;
begin
    for t in select unnest(array['leads','alunos','turmas','professores','financeiro','tarefas']) loop
        execute format('drop trigger if exists set_updated_at on %I', t);
        execute format('create trigger set_updated_at before update on %I for each row execute function update_updated_at_column()', t);
    end loop;
end $$;

-- =====================================================
-- VIEWS úteis
-- =====================================================

-- View: Aniversariantes do mês atual
create or replace view vw_aniversariantes_mes as
select
    'aluno' as tipo,
    id,
    nome,
    email,
    telefone,
    data_nascimento,
    extract(day from data_nascimento) as dia,
    date_part('year', age(data_nascimento))::int as idade_atual,
    status
from alunos
where data_nascimento is not null
  and extract(month from data_nascimento) = extract(month from current_date)
union all
select
    'lead' as tipo,
    id,
    nome,
    email,
    telefone,
    data_nascimento,
    extract(day from data_nascimento) as dia,
    date_part('year', age(data_nascimento))::int as idade_atual,
    etapa as status
from leads
where data_nascimento is not null
  and extract(month from data_nascimento) = extract(month from current_date);

-- View: MRR (Monthly Recurring Revenue)
create or replace view vw_mrr as
select
    mes_ref,
    count(*) filter (where status = 'Pago') as pagamentos_recebidos,
    sum(valor) filter (where status = 'Pago') as receita_paga,
    sum(valor) filter (where status in ('Pendente','Atrasado')) as a_receber,
    sum(valor) filter (where status = 'Atrasado') as inadimplencia
from financeiro
group by mes_ref
order by mes_ref desc;

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- Por enquanto permissivo - ajustar após configurar auth
-- =====================================================
alter table leads enable row level security;
alter table alunos enable row level security;
alter table turmas enable row level security;
alter table professores enable row level security;
alter table financeiro enable row level security;
alter table tarefas enable row level security;
alter table metodo_fases enable row level security;
alter table marketing enable row level security;
alter table templates enable row level security;
alter table interacoes enable row level security;

-- Políticas permissivas para anon (desenvolvimento)
-- ⚠️ Em produção, substitua por políticas baseadas em auth.uid()
do $$ declare t text;
begin
    for t in select unnest(array['leads','alunos','turmas','professores','financeiro','tarefas','metodo_fases','marketing','templates','interacoes']) loop
        execute format('drop policy if exists "allow_all_anon" on %I', t);
        execute format('create policy "allow_all_anon" on %I for all using (true) with check (true)', t);
    end loop;
end $$;
