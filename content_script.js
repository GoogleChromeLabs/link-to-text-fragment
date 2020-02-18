((browser) => {
  if (!('fragmentDirective' in window.location)) {
    return;
  }

  browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.message === 'get-text') {
      const {
        anchorNode,
        anchorOffset,
        focusNode,
        focusOffset,
      } = window.getSelection();
      sendResponse({
        pageText: document.body.textContent.trim().replace(/\s+/g, ' '),
        textBeforeSelection: anchorNode.data.substr(0, anchorOffset).trim(),
        textAfterSelection: focusNode.data.substr(focusOffset).trim(),
      });
    }
  });

})(window.chrome || window.browser);
