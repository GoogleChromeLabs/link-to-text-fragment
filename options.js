((browser) => {
  document.querySelector('h1').textContent = browser.i18n.getMessage('link_copy_style');
  document.querySelector('.rich').textContent = browser.i18n.getMessage('rich');
  document.querySelector('.raw').textContent = browser.i18n.getMessage('raw');
  document.querySelector('.rich_plus_raw').textContent = browser.i18n.getMessage('rich_plus_raw');
  document.querySelector('h4').textContent = browser.i18n.getMessage('link_text');
  document.querySelector('.link_text_option_1').textContent = browser.i18n.getMessage('link_text_option_1');
  document.querySelector('.link_text_option_2').textContent = browser.i18n.getMessage('link_text_option_2');
  document.querySelector('.link_text_option_3').textContent = browser.i18n.getMessage('link_text_option_3');
  document.querySelector('.link_text_option_4').textContent = browser.i18n.getMessage('link_text_option_4');

  const rich = document.querySelector('#rich');
  const raw = document.querySelector('#raw');
  const rich_plus_raw = document.querySelector('#rich_plus_raw');

  const link_text_option_1 = document.querySelector('#link_text_option_1');
  const link_text_option_2 = document.querySelector('#link_text_option_2');
  const link_text_option_3 = document.querySelector('#link_text_option_3');
  const link_text_option_4 = document.querySelector('#link_text_option_4');
  const link_text_input = document.querySelector('#link_text_input');

  const enableLinkTextOptions = (enabled) => {
    document.getElementsByName("link_text").forEach((e) => {
      e.disabled = !enabled;
    });
  };

  // Restore previous settings.
  browser.storage.sync.get({linkStyle: 'rich', linkText: document.querySelector('.link_text_option_1').textContent}, (items) => {
    rich.checked = items.linkStyle === 'rich';
    raw.checked = items.linkStyle === 'raw';
    rich_plus_raw.checked = items.linkStyle === 'rich_plus_raw';

    link_text_option_1.checked = items.linkText === document.querySelector('.link_text_option_1').textContent;
    link_text_option_2.checked = items.linkText === document.querySelector('.link_text_option_2').textContent;
    link_text_option_3.checked = items.linkText === document.querySelector('.link_text_option_3').textContent;
    if (!link_text_option_1.checked && !link_text_option_2.checked && !link_text_option_3.checked) {
        link_text_option_4.checked = true;
        link_text_input.value = items.linkText;
    }

    enableLinkTextOptions(rich_plus_raw.checked);
  });

  // Save settings on change.
  rich.addEventListener('click', () => {
    browser.storage.sync.set({linkStyle: 'rich'});
    enableLinkTextOptions(rich_plus_raw.checked);
  });
  raw.addEventListener('click', () => {
    browser.storage.sync.set({linkStyle: 'raw'});
    enableLinkTextOptions(rich_plus_raw.checked);
  });
  rich_plus_raw.addEventListener('click', () => {
    browser.storage.sync.set({linkStyle: 'rich_plus_raw'});
    enableLinkTextOptions(rich_plus_raw.checked);
  });

  link_text_option_1.addEventListener('click', () => {
    browser.storage.sync.set({
      linkText: document.querySelector('.link_text_option_1').textContent,
    });
  });
  link_text_option_2.addEventListener('click', () => {
    browser.storage.sync.set({
      linkText: document.querySelector('.link_text_option_2').textContent,
    });
  });
  link_text_option_3.addEventListener('click', () => {
    browser.storage.sync.set({
      linkText: document.querySelector('.link_text_option_3').textContent,
    });
  });
  link_text_option_4.addEventListener('click', () => {
    link_text_input.focus();
    browser.storage.sync.set({
      linkText: link_text_input.value,
    });
  });
  link_text_input.addEventListener('focus', () => {
    link_text_option_4.checked = true;
  });
  link_text_input.addEventListener('change', () => {
    if (link_text_input.value.replace(/\s/g, '').length > 0) {
      browser.storage.sync.set({
          linkText: link_text_input.value,
      });
    }
    else {
      browser.storage.sync.set({
        linkText: document.querySelector('.link_text_option_1').textContent,
      });
    }
  });

  // eslint-disable-next-line no-undef
})(chrome || browser);
