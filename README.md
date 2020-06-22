# Link to Text Fragment

- 📖 Article: https://web.dev/text-fragments/
- 🧩 Extension: https://chrome.google.com/webstore/detail/link-to-text-fragment/pbcodcjpfjdpcineamnnmbkkmkdpajjg
- 🎬 Demo video: https://www.youtube.com/watch?v=Y5DmGqnzvBI

## Installation

You can install the
[Link to Text Fragment extension](https://chrome.google.com/webstore/detail/link-to-text-fragment/pbcodcjpfjdpcineamnnmbkkmkdpajjg)
from the Chrome Web Store.

## Usage

The Link to Text Fragment extension allows for the easy creation
of text fragment URLs via the context menu:

1. Select the text that you want to link to.
1. Right-click and choose "Copy Link to Selected Text" from the context menu.
1. If the link creation succeeded, the selected text will be briefly highlighted in yellow.
1. Paste your link wherever you want to share it.

![Text fragment selected on a webpage and contextmenu showing "Copy Link to Selected Text"](https://github.com/GoogleChromeLabs/link-to-text-fragment/blob/master/store-assets/screenshot-contextmenu-1280x800.png?raw=true)

## Background

The [Text Fragments specification](https://wicg.github.io/ScrollToTextFragment/)
adds support for specifying a text snippet in the URL fragment.

```
#:~:text=[prefix-,]textStart[,textEnd][,-suffix]
```

When navigating to a URL with such a fragment, the user agent can quickly
emphasize and/or bring it to the user's attention.

Try it out by clicking on this link:
https://wicg.github.io/scroll-to-text-fragment/#ref-for-fragment-directive:~:text=%23%3A~%3Atext%3D%5Bprefix%2D%2C%5DtextStart%5B%2CtextEnd%5D%5B%2C%2Dsuffix%5D.

## License

The extension's source code is licensed under the terms of the Apache 2.0 license.

This is not an official Google product.
By installing this item, you agree to the Google Terms of Service and Privacy Policy at
https://www.google.com/intl/en/policies/.
