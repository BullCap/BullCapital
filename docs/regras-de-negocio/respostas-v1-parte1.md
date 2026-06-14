# Bull. — Regras de Negócio do Sistema de IA (Respostas V1)

> Respostas propostas pelo product owner às perguntas de descoberta do time de IA.
> Princípio que governa tudo: **computação determinística conclui; LLM narra e organiza; o Guardião garante que a fronteira não vaza.** Toda resposta abaixo deriva desse princípio, da dor validada da EQI (teto de clientes por assessor) e da linha CVM.

---

## 1. Produto de IA

**1.1 Produto principal da V1** — Apoio ao assessor: narração de payloads determinísticos (composição, rebalanceamento e calendário de vencimentos) + análise de notícias por ticker com chat escopado + análise estruturada de resultados trimestrais (módulo do doc de Multi-Agentic RAG). Não é valuation, não é relatório autônomo, não é chatbot generalista. *Justificativa: a dor da EQI é tempo-por-cliente; o valor está em consolidar e explicar o que já existe, não em opinar.*

**1.2 Usuário direto** — O assessor, exclusivamente. Nunca o cliente final na V1. *Justificativa: B2B; o assessor é o human-in-the-loop que a regulação e o modelo de negócio exigem.*

**1.3 Saída interna ou para o cliente?** — Formalmente interna. Mas o produto assume que qualquer saída pode ser repassada ao cliente pelo assessor, portanto todo output mantém o mesmo rigor (citações, limitações, linguagem sem recomendação). *Justificativa: não dá pra controlar copy-paste; o rigor não pode depender do destino.*

**1.4 Perguntas livres ou fluxos fechados?** — Fluxos fechados como espinha dorsal; chat livre apenas dentro de escopo resolvido (notícias da tab, resultado do documento ativo), sempre atrás do Guardião. *Justificativa: pergunta livre sem escopo é onde nasce mistura de documentos e recomendação acidental.*

**1.5 Análise pronta ou rascunho revisável?** — Rascunho revisável. O assessor edita, valida e assume o que vai ao cliente. *Justificativa: posiciona o produto como ferramenta do profissional, não substituto — comercial e regulatoriamente correto.*

**1.6 A IA pode concluir?** — Pode concluir apenas dentro de taxonomias fechadas definidas pelo negócio (ex.: resultado bom/ruim/misto/inconclusivo, com referencial explícito). Nunca conclusão de investimento. Fora das taxonomias, organiza evidências. *Justificativa: taxonomia fechada é avaliável e auditável; conclusão aberta é risco.*

**1.7 Obrigatório na V1** — Narração de composição, rebalanceamento e vencimentos; pipeline de news com ranking e chat escopado; análise de resultado release+ITR com maker-checker.

**1.8 Explicitamente fora da V1** — Valuation, preço justo, preço-alvo, recomendação de qualquer natureza, projeção de rentabilidade, sugestão de alocação, suitability automatizado, transcripts e comparação cross-document (ficam para V1.x), acesso do cliente final.

**1.9 Resposta "boa" para a Bull.** — Todo número rastreável a payload determinístico ou chunk citado; escopo documental respeitado; lacunas declaradas; referencial de comparação explícito; linguagem sem direção de investimento; útil o suficiente para o assessor economizar tempo real.

**1.10 Resposta perigosa/inaceitável** — Direção de trade (explícita ou disfarçada), número sem fonte, mistura de períodos/empresas/clientes, promessa ou projeção de retorno, parecer de adequação ao perfil, conclusão confiante sobre evidência incompleta.

---

## 2. Relatórios e RAG

**2.1 Documentos da V1** — Release de resultados e ITR. Apresentações e transcripts em V1.x. *Justificativa: release+ITR cobrem as métricas obrigatórias; transcript é refinamento.*

**2.2 Hierarquia de autoridade** — Documentos regulatórios (ITR, fato relevante CVM) > release/RI da empresa > apresentação > transcript > notícia. Planilha/import do assessor é a fonte autoritativa **de dados de carteira**, não de análise de empresa — são domínios separados.

**2.3 Métricas obrigatórias na análise mínima** — Receita, EBITDA e margem, lucro líquido, fluxo de caixa operacional, dívida líquida/alavancagem. Itens não recorrentes quando materiais. *Justificativa: é o checklist de cobertura do doc do time; sem uma delas, a lacuna entra no `evidence_coverage`.*

**2.4 Comparar períodos?** — Sim: YoY e QoQ no mínimo, vs. guidance da própria empresa quando existir. **Referencial sempre explícito no output** — a V1 não compara com consenso de mercado, e o usuário precisa saber disso. *Justificativa: "bom" sem referencial declarado induz erro de leitura.*

**2.5 Extrair tabelas ou interpretar texto?** — Extrair tabelas é necessário: as métricas obrigatórias vivem em tabelas. A profundidade da extração será calibrada pelo spike de parsing (3-5 releases reais) — se a qualidade não fechar, fallback: métricas centrais por input estruturado e RAG sobre narrativa.

**2.6 Nunca inferir** — Qualquer valor numérico, datas, períodos, guidance, unidades. Se não está na fonte, é lacuna declarada — sem exceção.

**2.7 Documento incompleto** — Análise com fallback declarado ("transcript ausente; análise baseada em release e ITR") ou classificação inconclusiva. Nunca preencher com conhecimento do modelo.

**2.8 Nível de citação** — Documento + página + chunk para narrativa; tabela + linha para métrica extraída. *Justificativa: é o nível que permite ao assessor verificar em segundos — abaixo disso a citação é decorativa.*

**2.9 Destacar riscos, oportunidades e lacunas?** — Sim, são camadas obrigatórias do contrato de saída (fatos / interpretação / riscos e lacunas / conclusão). Lacuna omitida = resposta rejeitada pelo avaliador.

**2.10 Relatório é evidência ou análise final?** — É evidência para o avaliador até passar no gate; depois é **rascunho revisável** para o assessor. Nunca "análise final" no sentido de pronta para o cliente sem revisão.

---

## 3. Valuation

**3.1 Uso do valuation** — Não existe na V1. Quando existir: estudo e suporte interno ao assessor, rotulado como simulação. Nunca insumo direto de recomendação.

**3.2 Preço justo na V1?** — Não. Futuro: apenas com premissas fornecidas pelo usuário, sempre em cenários, rotulado como exercício de simulação.

**3.3 Preço-alvo?** — Não — e não é questão de versão: emissão de preço-alvo é atividade de relatório de análise (Resolução CVM 20, analista certificado). Fora do produto, permanentemente, salvo mudança de estratégia regulatória com parecer jurídico.

**3.4 Compra/venda/manutenção?** — Nunca. É a linha inegociável do produto.

**3.5 Métodos permitidos (futuro)** — Múltiplos comparáveis e DCF com premissas explícitas. Nada proprietário-opaco.

**3.6 Premissas do usuário** — Taxa de desconto, crescimento, cenários de margem, horizonte. Tudo que define o resultado vem do assessor.

**3.7 Premissas de bases externas** — Apenas dados licenciados e citáveis: preços de mercado, indicadores publicados (Selic, IPCA), demonstrativos.

**3.8 Premissas estimadas pelo sistema** — Nenhuma na V1. Futuro: apenas valores derivados aritmeticamente de fontes citadas (ex.: média histórica de margem calculada de ITRs), nunca "chute calibrado" do modelo.

**3.9 Sempre cenários?** — Sim. Número único de valuation é proibido por design — cenários comunicam incerteza estruturalmente.

**3.10 Valuation inválido/bloqueado** — Premissas ausentes, dados de período errado, tentativa de converter simulação em recomendação ("então devo comprar?" → recusa estruturada do Guardião).

---

## 4. Risco

**4.1 Risco de quê?** — V1: risco **da carteira** — concentração e liquidez por vencimento. Tudo determinístico. Risco de ativo/tese vem com o módulo de resultados (camada de riscos do output); risco do cliente (suitability) fica fora.

**4.2 Categorias V1** — Concentração por emissor e por classe; concentração de vencimentos (liquidez no tempo).

**4.3 Obrigatórios em qualquer análise de carteira** — Concentração e vencimentos. *Justificativa: são dores objetivas da carteira e são computáveis sem nenhum juízo.*

**4.4 Régua interna da Bull.?** — Não existe ainda; deve ser **configuração por escritório** (thresholds de concentração, política de alerta), com default conservador. Definir os defaults com a EQI no piloto.

**4.5 Risco pode alterar/bloquear conclusão?** — Sim: o avaliador rejeita análise que classifica resultado/carteira positivamente ignorando risco crítico identificado. Risco crítico rebaixa confiança no mínimo.

**4.6 Leve/relevante/crítico** — Thresholds determinísticos definidos pelo negócio (ex.: >X% em um emissor, concentração excessiva em vencimentos próximos), não juízo de LLM. O LLM narra a classificação, não a decide.

**4.7 Riscos que exigem revisão humana** — Por design, tudo que chega ao cliente passa pelo assessor. Internamente: risco crítico + qualquer análise inconclusiva geram destaque visual obrigatório, não entrega silenciosa.

**4.8 Dados para risco de carteira** — Posições consolidadas via import padronizado Bull.: emissor, classe, indexador, vencimento e valor.

**4.9 Apontar concentração?** — Sim, é core da V1 — feature determinística, dor validada.

**4.10 Cruzar risco com perfil do cliente?** — Não na V1. Suitability automatizado é zona regulatória sensível; o sistema entrega o quadro de risco, o assessor cruza com o perfil. Reavaliar em V2 com parecer jurídico.

---

## 5. Compliance e Suitability

**5.1 Conteúdo que pareça recomendação?** — Não. O Guardião é estrutural: o LLM preenche templates com slots, números entram por referência ao payload, e linguagem direcional é bloqueada no contrato — não filtrada depois.

**5.2 Expressões proibidas** — "Compre/venda/mantenha", "recomendamos/sugerimos investir", "melhor ativo/opção", "vai subir/valorizar", "preço-alvo", "retorno garantido/esperado de X%", qualquer imperativo direcional sobre posição.

**5.3 Expressões obrigatórias** — Rotulagem de fonte e data em claims factuais; declaração de limitação quando há lacuna; referencial de comparação em classificações; disclaimer "não constitui recomendação de investimento" em todo artefato exportável.

**5.4 Respostas que exigem suitability** — A V1 não emite nenhuma: qualquer pergunta que exija adequação ao perfil ("isso serve pro meu cliente conservador?") recebe recusa estruturada com redirecionamento ao assessor.

**5.5 Rentabilidade esperada?** — Não projeta. Pode citar rentabilidade **contratual** de título (taxa de um CDB é fato com fonte) e **histórica** com período e fonte. A fronteira: passado/contratado = fato citável; futuro = proibido.

**5.6 Comparar ativos dizendo qual é melhor?** — Não. Pode exibir atributos lado a lado (taxa, prazo, rating e liquidez) sem veredito. A escolha é do assessor.

**5.7 Sugerir alocação?** — Não sugere. **Mas computa o delta entre a carteira atual e a política-alvo definida pelo assessor** — rebalanceamento é aritmética da política dele, não opinião do sistema. Essa distinção é o coração do produto e deve estar documentada palavra por palavra no prompt e no Guardião.

**5.8 Quando bloquear** — Pedido de recomendação direta (após recusa estruturada), claim numérica sem fonte resolvível, violação de escopo documental/tenant, segunda reprovação por groundedness.

**5.9 Quando vai para revisão humana** — Tudo passa pelo assessor por design. Sinalização ativa para o escritório: bloqueios recorrentes na mesma conversa (usuário insistindo em recomendação) e circuit breakers.

**5.10 Evidências para auditoria** — Log completo por run: inputs, escopo resolvido, payloads e chunks citados, versões de prompt e modelo, decisões do orquestrador (decision log), parecer do avaliador, o que foi bloqueado e por quê. Retenção por prazo a definir com jurídico.

---

## 6. Dados do Cliente e Escopo

**6.1-6.4 Acessos** — Carteira: sim, read-only (role do Postgres). Perfil: dados cadastrais mínimos e perfil declarado, leitura. Histórico de interação: apenas o necessário ao contexto da conversa atual. Nada de acesso write a dados de cliente pelo serviço de IA.

**6.5 Dados enviáveis ao modelo** — Minimização: posições agregadas e os campos estritamente necessários à pergunta. Nome do cliente substituível por identificador/apelido no contexto.

**6.6 Dados mascarados** — CPF, documentos, contatos e dados bancários. Regra: o LLM nunca precisa de PII para narrar uma carteira.

**6.7 Separação tenant/escritório/assessor/cliente** — Hierarquia `workspace (escritório) → assessor → cliente`, resolvida pelo `scope_resolver` **antes** de qualquer retrieval ou query, com enforcement em role de banco e filtro obrigatório de metadados nos chunks. Chunk sem tenant não entra na vector DB.

**6.8 Assessor consulta quais clientes** — Apenas os seus, por default. Compartilhamento intra-escritório é configuração explícita do workspace, com log.

**6.9 Preferência passada do usuário** — Sim para formato/estilo/idioma de saída. **Nunca como evidência financeira** — memória ≠ evidência; dado de carteira vem do banco, dado de empresa vem de documento citável.

**6.10 Esquecimento/expiração** — Cliente removido pelo assessor → dados derivados removidos. Conversas expiram conforme política de retenção do workspace. Logs de auditoria têm retenção própria (regulatória) e sobrevivem à exclusão da conversa — isso deve estar nos termos.

---

## 7. Saída Final

**7.1 Formatos V1** — Blocos narrativos streamados no app (SSE), cards de notícia com pontos-chave, análise estruturada de resultado (4 camadas). Export PDF/relatório: V1.x.

**7.2 Extensão** — Executiva por padrão, expansível para detalhe sob demanda. O assessor tem 15 minutos por cliente, não 50.

**7.3 Citações** — Sempre que houver claim factual de documento ou notícia. Narração de payload determinístico referencia o payload (que é auditável), não exige citação documental.

**7.4 Limitações** — Campo obrigatório do contrato, não cortesia. Resposta sem seção de limitações quando há lacuna conhecida = rejeitada.

**7.5 Próximos passos** — Apenas operacionais ("faltam dados de fluxo de caixa para completar"; "importe o extrato de X"). Nunca próximos passos de investimento.

**7.6 Separar fatos/análise/opinião** — Sim: fatos / interpretação / riscos e lacunas / conclusão. Opinião não existe como categoria — o sistema não opina.

**7.7 Mostrar confiança** — Sim, taxonomia low/medium/high com critério definido (cobertura de evidências + severidade de lacunas). Nunca percentual — falsa precisão.

**7.8 Mostrar agentes participantes** — Não na UI (ruído para o assessor). Sim no log de auditoria, integralmente.

**7.9 Mostrar bloqueios/omissões** — Sim: recusa estruturada explica o limite e oferece o caminho respondível ("não posso indicar direção; posso comparar os atributos lado a lado"). Bloqueio silencioso destrói confiança no produto.

**7.10 Artefato exportável** — V1.x, com disclaimer obrigatório, citações embutidas e identificação de que foi gerado com IA e revisado pelo assessor (campo de assinatura/revisão).

---

## 8. Avaliação e Aprovação

**8.1 Resposta aceitável** — Passa nos gates duros determinísticos (schema válido, toda claim numérica com chunk/payload existente e número de fato presente na fonte, escopo respeitado, aritmética re-verificada) + cobertura mínima das dimensões obrigatórias + linguagem segura + parecer positivo do avaliador LLM nos critérios soft.

**8.2 Incompleta mas útil** — Lacunas declaradas com fallback explícito e classificação prudente (misto/inconclusivo quando a cobertura não sustenta mais). É um estado legítimo de entrega, não um erro.

**8.3 Bloqueada** — Número sem fonte, violação de escopo (documento, período, tenant), linguagem de recomendação, mistura de períodos, segunda reprovação por groundedness, contradição numérica crítica.

**8.4 Erros toleráveis** — Estilo, verbosidade, ordem de apresentação, lacuna honesta de fonte ausente.

**8.5 Erros intoleráveis** — Número inventado ou alterado, citação que não sustenta a claim, vazamento entre clientes/documentos, direção de trade, promessa de retorno, período errado tratado como atual.

**8.6 Revisão humana obrigatória** — Estruturalmente: o assessor revisa tudo que vai ao cliente. Operacionalmente: circuit breakers e padrões recorrentes de bloqueio vão para revisão do time (telemetria), não do assessor.

**8.7 Entrega automática** — Tudo que passou no gate é entregue automaticamente **ao assessor**. Nada é entregue automaticamente ao cliente final — isso não é limitação técnica, é posição de produto.

**8.8 Evidência mínima** — Payload determinístico íntegro (para narração) ou conjunto de chunks citáveis do período correto cobrindo as dimensões obrigatórias (para análise documental). Sem isso: inconclusivo ou bloqueio.

**8.9 Divergência entre fontes** — Preservar ambas, marcar o conflito explicitamente e apresentá-lo ao assessor com as duas citações. Nunca resolver silenciosamente — escolher uma fonte é juízo editorial que o sistema não tem mandato para fazer.

**8.10 Hierarquia de confiança** — (1) Dados determinísticos da carteira (import do assessor — fonte autoritativa do domínio carteira); (2) documentos regulatórios CVM/ITR/fato relevante; (3) RI da empresa (release, apresentação); (4) dados de mercado licenciados; (5) transcript; (6) notícia — complemento, nunca substituto, sempre datada.

---

## Decisões que exigem validação ativa (não derivam automaticamente do que já foi definido)

1. **Defaults da régua de risco** (4.4, 4.6) — thresholds de concentração e liquidez: definir números com a EQI no piloto.
2. **Retenção de logs de auditoria** (5.10, 6.10) — prazo e base legal: jurídico.
3. **Compartilhamento intra-escritório** (6.8) — política default do workspace: decisão comercial com o primeiro cliente.
4. **Posição permanente sobre preço-alvo** (3.3) — confirmada como "nunca" ou "nunca sem reestruturação regulatória": fundadores + jurídico.
5. **Fronteira rentabilidade contratual vs. projetada** (5.5) — redação exata das expressões permitidas: revisar com compliance antes do piloto.
