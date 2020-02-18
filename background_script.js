((browser) => {
  if (!('fragmentDirective' in window.location)) {
    return;
  }

  browser.contextMenus.create({
    title: chrome.i18n.getMessage('copy_link'),
    id: 'copy-link',
    contexts: ['all'],
  });

  browser.contextMenus.onClicked.addListener(async (info, tab) => {
    const selectedText = info.selectionText;
    if (!selectedText) {
      return;
    }
    const textFragmentURL = await createURL(tab.url, selectedText);
    await copyToClipboard(textFragmentURL);
  });

  const isUniqueMatch = (hayStack, textStart, textEnd = '') => {
    const needle = textEnd ?
        new RegExp(`\\b${textStart}\\b.*?\\b${textEnd}\\b`, 'gimus') :
        new RegExp(`\\b${textStart}\\b`, 'giu');
    return matches = [...hayStack.matchAll(needle)];
  };

  const findUniqueMatch = (pageText, textStart, textEnd, matches, wordsBefore,
        wordsAfter, before = '', after = '') => {
    // We need to add context before or after the needle.
    if (wordsBefore.length > 0) {
      const newBefore = wordsBefore.pop();
      before = `${newBefore}${before ? ` ${before}` : ''}`;
      matches = isUniqueMatch(pageText, `${before} ${textStart}`, textEnd);
    } else if (wordsAfter.length > 0) {
      const newAfter = wordsAfter.shift();
      after = `${after ? `${after} ` : ''}${newAfter}`;
      matches = isUniqueMatch(pageText, textStart, `${textEnd} ${after}`);
    }
    if (matches.length === 1) {
      return {
        before,
        after,
      }
    }
    return findUniqueMatch(pageText, textStart, textEnd, matches, wordsBefore,
        wordsAfter, before, after);
  };

  const encodeURIComponentAndMinus = (text) => {
    return encodeURIComponent(text).replace(/-/g, '%2D');
  };

  const createURL = async (tabURL, selectedText) => {
    tabURL = new URL(tabURL);
    let textFragmentURL = `${tabURL.origin}${tabURL.pathname}`;
    const {
      pageText,
      textBeforeSelection,
      textAfterSelection,
    } = await getPageTextContent();
    const selectedWords = selectedText.split(/\s/gmu);
    let textStart = selectedText;
    let textEnd = '';
    if (selectedWords.length > 1) {
      textStart = selectedWords[0];
      textEnd = selectedWords.pop();
    }
    let matches = isUniqueMatch(pageText, textStart, textEnd);
    // We have a unique match, return it.
    if (matches.length === 1) {
      textStart = encodeURIComponentAndMinus(textStart);
      textEnd = textEnd ? `,${encodeURIComponentAndMinus(textEnd)}` : '';
      return textFragmentURL += `#:~:text=${textStart}${textEnd}`;
    } else {
      const wordsBefore = textBeforeSelection.split(/\s+/gm);
      const wordsAfter = textAfterSelection.split(/\s+/gm);
      let {before, after} = findUniqueMatch(pageText, textStart, textEnd,
          matches, wordsBefore, wordsAfter);
      before = before ? `${encodeURIComponentAndMinus(before)}-,` : '';
      after = after ? `,-${encodeURIComponentAndMinus(after)}` : '';
      textStart = encodeURIComponentAndMinus(textStart);
      textEnd = textEnd ? `,${encodeURIComponentAndMinus(textEnd)}` : '';
      return textFragmentURL +=
          `#:~:text=${before}${textStart}${textEnd}${after}`;
    }
  };

  const getPageTextContent = async () => {
    return new Promise((resolve) => {
      browser.tabs.query({
        active: true,
        currentWindow: true
      }, (tabs) => {
        browser.tabs.sendMessage(tabs[0].id, {
          message: 'get-text',
        }, (response) => {
          return resolve(response);
        });
      });
    });
  };

  const copyToClipboard = async (url) => {
    try {
      const {state} = await navigator.permissions.query({
        name: 'clipboard-write',
      });
      if (state !== 'granted') {
        throw new Error('Clipboard permission not granted');
      }
      await navigator.clipboard.writeText(url);
    } catch (err) {
      let textArea = document.createElement('textarea');
      document.body.append(textArea);
      textArea.textContent = url;
      textArea.select();
      document.execCommand('copy');
      textArea.remove();
    }
  };
})(window.chrome || window.browser);
