((browser) => {
  document.querySelector('h1').textContent =
    browser.i18n.getMessage('link_copy_style');
  document.querySelector('.rich').textContent = browser.i18n.getMessage('rich');
  document.querySelector('.raw').textContent = browser.i18n.getMessage('raw');
  document.querySelector('.html').textContent = browser.i18n.getMessage('html');

  const rich = document.querySelector('#rich');
  const raw = document.querySelector('#raw');
  const html = document.querySelector('#html');

  // Restore previous settings.
  browser.storage.sync.get({linkStyle: 'rich'}, (items) => {
    rich.checked = items.linkStyle === 'rich';
    raw.checked = items.linkStyle === 'raw';
    html.checked = items.linkStyle === 'html';
  });

  // Save settings on change.
  rich.addEventListener('change', () => {
    browser.storage.sync.set({
      linkStyle: rich.checked ? 'rich' : (raw.checked ? 'raw' : 'html'),
    });
  });
  raw.addEventListener('change', () => {
    browser.storage.sync.set({
      linkStyle: rich.checked ? 'rich' : (raw.checked ? 'raw' : 'html'),
    });
  });
  html.addEventListener('change', () => {
    browser.storage.sync.set({
      linkStyle: rich.checked ? 'rich' : (raw.checked ? 'raw' : 'html'),
    });
  });
  // eslint-disable-next-line no-undef
})(chrome || browser);
