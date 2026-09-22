import { createContext, omit, useContext, type ParentProps } from 'solid-js';

/**
 * MDX emits every element as `<_components.h1>`, where the value is the string
 * "h1". Solid's compiler reads that as a component call, so the tags need real
 * components behind them. Concrete ones per tag, written as JSX, so the
 * compiler emits a static template for each: a Dynamic-based version builds but
 * diverges from the server render during hydration.
 */
const intrinsics: Record<string, any> = {
  a: (p: any) => <a {...omit(p, 'children')}>{p.children}</a>,
  blockquote: (p: any) => <blockquote {...omit(p, 'children')}>{p.children}</blockquote>,
  br: (p: any) => <br {...p} />,
  code: (p: any) => <code {...omit(p, 'children')}>{p.children}</code>,
  del: (p: any) => <del {...omit(p, 'children')}>{p.children}</del>,
  div: (p: any) => <div {...omit(p, 'children')}>{p.children}</div>,
  em: (p: any) => <em {...omit(p, 'children')}>{p.children}</em>,
  h1: (p: any) => <h1 {...omit(p, 'children')}>{p.children}</h1>,
  h2: (p: any) => <h2 {...omit(p, 'children')}>{p.children}</h2>,
  h3: (p: any) => <h3 {...omit(p, 'children')}>{p.children}</h3>,
  h4: (p: any) => <h4 {...omit(p, 'children')}>{p.children}</h4>,
  h5: (p: any) => <h5 {...omit(p, 'children')}>{p.children}</h5>,
  h6: (p: any) => <h6 {...omit(p, 'children')}>{p.children}</h6>,
  hr: (p: any) => <hr {...p} />,
  img: (p: any) => <img {...p} />,
  li: (p: any) => <li {...omit(p, 'children')}>{p.children}</li>,
  ol: (p: any) => <ol {...omit(p, 'children')}>{p.children}</ol>,
  p: (p: any) => <p {...omit(p, 'children')}>{p.children}</p>,
  pre: (p: any) => <pre {...omit(p, 'children')}>{p.children}</pre>,
  span: (p: any) => <span {...omit(p, 'children')}>{p.children}</span>,
  strong: (p: any) => <strong {...omit(p, 'children')}>{p.children}</strong>,
  table: (p: any) => <table {...omit(p, 'children')}>{p.children}</table>,
  tbody: (p: any) => <tbody {...omit(p, 'children')}>{p.children}</tbody>,
  td: (p: any) => <td {...omit(p, 'children')}>{p.children}</td>,
  th: (p: any) => <th {...omit(p, 'children')}>{p.children}</th>,
  thead: (p: any) => <thead {...omit(p, 'children')}>{p.children}</thead>,
  tr: (p: any) => <tr {...omit(p, 'children')}>{p.children}</tr>,
  ul: (p: any) => <ul {...omit(p, 'children')}>{p.children}</ul>,
};

const MDXContext = createContext<Record<string, any>>(intrinsics);

export function useMDXComponents(extra?: Record<string, any>) {
  return { ...useContext(MDXContext), ...extra };
}

export function MDXProvider(props: ParentProps<{ components?: Record<string, any> }>) {
  return (
    <MDXContext {...{ value: { ...intrinsics, ...props.components } }}>
      {props.children}
    </MDXContext>
  );
}
