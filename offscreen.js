// eslint-disable-next-line no-undef
const browser = chrome || browser;

const copyLink = async (linkStyle, url, selectedText, html, linkText) => {
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
          [`<a href="${url}">${selectedText}</a>`],
          {
            type: 'text/html',
          },
      );
    } else if (linkStyle === 'rich_plus_raw') {
      clipboardItems['text/html'] = new Blob(
          [`${html} <a href="${url}">${linkText}</a>`],
          {type: 'text/html'},
      );
    }

    const clipboardData = [new ClipboardItem(clipboardItems)];
    await navigator.clipboard.write(clipboardData);
  } catch (err) {
    const textArea = document.createElement('textarea');
    document.body.append(textArea);
    textArea.textContent = url;
    textArea.select();
    document.execCommand('copy');
    textArea.remove();
  }
};

browser.runtime.onMessage.addListener((message) => {
  if (message.target !== 'offscreen') {
    return;
  }
  const {linkStyle, url, selectedText, html, linkText} = message.data;
  copyLink(linkStyle, url, selectedText, html, linkText);
  return true;
});
