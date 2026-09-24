// Tiny dependency-free HTML parser. Keeps source offsets so the original
// markup of any element (outer or inner) can be sliced out verbatim.
const VOID = new Set(['area','base','br','col','embed','hr','img','input','link','meta','source','track','wbr']);
const RAW = new Set(['script','style','textarea']);

export function parse(src) {
  const root = { tag: '#root', attrs: {}, children: [], start: 0, openEnd: 0, closeStart: src.length, end: src.length, parent: null };
  const stack = [root];
  const re = /<!--[\s\S]*?-->|<!DOCTYPE[^>]*>|<\/([a-zA-Z0-9-]+)\s*>|<([a-zA-Z0-9-]+)((?:\s+[^\s=>/]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?)*)\s*(\/?)>/gi;
  let m, last = 0;
  const top = () => stack[stack.length - 1];
  const addText = (a, b) => { if (b > a) top().children.push({ tag: '#text', start: a, end: b, text: src.slice(a, b), parent: top() }); };
  while ((m = re.exec(src))) {
    addText(last, m.index);
    last = re.lastIndex;
    if (m[1]) {
      const name = m[1].toLowerCase();
      for (let i = stack.length - 1; i > 0; i--) {
        if (stack[i].tag === name) {
          while (stack.length > i + 1) { const n = stack.pop(); n.closeStart = n.end = m.index; }
          const n = stack.pop(); n.closeStart = m.index; n.end = re.lastIndex; break;
        }
      }
    } else if (m[2]) {
      const name = m[2].toLowerCase();
      const node = { tag: name, attrs: parseAttrs(m[3] || ''), children: [], start: m.index, openEnd: re.lastIndex, parent: top() };
      top().children.push(node);
      if (VOID.has(name) || m[4]) { node.closeStart = node.end = re.lastIndex; continue; }
      if (RAW.has(name)) {
        const close = src.toLowerCase().indexOf('</' + name, re.lastIndex);
        node.closeStart = close; node.end = src.indexOf('>', close) + 1;
        node.children.push({ tag: '#text', start: re.lastIndex, end: close, text: src.slice(re.lastIndex, close), parent: node });
        re.lastIndex = last = node.end; continue;
      }
      stack.push(node);
    }
  }
  addText(last, src.length);
  root.src = src;
  const setSrc = n => { n.src = src; (n.children || []).forEach(setSrc); };
  setSrc(root);
  return root;
}

function parseAttrs(s) {
  const out = {}; const re = /([^\s=>/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g; let m;
  while ((m = re.exec(s))) out[m[1].toLowerCase()] = m[2] ?? m[3] ?? m[4] ?? '';
  return out;
}

export const classes = n => (n.attrs?.class || '').split(/\s+/).filter(Boolean);
export const hasClass = (n, c) => classes(n).includes(c);

// selector: "tag", ".class", "tag.class", "tag.a.b"
function matcher(sel) {
  const [tag, ...cls] = sel.split('.');
  return n => n.tag && n.tag[0] !== '#' && (!tag || n.tag === tag) && cls.every(c => hasClass(n, c));
}
export function all(node, sel) {
  const f = typeof sel === 'function' ? sel : matcher(sel); const out = [];
  (function walk(n) { for (const c of n.children || []) { if (f(c)) out.push(c); walk(c); } })(node);
  return out;
}
export const one = (node, sel) => all(node, sel)[0];
export const kids = (node, sel) => (node.children || []).filter(typeof sel === 'function' ? sel : matcher(sel));
export const inner = n => (n ? n.src.slice(n.openEnd, n.closeStart).trim() : '');
export const outer = n => (n ? n.src.slice(n.start, n.end) : '');

const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', rarr: '→', larr: '←', middot: '·', mdash: '—', ndash: '–', copy: '©', eacute: 'é', rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”', hellip: '…', times: '×' };
export const decode = s => s.replace(/&(#x?[0-9a-f]+|\w+);/gi, (m, e) => e[0] === '#' ? String.fromCodePoint(e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : +e.slice(1)) : (ENT[e] ?? m));
export const text = n => (n ? decode(inner(n).replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim() : '');
export const bgUrl = n => { const m = (n?.attrs?.style || '').match(/url\(['"]?([^'")]+)['"]?\)/); return m ? m[1] : ''; };
