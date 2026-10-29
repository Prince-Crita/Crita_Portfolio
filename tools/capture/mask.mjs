// Display-only masking. Runs inside the page: rewrites visible text so real
// third-party names, phone numbers and emails never reach a screenshot.
// Nothing is sent to the application; the data itself is untouched.

/**
 * Installed with page.evaluate(installMask, { sub, exact, regex, hide }).
 *  sub   — substring replacements, applied in ONE pass (longest key first),
 *          so a replacement is never re-replaced.
 *  exact — whole-text-node replacements (for initials like "AO").
 *  regex — [[pattern, flags, replacement]] applied after `sub`.
 *  hide  — CSS selectors to hide (transient UI such as connection badges).
 */
export function installMask({ sub = {}, exact = {}, regex = [], hide = [] }) {
  const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const keys = Object.keys(sub).sort((a, b) => b.length - a.length);
  const subRe = keys.length ? new RegExp(keys.map(escape).join('|'), 'g') : null;
  const regexes = regex.map(([p, f, r]) => [new RegExp(p, f), r]);

  const rewrite = (text) => {
    if (!text) return text;
    const trimmed = text.trim();
    if (trimmed && Object.prototype.hasOwnProperty.call(exact, trimmed)) {
      return text.replace(trimmed, exact[trimmed]);
    }
    let out = subRe ? text.replace(subRe, (m) => sub[m]) : text;
    for (const [re, r] of regexes) out = out.replace(re, r);
    return out;
  };

  const maskNode = (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const next = rewrite(node.nodeValue);
      if (next !== node.nodeValue) node.nodeValue = next;
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    if (node.matches?.('input, textarea')) {
      if (node.value) {
        const next = rewrite(node.value);
        if (next !== node.value) node.value = next;
      }
      const ph = node.getAttribute('placeholder');
      if (ph) node.setAttribute('placeholder', rewrite(ph));
    }
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    let n = walker.nextNode();
    while (n) {
      if (n.nodeType === Node.TEXT_NODE) {
        const next = rewrite(n.nodeValue);
        if (next !== n.nodeValue) n.nodeValue = next;
      } else if (n.matches('input, textarea')) {
        if (n.value) n.value = rewrite(n.value);
        const ph = n.getAttribute('placeholder');
        if (ph) n.setAttribute('placeholder', rewrite(ph));
      }
      n = walker.nextNode();
    }
  };

  if (hide.length) {
    const style = document.createElement('style');
    style.textContent = `${hide.join(',')}{display:none!important}`;
    document.head.appendChild(style);
  }

  maskNode(document.body);
  if (window.__critaMask) window.__critaMask.disconnect();
  const observer = new MutationObserver((records) => {
    for (const r of records) {
      if (r.type === 'characterData') maskNode(r.target);
      else r.addedNodes.forEach(maskNode);
    }
  });
  observer.observe(document.body, { subtree: true, childList: true, characterData: true });
  window.__critaMask = observer;
}

/** Hides elements whose own text matches, walking up `levels` parents. */
export function hideByText({ texts, levels = 1 }) {
  const all = document.querySelectorAll('body *');
  for (const el of all) {
    if (el.children.length) continue;
    if (!texts.includes(el.textContent.trim())) continue;
    let target = el;
    for (let i = 0; i < levels && target.parentElement; i++) target = target.parentElement;
    target.style.setProperty('display', 'none', 'important');
  }
}
