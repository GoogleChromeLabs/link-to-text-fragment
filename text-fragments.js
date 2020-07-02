(() => {
  if ('fragmentDirective' in Location.prototype) {
    return;
  }
  const FRAGMENT_DIRECTIVES = ['text'];

  Location.prototype.fragmentDirective = {};

  const getFragmentDirectives = (hash) => {
    const fragmentDirectivesString = hash.replace(/#.*?:~:(.*?)/, '$1');
    if (!fragmentDirectivesString) {
      return;
    }
    const fragmentDirectivesParams = new URLSearchParams(
      fragmentDirectivesString,
    );
    const fragmentDirectives = {};
    FRAGMENT_DIRECTIVES.forEach((fragmentDirectiveType) => {
      if (fragmentDirectivesParams.has(fragmentDirectiveType)) {
        fragmentDirectives[
          fragmentDirectiveType
        ] = fragmentDirectivesParams.getAll(fragmentDirectiveType);
      }
    });
    return fragmentDirectives;
  };

  const parseFragmentDirectives = (fragmentDirectives) => {
    const parsedFragmentDirectives = {};
    for (const [
      fragmentDirectiveType,
      fragmentDirectivesOfType,
    ] of Object.entries(fragmentDirectives)) {
      if (fragmentDirectiveType === 'text') {
        parsedFragmentDirectives[
          fragmentDirectiveType
        ] = fragmentDirectivesOfType.map((fragmentDirectiveOfType) => {
          return parseTextFragmentDirective(fragmentDirectiveOfType);
        });
      }
    }
    return parsedFragmentDirectives;
  };

  const parseTextFragmentDirective = (textFragment) => {
    const TEXT_FRAGMENT = /^(?:(.+?)-,)?(?:(.+?))(?:,(.+?))?(?:,-(.+?))?$/;
    return {
      prefix: decodeURIComponent(textFragment.replace(TEXT_FRAGMENT, '$1')),
      textStart: decodeURIComponent(textFragment.replace(TEXT_FRAGMENT, '$2')),
      textEnd: decodeURIComponent(textFragment.replace(TEXT_FRAGMENT, '$3')),
      suffix: decodeURIComponent(textFragment.replace(TEXT_FRAGMENT, '$4')),
    };
  };

  const processFragmentDirectives = (parsedFragmentDirectives) => {
    const processedFragmentDirectives = {};
    for (const [
      fragmentDirectiveType,
      fragmentDirectivesOfType,
    ] of Object.entries(parsedFragmentDirectives)) {
      if (fragmentDirectiveType === 'text') {
        processedFragmentDirectives[
          fragmentDirectiveType
        ] = fragmentDirectivesOfType.map((fragmentDirectiveOfType) => {
          return processTextFragmentDirective(fragmentDirectiveOfType);
        });
      }
    }
    return processedFragmentDirectives;
  };

  const escapeRegExp = (s) => {
    return s.replace(/[\\^$.*+?()[\]{}|]/g, '\\$&');
  };

  const processTextFragmentDirective = (textFragment) => {
    const prefixNodes = findText(textFragment.prefix);
    const textStartNodes = findText(textFragment.textStart);
    const textEndNodes = findText(textFragment.textEnd);
    const suffixNodes = findText(textFragment.suffix);
    const scrollBehavior = {
      behavior: 'smooth',
      block: 'nearest',
      inline: 'nearest',
    };
    if (
      !prefixNodes.length &&
      !suffixNodes.length &&
      textStartNodes.length === 1 &&
      textStartNodes[0].parentNode
    ) {
      // Only `textStart`
      if (!textEndNodes.length) {
        const textStartNode = textStartNodes[0].parentNode;
        const adjacentHTML = textStartNodes[0].textContent.replace(
          new RegExp(
            `(^.*?)(${escapeRegExp(textFragment.textStart)})(.*?$)`,
            'm',
          ),
          '$1<mark>$2</mark>$3',
        );
        textStartNode.textContent = '';
        textStartNode.insertAdjacentHTML('afterbegin', adjacentHTML);
        textStartNode.scrollIntoView(scrollBehavior);
        // Only `textStart` and `textEnd`
      } else if (textEndNodes.length === 1 && textEndNodes[0].parentNode) {
        // If `textStart` and `textEnd` are in the same node
        if (textEndNodes[0].parentNode === textStartNodes[0].parentNode) {
          const textStartNode = textStartNodes[0].parentNode;
          const adjacentHTML = textStartNodes[0].textContent.replace(
            new RegExp(
              `(^.*?)(${escapeRegExp(textFragment.textStart)})(.*?)(${
                textFragment.textEnd
              })(.*?$)`,
              'm',
            ),
            '$1<mark>$2$3$4</mark>$5',
          );
          textStartNode.textContent = '';
          textStartNode.insertAdjacentHTML('afterbegin', adjacentHTML);
          textStartNode.scrollIntoView(scrollBehavior);
          // If `textStart` and `textEnd` are in different nodes
        } else {
        }
      }
    }
    if (prefixNodes.length) {
    }
  };

  const findText = (text) => {
    if (!text) {
      return [];
    }
    const body = document.body;
    const treeWalker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => {
        if (node.textContent.includes(text)) {
          return NodeFilter.FILTER_ACCEPT;
        }
      },
    });

    const nodeList = [];
    let currentNode = treeWalker.currentNode;
    while (currentNode) {
      nodeList.push(currentNode);
      currentNode = treeWalker.nextNode();
    }
    return nodeList.slice(1);
  };

  const init = () => {
    const hash = document.location.hash;
    if (!hash) {
      return;
    }
    const fragmentDirectives = getFragmentDirectives(hash);
    const parsedFragmentDirectives = parseFragmentDirectives(fragmentDirectives);
    const processedFragmentDirectives = processFragmentDirectives(
      parsedFragmentDirectives,
    );
  };

  init();
})();
