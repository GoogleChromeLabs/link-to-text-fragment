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

  const isUniqueMatch = (hayStack, textStart, textEnd = '') => {
    const needle = textEnd
      ? new RegExp(`\\b${textStart}.*?${textEnd}\\b`, 'gimus')
      : new RegExp(`\\b${textStart}\\b`, 'giu');
    console.log('————————————————');
    console.log(needle.source);
    console.log([...hayStack.matchAll(needle)]);
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
    after = ''
  ) => {
    console.log('start "' + textStart + '"');
    console.log('end "' + textEnd + '"');
    console.log('wordsbefore "' + wordsBefore.join(',') + '"');
    console.log('wordsafter "' + wordsAfter.join(',') + '"');
    console.log('before "' + before + '"');
    console.log('after "' + after + '"');
    // We need to add context before or after the needle.
    if (wordsBefore.length > 0) {
      console.log('before pop');
      console.log(wordsBefore);
      const newBefore = wordsBefore.pop();
      console.log('after pop');
      console.log(wordsBefore);
      console.log('new before "' + newBefore + '"');
      before = `${newBefore}${before ? ` ${before}` : ''}`;
    } else if (wordsAfter.length > 0) {
      console.log('before shift');
      console.log(wordsAfter);
      const newAfter = wordsAfter.shift();
      console.log('after shift');
      console.log(wordsAfter);
      console.log('new after "' + newAfter + '"');
      after = `${after ? `${after}.?` : ''}${newAfter}`;
    }
    matches = isUniqueMatch(
      pageText,
      `${before}.?${textStart}`,
      `${textEnd}.?${after}`
    );
    if (matches.length === 1) {
      return {
        before,
        after
      };
    } else if (matches.length === 0) {
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
      after
    );
  };

  const encodeURIComponentAndMinus = text => {
    return encodeURIComponent(text).replace(/-/g, '%2D');
  };

  const createURL = async (tabURL, selectedText) => {
    tabURL = new URL(tabURL);
    let textFragmentURL = `${tabURL.origin}${tabURL.pathname}`;
    const {
      pageText,
      textBeforeSelection,
      textAfterSelection,
      textNodeBeforeSelection,
      textNodeAfterSelection
    } = await getPageTextContent();
    console.log(textNodeBeforeSelection);
    console.log(textBeforeSelection);
    console.log(textAfterSelection);
    console.log(textNodeAfterSelection);
    const selectedWords = selectedText.split(/\s+/gmu);
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
      return (textFragmentURL += `#:~:text=${textStart}${textEnd}`);
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
      return (textFragmentURL += `#:~:text=${before}${textStart}${textEnd}${after}`);
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
