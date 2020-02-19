(browser => {
  if (!('fragmentDirective' in window.location)) {
    return;
  }

  const trimRemoveDuplicateSpaces = text => {
    return text.trim().replace(/\s+/gm, ' ');
  };

  browser.runtime.onMessage.addListener((request, _, sendResponse) => {
    const message = request.message;
    if (message === 'get-text') {
      const {
        anchorNode,
        anchorOffset,
        focusNode,
        focusOffset
      } = window.getSelection();
      sendResponse({
        pageText: trimRemoveDuplicateSpaces(document.body.textContent),
        textBeforeSelection: anchorNode.data.substr(0, anchorOffset).trim(),
        textAfterSelection: focusNode.data.substr(focusOffset).trim(),
        textNodeBeforeSelection: focusNode.parentNode.previousElementSibling
          ? trimRemoveDuplicateSpaces(
              focusNode.parentNode.previousElementSibling.textContent
            )
          : '',
        textNodeAfterSelection: anchorNode.parentNode.nextElementSibling
          ? trimRemoveDuplicateSpaces(
              anchorNode.parentNode.nextElementSibling.textContent
            )
          : ''
      });
    } else if (message === 'success') {
      console.log(request.data);
    } else if (message === 'failure') {
      alert(chrome.i18n.getMessage('link_failure'));
    }
  });
})(window.chrome || window.browser);
