// @ts-nocheck
import * as __fd_glob_26 from "../content/docs/produto/roadmap.mdx?collection=docs"
import * as __fd_glob_25 from "../content/docs/produto/postura-editorial.mdx?collection=docs"
import * as __fd_glob_24 from "../content/docs/produto/index.mdx?collection=docs"
import * as __fd_glob_23 from "../content/docs/guias/variaveis-ambiente.mdx?collection=docs"
import * as __fd_glob_22 from "../content/docs/guias/spec-kit.mdx?collection=docs"
import * as __fd_glob_21 from "../content/docs/guias/setup.mdx?collection=docs"
import * as __fd_glob_20 from "../content/docs/guias/comandos.mdx?collection=docs"
import * as __fd_glob_19 from "../content/docs/backend/index.mdx?collection=docs"
import * as __fd_glob_18 from "../content/docs/backend/banco-de-dados.mdx?collection=docs"
import * as __fd_glob_17 from "../content/docs/backend/agentes-ia.mdx?collection=docs"
import * as __fd_glob_16 from "../content/docs/frontend/servicos.mdx?collection=docs"
import * as __fd_glob_15 from "../content/docs/frontend/rotas.mdx?collection=docs"
import * as __fd_glob_14 from "../content/docs/frontend/index.mdx?collection=docs"
import * as __fd_glob_13 from "../content/docs/frontend/convencoes.mdx?collection=docs"
import * as __fd_glob_12 from "../content/docs/frontend/componentes.mdx?collection=docs"
import * as __fd_glob_11 from "../content/docs/arquitetura/inventario.mdx?collection=docs"
import * as __fd_glob_10 from "../content/docs/arquitetura/index.mdx?collection=docs"
import * as __fd_glob_9 from "../content/docs/arquitetura/decisoes.mdx?collection=docs"
import * as __fd_glob_8 from "../content/docs/arquitetura/dados-e-integracoes.mdx?collection=docs"
import * as __fd_glob_7 from "../content/docs/index.mdx?collection=docs"
import * as __fd_glob_6 from "../content/docs/design-system.mdx?collection=docs"
import { default as __fd_glob_5 } from "../content/docs/guias/meta.json?collection=docs"
import { default as __fd_glob_4 } from "../content/docs/produto/meta.json?collection=docs"
import { default as __fd_glob_3 } from "../content/docs/frontend/meta.json?collection=docs"
import { default as __fd_glob_2 } from "../content/docs/backend/meta.json?collection=docs"
import { default as __fd_glob_1 } from "../content/docs/arquitetura/meta.json?collection=docs"
import { default as __fd_glob_0 } from "../content/docs/meta.json?collection=docs"
import { server } from 'fumadocs-mdx/runtime/server';
import type * as Config from '../source.config';

const create = server<typeof Config, import("fumadocs-mdx/runtime/types").InternalTypeConfig & {
  DocData: {
  }
}>({"doc":{"passthroughs":["extractedReferences"]}});

export const docs = await create.docs("docs", "content/docs", {"meta.json": __fd_glob_0, "arquitetura/meta.json": __fd_glob_1, "backend/meta.json": __fd_glob_2, "frontend/meta.json": __fd_glob_3, "produto/meta.json": __fd_glob_4, "guias/meta.json": __fd_glob_5, }, {"design-system.mdx": __fd_glob_6, "index.mdx": __fd_glob_7, "arquitetura/dados-e-integracoes.mdx": __fd_glob_8, "arquitetura/decisoes.mdx": __fd_glob_9, "arquitetura/index.mdx": __fd_glob_10, "arquitetura/inventario.mdx": __fd_glob_11, "frontend/componentes.mdx": __fd_glob_12, "frontend/convencoes.mdx": __fd_glob_13, "frontend/index.mdx": __fd_glob_14, "frontend/rotas.mdx": __fd_glob_15, "frontend/servicos.mdx": __fd_glob_16, "backend/agentes-ia.mdx": __fd_glob_17, "backend/banco-de-dados.mdx": __fd_glob_18, "backend/index.mdx": __fd_glob_19, "guias/comandos.mdx": __fd_glob_20, "guias/setup.mdx": __fd_glob_21, "guias/spec-kit.mdx": __fd_glob_22, "guias/variaveis-ambiente.mdx": __fd_glob_23, "produto/index.mdx": __fd_glob_24, "produto/postura-editorial.mdx": __fd_glob_25, "produto/roadmap.mdx": __fd_glob_26, });