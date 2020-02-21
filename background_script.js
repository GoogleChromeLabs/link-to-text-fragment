(browser => {
  // https://wicg.github.io/ScrollToTextFragment/#:~:text=It%20is%20recommended%20that%20text%20snippets%20shorter%20than%20300%20characters%20always%20be%20encoded%20using%20an%20exact%20match.
  // Experimenting with 100 instead.
  EXACT_MATCH_MAX_LENGTH = 100;
  INNER_CONTEXT_MAX_LENGTH = 2;
  DEBUG = true;

  const log = (...args) => {
    if (DEBUG) {
      console.log.apply(this, args);
    }
  };

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
    const textFragmentURL = await createURL(tab.url);
    await copyToClipboard(textFragmentURL);
  });

  const escapeRegExp = s => {
    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  };

  const unescapeRegExp = s => {
    return s.replace(/\\([-\/\\^$*+?.()|[\]{}])/g, '$1');
  };

  const isUniqueMatch = (hayStack, textStart, textEnd = '') => {
    try {
      const needle = new RegExp(`${textStart}${textEnd}`, 'gims');
      const matches = [...hayStack.matchAll(needle)];
      log('———\n', 'RegEx:', needle.source, '\n', 'Matches:', matches, '\n———');
      return matches;
    } catch (err) {
      console.error(err.name, err.message);
      return [];
    }
  };

  const findUniqueMatch = (
    pageText,
    textStart,
    textEnd,
    matches,
    wordsBefore,
    wordsAfter,
    growContextBefore,
    before = '',
    after = ''
  ) => {
    log(
      ' before: "' + before + '"\n',
      'textStart: "' + textStart + '"\n',
      'textEnd: "' + textEnd + '"\n',
      'after: "' + after + '"\n',
      'growContextBefore: ' + growContextBefore
    );
    // We need to add context before or after the needle.
    // Throw a coin to decide each time whether before or after.
    if (growContextBefore && wordsBefore.length > 0) {
      const newBefore = escapeRegExp(wordsBefore.pop());
      before = `${newBefore}${before ? ` ${before}` : ''}`;
      log('new before "' + before + '"');
    } else if (wordsAfter.length > 0) {
      const newAfter = escapeRegExp(wordsAfter.shift());
      after = `${after ? `${after} ` : ''}${newAfter}`;
      log('new after "' + after + '"');
    }
    matches = isUniqueMatch(
      pageText,
      `${before ? `${before}.?` : ''}${textStart}`,
      `${textEnd ? `.*?${textEnd}` : ''}${after ? `.?${after}` : ''}`
    );
    if (matches.length === 1) {
      return {
        before: unescapeRegExp(before),
        after: unescapeRegExp(after)
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
      growContextBefore,
      before,
      after
    );
  };

  const encodeURIComponentAndMinus = text => {
    return encodeURIComponent(text).replace(/-/g, '%2D');
  };

  const createURL = async tabURL => {
    const {
      selectedText,
      pageText,
      textBeforeSelection,
      textAfterSelection,
      textNodeBeforeSelection,
      textNodeAfterSelection,
      closestElementFragment
    } = await getPageTextContent();
    tabURL = new URL(tabURL);
    let textFragmentURL = `${tabURL.origin}${tabURL.pathname}${
      closestElementFragment ? `#${closestElementFragment}` : '#'
    }`;
    const selectedWords = selectedText.split(/\s+/gm);
    let textStart = '';
    let textEnd = '';
    if (
      selectedWords.length === 1 ||
      selectedText.length <= EXACT_MATCH_MAX_LENGTH
    ) {
      // Just use the entire text
      textStart = selectedText;
    } else {
      // Use the first and the last word of the selection.
      textStart = selectedWords.shift();
      textEnd = selectedWords.pop();
      if (
        selectedText.length > EXACT_MATCH_MAX_LENGTH &&
        INNER_CONTEXT_MAX_LENGTH > 0
      ) {
        textStart +=
          ' ' + selectedWords.splice(0, INNER_CONTEXT_MAX_LENGTH).join(' ');
        textEnd =
          selectedWords.splice(-1 * INNER_CONTEXT_MAX_LENGTH).join(' ') +
          ' ' +
          textEnd;
      }
    }
    let matches = isUniqueMatch(
      pageText,
      escapeRegExp(textStart),
      `${textEnd ? `.*?${escapeRegExp(textEnd)}` : ''}`
    );
    // We have a unique match, return it.
    if (matches.length === 1) {
      textStart = encodeURIComponentAndMinus(textStart);
      textEnd = textEnd ? `,${encodeURIComponentAndMinus(textEnd)}` : '';
      return (textFragmentURL += `:~:text=${textStart}${textEnd}`);
      // We need to add context.
    } else {
      // The text before/after in the same node as the selected text
      // combined with the text in the previous/next node.
      const wordsInTextNodeBeforeSelection = textNodeBeforeSelection
        ? textNodeBeforeSelection.split(/\s+/gm)
        : [];
      const wordsBeforeSelection = textBeforeSelection
        ? textBeforeSelection.split(/\s+/gm)
        : [];
      let wordsBefore = wordsInTextNodeBeforeSelection.concat(
        wordsBeforeSelection
      );

      const wordsInTextNodeAfterSelection = textNodeAfterSelection
        ? textNodeAfterSelection.split(/\s+/gm)
        : [];
      const wordsAfterSelection = textAfterSelection
        ? textAfterSelection.split(/\s+/gmu)
        : [];
      let wordsAfter = wordsAfterSelection.concat(
        wordsInTextNodeAfterSelection
      );

      const growContextBefore =
        wordsBeforeSelection.length > wordsAfterSelection.length;

      let { before, after } = findUniqueMatch(
        pageText,
        textStart,
        textEnd,
        matches,
        wordsBefore,
        wordsAfter,
        growContextBefore
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
    log(url)
    await sendMessageToPage('success', url);
  };
})(window.chrome || window.browser);
