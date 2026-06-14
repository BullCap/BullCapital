# Bull. — Regras de Negócio do Sistema de IA (Respostas V1 — Parte 2)

> Continuação do documento de respostas às perguntas de descoberta do time de IA.
> Mesmos princípios governantes: **determinístico conclui, LLM narra, Guardião segura a fronteira.** Valor comercial ancorado na dor validada da EQI: elevar o teto de clientes por assessor cortando tempo-por-cliente.
> Onde houver conflito aparente com a Parte 1, a Parte 1 prevalece — e o conflito deve ser apontado, não resolvido silenciosamente.

---

## 1. BullCapital Como Produto

**1.1 Plataforma para quem na V1?** — Assessores de investimento, exclusivamente. Analistas internos do escritório cliente podem ser usuários secundários dentro do mesmo workspace (mesmas regras, mesmo escopo). Cliente final não acessa nada na V1 — nem leitura. *Justificativa: o modelo é B2B; o assessor é simultaneamente o usuário, o human-in-the-loop e a razão regulatória de o produto poder existir como existe.*

**1.2 Principal caso de uso comercial da IA** — Reduzir o tempo de preparação por cliente do assessor: consolidação multi-instituição narrada, concentração por emissor e classe explicada, delta de rebalanceamento vs. política descrito, vencimentos contextualizados. A IA transforma o payload determinístico em texto de preparação de reunião em segundos — trabalho que hoje consome a maior parte do tempo-por-cliente. *Justificativa: é literalmente a dor que a EQI nomeou; tudo o mais é secundário.*

**1.3 Copiloto, gerador de relatórios, motor de valuation, triagem ou suporte?** — Copiloto de análise + suporte à preparação de atendimento. **Não** é motor de valuation (fora da V1 e parcialmente fora do produto), **não** é triagem de oportunidades (ver 4.6 — triagem de oportunidades é recomendação disfarçada). Gerador de relatórios é consequência (V1.x via export), não identidade.

**1.4 Resposta conversacional ou artefato formal?** — Ambos, com primazia do artefato: a conversa é o meio de interação, mas o produto entrega blocos estruturados revisáveis. Resposta puramente conversacional sem estrutura auditável não é um entregável válido da plataforma. *Justificativa: conversa não se audita nem se reaproveita; artefato sim.*

**1.5 Resultado principal** — (1º) Ficha consolidada de carteira/cliente com narração: composição, concentração, delta vs. política, calendário de vencimentos — o coração do tempo-por-cliente. (2º) Análise estruturada de resultado trimestral (4 camadas: fatos/interpretação/riscos/conclusão). **Tese de investimento não existe como output** — tese implica direção, direção é recomendação.

**1.6 Documentos exportáveis?** — V1.x. Com disclaimer obrigatório, citações embutidas, identificação de geração assistida por IA e registro de revisão do assessor. Na V1, o assessor copia/adapta — o que reforça que ele é o autor do que chega ao cliente.

**1.7 "Opinião da casa" BullCapital?** — **Não, e essa resposta é estrutural, não de versão.** A Bull. não é casa de análise: opinião institucional direcional ("a casa gosta de X") é recomendação institucional — exigiria credenciamento de analista (Resolução CVM 20) e mudaria a natureza jurídica do produto. O que pode e deve existir: **metodologia da casa** — como computar concentração, como apresentar risco de liquidez, como estruturar uma análise de resultado, qual formato de narração. A casa tem método, não tem opinião. *Justificativa: essa distinção é o que separa "plataforma de software para assessores" de "casa de research" — e a Bull. quer ser a primeira.*

**1.8 Metodologia proprietária que a IA segue?** — Sim: o formato padronizado Bull. (import Excel padrão, cálculo de concentração por emissor e classe, política-alvo declarada pelo assessor, taxonomia de classificação de resultado com referencial explícito, templates de narração com slots). A IA opera *dentro* da metodologia; a metodologia é determinística e versionada.

**1.9 Apoiar venda/relacionamento ou só análise técnica?** — Apoia relacionamento no sentido de preparação: resumo do cliente antes da reunião, mudanças desde o último encontro, pontos de atenção da carteira. **Nunca** gera argumento de venda direcional ("diga ao cliente que X é boa oportunidade"). A fronteira: preparar o assessor para conversar = sim; municiar o assessor com recomendação = não.

**1.10 Diferencial vs. "ChatGPT com documentos"** — Seis camadas, em ordem de defensabilidade: (1) **núcleo determinístico auditável** — ChatGPT erra aritmética e não tem proveniência; na Bull. número nunca nasce de LLM; (2) **dados estruturados de carteira multi-instituição** via import padronizado — ChatGPT não tem o dado, e o dado é o produto; (3) **compliance by design** — Guardião estrutural, taxonomias fechadas, recusa estruturada: um escritório não pode juridicamente colocar ChatGPT na frente de assessores para isso; (4) **escopo e tenancy** — isolamento documental e por cliente que chat genérico não oferece; (5) **workflow, não chat**: consolidação, rebalanceamento e vencimentos são features, não prompts que o assessor precisa saber escrever; (6) **auditabilidade ponta a ponta** — trilha de evidência, decisão e qualidade por execução. *Esta resposta é também o slide de competição do pitch.*

---

## 2. Jornada do Usuário

**2.1 Jornada principal** — Assessor importa/atualiza carteira do cliente (Excel padrão Bull.) → plataforma computa consolidação, concentração, riscos, delta vs. política → assessor pede narração/preparação de reunião → revisa, ajusta, usa. Jornada secundária: pergunta sobre resultado de empresa (importa release/ITR → análise estruturada assíncrona). Terciária: monitoramento de notícias por ticker das carteiras.

**2.2 Ponto de partida** — Pela carteira do cliente — é assim que o assessor pensa ("reunião com o Fulano às 15h"), e é onde o tempo dele vai. Empresa/documento é entrada secundária; pergunta livre nunca é ponto de partida de jornada (é interação dentro de um escopo já resolvido).

**2.3 IA conduz com perguntas ou responde com contexto?** — Responde com o contexto disponível; pergunta apenas quando o escopo é ambíguo (qual cliente? qual documento? qual período?) e a ambiguidade muda a resposta. Uma pergunta por vez, nunca interrogatório. *Justificativa: o assessor tem 15 minutos, não paciência para wizard.*

**2.4 Tarefas longas assíncronas?** — Sim. Análise de resultado trimestral é job assíncrono por definição (retrieve → analyze → evaluate → revise pode levar 1-2 min). Narração de carteira é síncrona/streaming (payload já computado).

**2.5 Acompanhamento de progresso?** — Sim: a state machine do orquestrador emite eventos SSE por transição (`recuperando evidências`, `analisando`, `validando`...). O usuário vê progresso semântico, não spinner genérico.

**2.6 Editar premissas antes do valuation?** — Valuation está fora da V1. Quando existir: sim, obrigatoriamente — premissas determinantes vêm do usuário por regra (Parte 1, 3.6); a edição não é feature, é pré-condição.

**2.7 Aprovar/rejeitar saída?** — Sim. Aprovação explícita do assessor é registrada (timestamp, versão, hash do conteúdo); rejeição pede motivo curto opcional e vira telemetria de qualidade. *Justificativa: o registro de aprovação é simultaneamente trilha de auditoria e o melhor dataset de avaliação que a Bull. vai ter.*

**2.8 Transformar análise em relatório para cliente?** — V1.x: export com disclaimer, citações e marca de revisão. Na V1, cópia manual — intencional: força o assessor a passar os olhos.

**2.9 Revisão ou comparação entre ativos?** — Revisão: sim ("reescreva mais curto", "detalhe a parte de concentração"). Comparação: atributos lado a lado (taxa, prazo, rating e liquidez) sem veredito — o "qual é melhor" é recusa estruturada com oferta da tabela comparativa.

**2.10 Histórico por cliente, ativo ou conversa?** — Por cliente: carteiras versionadas por snapshot (evolução temporal é feature futura de alto valor). Por documento: corpus versionado (hash, reimportação detectada). Por conversa: retida conforme política do workspace. Por ativo: derivável das duas primeiras, não é entidade própria de histórico.

---

## 3. Resultado de Saída

**3.1 Output mais importante da V1** — A ficha consolidada narrada da carteira do cliente. É o que ataca o tempo-por-cliente diretamente, é a demo de consolidação da carteira, e é 100% sustentada por computação determinística — o output de menor risco e maior valor simultaneamente.

**3.2 Resposta curta ou relatório estruturado?** — Executivo por padrão, expansível por seção. Estrutura fixa, profundidade variável. O assessor decide quanto quer ler, não quanto o modelo quer escrever.

**3.3 Seções do relatório financeiro (análise de resultado)** — Identificação (empresa, período, documentos usados com versão); destaques; fatos com citações; interpretação; itens não recorrentes; riscos e lacunas; classificação (bom/ruim/misto/inconclusivo) **com referencial declarado** (vs. períodos anteriores e guidance, não consenso); confiança (low/medium/high com critério); limitações.

**3.4 Seções do valuation (futuro)** — Premissas com origem marcada (usuário/fonte externa/derivada aritmeticamente); metodologia; cenários (mínimo três); análise de sensibilidade; limitações; disclaimer. Número único é proibido por design.

**3.5 Seções da análise de risco** — Exposição por emissor e por classe; calendário de vencimentos; thresholds violados com severidade (leve/relevante/crítico — réguas determinísticas do workspace); dados faltantes que limitam a análise.

**3.6 Citações e páginas?** — Sim para claims documentais (documento + página + chunk; tabela + linha para métrica). Narração de payload determinístico referencia o payload versionado — auditável por construção.

**3.7 Tabelas?** — Sim — dado estruturado se apresenta em tabela, narração curta em volta. **A tabela vem do payload determinístico; o LLM nunca monta tabela de números** (montar tabela = oportunidade de transcrever errado).

**3.8 Gráficos?** — Sim na UI (composição, vencimentos, evolução), gerados deterministicamente pelo front a partir do payload. LLM não gera nem descreve gráfico que não derive do payload.

**3.9 Premissas e metodologia?** — Sim, sempre que houver cálculo não trivial: como a concentração foi computada (por emissor, classe e data de referência), como o delta de rebalanceamento foi calculado (qual política-alvo, de quando). Transparência metodológica é argumento de venda para compliance do escritório.

**3.10 Disclaimers e limitações?** — Limitações: campo obrigatório do contrato em toda análise (ausência quando há lacuna = rejeição pelo avaliador). Disclaimers: obrigatórios em todo exportável; na UI, presentes de forma não-intrusiva mas visível.

---

## 4. Features de Negócio

**4.1 Features obrigatórias da V1** — Import padronizado + consolidação multi-instituição; concentração por emissor e classe; rebalanceamento vs. política-alvo; calendário de vencimentos; narração via templates; pipeline de notícias com tabs por ticker + chat escopado; análise de resultado release+ITR (maker-checker).

**4.2 Diferenciais que ficam para V2** — Transcripts e perguntas da call; comparação cross-document/entre empresas; export de relatório; alertas push; templates customizáveis por escritório; valuation-simulação; consenso de mercado como referencial; evolução temporal de carteira; aprovação em dois níveis (compliance officer).

**4.3 Comparar empresas?** — V2, e somente como comparação autorizada explicitamente (cross-document com `allow_cross_document = true` e motivo registrado, como no doc do time). Comparação de atributos, nunca de "qual é melhor investimento".

**4.4 Ativo contra setor?** — V2+. Exige dados setoriais licenciados e metodologia de peer group defensável. Sem isso vira comparação impressionista — pior que não ter.

**4.5 Analisar carteira?** — Sim, é o core absoluto da V1 (ver 3.1).

**4.6 Ranking de oportunidades?** — **Não — permanentemente nesta forma.** Ordenar ativos por atratividade é dizer qual é melhor, que é recomendação, apenas vestida de feature. Rankings permitidos: notícias por relevância (informacional), alertas por severidade de risco (determinístico), vencimentos por proximidade (calendário). A regra geral: ranquear **informação sobre o que o cliente já tem** = ok; ranquear **o que comprar** = bloqueado.

**4.7 Monitorar notícias?** — Sim, V1 — o pipeline já está desenhado (ingestão RSS+CVM, dedup, filtro de entidades, scoring híbrido, tabs).

**4.8 Alertar eventos relevantes?** — V1.x: fato relevante CVM publicado para ticker presente em carteiras do assessor → alerta. É determinístico (documento novo existe ou não existe), de altíssimo valor percebido e zero risco regulatório. Melhor candidato a primeira feature pós-V1.

**4.9 Relatório recorrente?** — V2 (ex.: resumo mensal por cliente). Depende do export e de evolução temporal de snapshots. Alto valor, mas não antes do loop básico rodar.

**4.10 Templates de relatório?** — V1: templates da casa, fixos e versionados (são parte do Guardião — o template É o controle). V2: customização por escritório dentro de slots seguros (saudação, identidade visual, disclaimers próprios) — nunca customização que abra slot de linguagem direcional.

---

## 5. Dados e Fontes

**5.1 Fontes que a Bull. já possui** — Brapi (cotações e dados de mercado), BCB SGS (Selic, IPCA, indicadores), import Excel padrão Bull. (carteiras — a fonte mais valiosa), RSS de veículos financeiros, fatos relevantes e documentos públicos CVM/RAD. yfinance foi removido por não ser licenciável para uso comercial — decisão tomada e mantida.

**5.2 Integradas na V1** — As acima. Nenhuma fonte nova entra na V1 sem passar pelo critério de licenciamento.

**5.3 Planilhas internas importantes?** — O Excel padrão Bull. é *a* planilha — formato definido pela Bull., preenchido/convertido pelo assessor. Planilhas legadas do escritório entram via conversão para o padrão, nunca via parsing ad-hoc por instituição (decisão arquitetural já tomada: padronizar na entrada, não interpretar N formatos).

**5.4 Relatórios internos da casa?** — Não existem — a Bull. não produz research, por design (ver 1.7). Relatórios internos do *escritório cliente* podem entrar como documentos importados no corpus do workspace em V2, com a mesma disciplina de metadados.

**5.5 Bases de clientes/carteiras disponíveis?** — Não — e isso é posição, não lacuna: os dados de cliente pertencem ao escritório e entram exclusivamente via import do próprio assessor, isolados por tenant. A Bull. não agrega, não cruza entre workspaces, não revende. Isso deve estar nos termos e no pitch para compliance dos escritórios.

**5.6 APIs de mercado contratadas?** — Brapi (verificar e documentar os termos comerciais do plano para uso B2B revendido — **pendência ativa**, mesma régua que tirou o yfinance); BCB SGS é público e estável. Qualquer API futura passa pelo mesmo gate: termo de uso comercial explícito antes de uma linha de código.

**5.7 Documentos CVM/B3 ingestados automaticamente?** — Sim: fatos relevantes via CVM/RAD no pipeline de notícias (já previsto, peso máximo no ranking); ITRs e releases buscados/importados por demanda na V1, ingestão automática por ticker monitorado em V1.x.

**5.8 Bases de research externas?** — Não na V1, e com ceticismo permanente: research de terceiros traz copyright, custo e — pior — opinião direcional embutida que contamina o produto com recomendação requentada. Se um dia entrar, entra como "evidência complementar com autoria declarada", nunca como fonte de conclusão.

**5.9 Fontes proibidas** — Dados de mercado não licenciados (yfinance e similares); fóruns e redes sociais como evidência; research sem licença; qualquer fonte sem data e autoria identificáveis; conteúdo atrás de paywall obtido sem contrato.

**5.10 Hierarquia oficial de fontes** — (1) Dados determinísticos da carteira (import do assessor — autoritativo no domínio carteira); (2) documentos regulatórios (ITR, fato relevante CVM); (3) RI da empresa (release, apresentação); (4) dados de mercado licenciados (Brapi, BCB); (5) transcript; (6) notícia — complemento datado, nunca substituto. Divergência entre níveis: preservar ambas e marcar conflito.

---

## 6. Tools Necessárias

**6.1 Ações fora do modelo** — Resolver escopo; buscar documentos (híbrida com filtros obrigatórios); extrair texto/tabelas na ingestão; extrair e normalizar métricas; calcular (aritmética, YoY/QoQ, margens, concentração, deltas); consultar carteira (read-only); consultar cotação/indicadores; validar citações; validar schemas; registrar aprovações; gerar arquivo (V1.x). Princípio: **tool executa e devolve resultado validável; tool nunca decide fluxo** (doc do time, mantido).

**6.2 Buscar documentos?** — Sim: `document_search` híbrida (metadados → vetorial → lexical/BM25 → rerank), sempre após `scope_resolver` e `metadata_filter`. Busca sem escopo resolvido é erro, não feature.

**6.3 Ler PDF?** — Sim, **na ingestão, nunca em runtime de chat** — o documento vira objeto de domínio (FinancialReport → seções → chunks → tabelas → métricas) uma vez, e o runtime consome o objeto. PDF bruto no contexto do modelo é proibido.

**6.4 Extrair tabela?** — Sim — e é a tool de maior risco do sistema inteiro. O spike com releases reais (Vale, BB, Santander) define a profundidade viável; fallback documentado: métricas obrigatórias via input estruturado + RAG só sobre narrativa.

**6.5 Calcular indicadores financeiros?** — Sim, exclusivamente via `calculator` determinística: YoY, QoQ, margens, alavancagem, concentração e deltas de rebalanceamento. **LLM não faz aritmética em hipótese alguma** — nem "simples".

**6.6 Calcular valuation?** — Não na V1. Quando existir: tool determinística (DCF/múltiplos) com premissas do usuário como input obrigatório; o LLM narra o resultado da tool, jamais o produz.

**6.7 Consultar cotação?** — Sim, via interface do módulo market (Brapi), sempre com timestamp da cotação no output. Cotação sem hora é dado quebrado.

**6.8 Consultar carteira?** — Sim, read-only por role de banco, escopo resolvido por tenant/assessor/cliente antes da query.

**6.9 Gerar arquivo final?** — V1.x: geração de PDF/documento do relatório aprovado, com disclaimer e citações embutidas, a partir do conteúdo *aprovado* (hash registrado) — não regenerado na hora do export.

**6.10 Registrar aprovação humana?** — Sim: `approval_registry` — quem aprovou/rejeitou, quando, qual versão (hash do conteúdo), motivo de rejeição opcional. É trilha de auditoria, é telemetria de qualidade, e é o futuro golden dataset de avaliação. Tool pequena, valor desproporcional.

---

## 7. Operação Interna

> Nota de reinterpretação: a "operação interna" relevante é majoritariamente a do **escritório cliente** (EQI), não da Bull. — a Bull. fornece os mecanismos; o escritório define as políticas. As respostas refletem isso.

**7.1 Quem revisa o output antes de ir ao cliente?** — O assessor, estruturalmente — nada chega ao cliente sem passar por ele (é design, não processo). O escritório pode exigir segunda revisão (compliance officer) para certos outputs: mecanismo de aprovação em dois níveis é V2.

**7.2 Comitê, analista ou assessor responsável?** — Responsabilidade é do escritório, na figura do assessor que aprova. A Bull. registra *quem* aprovou *o quê* e *quando* — fornece a trilha, não assume a responsabilidade.

**7.3 Padrão interno de relatório?** — A Bull. define o padrão default (templates versionados da casa). Padrões próprios do escritório: V2, dentro dos slots seguros.

**7.4 Linguagem institucional obrigatória?** — Suportada via slots de template (saudação, assinatura, disclaimers próprios do escritório) em V1.x. Slots nunca abrem espaço para linguagem direcional — o template é parte do Guardião.

**7.5 Política de risco interna?** — A da Bull.: defaults conservadores de thresholds (concentração e liquidez). A do escritório: configuração por workspace, definida no onboarding (com a EQI no piloto). Threshold do escritório só pode ser *mais* conservador que o piso mínimo definido pela metodologia do produto, nunca menos.

**7.6 Política comercial interna?** — Fora do sistema. A Bull. não gerencia metas, comissões ou campanhas comerciais — e não deve: misturar incentivo comercial com a camada de análise é exatamente o conflito de interesse que o produto se orgulha de não ter.

**7.7 Restrição por tipo de cliente?** — O perfil declarado existe como dado. Suitability automatizado não existe (Parte 1). Flags determinísticas exibicionais (ex.: "produto restrito a investidor qualificado" como aviso) são V2 — são regra objetiva, não juízo de adequação.

**7.8 Restrição por produto financeiro?** — V1 cobre: renda fixa bancária, títulos públicos, fundos e ações (consolidação/composição); análise de resultado para ações listadas. Fora: derivativos, COE, estruturados, cripto, offshore, previdência — cada um entra futuramente com regras próprias, não por extensão silenciosa.

**7.9 Trilha de auditoria exigida?** — Sim, integral: evidência (quais fontes sustentam), decisão (por que o orquestrador fez cada passo), qualidade (por que o avaliador aprovou/rejeitou), isolamento (como o escopo foi garantido), aprovação (quem assinou). As cinco trilhas respondem a qualquer questionamento de compliance do escritório — e são argumento de venda.

**7.10 Aprovação obrigatória para certos outputs?** — Todo exportável exige aprovação registrada. Internamente ao assessor, outputs com risco crítico identificado ou classificação inconclusiva ganham destaque obrigatório (não bloqueio — informação destacada, decisão humana).

---

## 8. Escopo Comercial e Regulatório

**8.1 Clientes profissionais, varejo ou ambos?** — O usuário é o assessor; os clientes finais dele são majoritariamente varejo e alta renda. O sistema não interage com eles, mas **todo conteúdo assume que pode chegar a um cliente de varejo** via assessor — portanto o rigor é calibrado pelo destinatário mais protegido, sempre.

**8.2 Recomendação individualizada?** — Nunca. Inegociável, permanente, estrutural.

**8.3 Relatório genérico?** — Relatório descritivo, educacional ou informativo: sim. "Relatório de análise" no sentido técnico da Resolução CVM 20 (com recomendação e/ou preço-alvo): não — isso exige analista credenciado e não é o produto.

**8.4 Sugerir alocação?** — Não sugere; **computa o delta entre carteira atual e a política-alvo definida pelo assessor** (Parte 1, 5.7 — a resposta mais importante do documento anterior, mantida palavra por palavra).

**8.5 Preço-alvo?** — Não, permanentemente (Parte 1, 3.3).

**8.6 Upside/downside?** — Não como cálculo ou projeção própria — "upside de 20%" é preço-alvo disfarçado e recebe o mesmo bloqueio. Pode reportar fato citável: "a empresa elevou o guidance de produção para X" ou "o documento Y projeta Z" — sempre com fonte e atribuição a terceiro identificado.

**8.7 Suitability para adaptar resposta?** — Não na V1 (Parte 1, 4.10 e 5.4). O sistema entrega o quadro; o assessor cruza com o perfil. Reavaliação em V2 somente com parecer jurídico.

**8.8 Produtos na V1** — Renda fixa bancária e títulos públicos como núcleo; fundos e ações em consolidação e composição; ações listadas no módulo de análise de resultado.

**8.9 Produtos fora** — Derivativos, COE e estruturados, cripto, ativos offshore, previdência. Motivo comum: cada um tem regime regulatório, fiscal ou de risco próprio que exige regras dedicadas — entrar "de carona" na consolidação genérica produziria números errados com aparência de certos.

**8.10 Respostas com bloqueio automático** — Pedido de recomendação direta ou disfarçada (após recusa estruturada com alternativa oferecida); claim numérica sem fonte resolvível; violação de escopo (documento, período, tenant, cliente); pedido de suitability; preço-alvo/upside; promessa ou projeção de rentabilidade; segunda reprovação por groundedness; contradição numérica crítica (circuit breaker).

---

## 9. Personalização e Memória

> Princípio governante do bloco: **memória ≠ evidência.** Memória pode mudar *como* o sistema fala; nunca pode mudar *o que* o sistema conclui.

**9.1 Lembrar preferências do assessor?** — Sim: formato, verbosidade, idioma, seções favoritas, templates preferidos. Explícitas e editáveis.

**9.2 Lembrar preferências do cliente final?** — Dados cadastrais e perfil *declarado* existem como dados estruturados do domínio (não "memória de IA"). O sistema **não infere nem acumula** impressões sobre o cliente final ("parece avesso a risco") — inferência sobre terceiro que não usa o sistema é passivo regulatório e ético.

**9.3 Lembrar premissas de valuation anterior?** — Quando valuation existir: premissas são **dados versionados recuperáveis** ("simulação de 12/03 com taxa X"), não memória implícita. Reuso exige confirmação explícita (ver 9.9).

**9.4 Lembrar histórico de relatórios?** — Sim: por cliente, versionado, com hash do conteúdo aprovado. É a base da feature futura de evolução temporal.

**9.5 Lembrar decisões de aprovação?** — Sim (6.10): auditoria + telemetria + futuro golden dataset.

**9.6 O que nunca deve ser lembrado** — PII além do operacionalmente necessário; conteúdo de conversa como evidência financeira; inferências não declaradas sobre situação ou psicologia do cliente final; qualquer dado de outro tenant; "preferências" que relaxem controles (ex.: "esse assessor prefere respostas sem disclaimers" — preferência inválida por definição).

**9.7 Memória pode mudar o formato?** — Sim — é o uso legítimo dela: comprimento, estrutura, idioma, ênfase de seções.

**9.8 Memória pode mudar a análise?** — **Não.** A análise depende exclusivamente da evidência atual (payload + documentos no escopo). Duas execuções com a mesma evidência devem produzir a mesma análise independentemente de quem pergunta ou do que foi conversado antes. É a propriedade que torna o sistema auditável.

**9.9 Memória pode mudar premissas?** — Não automaticamente. Pode *oferecer*: "usar as mesmas premissas da simulação de 12/03?" — com confirmação explícita, e a origem da premissa registrada como "reuso confirmado pelo usuário".

**9.10 Como o usuário vê/corrige memória?** — Tela de preferências explícita: tudo que o sistema "lembra" é visível, editável e deletável ali. Regra de design: **não existe memória implícita-opaca** — se não está na tela, o sistema não pode estar usando.

---

## 10. Métrica de Sucesso

**10.1 Como saber que deu certo** — Sinal comercial: a EQI renova/expande o piloto. North star operacional: **tempo de preparação por cliente ↓** (proxy direto de clientes-por-assessor ↑, que é a dor nomeada). Tudo o mais é métrica de suporte.

**10.2 Reduzir tempo de análise?** — Sim — métrica primária. Medir baseline com a EQI no onboarding (quanto tempo a preparação de uma reunião leva hoje, cronometrada em casos reais) e comparar após adoção. Sem baseline medido, o ROI do produto vira anedota.

**10.3 Melhorar qualidade de relatório?** — Secundária. Proxy mensurável: taxa de aprovação sem edição vs. com edição pesada (o `approval_registry` entrega isso de graça). Edição pesada recorrente na mesma seção = defeito de template ou de análise.

**10.4 Padronizar produção?** — Sim, métrica de valor para o *escritório* (não para o assessor individual): variância de formato e cobertura entre assessores cai. É argumento de venda enterprise.

**10.5 Aumentar escala comercial?** — É a consequência north star (mais clientes por assessor), não métrica operacional própria — medi-la diretamente exige dados comerciais do escritório que a Bull. não controla; reportar quando o cliente compartilhar.

**10.6 Reduzir erro operacional?** — Sim: contar **achados** — exposição excessiva detectada, vencimento próximo não percebido, concentração acima do threshold sinalizada. Cada achado é um erro operacional evitado e uma história de venda.

**10.7 Melhorar atendimento?** — Indireta (consequência do tempo liberado). Não perseguir como métrica própria na V1.

**10.8 Outputs comparados contra humano** — (a) Extração de métricas vs. conferência manual no golden dataset; (b) classificação de resultado vs. julgamento de analista nos mesmos casos; (c) cálculo de concentração/deltas vs. planilha do assessor — **este deve bater 100%: é determinístico; divergência é bug, não imprecisão.**ss

**10.9 Precisão aceitável** — Por camada: determinístico = 100% (sem tolerância — erro é bug); extração de métricas obrigatórias ≥ alvo definido no spike (proposta inicial: ≥95% de exatidão, com a regra de ouro **erro não detectado vale menos que lacuna declarada** — o sistema deve preferir dizer "não extraí" a extrair errado); classificação de resultado: concordância ≥80% com analista no golden dataset inicial, subindo por versão.

**10.10 Latência aceitável** — Queries determinísticas de carteira: <1s. Narração streaming: primeiro token em <2-3s. Análise de resultado: job assíncrono — minutos são aceitáveis *com progresso visível* (2.5); o que não é aceitável é silêncio. Pipeline de notícias: atualização a cada 15-30 min com rotulagem honesta de idade.

---

## Decisões que exigem validação ativa (Parte 2)

1. **Termos comerciais da Brapi para uso B2B** (5.6) — mesma régua do yfinance; verificar e documentar antes do piloto. *Pendência com dono: fundadores.*
2. **Baseline de tempo de preparação na EQI** (10.2) — cronometrar casos reais no onboarding; sem isso o ROI não se prova. *Dono: João/comercial.*
3. **Lista de produtos da V1 vs. carteiras reais da EQI** (7.8/8.8) — validar que renda fixa bancária + TD + fundos + ações cobrem ≥90% das posições dos clientes-piloto; se previdência for material, a decisão de exclusão precisa ser comunicada, não descoberta.
4. **Política default de thresholds de risco** (7.5) — números concretos com mercado
5. **Posição sobre "opinião da casa"** (1.7) — confirmada pelos fundadores como identidade permanente do produto (plataforma, não casa de research); essa resposta define o que a Bull. é.
