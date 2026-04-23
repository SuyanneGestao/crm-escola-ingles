# 🏫 Central de Gestão — Escola de Inglês (v2.0)

> CRM completo com 10 módulos integrados para gerenciar leads, alunos, turmas, financeiro, método autoral, marketing, aniversariantes e sincronização com Google Calendar.

---

## ✨ O que há de novo na v2.0

### 🆕 Melhorias implementadas nesta versão:

1. **🎯 Campo "Objetivo do Aluno"** — tanto no cadastro de leads quanto de alunos. Opções: Viagem, Trabalho, Intercâmbio, Fluência, Prova (IELTS/TOEFL), Carreira, Negócios, Hobby, Outro. Aparece destacado em cards e detalhes.
2. **🎂 Relatório de Aniversariantes do Mês** — módulo dedicado que mostra alunos e leads que fazem aniversário, com banner especial pro dia de hoje, botão de parabenizar por WhatsApp (usando template), exportação CSV, e navegação entre meses.
3. **📅 Integração Google Calendar** — conecta sua conta Google via OAuth e permite: criar eventos manuais, sincronizar aulas das turmas, follow-ups de leads, vencimentos financeiros e aniversários dos alunos diretamente na sua agenda.

---

## 🎯 Os 10 módulos do sistema

| # | Módulo | Rota | Descrição |
|---|--------|------|-----------|
| 1 | 📊 **Dashboard** | `#dashboard` | KPIs em tempo real, gráficos, alertas, follow-ups do dia |
| 2 | 🧲 **CRM Leads** | `#leads` | Kanban de 5 etapas, drag-and-drop, conversão em aluno |
| 3 | 👩‍🎓 **Alunos** | `#alunos` | Lista e Kanban, **objetivo**, progresso, fase do método |
| 4 | 📚 **Turmas** | `#turmas` | Kanban, ocupação, link de aula, professor |
| 5 | 👨‍🏫 **Professores** | `#professores` | Cards com disponibilidade e níveis |
| 6 | 💰 **Financeiro** | `#financeiro` | Kanban, MRR, filtro por mês, marcar como pago |
| 7 | ✅ **Tarefas** | `#tarefas` | Kanban com prioridade 🔴🟡🟢, alertas de prazo |
| 8 | 🎓 **Método & Progresso** | `#metodo` | Fases do método autoral, alunos por fase |
| 9 | 🎂 **Aniversariantes** 🆕 | `#aniversariantes` | Alunos/leads do mês, CSV, Parabéns por WhatsApp |
| 10 | 📅 **Google Calendar** 🆕 | `#calendar` | OAuth, sincronização bidirecional, eventos |
| + | 📣 **Marketing/ROI** | `#marketing` | CAC, LTV, ROI por canal, gráficos |
| + | 💬 **Templates** | `#templates` | Scripts prontos WhatsApp/Instagram |
| + | ⚙️ **Configurações** | `#config` | Integrações, PWA, limpar cache |

---

## 🛠️ Stack Técnica

- **Frontend:** HTML5 + TailwindCSS (CDN) + Vanilla JS (modular)
- **Banco:** Supabase (PostgreSQL + Auth + Realtime)
- **Deploy:** Vercel (frontend estático) + GitHub (versionamento)
- **Extras:** Chart.js (gráficos), Font Awesome, Google Identity Services (OAuth)
- **PWA:** Manifest + Service Worker (instalável no celular)

---

## 🚀 PASSO A PASSO — Rodar no Supabase + GitHub + Vercel

### 📦 PARTE 1 — Configurar o Supabase

O projeto já está pré-configurado com suas credenciais:

- **URL:** `https://waoinjpwdhdjhiybjuue.supabase.co`
- **Anon Key:** `sb_publishable_JJtIwq3rBLyzX5wuEXpZaA_ygN_m6Wx`

#### 1.1. Criar as tabelas no banco

1. Acesse [app.supabase.com](https://app.supabase.com) e entre no projeto
2. No menu lateral, clique em **SQL Editor** → **New Query**
3. Abra o arquivo `supabase/schema.sql` deste projeto e **cole todo o conteúdo**
4. Clique em **Run** (ou `Ctrl+Enter`)
5. Se aparecer algum erro de ordem nas FKs (turmas antes de alunos), rode o script de novo — o Postgres resolve na segunda execução.

#### 1.2. (Opcional) Popular com dados iniciais

1. Ainda no **SQL Editor**, crie nova query
2. Cole o conteúdo de `supabase/seed.sql`
3. Clique em **Run**

> Isso cria as 5 fases do método, templates de mensagem e registros de marketing iniciais.

#### 1.3. Verificar as novas colunas

Rode essa query para confirmar que os novos campos existem:

```sql
select column_name from information_schema.columns
where table_name in ('leads','alunos') and column_name in ('objetivo','data_nascimento');
```

Deve retornar 4 linhas. ✅

#### 1.4. Testar a view de aniversariantes

```sql
select * from vw_aniversariantes_mes;
```

---

### 📂 PARTE 2 — Subir pro GitHub

Repositório já configurado: **https://github.com/SuyanneGestao/crm-escola-ingles-v2.git**

#### 2.1. Primeira vez (se o repo estiver vazio)

```bash
# Baixe todos os arquivos deste projeto pra sua máquina
# Abra o terminal na pasta do projeto:

git init
git add .
git commit -m "feat: CRM v2.0 com objetivo, aniversariantes e Google Calendar"
git branch -M main
git remote add origin https://github.com/SuyanneGestao/crm-escola-ingles-v2.git
git push -u origin main
```

#### 2.2. Atualizações futuras

```bash
git add .
git commit -m "descrição da alteração"
git push
```

> **Se der erro de autenticação:** use um [Personal Access Token](https://github.com/settings/tokens) no lugar da senha. Escopo: `repo`.

---

### 🌐 PARTE 3 — Deploy no Vercel

#### 3.1. Importar o repositório

1. Acesse [vercel.com](https://vercel.com) e faça login com GitHub
2. Clique em **Add New** → **Project**
3. Selecione `SuyanneGestao/crm-escola-ingles-v2`
4. Em **Framework Preset**, escolha **Other** (é site estático)
5. Em **Root Directory**, deixe `./` (raiz)
6. **Build Command:** deixe vazio
7. **Output Directory:** deixe vazio
8. Clique em **Deploy**

#### 3.2. Aguarde ~30 segundos

Vercel vai gerar uma URL tipo:
`https://crm-escola-ingles-v2.vercel.app`

✅ **Pronto! Seu CRM tá no ar e acessível de qualquer dispositivo.**

#### 3.3. Auto-deploy

A cada `git push` que você fizer, o Vercel faz redeploy automático. Zero esforço.

#### 3.4. (Opcional) Domínio próprio

Em **Project Settings → Domains**, adicione seu domínio (ex: `crm.suyannegestao.com.br`) e configure o DNS conforme as instruções.

---

### 📅 PARTE 4 — Configurar Google Calendar (opcional)

Necessário apenas se quiser usar o módulo **📅 Google Calendar**.

#### 4.1. Criar projeto no Google Cloud

1. Acesse [console.cloud.google.com](https://console.cloud.google.com)
2. Crie novo projeto: **"Escola Inglês CRM"**
3. Vá em **APIs & Services → Library**
4. Busque e habilite **Google Calendar API**

#### 4.2. Criar credenciais

1. Em **APIs & Services → Credentials**
2. **+ CREATE CREDENTIALS → API key** → copie o valor (algo tipo `AIzaSy...`)
3. **+ CREATE CREDENTIALS → OAuth client ID**
   - Application type: **Web application**
   - Name: CRM Escola
   - **Authorized JavaScript origins:** adicione:
     - `http://localhost:3000` (pra testar local)
     - `https://crm-escola-ingles-v2.vercel.app` (sua URL do Vercel)
   - Copie o **Client ID**

#### 4.3. Configurar OAuth consent screen

1. Em **OAuth consent screen**
2. User Type: **External**
3. Preencha os dados básicos
4. Em **Scopes**, adicione: `https://www.googleapis.com/auth/calendar`
5. Em **Test users**, adicione seu email

#### 4.4. Atualizar o config.js

Abra `js/config.js` e preencha:

```javascript
GOOGLE_CLIENT_ID: 'seu-client-id.apps.googleusercontent.com',
GOOGLE_API_KEY: 'AIzaSy...sua-key',
```

Commit e push. O Vercel redeploya sozinho.

```bash
git add js/config.js
git commit -m "feat: configura Google Calendar"
git push
```

---

## 🔐 Segurança

- **RLS (Row Level Security)** já está habilitado no schema com política permissiva para desenvolvimento
- **⚠️ Antes de produção**, substitua a política por uma baseada em `auth.uid()`:

```sql
-- Exemplo de política baseada em usuário autenticado
drop policy "allow_all_anon" on alunos;
create policy "users_read_own" on alunos for select
  using (auth.role() = 'authenticated');
```

- **Chave publicável (anon)**: segura de expor, é projetada pra isso ✅
- **Service Role Key**: NUNCA exponha no frontend ou em commits! Ela burla o RLS.
- **`.gitignore`** já configurado para ignorar `.env*`

---

## 📊 Estrutura de Dados

### Tabelas principais

| Tabela | Campos-chave |
|--------|--------------|
| `leads` | nome, email, telefone, canal, etapa, temperatura, **objetivo**, **data_nascimento**, follow_up |
| `alunos` | nome, email, telefone, nivel, turno, status, **objetivo**, **data_nascimento**, turma_id, fase_metodo, progresso |
| `turmas` | nome, professor_id, dias, horario, nivel, status, capacidade, link_aula |
| `professores` | nome, email, telefone, niveis[], disponibilidade, dias, valor_hora |
| `financeiro` | aluno_id, descricao, valor, vencimento, status, forma, mes_ref |
| `tarefas` | titulo, categoria, prioridade, status, prazo, responsavel |
| `metodo_fases` | ordem, nome, descricao, duracao_semanas |
| `marketing` | canal, investimento, leads_gerados, alunos_convertidos, mes_ref |
| `templates` | categoria, nome, canal, conteudo |
| `interacoes` | lead_id, aluno_id, tipo, conteudo, created_by |

### Views úteis

- `vw_aniversariantes_mes` — alunos+leads aniversariantes do mês atual
- `vw_mrr` — receita recorrente mensal com breakdown por status

---

## 📱 Instalar como App (PWA)

### Android (Chrome)
1. Abra a URL do Vercel no Chrome
2. Menu (⋮) → **Adicionar à tela inicial**
3. Confirme

### iOS (Safari)
1. Abra a URL no Safari
2. Botão **Compartilhar** → **Adicionar à Tela de Início**
3. Confirme

Pronto! Ícone na home e funciona até offline (dados em cache).

---

## 🗂️ Estrutura de arquivos

```
.
├── index.html                    # Entry point
├── manifest.json                 # PWA manifest
├── sw.js                         # Service Worker
├── css/
│   └── style.css                 # Estilos customizados
├── js/
│   ├── config.js                 # Credenciais Supabase/Google
│   ├── api.js                    # Camada de API (Supabase + fallback)
│   ├── utils.js                  # Utilidades (formatação, modal, toast)
│   ├── components.js             # Componentes reutilizáveis
│   ├── app.js                    # Orquestrador / router
│   └── modules/
│       ├── dashboard.js          # 📊
│       ├── leads.js              # 🧲
│       ├── alunos.js             # 👩‍🎓 (com objetivo)
│       ├── turmas.js             # 📚
│       ├── professores.js        # 👨‍🏫
│       ├── financeiro.js         # 💰
│       ├── tarefas.js            # ✅
│       ├── metodo.js             # 🎓
│       ├── aniversariantes.js    # 🎂 🆕
│       ├── calendar.js           # 📅 🆕
│       ├── marketing.js          # 📣
│       ├── templates.js          # 💬
│       └── config.js             # ⚙️
├── supabase/
│   ├── schema.sql                # DDL completo (rode 1x)
│   └── seed.sql                  # Dados iniciais (rode 1x)
└── icons/
    └── icon.svg                  # Ícone PWA
```

---

## ✅ Funcionalidades implementadas

- [x] Dashboard com 4 KPIs + 3 cards de alertas + 2 gráficos
- [x] CRM de Leads com Kanban 5 etapas e drag-and-drop
- [x] Alunos com Lista + Kanban + progresso no método + **objetivo**
- [x] Turmas com Kanban e ocupação visual
- [x] Professores com cards de disponibilidade
- [x] Financeiro com Kanban, filtro por mês, MRR
- [x] Tarefas com Kanban por prioridade
- [x] Método autoral com pipeline de fases
- [x] **🎂 Aniversariantes do mês** (alunos + leads, export CSV, WhatsApp direto)
- [x] **📅 Google Calendar** (OAuth, criar evento, sync turmas/follow-ups/vencimentos/aniversários)
- [x] Marketing/ROI com CAC, LTV e gráficos
- [x] Templates de mensagem (WhatsApp/Instagram)
- [x] Configurações (status de integrações)
- [x] Responsivo (mobile, tablet, desktop)
- [x] PWA instalável
- [x] Integração real com Supabase
- [x] Fallback automático pra modo demo se Supabase falhar

---

## 🔮 Próximos passos sugeridos (Fase 3)

- [ ] **Autenticação multi-usuário** (Suyanne admin, professores limitados, secretária financeiro)
- [ ] **Timeline de interações** por lead/aluno (ligações, mensagens, objeções)
- [ ] **Presença e frequência** automática por aula
- [ ] **Alertas inteligentes** (aluno faltou 3x = risco de churn)
- [ ] **Upload de contratos** (Storage do Supabase)
- [ ] **Notificações push** via Supabase Realtime
- [ ] **Programa de indicação** com tracking
- [ ] **Integração WhatsApp Business API** (envio automático)
- [ ] **Integração Mercado Pago / Stripe** (cobrança automática)
- [ ] **Relatórios exportáveis em PDF**
- [ ] **Importador de planilha Excel** (migrar dados atuais)

---

## 🆘 Problemas comuns

**"Modo demo (offline)" no canto da sidebar**
→ O Supabase não está conectando. Verifique URL e key em `js/config.js`, ou se as tabelas existem (rode `schema.sql`).

**"Cannot read properties of null" no console**
→ O script `@supabase/supabase-js` não carregou. Normalmente é instabilidade de rede — recarregue.

**Google Calendar pede login mas dá erro**
→ Verifique se a URL do Vercel está em **Authorized JavaScript origins** no Google Cloud Console.

**Deploy no Vercel deu erro**
→ Vercel é zero-config pra sites estáticos. Se falhar, confirme que **Build Command** e **Output Directory** estão vazios.

---

## 💜 Créditos

**Feito pela Suyanne Gestão** — Social Seller & Social Media · CRM pensado sob medida para mentoria de inglês com método autoral.

**Versão:** 2.0 (abril/2026)
**Repositório:** https://github.com/SuyanneGestao/crm-escola-ingles-v2
