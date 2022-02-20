import { match as matchUri } from "path-to-regexp"
import { proxy, subscribe } from 'valtio/vanilla'

type Match = {path: string, params: Partial<Record<string, string | number>>, index: number}

type Handler = (match: Match) => void
type Route = [string, Handler]
type Params = Partial<Record<string, string | number>>

type RouterState = {
  current: Match
  routes: Route[],
  route: (path: string) => void
  listen: () => () => void
  match: (path: string) => Match | false
}

export function Router(base = "", on404?: (uri: string) => void) {
  base = '/' + base.replace(/^\/|\/$/g, '');
	const rgx = base == '/' ? /^\/+/ : new RegExp('^\\' + base + '(?=\\/|$)\\/?', 'i');

  const router = proxy<RouterState>({current: {path: window.location.pathname, params: {} as Params, index: -1}, routes: [], route, match: matchUri, listen})

  function route(uri: string, replace?: boolean) {
    if (uri[0] == '/' && !rgx.test(uri)) uri = uri;
    history[(uri === router.current.path || replace ? 'replace' : 'push') + 'State'](uri, null, uri);
  }

  function match (uri = window.location.pathname) {
    for (let i = 0; i < router.routes.length; i++) {
      const [path, handler] = router.routes[i]
      const match = matchUri(path, {decode: decodeURIComponent})(uri);
      if (match) {
        router.current = match;
        handler(match)
        return match
      }
    }
    if (on404) on404(uri)
    return false
  }

  function click(e: MouseEvent) {
    const el = (e.target as HTMLElement).closest('a')
    const href = el && el.getAttribute('href');
    if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey || e.button || e.defaultPrevented) return;
    if (!href || el.target || el.host !== location.host || href[0] == '#') return;
    if (href[0] != '/' || rgx.test(href)) {
      e.preventDefault();
      router.route(href);
    }
  }


  function listen() {
    ;['push', 'replace'].forEach(method => {
      window.history[method + 'State'] = new Proxy(window.history[method + 'State'], {
        apply: (target, thisArg, argArray) => {
          match(argArray[0])
          return target.apply(thisArg, argArray);
        },
      });
    })
    addEventListener('click', click);
    // if routes change, after listening, match will be called
    const unsubscribe = subscribe(router.routes, () => {
      match()
    })
   
    return () => {
      unsubscribe()
      document.removeEventListener('click', click);
      ;['push', 'replace'].forEach(method => {
        window.history[method + 'State'] = window.history[method + 'State']
      })
    }
  }
 
  return router
}


