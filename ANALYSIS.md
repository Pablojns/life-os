# Análise crítica — Life OS

Data: 24/09/2026  
Método: Playwright como usuário novo (`analise.*@lifeos.app`) — quiz completo, cadastro, onboarding de 3 passos — e depois uso autenticado no herói de teste (tema Naruto, plano anual).  
O que esta rodada entregou no backend: nudges por perfil em `send-notifications`, tom do coach por perfil em `ai-coach`, minigame recomendado na Arena, streak em `profiles` + TopBar.

---

## 1. Problemas de UX que encontrei

### Quiz (`/quiz`)
- Oito perguntas sem voltar atrás. Quem muda de ideia no meio recomeça do zero.
- “Aceitar este universo” não diz que o próximo passo é criar conta. Um usuário real fecha a aba achando que já “entrou”.
- O resultado acerta o arquétipo (Dovahkiin Perdido / Skyrim quando todas as respostas são “A”), mas o texto ainda parece pitch, não contrato.

### Cadastro
- Havia uma corrida: depois do `signUp` o efeito “já tem user → dashboard” atropelava o onboarding. Corrigido nesta rodada.
- Em DEV, `/login` entra sozinho no herói de teste. Qualquer pessoa rodando local pensa que a conta nova “não pegou”.
- Cinzel + tracking alto no formulário deixa português difícil de ler (NOME/E-MAIL parecem uma palavra só).

### Onboarding (o buraco mais grave do caminho novo)
- O passo 2 mostrou o erro cru: `Could not find the table 'public.user_profiles' in the schema cache`. A tabela foi criada em sessão anterior, mas o PostgREST não a servia. Reapliquei o SQL + `NOTIFY pgrst`.
- Enquanto o upsert falhava, `onboarding_completed` nunca gravava. “Entrar no sistema” ia ao dashboard e o app devolvia o usuário ao passo 1 — loop. Toasts de “missão/hábito adicionados” ao lado do formulário vazio. Um humano acharia que o app quebrou e sairia.
- O onboarding não avisava falha de save; o botão só falhava em silêncio (corrigido para avançar e mostrar erro).
- Chat flutuante cobre o CTA em telas estreitas.

### Missões
- Nove selos no topo (M N I P F T C H A) sem rótulo visível no tema Naruto. Ninguém adivinha que T é tesouro e H é oráculo.
- Formulário de nova missão (título / recompensa / XP) fica sempre aberto. O empty state com 3 sugestões é o melhor pedaço da tela — e compete com o form.
- Completar missão funciona (teste: +15 chakra, streak 0 → 1).

### Hábitos
- Grade do mês inteiro + scrollbar horizontal. Com 1 hábito parece planilha, não treino.
- O Desafio do Dia pede 3 checks. O onboarding cria 2 hábitos; o herói de teste tem 1. Meta impossível no primeiro dia.

### Notas e recompensas
- Empty states bonitos, formulários genéricos. Não há exemplo pré-preenchido do perfil (“anote a dívida”, “prêmio: 15 min sem celular”).
- Recompensa em XP sem explicar se é XP gastável ou total.

### Atributos
- Rank do tema diz Genin; o card de rank diz Iniciante. Duas verdades.
- Há 1 ponto disponível e nenhum tutorial do que Força muda.
- Histórico ainda mostra `scriptalert('xss')/script` — lixo de teste antigo, sanitização atual remove `<>` mas o registro velho assusta.

### Finanças
- Uma parede: saúde, resumo, metas, transações, gráficos, CSV, 6 abas. Usuário endividado quer “registrar o almoço”, não um ERP.
- Categorias se repetem com grafia diferente (`Alimentação` / `alimentação` / `alimentacao`) — o relatório mente o ranking.
- Abas ainda usam emoji (exceção visual ao resto do sistema).
- Inputs de renda/gastos fixos aparecem com valor cru (`50000`) sem máscara no tema.

### Agenda
- Calendário vazio, “Nada neste dia.” Não sugere o horário de acordar/dormir que o onboarding acabou de perguntar.

### IA Coach
- Markdown crú na tela (`# Coach Daily Report`, `**2 missões**`). O usuário lê código, não coaching.
- Títulos em inglês. O tom por perfil já existe no backend; a UI não deixa isso visível.
- Três botões de análise sem dizer o que o plano libera até o erro.

### Arena
- Card “Recomendado para seu perfil” apareceu e abriu o quiz de 3 perguntas (Dovahkiin/procrastinador). Isso funciona.
- Título e “porquê” colados: `Quiz de disciplinaTrês perguntas...`
- Tabs Batalha/Clicker/Quiz/Juros continuam lá — o perfil não esconde o ruído (exceto desorganizado).
- Desafio 0/3 com 1 hábito ativo. Botão Resgatar visível e morto.

### Configurações e planos
- CFG no canto não parece “conta”.
- Plano gratuito lista os mesmos itens dos pagos com um traço — parece que o free tem tudo. Confunde na hora de pagar.
- Temas Cyberpunk/Ghibli/Legendary estão na vitrine sem o mesmo capricho dos quatro mundos jogáveis.

### O que um usuário real faria de errado
1. Terminar o quiz e não criar conta.
2. Criar conta, ver o erro de `user_profiles`, achar que o produto não está no ar.
3. Clicar nos 9 círculos até desistir.
4. Abrir Finanças, se perder, não registrar o gasto do dia — e o nudge das 18h do endividado não tem o que cobrar.
5. Completar 1 hábito e achar que o desafio do dia está quebrado.
6. Ler o Coach em markdown e achar que é um bug, não um conselho.

---

## 2. Coisas que ficaram genéricas

- **Arena**: batalha é pedra-papel-tesouro com HP. Quiz de disciplina é educação financeira, não disciplina. Clicker meditativo ainda é um botão. A calculadora de juros é a peça mais honesta.
- **Coach**: o system prompt agora muda; o texto entregue ainda é o template de 3 seções com emoji e inglês.
- **Notas / Recompensas / Agenda**: skins de nome (ANBU, baú, aldeia) em cima de CRUD.
- **Finanças**: módulo de planilha, não de personagem. O perfil Endividado não muda a ordem das abas.
- **Empty states**: bons nas missões, fracos no resto.
- **Chat flutuante**: sempre o mesmo círculo. Não usa o desafio do perfil (`suggestions.aiChallenge`).
- **Streak**: o texto tem personalidade por tema; o número começa em 0 e o rótulo “Dias consecutivos” no ninja (desorganizado) ainda é o genérico — correto pela tabela, frio na aldeia.

O que já tem personalidade de verdade: shells Skyrim/Naruto/Solo, clima no canto, empty state de missões, resultado do quiz, copy dos nudges.

---

## 3. Features para competir com o Habitica

### Habitica tem e o Life OS não
- Party / guilda / chat social.
- Dano por hábito falho (consequência, não só XP).
- Avatar, equipamento, drops, pets, mounts.
- Boss raids com progresso compartilhado.
- App mobile maduro (iOS/Android de verdade, não só Expo web).
- Marketplace e temporada.

### Life OS tem e o Habitica não (vantagem)
- **Dinheiro de verdade**: contas, dívidas, orçamento, CSV, score.
- **IA Coach** com dados da semana (quando o markdown for renderizado).
- **Mundos visuais** (Skyrim / Naruto / Solo / Clean) — Habitica é um sprite único.
- **Quiz de perfil** + onboarding que planta missão/hábito.
- **Nudges por hora e por arquétipo** (se o cron rodar).
- Português e contexto BR (Pix, Nubank no CSV).

A aposta certa não é copiar pet. É ser o único app em que a missão de hoje e o boleto de hoje moram no mesmo lugar, com um coach que não aceita desculpa — ou que manda desligar, se o perfil for ansioso.

---

## 4. Problemas técnicos que escalam mal

- **`send-notifications` é N+1**: até 400 perfis com token; para cada um, busca `user_profiles` e, em vários slots, `count` em `quests`/`transactions`. Às 18h, 400 queries extras. Precisa join + batch. O `limit 400` corta o restante sem fila.
- **Sem cron visível nesta análise**. Função deployada não age sozinha. Sem `pg_cron` / GitHub Action, o backend “inteligente” é um POST morto.
- **Schema cache do PostgREST**: criar tabela no SQL Editor não basta. Sem `NOTIFY pgrst, 'reload schema'`, o onboarding inteiro quebra em produção do mesmo jeito.
- **Dashboard hidrata demais**: finanças puxa finances + goals + transactions + accounts + budgets + debts + recurring + habits de uma vez. 1.000 usuários às 8h = pico de reads.
- **Streak**: `select` + `update` sem lock. Dois `gainXP` no mesmo segundo podem resetar ou perder incremento. Precisa RPC atômica.
- **Ranking da Arena**: `select name, streak_days` em `profiles` provavelmente só devolve o próprio row (RLS). “Modo geek + ranking” é um placeholder.
- **Realtime** por `profiles` em todo cliente autenticado — caro e inútil para 1.000 people se o único evento é XP.
- **Coach** manda hábitos/quests/finances no body a cada clique. Sem cache/idempotency, Haiku vira custo.
- **Índices**: esta rodada criou `quests(user_id, completed_at)`, `transactions(user_id, transaction_date)`, `notification_sends(user_id, slot, sent_on)`, `profiles(streak_days)`. Ainda faltam índices óbvios em `habit_checks(user_id, check_date)` e `scheduled_events(notify_at, notified)`.
- **XSS histórico** em títulos de missão: sanitização atual é só `<>`. Não é XSS clássico no React, mas prova que dados velhos não foram limpos.

---

## 5. Se eu fosse o Pablo

### Antes dos primeiros 100
1. Confirmar `user_profiles` no schema cache em produção e um teste de cadastro real (e-mail confirmado) toda semana.
2. Tipografia: Cinzel só em títulos curtos; corpo em Inter/Crimson com `letter-spacing: 0`. Se o usuário não lê, o tema não importa.
3. Nav com nome, não só runa. Mobile já esconde o texto — no desktop isso é vaidade.
4. Renderizar o Coach (markdown → HTML) e forçar português no modelo.
5. Desafio do dia = `min(3, hábitos ativos)` ou 1 check no primeiro dia.
6. Ligar o cron dos nudges e um log de `notification_sends`.
7. Caminho de 2 minutos: quiz → conta → 1 missão pronta → completar → streak 1. Sem form de XP na cara.
8. Plano free: esconder abas de finanças avançadas. Mostrar “registrou o gasto? não? então só isso”.

### Esperar para depois
- Party / pets / raids.
- Open Finance de verdade (não só CSV).
- Cyberpunk / Ghibli / Legendary no mesmo nível dos quatro mundos.
- App nativo polido.
- Ranking global.

### Maior impacto, menor esforço agora
**Completar 1 missão no primeiro minuto, sem atrito, e ver o streak virar 1.**  
O quiz já escolhe a missão. O empty state já sugere. Falta: pular o form, gravar `user_profiles` de forma à prova de cache, e um header que o olho lê. Isso vende o produto. O resto é cenário.

---

## 6. Nota geral

**6,4 / 10**

O teto é alto: quatro mundos, finanças reais, coach, clima, quiz, streak, push por perfil. Poucos apps BR tentam isso.  
O chão, hoje, é de protótipo: tabela que some do schema, onboarding que devolve o usuário ao passo 1, fonte que come espaço, nove botões sem nome, Coach em markdown cru, Arena com desafio impossível, finanças que assustam no dia 1.

Com o caminho novo estável e o primeiro dia cabendo em uma missão, sobe para 7,5 sem inventar feature. Sem isso, divulgar para 100 pessoas é pedir review de “bonito e quebrado”.

---

## O que esta missão deixou no ar

| Peça | Estado |
|---|---|
| Nudges por perfil (`send-notifications`) | Código + deploy |
| Prompts do coach por perfil (`ai-coach`) | Código + deploy |
| Arena recomendada + juros + quiz 3q + clicker calmo + ranking | Código |
| Colunas de streak + `notification_sends` + índices | SQL aplicado |
| `updateStreak` em XP e transação | Código |
| Streak no shell (Skyrim/Naruto/Solo/Clean) | Código; visto no Naruto (0 → 1 ao completar missão) |
| `user_profiles` + reload de schema | Reaplicado após falha no onboarding |
| Cron automático dos nudges | Ainda depende de agendar a função |

---

## Atualização — 24/09/2026 (correções)

Playwright novo usuário `qa.*@lifeos.app`: quiz → conta → onboarding 3/3 sem loop → dashboard com missão sugerida → completar missão (streak 1 visível no header) → Finanças só com “Qual foi seu gasto mais recente?” → Coach free com CTA de upgrade → mobile 375px com nomes nas abas e chat acima da nav.

### Corrigido
1. **Onboarding à prova de falha** — não avança se o save remoto quebrar; mostra erro + tentar novamente; loading no botão; `onboarding_completed` só no último passo. Fallback em `localStorage` + colunas de `profiles` porque o PostgREST **ainda não expõe** `public.user_profiles` (PGRST205 mesmo após `NOTIFY pgrst`).
2. **Coach** — `react-markdown` + CSS do tema. Prompt força português e proíbe `#`. Free vê cadeado + “Ver planos”.
3. **Nav** — desktop ícone + nome; mobile ícone + nome curto (Missões, Hábitos, Notas…).
4. **Rank** — `src/lib/rankByTheme.js` é a única fonte (Genin / E-Rank / Iniciante).
5. **Desafio do dia** — `min(hábitos, 3)`; 0 hábitos = criar 1; 1 hábito = marcar esse.
6. **Nudges** — `.github/workflows/nudges.yml` criado. `gh secret` falhou (CLI sem login). **Pablo precisa criar o secret `SUPABASE_ANON_KEY` no GitHub.**
7. **Tipografia** — corpo/inputs em Inter ou Crimson, 14px, tracking 0. Cinzel só em títulos/rank.
8. **Glass** — painéis Skyrim/Naruto/Solo em `rgba(0,0,0,0.55)` + blur; fundo da cena aparece nas bordas do grimório.
9. **Finanças dia 1** — 0 transações = um campo; 1–2 = resumo; 3+ = abas. Free só Visão Geral.
10. **Empty states** de notas/recompensas/agenda com copy do tema.
11. **Chat** — some no onboarding; no mobile fica acima da bottom nav; aberto vira fullscreen; z-index 150.
12. **Planos** — itens sem acesso em vermelho com ✕; bloco “O que você perde sem o plano Herói”.
13. **XSS** — DELETE rodado no SQL Editor (histórico de teste).

### Ainda aberto
- Tabela `user_profiles` continua invisível na Data API. Sem o expose no dashboard, o fallback local é o que segura o onboarding.
- Secret do GitHub Action dos nudges não foi gravado (login do `gh` ausente).
- Coach pago não foi reaberto neste QA (conta nova é free). O markdown está no código.

### Nota nova
**7,6 / 10**

O caminho de 2 minutos agora existe: quiz, conta, 3 passos, missão na mesa, streak 1, gasto do dia sem ERP. Ainda não é 8 porque o schema cache do Supabase continua mentindo e o cron depende de um secret manual.
