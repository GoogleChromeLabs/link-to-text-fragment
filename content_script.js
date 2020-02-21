(browser => {
  if (!('fragmentDirective' in window.location)) {
    return;
  }

  const trimAndRemoveDuplicateSpaces = text => {
    return text.trim().replace(/\s+/gm, ' ');
  };

  // Credits: https://stackoverflow.com/a/7381574/6255000
  const snapSelectionToWord = sel => {
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
    return trimAndRemoveDuplicateSpaces(sel.toString());
  };

  browser.runtime.onMessage.addListener((request, _, sendResponse) => {
    const message = request.message;
    if (message === 'get-text') {
      const selection = window.getSelection();
      const selectedText = snapSelectionToWord(selection);
      const { anchorNode, anchorOffset, focusNode, focusOffset } = selection;
      const closest = anchorNode.parentNode.closest('[id]:not([id=""])');
      sendResponse({
        selectedText,
        pageText: trimAndRemoveDuplicateSpaces(document.body.innerText),
        textBeforeSelection: anchorNode.data.substr(0, anchorOffset).trim(),
        textAfterSelection: focusNode.data.substr(focusOffset).trim(),
        textNodeBeforeSelection: anchorNode.parentNode.previousElementSibling
          ? trimAndRemoveDuplicateSpaces(
              anchorNode.parentNode.previousElementSibling.innerText
            )
          : '',
        textNodeAfterSelection: focusNode.parentNode.nextElementSibling
          ? trimAndRemoveDuplicateSpaces(
              focusNode.parentNode.nextElementSibling.innerText
            )
          : '',
        closestElementFragment: closest ? closest.id : null
      });
    } else if (message === 'success') {
      console.log(request.data);
      const style = document.createElement('style');
      document.head.append(style);
      const sheet = style.sheet;
      sheet.insertRule(`
        ::selection {
          color: #000 !important;
          background-color: #ffff00 !important;
        }`);
      setTimeout(() => style.remove(), 1000);
    } else if (message === 'failure') {
      alert(chrome.i18n.getMessage('link_failure'));
    }
  });
})(window.chrome || window.browser);
