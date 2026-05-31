import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';

// Componentes disponiveis em todos os arquivos MDX de /docs.
// Inclui os defaults do Fumadocs (Cards, Callout, code blocks, tabelas, etc.).
export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    ...components,
  };
}
