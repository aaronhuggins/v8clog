// deno-lint-ignore-file no-explicit-any

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [element: string]: any;
    }
  }
}

export type XMLComponent<T = any> = T & { __isXML: boolean; __expr: [string, string][] }
export type Renderer = (...args: any[]) => string
export type JSXHandler = (...args: any[]) => any

const selfClosing = [
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr'
]
const regex = `<(\\/{0,1})purexml(${selfClosing.join('|')})`

export function xml<T = any> (component: T, tagExpressions?: Record<string, string>): XMLComponent<T> {
  (component as any).__isXML = true;
  (component as any).__expr = Object.entries(tagExpressions ?? {});

  return component as any
}

export function createXMLHandler<T extends JSXHandler> (h: T): T {
  const marker: JSXHandler = (...args: any[]): any => {
    const tagOrComponent = args[0]
    if (selfClosing.includes(tagOrComponent)) args[0] = `purexml${tagOrComponent}`

    return h(...args)
  }

  return marker as T
}

/** Create a server-side renderer with support for pure XML components. */
export function createXMLRenderer<T extends Renderer>(renderSSR: T): T {
  const renderer: Renderer = (...args: any[]): string => {
    const component = args[0]
    if (component?.__isXML || component?.component?.__isXML) {
      const expressions: [string, string][] = component?.__expr ?? component?.component?.__expr ?? []
      let rendered = renderSSR(...args).replaceAll(new RegExp(regex, 'gu'), '<$1$2')
  
      for (const [tagName, replacement] of expressions) {
        rendered = rendered.replaceAll(new RegExp(`<(\\/{0,1})${tagName}`, 'gu'), `<$1${replacement}`)
      }

      return rendered
    }

    return renderSSR(...args)
  }

  return renderer as any
}

export { h, Helmet, Component, Suspense, renderSSR } from "https://deno.land/x/nano_jsx@v0.0.32/mod.ts";
