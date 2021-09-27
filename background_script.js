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

(async (browser) => {
  const DEBUG = false;

  const SUPPORTS_TEXT_FRAGMENTS =
    'fragmentDirective' in Location.prototype ||
    'fragmentDirective' in document;

  const log = (...args) => {
    if (DEBUG) {
      console.log(...args);
    }
  };

  const injectContentScripts = async (contentScriptNames) => {
    // If there's a reply, the content script already was injected.
    try {
      return await sendMessageToPage('ping');
    } catch (err) {
      await Promise.all(
          contentScriptNames.map((contentScriptName) => {
            return new Promise((resolve) => {
              browser.tabs.executeScript(
                  {
                    file: contentScriptName,
                  },
                  () => {
                    log('Injected content script', contentScriptName);
                    return resolve();
                  },
              );
            });
          }),
      );
    }
  };

  const askForAllOriginsPermission = async () => {
    return new Promise((resolve, reject) => {
      browser.permissions.request(
          {
            origins: ['http://*/*', 'https://*/*'],
          },
          (granted) => {
            if (granted) {
              return resolve();
            }
            return reject(new Error('Host permission not granted.'));
          },
      );
    });
  };

  const polyfillTextFragments = async () => {
    try {
      await askForAllOriginsPermission();
      browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
        if (changeInfo.status === 'complete' && tab.status === 'complete') {
          await injectContentScripts(['text-fragments.js']);
        }
      });
    } catch {
      // Ignore for now. Like this, users can still create links, for example,
      // for sharing, but they won't work locally.
    }
  };

  browser.contextMenus.create(
      {
        title: browser.i18n.getMessage('copy_link'),
        id: 'copy-link',
        contexts: ['selection'],
      },
      () => {
        if (browser.runtime.lastError) {
          console.log(
              'Error creating context menu item:',
              browser.runtime.lastError,
          );
        }
      },
  );

  browser.commands.onCommand.addListener(async (command) => {
    if (command === 'copy_link') {
      if (!SUPPORTS_TEXT_FRAGMENTS) {
        await polyfillTextFragments();
      }
      await injectContentScripts([
        'prepare.js',
        'fragment-generation-utils.js',
        'content_script.js',
      ]);
      browser.tabs.query(
          {
            active: true,
            currentWindow: true,
          },
          (tabs) => {
            startProcessing(tabs[0]);
          },
      );
    }
  });

  browser.contextMenus.onClicked.addListener(async (info, tab) => {
    if (!SUPPORTS_TEXT_FRAGMENTS) {
      await polyfillTextFragments();
    }
    await injectContentScripts([
      'prepare.js',
      'fragment-generation-utils.js',
      'content_script.js',
    ]);
    startProcessing(tab);
  });

  const startProcessing = async (tab) => {
    try {
      await sendMessageToPage('debug', DEBUG);
    } catch {
      // Ignore
    }
    await sendMessageToPage('create-text-fragment');
  };

  const sendMessageToPage = (message, data = null) => {
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
                  message,
                  data,
                },
                (response) => {
                  if (!response) {
                    return reject(
                        new Error('Failed to connect to the specified tab.'),
                    );
                  }
                  return resolve(response);
                },
            );
          },
      );
    });
  };
  // eslint-disable-next-line no-undef
})(chrome || browser);
