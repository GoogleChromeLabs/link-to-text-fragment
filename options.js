((browser) => {
  document.querySelector('h1').textContent =
    browser.i18n.getMessage('link_copy_style');
  document.querySelector('.rich').textContent = browser.i18n.getMessage('rich');
  document.querySelector('.raw').textContent = browser.i18n.getMessage('raw');
  document.querySelector('.rich-plus-raw').textContent =
    browser.i18n.getMessage('rich_plus_raw');
  document.querySelector('h4').textContent =
    browser.i18n.getMessage('link_text');
  document.querySelector('.link-text-option-1').textContent =
    browser.i18n.getMessage('link_text_option_1');
  document.querySelector('.link-text-option-2').textContent =
    browser.i18n.getMessage('link_text_option_2');
  document.querySelector('.link-text-option-3').textContent =
    browser.i18n.getMessage('link_text_option_3');
  document.querySelector('.link-text-option-4').textContent =
    browser.i18n.getMessage('link_text_option_4');

  const rich = document.querySelector('#rich');
  const raw = document.querySelector('#raw');
  const richPlusRaw = document.querySelector('#rich-plus-raw');

  const linkTextOption1 = document.querySelector('#link-text-option-1');
  const linkTextOption2 = document.querySelector('#link-text-option-2');
  const linkTextOption3 = document.querySelector('#link-text-option-3');
  const linkTextOption4 = document.querySelector('#link-text-option-4');
  const linkTextInput = document.querySelector('#link-text-input');

  const enableLinkTextOptions = (enabled) => {
    document.getElementsByName('link-text').forEach((e) => {
      e.disabled = !enabled;
    });
  };

  // Restore previous settings.
  browser.storage.sync.get(
      {
        linkStyle: 'rich',
        linkText: document.querySelector('.link-text-option-1').textContent,
      },
      (items) => {
        rich.checked = items.linkStyle === 'rich';
        raw.checked = items.linkStyle === 'raw';
        richPlusRaw.checked = items.linkStyle === 'rich_plus_raw';
        linkTextOption1.checked =
        items.linkText ===
        document.querySelector('.link-text-option-1').textContent;
        linkTextOption2.checked =
        items.linkText ===
        document.querySelector('.link-text-option-2').textContent;
        linkTextOption3.checked =
        items.linkText ===
        document.querySelector('.link-text-option-3').textContent;
        if (
          !linkTextOption1.checked &&
        !linkTextOption2.checked &&
        !linkTextOption3.checked
        ) {
          linkTextOption4.checked = true;
          linkTextInput.value = items.linkText;
        }
        enableLinkTextOptions(richPlusRaw.checked);
      },
  );

  // Save settings on change.
  rich.addEventListener('click', () => {
    browser.storage.sync.set({linkStyle: 'rich'});
    enableLinkTextOptions(richPlusRaw.checked);
  });
  raw.addEventListener('click', () => {
    browser.storage.sync.set({linkStyle: 'raw'});
    enableLinkTextOptions(richPlusRaw.checked);
  });
  richPlusRaw.addEventListener('click', () => {
    browser.storage.sync.set({linkStyle: 'rich_plus_raw'});
    enableLinkTextOptions(richPlusRaw.checked);
  });

  linkTextOption1.addEventListener('click', () => {
    browser.storage.sync.set({
      linkText: document.querySelector('.link-text-option-1').textContent,
    });
  });
  linkTextOption2.addEventListener('click', () => {
    browser.storage.sync.set({
      linkText: document.querySelector('.link-text-option-2').textContent,
    });
  });
  linkTextOption3.addEventListener('click', () => {
    browser.storage.sync.set({
      linkText: document.querySelector('.link-text-option-3').textContent,
    });
  });
  linkTextOption4.addEventListener('click', () => {
    linkTextInput.focus();
    browser.storage.sync.set({
      linkText: linkTextInput.value,
    });
  });
  linkTextInput.addEventListener('focus', () => {
    linkTextOption4.checked = true;
  });
  linkTextInput.addEventListener('change', () => {
    if (linkTextInput.value.replace(/\s/g, '').length > 0) {
      browser.storage.sync.set({
        linkText: linkTextInput.value,
      });
    } else {
      browser.storage.sync.set({
        linkText: document.querySelector('.link-text-option-1').textContent,
      });
    }
  });

  // eslint-disable-next-line no-undef
})(chrome || browser);
