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

// eslint-disable-next-line no-undef
const browser = chrome || browser;
const DEBUG = false;

// A global promise to avoid concurrency issues
let creating;
const path = 'offscreen.html';

const setupOffscreenDocument = async (path) => {
  // Check all windows controlled by the service worker to see if one
  // of them is the offscreen document with the given path
  const offscreenUrl = browser.runtime.getURL(path);

  // eslint-disable-next-line no-undef
  const matchedClients = await clients.matchAll();
  for (const client of matchedClients) {
    if (client.url === offscreenUrl) {
      return;
    }
  }

  // Create offscreen document
  if (creating) {
    await creating;
  } else {
    creating = browser.offscreen.createDocument({
      url: path,
      reasons: ['CLIPBOARD'],
      justification: 'Clipboard access is required to copy the link.',
    });
    await creating;
    creating = null;
  }
};

browser.action.onClicked.addListener((info, tab) => onCopy(info, tab));

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
            browser.tabs.query(
                {
                  active: true,
                  currentWindow: true,
                },
                (tabs) => {
                  browser.scripting.executeScript(
                      {
                        files: [contentScriptName],
                        target: {
                          tabId: tabs[0].id,
                        },
                      },
                      () => {
                        log('Injected content script', contentScriptName);
                        return resolve();
                      },
                  );
                },
            );
          });
        }),
    );
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
browser.contextMenus.onClicked.addListener((info, tab) => onCopy(info, tab));

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

const onCopy = async (info, tab) => {
  Promise.all([
    await setupOffscreenDocument(path),
    await injectContentScripts([
      'prepare.js',
      'fragment-generation-utils.js',
      'content_script.js',
    ]),
  ]);
  startProcessing(tab);
};
