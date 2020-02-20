(browser => {
  if (!('fragmentDirective' in window.location)) {
    return;
  }

  browser.contextMenus.create({
    title: chrome.i18n.getMessage('copy_link'),
    id: 'copy-link',
    contexts: ['all']
  });

  browser.contextMenus.onClicked.addListener(async (info, tab) => {
    const selectedText = info.selectionText;
    if (!selectedText) {
      return;
    }
    const textFragmentURL = await createURL(tab.url, selectedText);
    await copyToClipboard(textFragmentURL);
  });

  const escapeRegExp = (s) => {
    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  };

  const isUniqueMatch = (hayStack, textStart, textEnd = '') => {
    const needle = new RegExp(`${textStart}${textEnd}`, 'gimus');
    console.log('————————————————');
    console.log('RegExp:', needle.source);
    console.log('Matches:', [...hayStack.matchAll(needle)]);
    console.log('————————————————');
    return (matches = [...hayStack.matchAll(needle)]);
  };

  const findUniqueMatch = (
    pageText,
    textStart,
    textEnd,
    matches,
    wordsBefore,
    wordsAfter,
    before = '',
    after = '',
    coin = true,
  ) => {
    console.log('before "' + before + '"');
    console.log('textStart "' + textStart + '"');
    console.log('textEnd "' + textEnd + '"');
    console.log('after "' + after + '"');
    // We need to add context before or after the needle.
    // Throw a coin to decide each time whether before or after.
    if (wordsBefore.length > 0 && coin) {
      const newBefore = escapeRegExp(wordsBefore.pop());
      before = `${newBefore}${before ? ` ${before}` : ''}`;
      console.log('new before "' + before + '"');
    } else if (wordsAfter.length > 0) {
      const newAfter = escapeRegExp(wordsAfter.shift());
      after = `${after ? `${after} ` : ''}${newAfter}`;
      console.log('new after "' + after + '"');
    }
    matches = isUniqueMatch(
      pageText,
      `${before ? `${before}.?` : ''}${textStart}`,
      `${textEnd ? `.*?${textEnd}` : ''}${after ? `.?${after}` : ''}`
    );
    if (matches.length === 1) {
      return {
        before,
        after
      };
    } else if (matches.length === 0) {
      // This should never happen, but, hey… ¯\_(ツ)_/¯
      return {
        before: false,
        after: false
      };
    }
    return findUniqueMatch(
      pageText,
      textStart,
      textEnd,
      matches,
      wordsBefore,
      wordsAfter,
      before,
      after,
      Math.random() > 0.5
    );
  };

  const encodeURIComponentAndMinus = text => {
    return encodeURIComponent(text).replace(/-/g, '%2D');
  };

  const createURL = async (tabURL, selectedText) => {
    const {
      pageText,
      textBeforeSelection,
      textAfterSelection,
      textNodeBeforeSelection,
      textNodeAfterSelection,
      closestElementFragment,
    } = await getPageTextContent();
    tabURL = new URL(tabURL);
    let textFragmentURL = `${tabURL.origin}${tabURL.pathname}${
        closestElementFragment ? `#${closestElementFragment}` : '#'}`;
    const selectedWords = selectedText.split(/\s+/gmu);
    let textStart = selectedText;
    let textEnd = '';
    if (selectedWords.length > 1) {
      textStart = selectedWords[0];
      textEnd = selectedWords.pop();
    }
    let matches = isUniqueMatch(pageText, textStart, `${textEnd ? `.*?${textEnd}` : ''}`);
    // We have a unique match, return it.
    if (matches.length === 1) {
      textStart = encodeURIComponentAndMinus(textStart);
      textEnd = textEnd ? `,${encodeURIComponentAndMinus(textEnd)}` : '';
      return (textFragmentURL += `:~:text=${textStart}${textEnd}`);
    } else {
      let wordsBefore = (textNodeBeforeSelection
        ? textNodeBeforeSelection.split(/\s+/gmu)
        : []
      ).concat(textBeforeSelection ? textBeforeSelection.split(/\s+/gmu) : []);
      let wordsAfter = (textAfterSelection
        ? textAfterSelection.split(/\s+/gmu)
        : []
      ).concat(
        textNodeAfterSelection ? textNodeAfterSelection.split(/\s+/gmu) : []
      );
      let { before, after } = findUniqueMatch(
        pageText,
        textStart,
        textEnd,
        matches,
        wordsBefore,
        wordsAfter
      );
      if (!before && !after) {
        return await sendMessageToPage('failure');
      }
      before = before ? `${encodeURIComponentAndMinus(before)}-,` : '';
      after = after ? `,-${encodeURIComponentAndMinus(after)}` : '';
      textStart = encodeURIComponentAndMinus(textStart);
      textEnd = textEnd ? `,${encodeURIComponentAndMinus(textEnd)}` : '';
      return (textFragmentURL += `:~:text=${before}${textStart}${textEnd}${after}`);
    }
  };

  const getPageTextContent = async () => {
    return new Promise(resolve => {
      browser.tabs.query(
        {
          active: true,
          currentWindow: true
        },
        tabs => {
          browser.tabs.sendMessage(
            tabs[0].id,
            {
              message: 'get-text'
            },
            response => {
              return resolve(response);
            }
          );
        }
      );
    });
  };

  const sendMessageToPage = async (message, data = null) => {
    browser.tabs.query(
      {
        active: true,
        currentWindow: true
      },
      tabs => {
        browser.tabs.sendMessage(tabs[0].id, {
          message,
          data
        });
      }
    );
  };

  const copyToClipboard = async url => {
    try {
      const { state } = await navigator.permissions.query({
        name: 'clipboard-write'
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
    await sendMessageToPage('success', url);
  };
})(window.chrome || window.browser);
