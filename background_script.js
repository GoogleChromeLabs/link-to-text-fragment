(async (browser) => {
  if (!('fragmentDirective' in window.location)) {
    return;
  }

  DEBUG = true;

  // https://wicg.github.io/ScrollToTextFragment/#:~:text=It%20is%20recommended,a%20range%2Dbased%20match.
  // Experimenting with 100 instead.
  EXACT_MATCH_MAX_CHARS = 100;
  CONTEXT_MAX_WORDS = 5;

  const log = (...args) => {
    if (DEBUG) {
      console.log.apply(this, args);
    }
  };

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
    await sendMessageToPage('debug', DEBUG);
    const textFragmentURL = await createURL(tab.url);
    await copyToClipboard(textFragmentURL);
  });

  const escapeRegExp = (s) => {
    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  };

  const unescapeRegExp = (s) => {
    return s.replace(/\\([-\/\\^$*+?.()|[\]{}])/g, '$1');
  };

  const encodeURIComponentAndMinus = (text) => {
    return encodeURIComponent(text).replace(/-/g, '%2D');
  };

  const isUniqueMatch = (hayStack, start, end = '') => {
    try {
      const needle = new RegExp(`${start}${end}`, 'gims');
      const matches = [...hayStack.matchAll(needle)];
      log('———\n', 'RegEx:', needle.source, '\n', 'Matches:', matches, '\n———');
      if (matches.length === 1) {
        let matchedText = matches[0][0];
        // Find inner matches where the needle is (at least partly) contained
        // again in the haystack.
        const startNeedle = new RegExp(start, 'ims');
        const endNeedle = new RegExp(end.replace(/^\.\*\?/), 'ims');
        matchedText = matchedText
          .replace(startNeedle, '')
          .replace(endNeedle, '');
        const innerMatches = [...matchedText.matchAll(needle)];
        if (innerMatches.length === 0) {
          return true;
        }
        return false;
      }
      return false;
    } catch (err) {
      // This can happen when the regular expression can't be created.
      console.error(err.name, err.message);
      return null;
    }
  };

  const findUniqueMatch = (
    pageText,
    textStart,
    textEnd,
    unique,
    wordsBefore,
    wordsAfter,
    growthDirection,
    prefix = '',
    suffix = '',
  ) => {
    log(
      'prefix: "' +
        prefix +
        '"\n' +
        'textStart: "' +
        textStart +
        '"\n' +
        'textEnd: "' +
        textEnd +
        '"\n' +
        'suffix: "' +
        suffix +
        '"\n' +
        'growth direction: ' +
        growthDirection,
    );
    if (
      wordsAfter.length === 0 &&
      wordsBefore.length > 0 &&
      growthDirection === 'suffix'
    ) {
      // Switch the growth direction.
      growthDirection = 'prefix';
    } else if (
      wordsBefore.length === 0 &&
      wordsAfter.length === 0 &&
      unique === false
    ) {
      // No more search options.
      return {
        prefix: false,
        suffix: false,
      };
    }
    // We need to add outer context before or after the needle.
    if (growthDirection === 'prefix' && wordsBefore.length > 0) {
      const newBefore = escapeRegExp(wordsBefore.pop());
      prefix = `${newBefore}${prefix ? ` ${prefix}` : ''}`;
      log('new prefix "' + prefix + '"');
    } else if (wordsAfter.length > 0) {
      const newAfter = escapeRegExp(wordsAfter.shift());
      suffix = `${suffix ? `${suffix} ` : ''}${newAfter}`;
      log('new suffix "' + suffix + '"');
    }
    unique = isUniqueMatch(
      pageText,
      `${prefix ? `${prefix}.?` : ''}${textStart}`,
      `${textEnd ? `.*?${textEnd}` : ''}${suffix ? `.?${suffix}` : ''}`,
    );
    if (unique) {
      return {
        prefix: unescapeRegExp(prefix),
        suffix: unescapeRegExp(suffix),
      };
    } else if (unique === null) {
      // Couldn't create regular expression. This should rarely happen…
      return {
        prefix: false,
        suffix: false,
      };
    }
    return findUniqueMatch(
      pageText,
      textStart,
      textEnd,
      unique,
      wordsBefore,
      wordsAfter,
      growthDirection,
      prefix,
      suffix,
    );
  };

  const chooseSeedTextStartAndTextEnd = (selection) => {
    const selectedText = selection.processed;
    const selectedWords = selection.processed.split(/\s+/gm);
    const selectedParagraphs = selection.raw.split(/\n+/gm);
    let textStart = '';
    let textEnd = '';
    log('🔎 Beginning our search.', selection);
    // Reminder: `shift()`, `pop()`, and `splice()` all change the array.
    if (selectedParagraphs.length > 1) {
      log('Selection spans multiple boundaries.');
      // Use the first word of the first boundary and the last word of the last
      // boundary.
      const selectedWordsBeforeBoundary = selectedParagraphs
        .shift()
        .split(/\s+/g);
      const selectedWordsAfterBoundary = selectedParagraphs.pop().split(/\s+/g);
      textStart = selectedWordsBeforeBoundary.shift();
      textEnd = selectedWordsAfterBoundary.pop();
      // Add inner context at the beginning and the end.
      if (CONTEXT_MAX_WORDS > 0) {
        textStart +=
          ' ' +
          selectedWordsBeforeBoundary.splice(0, CONTEXT_MAX_WORDS).join(' ');
        textEnd =
          selectedWordsAfterBoundary.splice(-1 * CONTEXT_MAX_WORDS).join(' ') +
          ' ' +
          textEnd;
      }
    } else if (
      selectedWords.length === 1 ||
      selectedText.length <= EXACT_MATCH_MAX_CHARS
    ) {
      log('Selection spans just one boundary and is short enough.');
      // Just use the entire text.
      textStart = selectedText;
    } else {
      log('Selection spans just one boundary but is too long.');
      // Use the first and the last word of the selection.
      textStart = selectedWords.shift();
      textEnd = selectedWords.pop();
      // Add inner context at the beginning and the end.
      if (CONTEXT_MAX_WORDS > 0) {
        textStart += ' ' + selectedWords.splice(0, CONTEXT_MAX_WORDS).join(' ');
        textEnd =
          selectedWords.splice(-1 * CONTEXT_MAX_WORDS).join(' ') +
          ' ' +
          textEnd;
      }
    }
    return { textStart, textEnd };
  };

  const createURL = async (tabURL) => {
    let pageResponse;
    try {
      pageResponse = await getPageTextContent();
    } catch (err) {
      console.error(err.name, err.message);
      return;
    }
    const {
      selectedText,
      pageText,
      textBeforeSelection,
      textAfterSelection,
      textNodeBeforeSelection,
      textNodeAfterSelection,
      closestElementFragment,
    } = pageResponse;

    tabURL = new URL(tabURL);
    let textFragmentURL = `${tabURL.origin}${tabURL.pathname}${
      closestElementFragment ? `#${closestElementFragment}` : '#'
    }`;

    let { textStart, textEnd } = chooseSeedTextStartAndTextEnd(selectedText);
    let unique = isUniqueMatch(
      pageText,
      escapeRegExp(textStart),
      `${textEnd ? `.*?${escapeRegExp(textEnd)}` : ''}`,
    );
    if (unique) {
      // We have a unique match, return it.
      textStart = encodeURIComponentAndMinus(textStart);
      textEnd = textEnd ? `,${encodeURIComponentAndMinus(textEnd)}` : '';
      return (textFragmentURL += `:~:text=${textStart}${textEnd}`);
    } else {
      // We need to add context. Therefore, use the text before/after in the
      // same node as the selected text, or if there's none, the text in
      // the previous/next node.
      const wordsInTextNodeBeforeSelection = textNodeBeforeSelection
        ? textNodeBeforeSelection.split(/\s+/gm)
        : [];
      const wordsBeforeSelection = textBeforeSelection
        ? textBeforeSelection.split(/\s+/gm)
        : [];
      const wordsBefore = wordsBeforeSelection.length
        ? wordsBeforeSelection
        : wordsInTextNodeBeforeSelection;

      const wordsInTextNodeAfterSelection = textNodeAfterSelection
        ? textNodeAfterSelection.split(/\s+/gm)
        : [];
      const wordsAfterSelection = textAfterSelection
        ? textAfterSelection.split(/\s+/gm)
        : [];
      const wordsAfter = wordsAfterSelection.length
        ? wordsAfterSelection
        : wordsInTextNodeAfterSelection;

      // Add context either before or after the selected text, depending on
      // where there is more text.
      const growthDirection =
        wordsBefore.length > wordsAfter.length ? 'prefix' : 'suffix';

      let { prefix, suffix } = findUniqueMatch(
        pageText,
        textStart,
        textEnd,
        unique,
        wordsBefore,
        wordsAfter,
        growthDirection,
      );
      if (!prefix && !suffix) {
        return await sendMessageToPage('failure');
      }
      prefix = prefix ? `${encodeURIComponentAndMinus(prefix)}-,` : '';
      suffix = suffix ? `,-${encodeURIComponentAndMinus(suffix)}` : '';
      textStart = encodeURIComponentAndMinus(textStart);
      textEnd = textEnd ? `,${encodeURIComponentAndMinus(textEnd)}` : '';
      return (textFragmentURL += `:~:text=${prefix}${textStart}${textEnd}${suffix}`);
    }
  };

  const getPageTextContent = async () => {
    return new Promise((resolve, reject) => {
      browser.tabs.query(
        {
          active: true,
          currentWindow: true,
        },
        (tabs) => {
          browser.tabs.sendMessage(
            tabs[0].id,
            {
              message: 'get-text',
            },
            (response) => {
              if (!response) {
                return reject(
                  'An error occurred while connecting to the specified tab.',
                );
              }
              return resolve(response);
            },
          );
        },
      );
    });
  };

  const sendMessageToPage = async (message, data = null) => {
    browser.tabs.query(
      {
        active: true,
        currentWindow: true,
      },
      (tabs) => {
        browser.tabs.sendMessage(tabs[0].id, {
          message,
          data,
        });
      },
    );
  };

  const copyToClipboard = async (url) => {
    // Try to use the Async Clipboard API with fallback to the legacy approach.
    try {
      const { state } = await navigator.permissions.query({
        name: 'clipboard-write',
      });
      if (state !== 'granted') {
        throw new Error('Clipboard permission not granted');
      }
      await navigator.clipboard.writeText(url);
    } catch {
      let textArea = document.createElement('textarea');
      document.body.append(textArea);
      textArea.textContent = url;
      textArea.select();
      document.execCommand('copy');
      textArea.remove();
    }
    log('🎉', url);
    await sendMessageToPage('success', url);
  };
})(window.chrome || window.browser);
