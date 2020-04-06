((browser) => {
  let DEBUG = false;

  const log = (...args) => {
    if (DEBUG) {
      console.log(...args);
    }
  };

  // Credits: https://stackoverflow.com/a/7381574/6255000
  const snapSelectionToWord = (sel) => {
    if (!sel.isCollapsed) {
      // Detect if selection is backwards
      const range = document.createRange();
      range.setStart(sel.anchorNode, sel.anchorOffset);
      range.setEnd(sel.focusNode, sel.focusOffset);
      const direction = range.collapsed ?
        ['backward', 'forward'] :
        ['forward', 'backward'];
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
    return sel.toString().trim();
  };

  const getPreviousNode = (anchorNode) => {
    let seenAnchorNode = false;
    const treeWalker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: (node) => {
            if (node.isSameNode(anchorNode)) {
              seenAnchorNode = true;
              return NodeFilter.FILTER_SKIP;
            }
            if (seenAnchorNode) {
              return NodeFilter.FILTER_SKIP;
            }
            return node.parentNode.offsetParent &&
            node.nodeValue.replace(/\s/g, '') ?
            NodeFilter.FILTER_ACCEPT :
            NodeFilter.FILTER_SKIP;
          },
        },
    );
    let previousNode = null;
    let currentNode = null;
    while ((currentNode = treeWalker.nextNode())) {
      previousNode = currentNode;
    }
    return previousNode;
  };

  const getNextNode = (focusNode) => {
    let seenFocusNode = false;
    const treeWalker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: (node) => {
            if (node.isSameNode(focusNode)) {
              seenFocusNode = true;
              return NodeFilter.FILTER_SKIP;
            }
            if (!seenFocusNode) {
              return NodeFilter.FILTER_SKIP;
            }
            return node.parentNode.offsetParent &&
            node.nodeValue.replace(/\s/g, '') ?
            NodeFilter.FILTER_ACCEPT :
            NodeFilter.FILTER_SKIP;
          },
        },
    );
    return treeWalker.nextNode();
  };

  const getClosestID = (root) => {
    if (root.id) {
      return root.id;
    }
    let seenRoot = false;
    const treeWalker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_ELEMENT,
        {
          acceptNode: (node) => {
            if (node.isSameNode(root)) {
              seenRoot = true;
            }
            return node.offsetParent && node.hasAttribute('id') && !seenRoot ?
            NodeFilter.FILTER_ACCEPT :
            NodeFilter.FILTER_SKIP;
          },
        },
    );
    let nodeWithID = null;
    let currentNode = null;
    while ((currentNode = treeWalker.nextNode())) {
      nodeWithID = currentNode;
    }
    return nodeWithID ? nodeWithID.id : null;
  };

  const getText = (sendResponse) => {
    const selection = window.getSelection();
    const selectedText = snapSelectionToWord(selection);
    const {anchorNode, anchorOffset, focusNode, focusOffset} = selection;

    const pageText = document.body.innerText.trim();
    const textBeforeSelection = anchorNode.data.substr(0, anchorOffset).trim();
    const textAfterSelection = focusNode.data.substr(focusOffset).trim();
    const closestElementFragment = getClosestID(anchorNode.parentNode);
    const previousNode = getPreviousNode(anchorNode);
    const nextNode = getNextNode(focusNode);
    const textNodeBeforeSelection = previousNode ?
      previousNode.nodeType === 3 ?
        previousNode.nodeValue :
        previousNode.innerText :
      '';
    const textNodeAfterSelection = nextNode ?
      nextNode.nodeType === 3 ?
        nextNode.nodeValue :
        nextNode.innerText :
      '';
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
    return data;
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
    window.setTimeout(() => style.remove(), 2000);
    return true;
  };

  const reportFailure = () => {
    window.queueMicrotask(() => {
      alert(browser.i18n.getMessage('link_failure'));
    });
    return true;
  };

  browser.runtime.onMessage.addListener((request, _, sendResponse) => {
    const message = request.message;
    if (message === 'get-text') {
      return sendResponse(getText());
    } else if (message === 'success') {
      return sendResponse(reportSuccess(request.data));
    } else if (message === 'failure') {
      return sendResponse(reportFailure());
    } else if (message === 'debug') {
      return sendResponse((DEBUG = request.data) || true);
    }
  });
})(window.chrome || window.browser);
