const e = ['text'],
  t = [
    'ADDRESS',
    'ARTICLE',
    'ASIDE',
    'BLOCKQUOTE',
    'DETAILS',
    'DIALOG',
    'DD',
    'DIV',
    'DL',
    'DT',
    'FIELDSET',
    'FIGCAPTION',
    'FIGURE',
    'FOOTER',
    'FORM',
    'H1',
    'H2',
    'H3',
    'H4',
    'H5',
    'H6',
    'HEADER',
    'HGROUP',
    'HR',
    'LI',
    'MAIN',
    'NAV',
    'OL',
    'P',
    'PRE',
    'SECTION',
    'TABLE',
    'UL',
  ],
  n = (e) => {
    const t = /^(?:(.+?)-,)?(?:(.+?))(?:,(.+?))?(?:,-(.+?))?$/;
    return {
      prefix: decodeURIComponent(e.replace(t, '$1')),
      textStart: decodeURIComponent(e.replace(t, '$2')),
      textEnd: decodeURIComponent(e.replace(t, '$3')),
      suffix: decodeURIComponent(e.replace(t, '$4')),
    };
  },
  o = (e) => {
    const t = c(e.prefix),
      n = c(e.textStart),
      o = c(e.textEnd),
      d = c(e.suffix),
      a = document.createElement('mark');
    if (!t.length && !d.length && 1 === n.length) {
      let t, c, d, s;
      o.length
        ? 1 === o.length &&
          (([t, c] = r(n[0], e.textStart, !0)),
          ([d, s] = r(o[0], e.textEnd, !1)))
        : (([t, c] = r(n[0], e.textStart, !0)),
          ([d, s] = r(n[0], e.textStart, !1)));
      const l = document.createRange();
      l.setStart(t, c), l.setEnd(d, s);
      try {
        l.surroundContents(a);
      } catch {
        const e = l.commonAncestorContainer;
        for (; t.parentNode !== e; ) (t = t.parentNode), l.setStartBefore(t);
        for (; d.parentNode !== e; ) (d = d.parentNode), l.setEndAfter(d);
        try {
          l.surroundContents(a);
        } catch {
          return;
        }
      }
    }
    return t.length, a.parentElement ? a : void 0;
  },
  r = (e, t, n) => {
    let o = e.textContent.indexOf(t) + (n ? 0 : t.length);
    const r = [],
      c = document.createTreeWalker(e, NodeFilter.SHOW_TEXT);
    let d,
      a = c.nextNode();
    for (
      a && r.push({ node: a, start: 0, end: a.textContent.length });
      (a = c.nextNode());

    )
      r.push({
        node: a,
        start: r[r.length - 1].end,
        end: r[r.length - 1].end + a.textContent.length,
      });
    for (const { node: e, start: t, end: n } of r)
      if (o >= t && o < n) {
        (d = e), (o -= t);
        break;
      }
    return [d, o];
  },
  c = (e) => {
    if (!e) return [];
    const n = document.body,
      o = document.createTreeWalker(n, NodeFilter.SHOW_ELEMENT, {
        acceptNode: (n) =>
          t.includes(n.tagName)
            ? [...n.childNodes].some((e) => t.includes(e.tagName))
              ? NodeFilter.FILTER_SKIP
              : n.textContent.includes(e)
              ? NodeFilter.FILTER_ACCEPT
              : void 0
            : NodeFilter.FILTER_REJECT,
      }),
      r = [];
    let c;
    for (; (c = o.nextNode()); ) r.push(c);
    return r;
  };
(async () => {
  const t = document.location.hash;
  if ('fragmentDirective' in Location.prototype || !t) return;
  Location.prototype.fragmentDirective = {};
  const r = () => {
    const r = ((t) => {
      const n = {};
      for (const [r, c] of Object.entries(t))
        e.includes(r) && (n[r] = c.map((e) => o(e)));
      return n;
    })(
      ((t) => {
        const o = {};
        for (const [r, c] of Object.entries(t))
          e.includes(r) && (o[r] = c.map((e) => n(e)));
        return o;
      })(
        ((e) => {
          const t = e
            .replace(/#.*?:~:(.*?)/, '$1')
            .split(/&?text=/)
            .filter(Boolean);
          return t.length ? { text: t } : {};
        })(t)
      )
    ).text.filter(Boolean)[0];
    r &&
      window.setTimeout(() => {
        r.scrollIntoView({
          behavior: 'auto',
          block: 'center',
          inline: 'nearest',
        });
      });
  };
  'complete' !== document.readyState
    ? window.addEventListener('DOMContentLoaded', r)
    : r();
})();
