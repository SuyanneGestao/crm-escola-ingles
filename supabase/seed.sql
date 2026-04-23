-- =====================================================
-- Seed de dados iniciais (opcional)
-- Execute depois do schema.sql
-- =====================================================

-- Fases do método (exemplo - adapte ao método real)
insert into metodo_fases (ordem, nome, descricao, duracao_semanas) values
    (1, 'Fase 1 - Fundamentos', 'Vocabulário básico, presente simples, pronunciação', 8),
    (2, 'Fase 2 - Speaking', 'Conversação guiada, verbos irregulares, past/future', 10),
    (3, 'Fase 3 - Immersion', 'Imersão em mídia (séries/podcasts), listening ativo', 8),
    (4, 'Fase 4 - Conversação', 'Debates livres, expressões idiomáticas, phrasal verbs', 12),
    (5, 'Fase 5 - Fluência', 'Prática em contextos reais, certificação', 6)
on conflict do nothing;

-- Templates de mensagem
insert into templates (categoria, nome, canal, conteudo) values
    ('Boas-vindas', 'Novo Lead Instagram', 'WhatsApp', 'Oi {{nome}}! 💜 Vi que você se interessou pela nossa mentoria de inglês pelo Instagram. Posso te explicar como funciona o método?'),
    ('Follow-up', 'Lead sem resposta', 'WhatsApp', 'Oi {{nome}}, tudo bem? Passando aqui pra saber se ainda tem interesse em começar seu inglês com a gente 🚀'),
    ('Cobrança', 'Mensalidade atrasada', 'WhatsApp', 'Oi {{nome}}! Sua mensalidade de {{mes}} venceu em {{vencimento}}. Posso te ajudar com o pagamento?'),
    ('Reengajamento', 'Aluno sumido', 'WhatsApp', 'Oi {{nome}}! Senti sua falta nas últimas aulas. Tá tudo bem? Vamos retomar? 💪'),
    ('Aniversário', 'Parabéns aluno', 'WhatsApp', 'Oi {{nome}}! 🎉🎂 Hoje é seu dia! A equipe toda deseja um feliz aniversário e muito sucesso na sua jornada com o inglês!'),
    ('Conversão', 'Proposta enviada', 'WhatsApp', 'Oi {{nome}}! Acabei de te enviar a proposta. Qualquer dúvida me chama!')
on conflict do nothing;

-- Marketing inicial (mês corrente)
insert into marketing (canal, investimento, leads_gerados, alunos_convertidos, mes_ref) values
    ('Instagram', 800, 0, 0, to_char(current_date, 'YYYY-MM')),
    ('Indicação', 150, 0, 0, to_char(current_date, 'YYYY-MM')),
    ('WhatsApp', 0, 0, 0, to_char(current_date, 'YYYY-MM')),
    ('Google Ads', 500, 0, 0, to_char(current_date, 'YYYY-MM'))
on conflict do nothing;
