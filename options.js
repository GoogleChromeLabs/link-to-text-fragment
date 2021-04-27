((browser) => {
  const rich = document.querySelector('#rich');
  const raw = document.querySelector('#raw');

  // Restore previous settings.
  browser.storage.sync.get({linkStyle: 'rich'}, (items) => {
    rich.checked = items.linkStyle === 'rich';
    raw.checked = items.linkStyle === 'raw';
  });

  // Save settings on change.
  rich.addEventListener('change', () => {
    browser.storage.sync.set({
      linkStyle: rich.checked ? 'rich' : 'raw',
    });
  });
  raw.addEventListener('change', () => {
    browser.storage.sync.set({linkStyle: raw.checked ? 'raw' : 'rich'});
  });
  // eslint-disable-next-line no-undef
})(chrome || browser);
