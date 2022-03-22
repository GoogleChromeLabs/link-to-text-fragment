((browser) => {
  document.querySelector('h1').textContent =
    browser.i18n.getMessage('link_copy_style');
  document.querySelector('.rich').textContent = browser.i18n.getMessage('rich');
  document.querySelector('.raw').textContent = browser.i18n.getMessage('raw');
  document.querySelector('.rich_plus_raw').textContent = browser.i18n.getMessage('rich_plus_raw');

  const rich = document.querySelector('#rich');
  const raw = document.querySelector('#raw');
  const rich_plus_raw = document.querySelector('#rich_plus_raw');

  // Restore previous settings.
  browser.storage.sync.get({linkStyle: 'rich'}, (items) => {
    rich.checked = items.linkStyle === 'rich';
    raw.checked = items.linkStyle === 'raw';
    rich_plus_raw.checked = items.linkStyle === 'rich_plus_raw';
  });

  // Save settings on change.
  rich.addEventListener('change', () => {
    browser.storage.sync.set({
      linkStyle: rich.checked ? 'rich' : (raw.checked ? 'raw' : 'rich_plus_raw'),
    });
  });
  raw.addEventListener('change', () => {
    browser.storage.sync.set({
      linkStyle: rich.checked ? 'rich' : (raw.checked ? 'raw' : 'rich_plus_raw'),
    });
  });
  rich_plus_raw.addEventListener('change', () => {
    browser.storage.sync.set({
      linkStyle: rich.checked ? 'rich' : (raw.checked ? 'raw' : 'rich_plus_raw'),
    });
  });
  // eslint-disable-next-line no-undef
})(chrome || browser);
