(() => {
  const nbsp = '\u00a0';
  function protect(text) {
    let result = text
      // Scores, battle formats and number/unit pairs stay together.
      .replace(/\b(\d+) +(vs\.?) +(\d+)\b/gi, `$1${nbsp}$2${nbsp}$3`)
      .replace(/\b(USD|AED|EUR|GBP) +(\d[\d,.]*(?: +\d{3})*(?:\/\w+)?)/g, match => match.replace(/ +/g, nbsp))
      .replace(/[$€£] +\d[\d,.]*(?: +\d{3})*/g, match => match.replace(/ +/g, nbsp))
      .replace(/\b(\d+(?:[–-]\d+)?\+?) +(?=[A-Za-zА-Яа-яЁё])/g, `$1${nbsp}`)
      .replace(/\b(Top|Hall|day|Phase|Round|Stage|Crews?|categor(?:y|ies)) +(?=\d)/gi, `$1${nbsp}`)
      .replace(/\bTop-(?=\d)/gi, 'Top\u2011');
    const shortWords = /(^|[\s(«“])((?:a|an|the|and|or|of|to|in|on|at|by|for|as|per|via|with|from|в|во|на|с|со|к|ко|у|о|об|от|до|из|за|по|не|и|а|но|&)) +(?=\S)/gi;
    // Repeat to handle adjacent function words, e.g. "to the final".
    let previous;
    do {
      previous = result;
      result = result.replace(shortWords, `$1$2${nbsp}`);
    } while (previous !== result);
    return result;
  }
  function apply(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (!node.parentElement.closest('script,style,pre,code,textarea,[data-typography-ignore]')) nodes.push(node);
    }
    nodes.forEach(node => { node.nodeValue = protect(node.nodeValue); });
  }
  globalThis.DOBTypography = {protect, apply};
  if (typeof document !== 'undefined') apply(document.body);
})();
