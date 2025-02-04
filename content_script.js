/**
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
((browser) => {

  let DEBUG = false;

  const log = (...args) => {
    if (DEBUG) {
      console.log(...args);
    }
  };

  const createTextFragment = () => {
    const selection = window.getSelection();

    const result = exports.generateFragment(selection);
    let url = `${location.origin}${location.pathname}${location.search}${
      location.hash ? location.hash : '#'
    }`;
    if (result.status === 0) {
      const fragment = result.fragment;
      const prefix = fragment.prefix
        ? `${encodeURIComponent(fragment.prefix)}-,`
        : '';
      const suffix = fragment.suffix
        ? `,-${encodeURIComponent(fragment.suffix)}`
        : '';
      const textStart = encodeURIComponent(fragment.textStart);
      const textEnd = fragment.textEnd
        ? `,${encodeURIComponent(fragment.textEnd)}`
        : '';
      url = `${url}:~:text=${prefix}${textStart}${textEnd}${suffix}`;
      copyToClipboard(url, selection);
      reportSuccess();
      return url;
    } else {
      reportFailure(result.status);
      return `Oops! Unable to create link. ${result.status}`;
    }
  };

  const reportSuccess = () => {
    const style = document.createElement('style');
    document.head.append(style);
    const sheet = style.sheet;
    sheet.insertRule(`
      ::selection {
        color: #000 !important;
        background-color: #ffff00 !important;
      }`);
    // Need to force re-selection for the CSS to have an effect in Safari.
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    selection.removeAllRanges();
    window.setTimeout(() => selection.addRange(range), 0);
    window.setTimeout(() => style.remove(), 2000);
    return true;
  };

  const reportFailure = (status) => {
    const statusCodes = {
      1: 'INVALID_SELECTION: ❌ The selected text is too short or does not contain enough valid words. Please choose a longer or more specific phrase.',
      2: 'AMBIGUOUS:❌ The selected text appears multiple times on this page and no unique link could be created. Try selecting a different text segment.',
      3: 'TIMEOUT: ⏳ The process took too long. This may be due to a large page size or slow browser performance. Try selecting a different text segment.',
      4: 'EXECUTION_FAILED: ⚠️ An unexpected error occurred while generating the link.
    };

    window.queueMicrotask(() => {
      alert(
        `🛑 ${browser.i18n.getMessage(
          'extension_name'
        )}:\n${browser.i18n.getMessage('link_failure')}\n\n(${
          statusCodes[status]
        })`
      );
    });
    return true;
  };

  const copyToClipboard = (url, selection) => {
    browser.storage.sync.get(
      {
        linkStyle: 'rich',
        linkText: browser.i18n.getMessage('link_text_option_1'),
      },
      async (items) => {
        const linkStyle = items.linkStyle;
        // Send message to offscreen document
        const selectedText = selection.toString();
        const linkText = items.linkText;
        let html = '';
        if (selection.rangeCount) {
          const container = document.createElement('div');
          for (let i = 0, len = selection.rangeCount; i < len; ++i) {
            // prettier-ignore
            container.appendChild(
                  selection.getRangeAt(i).cloneContents());
          }
          html = container.innerHTML;
        }
        browser.runtime.sendMessage(
          {
            target: 'offscreen',
            data: { linkStyle, url, selectedText, html, linkText },
          },
          (response) => {
            if (response) {
              log('🎉', url);
            }
          }
        );
      }
    );
  };

  browser.runtime.onMessage.addListener((request, _, sendResponse) => {
    const message = request.message;
    if (message === 'create-text-fragment') {
      return sendResponse(createTextFragment());
    } else if (message === 'debug') {
      return sendResponse((DEBUG = request.data) || true);
    } else if (message === 'ping') {
      return sendResponse('pong');
    }
  });
})(chrome || browser);
