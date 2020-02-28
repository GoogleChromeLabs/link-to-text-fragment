((browser) => {
  if (!('fragmentDirective' in window.location)) {
    return;
  }

  let DEBUG = false;

  const log = (...args) => {
    if (DEBUG) {
      console.log.apply(this, args);
    }
  };

  const trimAndRemoveDuplicateSpaces = (text) => {
    return text.trim().replace(/\s+/gm, ' ');
  };

  // Credits: https://stackoverflow.com/a/7381574/6255000
  const snapSelectionToWord = (sel) => {
    if (!sel.isCollapsed) {
      // Detect if selection is backwards
      const range = document.createRange();
      range.setStart(sel.anchorNode, sel.anchorOffset);
      range.setEnd(sel.focusNode, sel.focusOffset);
      const direction = range.collapsed
        ? ['backward', 'forward']
        : ['forward', 'backward'];
      range.detach();

      // modify() works on the focus of the selection
      const endNode = sel.focusNode;
      const endOffset = sel.focusOffset;
      sel.collapse(sel.anchorNode, sel.anchorOffset);
      sel.modify('move', direction[0], 'character');
      sel.modify('move', direction[1], 'word');
      sel.extend(endNode, endOffset);
      sel.modify('extend', direction[1], 'character');
      sel.modify('extend', direction[0], 'word');
    }
    const selection = sel.toString();
    return {
      raw: selection.trim(),
      processed: trimAndRemoveDuplicateSpaces(selection),
    };
  };

  const getText = (sendResponse) => {
    const selection = window.getSelection();
    const selectedText = snapSelectionToWord(selection);
    const { anchorNode, anchorOffset, focusNode, focusOffset } = selection;

    const pageText = trimAndRemoveDuplicateSpaces(document.body.innerText);
    const textBeforeSelection = anchorNode.data.substr(0, anchorOffset).trim();
    const textAfterSelection = focusNode.data.substr(focusOffset).trim();
    const closestElementFragment = anchorNode.parentNode.closest(
      '[id]:not([id=""])',
    )
      ? anchorNode.parentNode.closest('[id]:not([id=""])').id
      : null;
    const textNodeBeforeSelection = anchorNode.parentNode.previousElementSibling
      ? trimAndRemoveDuplicateSpaces(
          anchorNode.parentNode.previousElementSibling.innerText,
        )
      : '';
    const textNodeAfterSelection = focusNode.parentNode.nextElementSibling
      ? trimAndRemoveDuplicateSpaces(
          focusNode.parentNode.nextElementSibling.innerText,
        )
      : '';

    const data = {
      selectedText,
      pageText,
      textBeforeSelection,
      textAfterSelection,
      textNodeBeforeSelection,
      textNodeAfterSelection,
      closestElementFragment,
    };
    log(data);
    sendResponse(data);
  };

  const reportSuccess = (url) => {
    log(url);
    const style = document.createElement('style');
    document.head.append(style);
    const sheet = style.sheet;
    sheet.insertRule(`
      ::selection {
        color: #000 !important;
        background-color: #ffff00 !important;
      }`);
    setTimeout(() => style.remove(), 1000);
  };

  const reportFailure = () => {
    alert(chrome.i18n.getMessage('link_failure'));
  };

  browser.runtime.onMessage.addListener((request, _, sendResponse) => {
    const message = request.message;
    if (message === 'get-text') {
      return getText(sendResponse);
    } else if (message === 'success') {
      return reportSuccess(request.data);
    } else if (message === 'failure') {
      return reportFailure();
    } else if (message === 'debug') {
      return (DEBUG = request.data);
    }
  });
})(window.chrome || window.browser);
