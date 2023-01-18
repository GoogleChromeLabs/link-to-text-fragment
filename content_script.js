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
    // eslint-disable-next-line no-undef
    const result = exports.generateFragment(selection);
    let url = `${location.origin}${location.pathname}${location.search}`;
    if (result.status === 0) {
      const fragment = result.fragment;
      const prefix = fragment.prefix ?
        `${str_replace('-', '%2D', encodeURIComponent(fragment.prefix))}-,` :
        '';
      const suffix = fragment.suffix ?
        `,-${str_replace('-', '%2D', encodeURIComponent(fragment.suffix))}` :
        '';
      const textStart = str_replace('-', '%2D', encodeURIComponent(fragment.textStart));
      const textEnd = fragment.textEnd ?
        `,${str_replace('-', '%2D', encodeURIComponent(fragment.textEnd))}` :
        '';
      url = `${url}#:~:text=${prefix}${textStart}${textEnd}${suffix}`;
      copyToClipboard(url, selection);
      reportSuccess();
      return url;
    } else {
      reportFailure(result.status);
      return `Could not create URL ${result.status}`;
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
      1: 'INVALID_SELECTION: The selection provided could not be used.',
      // eslint-disable-next-line max-len
      2: 'AMBIGUOUS: No unique fragment could be identified for this selection.',
      3: 'TIMEOUT: Computation could not complete in time.',
      4: 'EXECUTION_FAILED: Unknown error.',
    };

    window.queueMicrotask(() => {
      alert(
          `🛑 ${browser.i18n.getMessage(
              'extension_name',
          )}:\n${browser.i18n.getMessage('link_failure')}\n\n(${
            statusCodes[status]
          })`,
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
          // Try to use the Async Clipboard API with fallback to the legacy API.
          try {
            const {state} = await navigator.permissions.query({
              name: 'clipboard-write',
            });
            if (state !== 'granted') {
              throw new Error('Clipboard permission not granted');
            }
            const clipboardItems = {
              'text/plain': new Blob([url], {type: 'text/plain'}),
            };
            if (linkStyle === 'rich') {
              clipboardItems['text/html'] = new Blob(
                  [`<a href="${url}">${selection.toString()}</a>`],
                  {
                    type: 'text/html',
                  },
              );
            } else if (linkStyle === 'rich_plus_raw') {
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
              clipboardItems['text/html'] = new Blob(
                  [`${html} <a href="${url}">${items.linkText}</a>`],
                  {type: 'text/html'},
              );
            }

            const clipboardData = [new ClipboardItem(clipboardItems)];
            /* global ClipboardItem */
            await navigator.clipboard.write(clipboardData);
          } catch (err) {
            const textArea = document.createElement('textarea');
            document.body.append(textArea);
            textArea.textContent = url;
            textArea.select();
            document.execCommand('copy');
            textArea.remove();
          }
          log('🎉', url);
          return true;
        },
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
  // eslint-disable-next-line no-undef
})(chrome || browser);
