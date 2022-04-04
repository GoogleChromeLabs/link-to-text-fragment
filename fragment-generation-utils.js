"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.setTimeout = exports.isValidRangeForFragmentGeneration = exports.generateFragment = exports.forTesting = exports.GenerateFragmentStatus = void 0;

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
// Block elements. elements of a text fragment cannot cross the boundaries of a
// block element. Source for the list:
// https://developer.mozilla.org/en-US/docs/Web/HTML/Block-level_elements#Elements
const BLOCK_ELEMENTS = ['ADDRESS', 'ARTICLE', 'ASIDE', 'BLOCKQUOTE', 'BR', 'DETAILS', 'DIALOG', 'DD', 'DIV', 'DL', 'DT', 'FIELDSET', 'FIGCAPTION', 'FIGURE', 'FOOTER', 'FORM', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'HEADER', 'HGROUP', 'HR', 'LI', 'MAIN', 'NAV', 'OL', 'P', 'PRE', 'SECTION', 'TABLE', 'UL', 'TR', 'TH', 'TD', 'COLGROUP', 'COL', 'CAPTION', 'THEAD', 'TBODY', 'TFOOT']; // Characters that indicate a word boundary. Use the script
// tools/generate-boundary-regex.js if it's necessary to modify or regenerate
// this. Because it's a hefty regex, this should be used infrequently and only
// on single-character strings.

const BOUNDARY_CHARS = /[\t-\r -#%-\*,-\/:;\?@\[-\]_\{\}\x85\xA0\xA1\xA7\xAB\xB6\xB7\xBB\xBF\u037E\u0387\u055A-\u055F\u0589\u058A\u05BE\u05C0\u05C3\u05C6\u05F3\u05F4\u0609\u060A\u060C\u060D\u061B\u061E\u061F\u066A-\u066D\u06D4\u0700-\u070D\u07F7-\u07F9\u0830-\u083E\u085E\u0964\u0965\u0970\u0AF0\u0DF4\u0E4F\u0E5A\u0E5B\u0F04-\u0F12\u0F14\u0F3A-\u0F3D\u0F85\u0FD0-\u0FD4\u0FD9\u0FDA\u104A-\u104F\u10FB\u1360-\u1368\u1400\u166D\u166E\u1680\u169B\u169C\u16EB-\u16ED\u1735\u1736\u17D4-\u17D6\u17D8-\u17DA\u1800-\u180A\u1944\u1945\u1A1E\u1A1F\u1AA0-\u1AA6\u1AA8-\u1AAD\u1B5A-\u1B60\u1BFC-\u1BFF\u1C3B-\u1C3F\u1C7E\u1C7F\u1CC0-\u1CC7\u1CD3\u2000-\u200A\u2010-\u2029\u202F-\u2043\u2045-\u2051\u2053-\u205F\u207D\u207E\u208D\u208E\u2308-\u230B\u2329\u232A\u2768-\u2775\u27C5\u27C6\u27E6-\u27EF\u2983-\u2998\u29D8-\u29DB\u29FC\u29FD\u2CF9-\u2CFC\u2CFE\u2CFF\u2D70\u2E00-\u2E2E\u2E30-\u2E44\u3000-\u3003\u3008-\u3011\u3014-\u301F\u3030\u303D\u30A0\u30FB\uA4FE\uA4FF\uA60D-\uA60F\uA673\uA67E\uA6F2-\uA6F7\uA874-\uA877\uA8CE\uA8CF\uA8F8-\uA8FA\uA8FC\uA92E\uA92F\uA95F\uA9C1-\uA9CD\uA9DE\uA9DF\uAA5C-\uAA5F\uAADE\uAADF\uAAF0\uAAF1\uABEB\uFD3E\uFD3F\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE61\uFE63\uFE68\uFE6A\uFE6B\uFF01-\uFF03\uFF05-\uFF0A\uFF0C-\uFF0F\uFF1A\uFF1B\uFF1F\uFF20\uFF3B-\uFF3D\uFF3F\uFF5B\uFF5D\uFF5F-\uFF65]|\uD800[\uDD00-\uDD02\uDF9F\uDFD0]|\uD801\uDD6F|\uD802[\uDC57\uDD1F\uDD3F\uDE50-\uDE58\uDE7F\uDEF0-\uDEF6\uDF39-\uDF3F\uDF99-\uDF9C]|\uD804[\uDC47-\uDC4D\uDCBB\uDCBC\uDCBE-\uDCC1\uDD40-\uDD43\uDD74\uDD75\uDDC5-\uDDC9\uDDCD\uDDDB\uDDDD-\uDDDF\uDE38-\uDE3D\uDEA9]|\uD805[\uDC4B-\uDC4F\uDC5B\uDC5D\uDCC6\uDDC1-\uDDD7\uDE41-\uDE43\uDE60-\uDE6C\uDF3C-\uDF3E]|\uD807[\uDC41-\uDC45\uDC70\uDC71]|\uD809[\uDC70-\uDC74]|\uD81A[\uDE6E\uDE6F\uDEF5\uDF37-\uDF3B\uDF44]|\uD82F\uDC9F|\uD836[\uDE87-\uDE8B]|\uD83A[\uDD5E\uDD5F]/u; // The same thing, but with a ^.

const NON_BOUNDARY_CHARS = /[^\t-\r -#%-\*,-\/:;\?@\[-\]_\{\}\x85\xA0\xA1\xA7\xAB\xB6\xB7\xBB\xBF\u037E\u0387\u055A-\u055F\u0589\u058A\u05BE\u05C0\u05C3\u05C6\u05F3\u05F4\u0609\u060A\u060C\u060D\u061B\u061E\u061F\u066A-\u066D\u06D4\u0700-\u070D\u07F7-\u07F9\u0830-\u083E\u085E\u0964\u0965\u0970\u0AF0\u0DF4\u0E4F\u0E5A\u0E5B\u0F04-\u0F12\u0F14\u0F3A-\u0F3D\u0F85\u0FD0-\u0FD4\u0FD9\u0FDA\u104A-\u104F\u10FB\u1360-\u1368\u1400\u166D\u166E\u1680\u169B\u169C\u16EB-\u16ED\u1735\u1736\u17D4-\u17D6\u17D8-\u17DA\u1800-\u180A\u1944\u1945\u1A1E\u1A1F\u1AA0-\u1AA6\u1AA8-\u1AAD\u1B5A-\u1B60\u1BFC-\u1BFF\u1C3B-\u1C3F\u1C7E\u1C7F\u1CC0-\u1CC7\u1CD3\u2000-\u200A\u2010-\u2029\u202F-\u2043\u2045-\u2051\u2053-\u205F\u207D\u207E\u208D\u208E\u2308-\u230B\u2329\u232A\u2768-\u2775\u27C5\u27C6\u27E6-\u27EF\u2983-\u2998\u29D8-\u29DB\u29FC\u29FD\u2CF9-\u2CFC\u2CFE\u2CFF\u2D70\u2E00-\u2E2E\u2E30-\u2E44\u3000-\u3003\u3008-\u3011\u3014-\u301F\u3030\u303D\u30A0\u30FB\uA4FE\uA4FF\uA60D-\uA60F\uA673\uA67E\uA6F2-\uA6F7\uA874-\uA877\uA8CE\uA8CF\uA8F8-\uA8FA\uA8FC\uA92E\uA92F\uA95F\uA9C1-\uA9CD\uA9DE\uA9DF\uAA5C-\uAA5F\uAADE\uAADF\uAAF0\uAAF1\uABEB\uFD3E\uFD3F\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE61\uFE63\uFE68\uFE6A\uFE6B\uFF01-\uFF03\uFF05-\uFF0A\uFF0C-\uFF0F\uFF1A\uFF1B\uFF1F\uFF20\uFF3B-\uFF3D\uFF3F\uFF5B\uFF5D\uFF5F-\uFF65]|\uD800[\uDD00-\uDD02\uDF9F\uDFD0]|\uD801\uDD6F|\uD802[\uDC57\uDD1F\uDD3F\uDE50-\uDE58\uDE7F\uDEF0-\uDEF6\uDF39-\uDF3F\uDF99-\uDF9C]|\uD804[\uDC47-\uDC4D\uDCBB\uDCBC\uDCBE-\uDCC1\uDD40-\uDD43\uDD74\uDD75\uDDC5-\uDDC9\uDDCD\uDDDB\uDDDD-\uDDDF\uDE38-\uDE3D\uDEA9]|\uD805[\uDC4B-\uDC4F\uDC5B\uDC5D\uDCC6\uDDC1-\uDDD7\uDE41-\uDE43\uDE60-\uDE6C\uDF3C-\uDF3E]|\uD807[\uDC41-\uDC45\uDC70\uDC71]|\uD809[\uDC70-\uDC74]|\uD81A[\uDE6E\uDE6F\uDEF5\uDF37-\uDF3B\uDF44]|\uD82F\uDC9F|\uD836[\uDE87-\uDE8B]|\uD83A[\uDD5E\uDD5F]/u;
/**
 * Searches the document for a given text fragment.
 *
 * @param {TextFragment} textFragment - Text Fragment to highlight.
 * @return {Ranges[]} - Zero or more ranges within the document corresponding
 *     to the fragment. If the fragment corresponds to more than one location
 *     in the document (i.e., is ambiguous) then the first two matches will be
 *     returned (regardless of how many more matches there may be in the
 *     document).
 */

const processTextFragmentDirective = textFragment => {
  const results = [];
  const searchRange = document.createRange();
  searchRange.selectNodeContents(document.body);

  while (!searchRange.collapsed && results.length < 2) {
    let potentialMatch;

    if (textFragment.prefix) {
      const prefixMatch = findTextInRange(textFragment.prefix, searchRange);

      if (prefixMatch == null) {
        break;
      } // Future iterations, if necessary, should start after the first character
      // of the prefix match.


      advanceRangeStartPastOffset(searchRange, prefixMatch.startContainer, prefixMatch.startOffset); // The search space for textStart is everything after the prefix and
      // before the end of the top-level search range, starting at the next non-
      // whitespace position.

      const matchRange = document.createRange();
      matchRange.setStart(prefixMatch.endContainer, prefixMatch.endOffset);
      matchRange.setEnd(searchRange.endContainer, searchRange.endOffset);
      advanceRangeStartToNonWhitespace(matchRange);

      if (matchRange.collapsed) {
        break;
      }

      potentialMatch = findTextInRange(textFragment.textStart, matchRange); // If textStart wasn't found anywhere in the matchRange, then there's no
      // possible match and we can stop early.

      if (potentialMatch == null) {
        break;
      } // If potentialMatch is immediately after the prefix (i.e., its start
      // equals matchRange's start), this is a candidate and we should keep
      // going with this iteration. Otherwise, we'll need to find the next
      // instance (if any) of the prefix.


      if (potentialMatch.compareBoundaryPoints(Range.START_TO_START, matchRange) !== 0) {
        continue;
      }
    } else {
      // With no prefix, just look directly for textStart.
      potentialMatch = findTextInRange(textFragment.textStart, searchRange);

      if (potentialMatch == null) {
        break;
      }

      advanceRangeStartPastOffset(searchRange, potentialMatch.startContainer, potentialMatch.startOffset);
    }

    if (textFragment.textEnd) {
      const textEndRange = document.createRange();
      textEndRange.setStart(potentialMatch.endContainer, potentialMatch.endOffset);
      textEndRange.setEnd(searchRange.endContainer, searchRange.endOffset); // Keep track of matches of the end term followed by suffix term
      // (if needed).
      // If no matches are found then there's no point in keeping looking for
      // matches of the start term after the current start term occurrence.

      let matchFound = false; // Search through the rest of the document to find a textEnd match. This
      // may take multiple iterations if a suffix needs to be found.

      while (!textEndRange.collapsed && results.length < 2) {
        const textEndMatch = findTextInRange(textFragment.textEnd, textEndRange);

        if (textEndMatch == null) {
          break;
        }

        advanceRangeStartPastOffset(textEndRange, textEndMatch.startContainer, textEndMatch.startOffset);
        potentialMatch.setEnd(textEndMatch.endContainer, textEndMatch.endOffset);

        if (textFragment.suffix) {
          // If there's supposed to be a suffix, check if it appears after the
          // textEnd we just found.
          const suffixResult = checkSuffix(textFragment.suffix, potentialMatch, searchRange);

          if (suffixResult === CheckSuffixResult.NO_SUFFIX_MATCH) {
            break;
          } else if (suffixResult === CheckSuffixResult.SUFFIX_MATCH) {
            matchFound = true;
            results.push(potentialMatch.cloneRange());
            continue;
          } else if (suffixResult === CheckSuffixResult.MISPLACED_SUFFIX) {
            continue;
          }
        } else {
          // If we've found textEnd and there's no suffix, then it's a match!
          matchFound = true;
          results.push(potentialMatch.cloneRange());
        }
      } // Stopping match search because suffix or textEnd are missing from the
      // rest of the search space.


      if (!matchFound) {
        break;
      }
    } else if (textFragment.suffix) {
      // If there's no textEnd but there is a suffix, search for the suffix
      // after potentialMatch
      const suffixResult = checkSuffix(textFragment.suffix, potentialMatch, searchRange);

      if (suffixResult === CheckSuffixResult.NO_SUFFIX_MATCH) {
        break;
      } else if (suffixResult === CheckSuffixResult.SUFFIX_MATCH) {
        results.push(potentialMatch.cloneRange());
        advanceRangeStartPastOffset(searchRange, searchRange.startContainer, searchRange.startOffset);
        continue;
      } else if (suffixResult === CheckSuffixResult.MISPLACED_SUFFIX) {
        continue;
      }
    } else {
      results.push(potentialMatch.cloneRange());
    }
  }

  return results;
};
/**
 * Enum indicating the result of the checkSuffix function.
 */


const CheckSuffixResult = {
  NO_SUFFIX_MATCH: 0,
  // Suffix wasn't found at all. Search should halt.
  SUFFIX_MATCH: 1,
  // The suffix matches the expectation.
  MISPLACED_SUFFIX: 2 // The suffix was found, but not in the right place.

};
/**
 * Checks to see if potentialMatch satisfies the suffix conditions of this
 * Text Fragment.
 * @param {String} suffix - the suffix text to find
 * @param {Range} potentialMatch - the Range containing the match text.
 * @param {Range} searchRange - the Range in which to search for |suffix|.
 *     Regardless of the start boundary of this Range, nothing appearing before
 *     |potentialMatch| will be considered.
 * @return {CheckSuffixResult} - enum value indicating that potentialMatch
 *     should be accepted, that the search should continue, or that the search
 *     should halt.
 */

const checkSuffix = (suffix, potentialMatch, searchRange) => {
  const suffixRange = document.createRange();
  suffixRange.setStart(potentialMatch.endContainer, potentialMatch.endOffset);
  suffixRange.setEnd(searchRange.endContainer, searchRange.endOffset);
  advanceRangeStartToNonWhitespace(suffixRange);
  const suffixMatch = findTextInRange(suffix, suffixRange); // If suffix wasn't found anywhere in the suffixRange, then there's no
  // possible match and we can stop early.

  if (suffixMatch == null) {
    return CheckSuffixResult.NO_SUFFIX_MATCH;
  } // If suffixMatch is immediately after potentialMatch (i.e., its start
  // equals suffixRange's start), this is a match. If not, we have to
  // start over from the beginning.


  if (suffixMatch.compareBoundaryPoints(Range.START_TO_START, suffixRange) !== 0) {
    return CheckSuffixResult.MISPLACED_SUFFIX;
  }

  return CheckSuffixResult.SUFFIX_MATCH;
};
/**
 * Sets the start of |range| to be the first boundary point after |offset| in
 * |node|--either at offset+1, or after the node.
 * @param {Range} range - the range to mutate
 * @param {Node} node - the node used to determine the new range start
 * @param {Number} offset - the offset immediately before the desired new
 *     boundary point
 */


const advanceRangeStartPastOffset = (range, node, offset) => {
  try {
    range.setStart(node, offset + 1);
  } catch (err) {
    range.setStartAfter(node);
  }
};
/**
 * Modifies |range| to start at the next non-whitespace position.
 * @param {Range} range - the range to mutate
 */


const advanceRangeStartToNonWhitespace = range => {
  const walker = makeTextNodeWalker(range);
  let node = walker.nextNode();

  while (!range.collapsed && node != null) {
    if (node !== range.startContainer) {
      range.setStart(node, 0);
    }

    if (node.textContent.length > range.startOffset) {
      const firstChar = node.textContent[range.startOffset];

      if (!firstChar.match(/\s/)) {
        return;
      }
    }

    try {
      range.setStart(node, range.startOffset + 1);
    } catch (err) {
      node = walker.nextNode();

      if (node == null) {
        range.collapse();
      } else {
        range.setStart(node, 0);
      }
    }
  }
};
/**
 * Creates a TreeWalker that traverses a range and emits visible text nodes in
 * the range.
 * @param {Range} range - Range to be traversed by the walker
 * @return {TreeWalker}
 */


const makeTextNodeWalker = range => {
  const walker = document.createTreeWalker(range.commonAncestorContainer, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, node => {
    return acceptTextNodeIfVisibleInRange(node, range);
  });
  return walker;
};
/**
 * Helper function to calculate the visibility of a Node based on its CSS
 * computed style. This function does not take into account the visibility of
 * the node's ancestors so even if the node is visible according to its style
 * it might not be visible on the page if one of its ancestors is not visible.
 * @param {Node} node - the Node to evaluate
 * @return {Boolean} - true if the node is visible. A node will be visible if
 * its computed style meets all of the following criteria:
 *  - non zero height, width, height and opacity
 *  - visibility not hidden
 *  - display not none
 */


const isNodeVisible = node => {
  // Find an HTMLElement (this node or an ancestor) so we can check
  // visibility.
  let elt = node;

  while (elt != null && !(elt instanceof HTMLElement)) elt = elt.parentNode;

  if (elt != null) {
    const nodeStyle = window.getComputedStyle(elt); // If the node is not rendered, just skip it.

    if (nodeStyle.visibility === 'hidden' || nodeStyle.display === 'none' || nodeStyle.height === 0 || nodeStyle.width === 0 || nodeStyle.opacity === 0) {
      return false;
    }
  }

  return true;
};
/**
 * Filter function for use with TreeWalkers. Rejects nodes that aren't in the
 * given range or aren't visible.
 * @param {Node} node - the Node to evaluate
 * @param {Range|Undefined} range - the range in which node must fall. Optional;
 *     if null, the range check is skipped.
 * @return {NodeFilter} - FILTER_ACCEPT or FILTER_REJECT, to be passed along to
 *     a TreeWalker.
 */


const acceptNodeIfVisibleInRange = (node, range) => {
  if (range != null && !range.intersectsNode(node)) return NodeFilter.FILTER_REJECT;
  return isNodeVisible(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
};
/**
 * Filter function for use with TreeWalkers. Accepts only visible text nodes
 * that are in the given range. Other types of nodes visible in the given range
 * are skipped so a TreeWalker using this filter function still visits text
 * nodes in the node's subtree.
 * @param {Node} node - the Node to evaluate
 * @param {Range} range - the range in which node must fall. Optional;
 *     if null, the range check is skipped/
 * @return {NodeFilter} - NodeFilter value to be passed along to a TreeWalker.
 * Values returned:
 *  - FILTER_REJECT: Node not in range or not visible.
 *  - FILTER_SKIP: Non Text Node visible and in range
 *  - FILTER_ACCEPT: Text Node visible and in range
 */


const acceptTextNodeIfVisibleInRange = (node, range) => {
  if (range != null && !range.intersectsNode(node)) return NodeFilter.FILTER_REJECT;

  if (!isNodeVisible(node)) {
    return NodeFilter.FILTER_REJECT;
  }

  return node.nodeType === Node.TEXT_NODE ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
};
/**
 * Extracts all the text nodes within the given range.
 * @param {Node} root - the root node in which to search
 * @param {Range} range - a range restricting the scope of extraction
 * @return {Array<String[]>} - a list of lists of text nodes, in document order.
 *     Lists represent block boundaries; i.e., two nodes appear in the same list
 *     iff there are no block element starts or ends in between them.
 */


const getAllTextNodes = (root, range) => {
  const blocks = [];
  let tmp = [];
  const nodes = Array.from(getElementsIn(root, node => {
    return acceptNodeIfVisibleInRange(node, range);
  }));

  for (const node of nodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      tmp.push(node);
    } else if (node instanceof HTMLElement && BLOCK_ELEMENTS.includes(node.tagName) && tmp.length > 0) {
      // If this is a block element, the current set of text nodes in |tmp| is
      // complete, and we need to move on to a new one.
      blocks.push(tmp);
      tmp = [];
    }
  }

  if (tmp.length > 0) blocks.push(tmp);
  return blocks;
};
/**
 * Returns the textContent of all the textNodes and normalizes strings by
 * replacing duplicated spaces with single space.
 * @param {Node[]} nodes - TextNodes to get the textContent from.
 * @param {Number} startOffset - Where to start in the first TextNode.
 * @param {Number|undefined} endOffset Where to end in the last TextNode.
 * @return {string} Entire text content of all the nodes, with spaces
 *     normalized.
 */


const getTextContent = (nodes, startOffset, endOffset) => {
  let str = '';

  if (nodes.length === 1) {
    str = nodes[0].textContent.substring(startOffset, endOffset);
  } else {
    str = nodes[0].textContent.substring(startOffset) + nodes.slice(1, -1).reduce((s, n) => s + n.textContent, '') + nodes.slice(-1)[0].textContent.substring(0, endOffset);
  }

  return str.replace(/[\t\n\r ]+/g, ' ');
};
/**
 * @callback ElementFilterFunction
 * @param {HTMLElement} element - Node to accept, reject or skip.
 * @returns {number} Either NodeFilter.FILTER_ACCEPT, NodeFilter.FILTER_REJECT
 *     or NodeFilter.FILTER_SKIP.
 */

/**
 * Returns all nodes inside root using the provided filter.
 * @generator
 * @param {Node} root - Node where to start the TreeWalker.
 * @param {ElementFilterFunction} filter - Filter provided to the TreeWalker's
 *     acceptNode filter.
 * @yield {HTMLElement} All elements that were accepted by filter.
 */


function* getElementsIn(root, filter) {
  const treeWalker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
    acceptNode: filter
  });
  const finishedSubtrees = new Set();

  while (forwardTraverse(treeWalker, finishedSubtrees) !== null) {
    yield treeWalker.currentNode;
  }
}
/**
 * Returns a range pointing to the first instance of |query| within |range|.
 * @param {String} query - the string to find
 * @param {Range} range - the range in which to search
 * @return {Range|Undefined} - The first found instance of |query| within
 *     |range|.
 */


const findTextInRange = (query, range) => {
  const textNodeLists = getAllTextNodes(range.commonAncestorContainer, range);
  const segmenter = makeNewSegmenter();

  for (const list of textNodeLists) {
    const found = findRangeFromNodeList(query, range, list, segmenter);
    if (found !== undefined) return found;
  }

  return undefined;
};
/**
 * Finds a range pointing to the first instance of |query| within |range|,
 * searching over the text contained in a list |nodeList| of relevant textNodes.
 * @param {String} query - the string to find
 * @param {Range} range - the range in which to search
 * @param {Node[]} textNodes - the visible text nodes within |range|
 * @param {Intl.Segmenter} [segmenter] - a segmenter to be used for finding word
 *     boundaries, if supported
 * @return {Range} - the found range, or undefined if no such range could be
 *     found
 */


const findRangeFromNodeList = (query, range, textNodes, segmenter) => {
  if (!query || !range || !(textNodes || []).length) return undefined;
  const data = normalizeString(getTextContent(textNodes, 0, undefined));
  const normalizedQuery = normalizeString(query);
  let searchStart = textNodes[0] === range.startNode ? range.startOffset : 0;
  let start;
  let end;

  while (searchStart < data.length) {
    const matchIndex = data.indexOf(normalizedQuery, searchStart);
    if (matchIndex === -1) return undefined;

    if (isWordBounded(data, matchIndex, normalizedQuery.length, segmenter)) {
      start = getBoundaryPointAtIndex(matchIndex, textNodes,
      /* isEnd=*/
      false);
      end = getBoundaryPointAtIndex(matchIndex + normalizedQuery.length, textNodes,
      /* isEnd=*/
      true);
    }

    if (start != null && end != null) {
      const foundRange = document.createRange();
      foundRange.setStart(start.node, start.offset);
      foundRange.setEnd(end.node, end.offset); // Verify that |foundRange| is a subrange of |range|

      if (range.compareBoundaryPoints(Range.START_TO_START, foundRange) <= 0 && range.compareBoundaryPoints(Range.END_TO_END, foundRange) >= 0) {
        return foundRange;
      }
    }

    searchStart = matchIndex + 1;
  }

  return undefined;
};
/**
 * Provides the data needed for calling setStart/setEnd on a Range.
 * @typedef {Object} BoundaryPoint
 * @property {Node} node
 * @property {Number} offset
 */

/**
 * Generates a boundary point pointing to the given text position.
 * @param {Number} index - the text offset indicating the start/end of a
 *     substring of the concatenated, normalized text in |textNodes|
 * @param {Node[]} textNodes - the text Nodes whose contents make up the search
 *     space
 * @param {bool} isEnd - indicates whether the offset is the start or end of the
 *     substring
 * @return {BoundaryPoint} - a boundary point suitable for setting as the start
 *     or end of a Range, or undefined if it couldn't be computed.
 */


const getBoundaryPointAtIndex = (index, textNodes, isEnd) => {
  let counted = 0;
  let normalizedData;

  for (let i = 0; i < textNodes.length; i++) {
    const node = textNodes[i];
    if (!normalizedData) normalizedData = normalizeString(node.data);
    let nodeEnd = counted + normalizedData.length;
    if (isEnd) nodeEnd += 1;

    if (nodeEnd > index) {
      // |index| falls within this node, but we need to turn the offset in the
      // normalized data into an offset in the real node data.
      const normalizedOffset = index - counted;
      let denormalizedOffset = Math.min(index - counted, node.data.length); // Walk through the string until denormalizedOffset produces a substring
      // that corresponds to the target from the normalized data.

      const targetSubstring = isEnd ? normalizedData.substring(0, normalizedOffset) : normalizedData.substring(normalizedOffset);
      let candidateSubstring = isEnd ? normalizeString(node.data.substring(0, denormalizedOffset)) : normalizeString(node.data.substring(denormalizedOffset)); // We will either lengthen or shrink the candidate string to approach the
      // length of the target string. If we're looking for the start, adding 1
      // makes the candidate shorter; if we're looking for the end, it makes the
      // candidate longer.

      const direction = (isEnd ? -1 : 1) * (targetSubstring.length > candidateSubstring.length ? -1 : 1);

      while (denormalizedOffset >= 0 && denormalizedOffset <= node.data.length) {
        if (candidateSubstring.length === targetSubstring.length) {
          return {
            node: node,
            offset: denormalizedOffset
          };
        }

        denormalizedOffset += direction;
        candidateSubstring = isEnd ? normalizeString(node.data.substring(0, denormalizedOffset)) : normalizeString(node.data.substring(denormalizedOffset));
      }
    }

    counted += normalizedData.length;

    if (i + 1 < textNodes.length) {
      // Edge case: if this node ends with a whitespace character and the next
      // node starts with one, they'll be double-counted relative to the
      // normalized version. Subtract 1 from |counted| to compensate.
      const nextNormalizedData = normalizeString(textNodes[i + 1].data);

      if (normalizedData.slice(-1) === ' ' && nextNormalizedData.slice(0, 1) === ' ') {
        counted -= 1;
      } // Since we already normalized the next node's data, hold on to it for the
      // next iteration.


      normalizedData = nextNormalizedData;
    }
  }

  return undefined;
};
/**
 * Checks if a substring is word-bounded in the context of a longer string.
 *
 * If an Intl.Segmenter is provided for locale-specific segmenting, it will be
 * used for this check. This is the most desirable option, but not supported in
 * all browsers.
 *
 * If one is not provided, a heuristic will be applied,
 * returning true iff:
 *  - startPos == 0 OR char before start is a boundary char, AND
 *  - length indicates end of string OR char after end is a boundary char
 * Where boundary chars are whitespace/punctuation defined in the const above.
 * This causes the known issue that some languages, notably Japanese, only match
 * at the level of roughly a full clause or sentence, rather than a word.
 *
 * @param {String} text - the text to search
 * @param {Number} startPos - the index of the start of the substring
 * @param {Number} length - the length of the substring
 * @param {Intl.Segmenter} [segmenter] - a segmenter to be used for finding word
 *     boundaries, if supported
 * @return {bool} - true iff startPos and length point to a word-bounded
 *     substring of |text|.
 */


const isWordBounded = (text, startPos, length, segmenter) => {
  if (startPos < 0 || startPos >= text.length || length <= 0 || startPos + length > text.length) {
    return false;
  }

  if (segmenter) {
    // If the Intl.Segmenter API is available on this client, use it for more
    // reliable word boundary checking.
    const segments = segmenter.segment(text);
    const startSegment = segments.containing(startPos);
    if (!startSegment) return false; // If the start index is inside a word segment but not the first character
    // in that segment, it's not word-bounded. If it's not a word segment, then
    // it's punctuation, etc., so that counts for word bounding.

    if (startSegment.isWordLike && startSegment.index != startPos) return false; // |endPos| points to the first character outside the target substring.

    const endPos = startPos + length;
    const endSegment = segments.containing(endPos); // If there's no end segment found, it's because we're at the end of the
    // text, which is a valid boundary. (Because of the preconditions we
    // checked above, we know we aren't out of range.)
    // If there's an end segment found but it's non-word-like, that's also OK,
    // since punctuation and whitespace are acceptable boundaries.
    // Lastly, if there's an end segment and it is word-like, then |endPos|
    // needs to point to the start of that new word, or |endSegment.index|.

    if (endSegment && endSegment.isWordLike && endSegment.index != endPos) return false;
  } else {
    // We don't have Intl.Segmenter support, so fall back to checking whether or
    // not the substring is flanked by boundary characters.
    // If the first character is already a boundary, move it once.
    if (text[startPos].match(BOUNDARY_CHARS)) {
      ++startPos;
      --length;

      if (!length) {
        return false;
      }
    } // If the last character is already a boundary, move it once.


    if (text[startPos + length - 1].match(BOUNDARY_CHARS)) {
      --length;

      if (!length) {
        return false;
      }
    }

    if (startPos !== 0 && !text[startPos - 1].match(BOUNDARY_CHARS)) return false;
    if (startPos + length !== text.length && !text[startPos + length].match(BOUNDARY_CHARS)) return false;
  }

  return true;
};
/**
 * @param {String} str - a string to be normalized
 * @return {String} - a normalized version of |str| with all consecutive
 *     whitespace chars converted to a single ' ' and all diacriticals removed
 *     (e.g., 'é' -> 'e').
 */


const normalizeString = str => {
  // First, decompose any characters with diacriticals. Then, turn all
  // consecutive whitespace characters into a standard " ", and strip out
  // anything in the Unicode U+0300..U+036F (Combining Diacritical Marks) range.
  // This may change the length of the string.
  return (str || '').normalize('NFKD').replace(/\s+/g, ' ').replace(/[\u0300-\u036f]/g, '').toLowerCase();
};
/**
 * @return {Intl.Segmenter|undefined} - a segmenter object suitable for finding
 *     word boundaries. Returns undefined on browsers/platforms that do not yet
 *     support the Intl.Segmenter API.
 */


const makeNewSegmenter = () => {
  if (Intl.Segmenter) {
    let lang = document.documentElement.lang;

    if (!lang) {
      lang = navigator.languages;
    }

    return new Intl.Segmenter(lang, {
      granularity: 'word'
    });
  }

  return undefined;
};
/**
 * Performs traversal on a TreeWalker, visiting each subtree in document order.
 * When visiting a subtree not already visited (its root not in finishedSubtrees
 * ), first the root is emitted then the subtree is traversed, then the root is
 * emitted again and then the next subtree in document order is visited.
 *
 * Subtree's roots are emitted twice to signal the beginning and ending of
 * element nodes. This is useful for ensuring the ends of block boundaries are
 * found.
 * @param {TreeWalker} walker - the TreeWalker to be traversed
 * @param {Set} finishedSubtrees - set of subtree roots already visited
 * @return {Node} - next node in the traversal
 */


const forwardTraverse = (walker, finishedSubtrees) => {
  // If current node's subtree is not already finished
  // try to go first down the subtree.
  if (!finishedSubtrees.has(walker.currentNode)) {
    const firstChild = walker.firstChild();

    if (firstChild !== null) {
      return firstChild;
    }
  } // If no subtree go to next sibling if any.


  const nextSibling = walker.nextSibling();

  if (nextSibling !== null) {
    return nextSibling;
  } // If no sibling go back to parent and mark it as finished.


  const parent = walker.parentNode();

  if (parent !== null) {
    finishedSubtrees.add(parent);
  }

  return parent;
};
/**
 * Performs backwards traversal on a TreeWalker, visiting each subtree in
 * backwards document order. When visiting a subtree not already visited (its
 * root not in finishedSubtrees ), first the root is emitted then the subtree is
 * backward traversed, then the root is emitted again and then the previous
 * subtree in document order is visited.
 *
 * Subtree's roots are emitted twice to signal the beginning and ending of
 * element nodes. This is useful for ensuring  block boundaries are found.
 * @param {TreeWalker} walker - the TreeWalker to be traversed
 * @param {Set} finishedSubtrees - set of subtree roots already visited
 * @return {Node} - next node in the backwards traversal
 */


const backwardTraverse = (walker, finishedSubtrees) => {
  // If current node's subtree is not already finished
  // try to go first down the subtree.
  if (!finishedSubtrees.has(walker.currentNode)) {
    const lastChild = walker.lastChild();

    if (lastChild !== null) {
      return lastChild;
    }
  } // If no subtree go to previous sibling if any.


  const previousSibling = walker.previousSibling();

  if (previousSibling !== null) {
    return previousSibling;
  } // If no sibling go back to parent and mark it as finished.


  const parent = walker.parentNode();

  if (parent !== null) {
    finishedSubtrees.add(parent);
  }

  return parent;
};
/**
 * Should only be used by other files in this directory.
 */


const internal = {
  BLOCK_ELEMENTS: BLOCK_ELEMENTS,
  BOUNDARY_CHARS: BOUNDARY_CHARS,
  NON_BOUNDARY_CHARS: NON_BOUNDARY_CHARS,
  acceptNodeIfVisibleInRange: acceptNodeIfVisibleInRange,
  normalizeString: normalizeString,
  makeNewSegmenter: makeNewSegmenter,
  forwardTraverse: forwardTraverse,
  backwardTraverse: backwardTraverse,
  makeTextNodeWalker: makeTextNodeWalker,
  isNodeVisible: isNodeVisible
}; // Allow importing module from closure-compiler projects that haven't migrated
// to ES6 modules.

if (typeof goog !== 'undefined') {
  // clang-format off
  goog.declareModuleId('googleChromeLabs.textFragmentPolyfill.textFragmentUtils'); // clang-format on
}
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


const MAX_EXACT_MATCH_LENGTH = 300;
const MIN_LENGTH_WITHOUT_CONTEXT = 20;
const ITERATIONS_BEFORE_ADDING_CONTEXT = 1;
const WORDS_TO_ADD_FIRST_ITERATION = 3;
const WORDS_TO_ADD_SUBSEQUENT_ITERATIONS = 1;
const TRUNCATE_RANGE_CHECK_CHARS = 10000;
const MAX_DEPTH = 500; // Desired max run time, in ms. Can be overwritten.

let timeoutDurationMs = 500;
let t0; // Start timestamp for fragment generation

/**
 * Allows overriding the max runtime to specify a different interval. Fragment
 * generation will halt and throw an error after this amount of time.
 * @param {Number} newTimeoutDurationMs - the desired timeout length, in ms.
 */

const setTimeout = newTimeoutDurationMs => {
  timeoutDurationMs = newTimeoutDurationMs;
};
/**
 * Enum indicating the success, or failure reason, of generateFragment.
 */


exports.setTimeout = setTimeout;
const GenerateFragmentStatus = {
  SUCCESS: 0,
  // A fragment was generated.
  INVALID_SELECTION: 1,
  // The selection provided could not be used.
  AMBIGUOUS: 2,
  // No unique fragment could be identified for this selection.
  TIMEOUT: 3,
  // Computation could not complete in time.
  EXECUTION_FAILED: 4 // An exception was raised during generation.

};
/**
 * @typedef {Object} GenerateFragmentResult
 * @property {GenerateFragmentStatus} status
 * @property {TextFragment} [fragment]
 */

/**
 * Attempts to generate a fragment, suitable for formatting and including in a
 * URL, which will highlight the given selection upon opening.
 * @param {Selection} selection - a Selection object, the result of
 *     window.getSelection
 * @param {Date} [startTime] - the time when generation began, for timeout
 *     purposes. Defaults to current timestamp.
 * @return {GenerateFragmentResult}
 */

exports.GenerateFragmentStatus = GenerateFragmentStatus;

const generateFragment = (selection, startTime = Date.now()) => {
  try {
    return doGenerateFragment(selection, startTime);
  } catch (err) {
    if (err.isTimeout) {
      return {
        status: GenerateFragmentStatus.TIMEOUT
      };
    } else {
      return {
        status: GenerateFragmentStatus.EXECUTION_FAILED
      };
    }
  }
};
/**
 * Checks whether fragment generation can be attempted for a given range. This
 * checks a handful of simple conditions: the range must be nonempty, not inside
 * an <input>, etc. A true return is not a guarantee that fragment generation
 * will succeed; instead, this is a way to quickly rule out generation in cases
 * where a failure is predictable.
 * @param {Range} range
 * @return {boolean} - true if fragment generation may proceed; false otherwise.
 */


exports.generateFragment = generateFragment;

const isValidRangeForFragmentGeneration = range => {
  // Check that the range isn't just punctuation and whitespace. Only check the
  // first |TRUNCATE_RANGE_CHECK_CHARS| to put an upper bound on runtime; ranges
  // that start with (e.g.) thousands of periods should be rare.
  // This also implicitly ensures the selection isn't in an input or textarea
  // field, as document.selection contains an empty range in these cases.
  if (!range.toString().substring(0, TRUNCATE_RANGE_CHECK_CHARS).match(internal.NON_BOUNDARY_CHARS)) {
    return false;
  } // Check for iframe


  try {
    if (range.startContainer.ownerDocument.defaultView !== window.top) {
      return false;
    }
  } catch {
    // If accessing window.top throws an error, this is in a cross-origin
    // iframe.
    return false;
  } // Walk up the DOM to ensure that the range isn't inside an editable. Limit
  // the search depth to |MAX_DEPTH| to constrain runtime.


  let node = range.commonAncestorContainer;
  let numIterations = 0;

  while (node) {
    if (node.nodeType == Node.ELEMENT_NODE) {
      if (['TEXTAREA', 'INPUT'].includes(node.tagName)) {
        return false;
      }

      const editable = node.attributes.getNamedItem('contenteditable');

      if (editable && editable.value !== 'false') {
        return false;
      } // Cap the number of iterations at |MAX_PRECONDITION_DEPTH| to put an
      // upper bound on runtime.


      numIterations++;

      if (numIterations >= MAX_DEPTH) {
        return false;
      }
    }

    node = node.parentNode;
  }

  return true;
};
/* eslint-disable valid-jsdoc */

/**
 * @see {@link generateFragment} - this method wraps the error-throwing portions
 *     of that method.
 * @throws {Error} - Will throw if computation takes longer than the accepted
 *     timeout length.
 */


exports.isValidRangeForFragmentGeneration = isValidRangeForFragmentGeneration;

const doGenerateFragment = (selection, startTime) => {
  recordStartTime(startTime);
  let range;

  try {
    range = selection.getRangeAt(0);
  } catch {
    return {
      status: GenerateFragmentStatus.INVALID_SELECTION
    };
  }

  expandRangeStartToWordBound(range);
  expandRangeEndToWordBound(range); // Keep a copy of the range before we try to shrink it to make it start and
  // end in text nodes. We need to use the range edges as starting points
  // for context term building, so it makes sense to start from the original
  // edges instead of the edges after shrinking. This way we don't have to
  // traverse all the non-text nodes that are between the edges after shrinking
  // and the original ones.

  const rangeBeforeShrinking = range.cloneRange();
  moveRangeEdgesToTextNodes(range);

  if (range.collapsed) {
    return {
      status: GenerateFragmentStatus.INVALID_SELECTION
    };
  }

  let factory;

  if (canUseExactMatch(range)) {
    const exactText = internal.normalizeString(range.toString());
    const fragment = {
      textStart: exactText
    }; // If the exact text is long enough to be used on its own, try this and skip
    // the longer process below.

    if (exactText.length >= MIN_LENGTH_WITHOUT_CONTEXT && isUniquelyIdentifying(fragment)) {
      return {
        status: GenerateFragmentStatus.SUCCESS,
        fragment: fragment
      };
    }

    factory = new FragmentFactory().setExactTextMatch(exactText);
  } else {
    // We have to use textStart and textEnd to identify a range. First, break
    // the range up based on block boundaries, as textStart/textEnd can't cross
    // these.
    const startSearchSpace = getSearchSpaceForStart(range);
    const endSearchSpace = getSearchSpaceForEnd(range);

    if (startSearchSpace && endSearchSpace) {
      // If the search spaces are truthy, then there's a block boundary between
      // them.
      factory = new FragmentFactory().setStartAndEndSearchSpace(startSearchSpace, endSearchSpace);
    } else {
      // If the search space was empty/undefined, it's because no block boundary
      // was found. That means textStart and textEnd *share* a search space, so
      // our approach must ensure the substrings chosen as candidates don't
      // overlap.
      factory = new FragmentFactory().setSharedSearchSpace(range.toString().trim());
    }
  }

  const prefixRange = document.createRange();
  prefixRange.selectNodeContents(document.body);
  const suffixRange = prefixRange.cloneRange();
  prefixRange.setEnd(rangeBeforeShrinking.startContainer, rangeBeforeShrinking.startOffset);
  suffixRange.setStart(rangeBeforeShrinking.endContainer, rangeBeforeShrinking.endOffset);
  const prefixSearchSpace = getSearchSpaceForEnd(prefixRange);
  const suffixSearchSpace = getSearchSpaceForStart(suffixRange);

  if (prefixSearchSpace || suffixSearchSpace) {
    factory.setPrefixAndSuffixSearchSpace(prefixSearchSpace, suffixSearchSpace);
  }

  factory.useSegmenter(internal.makeNewSegmenter());
  let didEmbiggen = false;

  do {
    checkTimeout();
    didEmbiggen = factory.embiggen();
    const fragment = factory.tryToMakeUniqueFragment();

    if (fragment != null) {
      return {
        status: GenerateFragmentStatus.SUCCESS,
        fragment: fragment
      };
    }
  } while (didEmbiggen);

  return {
    status: GenerateFragmentStatus.AMBIGUOUS
  };
};
/**
 * @throws {Error} - if the timeout duration has been exceeded, an error will
 *     be thrown so that execution can be halted.
 */


const checkTimeout = () => {
  // disable check when no timeout duration specified
  if (timeoutDurationMs === null) {
    return;
  }

  const delta = Date.now() - t0;

  if (delta > timeoutDurationMs) {
    const timeoutError = new Error(`Fragment generation timed out after ${delta} ms.`);
    timeoutError.isTimeout = true;
    throw timeoutError;
  }
};
/**
 * Call at the start of fragment generation to set the baseline for timeout
 * checking.
 * @param {Date} newStartTime - the timestamp when fragment generation began
 */


const recordStartTime = newStartTime => {
  t0 = newStartTime;
};
/**
 * Finds the search space for parameters when using range or suffix match.
 * This is the text from the start of the range to the first block boundary,
 * trimmed to remove any leading/trailing whitespace characters.
 * @param {Range} range - the range which will be highlighted.
 * @return {String|Undefined} - the text which may be used for constructing a
 *     textStart parameter identifying this range. Will return undefined if no
 *     block boundaries are found inside this range, or if all the candidate
 *     ranges were empty (or included only whitespace characters).
 */


const getSearchSpaceForStart = range => {
  let node = getFirstNodeForBlockSearch(range);
  const walker = makeWalkerForNode(node, range.endContainer);

  if (!walker) {
    return undefined;
  }

  const finishedSubtrees = new Set(); // If the range starts after the last child of an element node
  // don't visit its subtree because it's not included in the range.

  if (range.startContainer.nodeType === Node.ELEMENT_NODE && range.startOffset === range.startContainer.childNodes.length) {
    finishedSubtrees.add(range.startContainer);
  }

  const origin = node;
  const textAccumulator = new BlockTextAccumulator(range, true); // tempRange monitors whether we've exhausted our search space yet.

  const tempRange = range.cloneRange();

  while (!tempRange.collapsed && node != null) {
    checkTimeout(); // Depending on whether |node| is an ancestor of the start of our
    // search, we use either its leading or trailing edge as our start.

    if (node.contains(origin)) {
      tempRange.setStartAfter(node);
    } else {
      tempRange.setStartBefore(node);
    } // Add node to accumulator to keep track of text inside the current block
    // boundaries


    textAccumulator.appendNode(node); // If the accumulator found a non empty block boundary we've got our search
    // space.

    if (textAccumulator.textInBlock !== null) {
      return textAccumulator.textInBlock;
    }

    node = internal.forwardTraverse(walker, finishedSubtrees);
  }

  return undefined;
};
/**
 * Finds the search space for parameters when using range or prefix match.
 * This is the text from the last block boundary to the end of the range,
 * trimmed to remove any leading/trailing whitespace characters.
 * @param {Range} range - the range which will be highlighted.
 * @return {String|Undefined} - the text which may be used for constructing a
 *     textEnd parameter identifying this range. Will return undefined if no
 *     block boundaries are found inside this range, or if all the candidate
 *     ranges were empty (or included only whitespace characters).
 */


const getSearchSpaceForEnd = range => {
  let node = getLastNodeForBlockSearch(range);
  const walker = makeWalkerForNode(node, range.startContainer);

  if (!walker) {
    return undefined;
  }

  const finishedSubtrees = new Set(); // If the range ends before the first child of an element node
  // don't visit its subtree because it's not included in the range.

  if (range.endContainer.nodeType === Node.ELEMENT_NODE && range.endOffset === 0) {
    finishedSubtrees.add(range.endContainer);
  }

  const origin = node;
  const textAccumulator = new BlockTextAccumulator(range, false); // tempRange monitors whether we've exhausted our search space yet.

  const tempRange = range.cloneRange();

  while (!tempRange.collapsed && node != null) {
    checkTimeout(); // Depending on whether |node| is an ancestor of the start of our
    // search, we use either its leading or trailing edge as our end.

    if (node.contains(origin)) {
      tempRange.setEnd(node, 0);
    } else {
      tempRange.setEndAfter(node);
    } // Add node to accumulator to keep track of text inside the current block
    // boundaries.


    textAccumulator.appendNode(node); // If the accumulator found a non empty block boundary we've got our search
    // space.

    if (textAccumulator.textInBlock !== null) {
      return textAccumulator.textInBlock;
    }

    node = internal.backwardTraverse(walker, finishedSubtrees);
  }

  return undefined;
};
/**
 * Helper class for constructing range-based fragments for selections that cross
 * block boundaries.
 */


const FragmentFactory = class {
  /**
   * Initializes the basic state of the factory. Users should then call exactly
   * one of setStartAndEndSearchSpace, setSharedSearchSpace, or
   * setExactTextMatch, and optionally setPrefixAndSuffixSearchSpace.
   */
  constructor() {
    this.Mode = {
      ALL_PARTS: 1,
      SHARED_START_AND_END: 2,
      CONTEXT_ONLY: 3
    };
    this.startOffset = null;
    this.endOffset = null;
    this.prefixOffset = null;
    this.suffixOffset = null;
    this.prefixSearchSpace = '';
    this.backwardsPrefixSearchSpace = '';
    this.suffixSearchSpace = '';
    this.numIterations = 0;
  }
  /**
   * Generates a fragment based on the current state, then tests it for
   * uniqueness.
   * @return {TextFragment|Undefined} - a text fragment if the current state is
   *     uniquely identifying, or undefined if the current state is ambiguous.
   */


  tryToMakeUniqueFragment() {
    let fragment;

    if (this.mode === this.Mode.CONTEXT_ONLY) {
      fragment = {
        textStart: this.exactTextMatch
      };
    } else {
      fragment = {
        textStart: this.getStartSearchSpace().substring(0, this.startOffset).trim(),
        textEnd: this.getEndSearchSpace().substring(this.endOffset).trim()
      };
    }

    if (this.prefixOffset != null) {
      const prefix = this.getPrefixSearchSpace().substring(this.prefixOffset).trim();

      if (prefix) {
        fragment.prefix = prefix;
      }
    }

    if (this.suffixOffset != null) {
      const suffix = this.getSuffixSearchSpace().substring(0, this.suffixOffset).trim();

      if (suffix) {
        fragment.suffix = suffix;
      }
    }

    return isUniquelyIdentifying(fragment) ? fragment : undefined;
  }
  /**
   * Shifts the current state such that the candidates for textStart and textEnd
   * represent more of the possible search spaces.
   * @return {boolean} - true if the desired expansion occurred; false if the
   *     entire search space has been consumed and no further attempts can be
   *     made.
   */


  embiggen() {
    let canExpandRange = true;

    if (this.mode === this.Mode.SHARED_START_AND_END) {
      if (this.startOffset >= this.endOffset) {
        // If the search space is shared between textStart and textEnd, then
        // stop expanding when textStart overlaps textEnd.
        canExpandRange = false;
      }
    } else if (this.mode === this.Mode.ALL_PARTS) {
      // Stop expanding if both start and end have already consumed their full
      // search spaces.
      if (this.startOffset === this.getStartSearchSpace().length && this.backwardsEndOffset() === this.getEndSearchSpace().length) {
        canExpandRange = false;
      }
    } else if (this.mode === this.Mode.CONTEXT_ONLY) {
      canExpandRange = false;
    }

    if (canExpandRange) {
      const desiredIterations = this.getNumberOfRangeWordsToAdd();

      if (this.startOffset < this.getStartSearchSpace().length) {
        let i = 0;

        if (this.getStartSegments() != null) {
          while (i < desiredIterations && this.startOffset < this.getStartSearchSpace().length) {
            this.startOffset = this.getNextOffsetForwards(this.getStartSegments(), this.startOffset, this.getStartSearchSpace());
            i++;
          }
        } else {
          // We don't have a segmenter, so find the next boundary character
          // instead. Shift to the next boundary char, and repeat until we've
          // added a word char.
          let oldStartOffset = this.startOffset;

          do {
            checkTimeout();
            const newStartOffset = this.getStartSearchSpace().substring(this.startOffset + 1).search(internal.BOUNDARY_CHARS);

            if (newStartOffset === -1) {
              this.startOffset = this.getStartSearchSpace().length;
            } else {
              this.startOffset = this.startOffset + 1 + newStartOffset;
            } // Only count as an iteration if a word character was added.


            if (this.getStartSearchSpace().substring(oldStartOffset, this.startOffset).search(internal.NON_BOUNDARY_CHARS) !== -1) {
              oldStartOffset = this.startOffset;
              i++;
            }
          } while (this.startOffset < this.getStartSearchSpace().length && i < desiredIterations);
        } // Ensure we don't have overlapping start and end offsets.


        if (this.mode === this.Mode.SHARED_START_AND_END) {
          this.startOffset = Math.min(this.startOffset, this.endOffset);
        }
      }

      if (this.backwardsEndOffset() < this.getEndSearchSpace().length) {
        let i = 0;

        if (this.getEndSegments() != null) {
          while (i < desiredIterations && this.endOffset > 0) {
            this.endOffset = this.getNextOffsetBackwards(this.getEndSegments(), this.endOffset);
            i++;
          }
        } else {
          // No segmenter, so shift to the next boundary char, and repeat until
          // we've added a word char.
          let oldBackwardsEndOffset = this.backwardsEndOffset();

          do {
            checkTimeout();
            const newBackwardsOffset = this.getBackwardsEndSearchSpace().substring(this.backwardsEndOffset() + 1).search(internal.BOUNDARY_CHARS);

            if (newBackwardsOffset === -1) {
              this.setBackwardsEndOffset(this.getEndSearchSpace().length);
            } else {
              this.setBackwardsEndOffset(this.backwardsEndOffset() + 1 + newBackwardsOffset);
            } // Only count as an iteration if a word character was added.


            if (this.getBackwardsEndSearchSpace().substring(oldBackwardsEndOffset, this.backwardsEndOffset()).search(internal.NON_BOUNDARY_CHARS) !== -1) {
              oldBackwardsEndOffset = this.backwardsEndOffset();
              i++;
            }
          } while (this.backwardsEndOffset() < this.getEndSearchSpace().length && i < desiredIterations);
        } // Ensure we don't have overlapping start and end offsets.


        if (this.mode === this.Mode.SHARED_START_AND_END) {
          this.endOffset = Math.max(this.startOffset, this.endOffset);
        }
      }
    }

    let canExpandContext = false;

    if (!canExpandRange || this.startOffset + this.backwardsEndOffset() < MIN_LENGTH_WITHOUT_CONTEXT || this.numIterations >= ITERATIONS_BEFORE_ADDING_CONTEXT) {
      // Check if there's any unused search space left.
      if (this.backwardsPrefixOffset() != null && this.backwardsPrefixOffset() !== this.getPrefixSearchSpace().length || this.suffixOffset != null && this.suffixOffset !== this.getSuffixSearchSpace().length) {
        canExpandContext = true;
      }
    }

    if (canExpandContext) {
      const desiredIterations = this.getNumberOfContextWordsToAdd();

      if (this.backwardsPrefixOffset() < this.getPrefixSearchSpace().length) {
        let i = 0;

        if (this.getPrefixSegments() != null) {
          while (i < desiredIterations && this.prefixOffset > 0) {
            this.prefixOffset = this.getNextOffsetBackwards(this.getPrefixSegments(), this.prefixOffset);
            i++;
          }
        } else {
          // Shift to the next boundary char, and repeat until we've added a
          // word char.
          let oldBackwardsPrefixOffset = this.backwardsPrefixOffset();

          do {
            checkTimeout();
            const newBackwardsPrefixOffset = this.getBackwardsPrefixSearchSpace().substring(this.backwardsPrefixOffset() + 1).search(internal.BOUNDARY_CHARS);

            if (newBackwardsPrefixOffset === -1) {
              this.setBackwardsPrefixOffset(this.getBackwardsPrefixSearchSpace().length);
            } else {
              this.setBackwardsPrefixOffset(this.backwardsPrefixOffset() + 1 + newBackwardsPrefixOffset);
            } // Only count as an iteration if a word character was added.


            if (this.getBackwardsPrefixSearchSpace().substring(oldBackwardsPrefixOffset, this.backwardsPrefixOffset()).search(internal.NON_BOUNDARY_CHARS) !== -1) {
              oldBackwardsPrefixOffset = this.backwardsPrefixOffset();
              i++;
            }
          } while (this.backwardsPrefixOffset() < this.getPrefixSearchSpace().length && i < desiredIterations);
        }
      }

      if (this.suffixOffset < this.getSuffixSearchSpace().length) {
        let i = 0;

        if (this.getSuffixSegments() != null) {
          while (i < desiredIterations && this.suffixOffset < this.getSuffixSearchSpace().length) {
            this.suffixOffset = this.getNextOffsetForwards(this.getSuffixSegments(), this.suffixOffset, this.suffixOffset);
            i++;
          }
        } else {
          let oldSuffixOffset = this.suffixOffset;

          do {
            checkTimeout();
            const newSuffixOffset = this.getSuffixSearchSpace().substring(this.suffixOffset + 1).search(internal.BOUNDARY_CHARS);

            if (newSuffixOffset === -1) {
              this.suffixOffset = this.getSuffixSearchSpace().length;
            } else {
              this.suffixOffset = this.suffixOffset + 1 + newSuffixOffset;
            } // Only count as an iteration if a word character was added.


            if (this.getSuffixSearchSpace().substring(oldSuffixOffset, this.suffixOffset).search(internal.NON_BOUNDARY_CHARS) !== -1) {
              oldSuffixOffset = this.suffixOffset;
              i++;
            }
          } while (this.suffixOffset < this.getSuffixSearchSpace().length && i < desiredIterations);
        }
      }
    }

    this.numIterations++; // TODO: check if this exceeds the total length limit

    return canExpandRange || canExpandContext;
  }
  /**
   * Sets up the factory for a range-based match with a highlight that crosses
   * block boundaries.
   *
   * Exactly one of this, setSharedSearchSpace, or setExactTextMatch should be
   * called so the factory can identify the fragment.
   *
   * @param {String} startSearchSpace - the maximum possible string which can be
   *     used to identify the start of the fragment
   * @param {String} endSearchSpace - the maximum possible string which can be
   *     used to identify the end of the fragment
   * @return {FragmentFactory} - returns |this| to allow call chaining and
   *     assignment
   */


  setStartAndEndSearchSpace(startSearchSpace, endSearchSpace) {
    this.startSearchSpace = startSearchSpace;
    this.endSearchSpace = endSearchSpace;
    this.backwardsEndSearchSpace = reverseString(endSearchSpace);
    this.startOffset = 0;
    this.endOffset = endSearchSpace.length;
    this.mode = this.Mode.ALL_PARTS;
    return this;
  }
  /**
   * Sets up the factory for a range-based match with a highlight that doesn't
   * cross block boundaries.
   *
   * Exactly one of this, setStartAndEndSearchSpace, or setExactTextMatch should
   * be called so the factory can identify the fragment.
   *
   * @param {String} sharedSearchSpace - the full text of the highlight
   * @return {FragmentFactory} - returns |this| to allow call chaining and
   *     assignment
   */


  setSharedSearchSpace(sharedSearchSpace) {
    this.sharedSearchSpace = sharedSearchSpace;
    this.backwardsSharedSearchSpace = reverseString(sharedSearchSpace);
    this.startOffset = 0;
    this.endOffset = sharedSearchSpace.length;
    this.mode = this.Mode.SHARED_START_AND_END;
    return this;
  }
  /**
   * Sets up the factory for an exact text match.
   *
   * Exactly one of this, setStartAndEndSearchSpace, or setSharedSearchSpace
   * should be called so the factory can identify the fragment.
   *
   * @param {String} exactTextMatch - the full text of the highlight
   * @return {FragmentFactory} - returns |this| to allow call chaining and
   *     assignment
   */


  setExactTextMatch(exactTextMatch) {
    this.exactTextMatch = exactTextMatch;
    this.mode = this.Mode.CONTEXT_ONLY;
    return this;
  }
  /**
   * Sets up the factory for context-based matches.
   *
   * @param {String} prefixSearchSpace - the string to be used as the search
   *     space for prefix
   * @param {String} suffixSearchSpace - the string to be used as the search
   *     space for suffix
   * @return {FragmentFactory} - returns |this| to allow call chaining and
   *     assignment
   */


  setPrefixAndSuffixSearchSpace(prefixSearchSpace, suffixSearchSpace) {
    if (prefixSearchSpace) {
      this.prefixSearchSpace = prefixSearchSpace;
      this.backwardsPrefixSearchSpace = reverseString(prefixSearchSpace);
      this.prefixOffset = prefixSearchSpace.length;
    }

    if (suffixSearchSpace) {
      this.suffixSearchSpace = suffixSearchSpace;
      this.suffixOffset = 0;
    }

    return this;
  }
  /**
   * Sets up the factory to use an instance of Intl.Segmenter when identifying
   * the start/end of words. |segmenter| is not actually retained; instead it is
   * used to create segment objects which are cached.
   *
   * This must be called AFTER any calls to setStartAndEndSearchSpace,
   * setSharedSearchSpace, and/or setPrefixAndSuffixSearchSpace, as these search
   * spaces will be segmented immediately.
   *
   * @param {Intl.Segmenter | Undefined} segmenter
   * @returns {FragmentFactory} - returns |this| to allow call chaining and
   *     assignment
   */


  useSegmenter(segmenter) {
    if (segmenter == null) {
      return this;
    }

    if (this.mode === this.Mode.ALL_PARTS) {
      this.startSegments = segmenter.segment(this.startSearchSpace);
      this.endSegments = segmenter.segment(this.endSearchSpace);
    } else if (this.mode === this.Mode.SHARED_START_AND_END) {
      this.sharedSegments = segmenter.segment(this.sharedSearchSpace);
    }

    if (this.prefixSearchSpace) {
      this.prefixSegments = segmenter.segment(this.prefixSearchSpace);
    }

    if (this.suffixSearchSpace) {
      this.suffixSegments = segmenter.segment(this.suffixSearchSpace);
    }

    return this;
  }
  /**
   * @returns {number} - how many words should be added to the prefix and suffix
   *     when embiggening. This changes depending on the current state of the
   *     prefix/suffix, so it should be invoked once per embiggen, before either
   *     is modified.
   */


  getNumberOfContextWordsToAdd() {
    return this.backwardsPrefixOffset() === 0 && this.suffixOffset === 0 ? WORDS_TO_ADD_FIRST_ITERATION : WORDS_TO_ADD_SUBSEQUENT_ITERATIONS;
  }
  /**
   * @returns {number} - how many words should be added to textStart and textEnd
   *     when embiggening. This changes depending on the current state of
   *     textStart/textEnd, so it should be invoked once per embiggen, before
   *     either is modified.
   */


  getNumberOfRangeWordsToAdd() {
    return this.startOffset === 0 && this.backwardsEndOffset() === 0 ? WORDS_TO_ADD_FIRST_ITERATION : WORDS_TO_ADD_SUBSEQUENT_ITERATIONS;
  }
  /**
   * Helper method for embiggening using Intl.Segmenter. Finds the next offset
   * to be tried in the forwards direction (i.e., a prefix of the search space).
   * @param {Segments} segments - the output of segmenting the desired search
   *     space using Intl.Segmenter
   * @param {number} offset - the current offset
   * @param {string} searchSpace - the search space that was segmented
   * @returns {number} - the next offset which should be tried.
   */


  getNextOffsetForwards(segments, offset, searchSpace) {
    // Find the nearest wordlike segment and move to the end of it.
    let currentSegment = segments.containing(offset);

    while (currentSegment != null) {
      checkTimeout();
      const currentSegmentEnd = currentSegment.index + currentSegment.segment.length;

      if (currentSegment.isWordLike) {
        return currentSegmentEnd;
      }

      currentSegment = segments.containing(currentSegmentEnd);
    } // If we didn't find a wordlike segment by the end of the string, set the
    // offset to the full search space.


    return searchSpace.length;
  }
  /**
   * Helper method for embiggening using Intl.Segmenter. Finds the next offset
   * to be tried in the backwards direction (i.e., a suffix of the search
   * space).
   * @param {Segments} segments - the output of segmenting the desired search
   *     space using Intl.Segmenter
   * @param {number} offset - the current offset
   * @returns {number} - the next offset which should be tried.
   */


  getNextOffsetBackwards(segments, offset) {
    // Find the nearest wordlike segment and move to the start of it.
    let currentSegment = segments.containing(offset); // Handle two edge cases:
    //     1. |offset| is at the end of the search space, so |currentSegment|
    //        is undefined
    //     2. We're already at the start of a segment, so moving to the start of
    //        |currentSegment| would be a no-op.
    // In both cases, the solution is to grab the segment immediately
    // prior to this offset.

    if (!currentSegment || offset == currentSegment.index) {
      // If offset is 0, this will return null, which is handled below.
      currentSegment = segments.containing(offset - 1);
    }

    while (currentSegment != null) {
      checkTimeout();

      if (currentSegment.isWordLike) {
        return currentSegment.index;
      }

      currentSegment = segments.containing(currentSegment.index - 1);
    } // If we didn't find a wordlike segment by the start of the string,
    // set the offset to the full search space.


    return 0;
  }
  /**
   * @return {String} - the string to be used as the search space for textStart
   */


  getStartSearchSpace() {
    return this.mode === this.Mode.SHARED_START_AND_END ? this.sharedSearchSpace : this.startSearchSpace;
  }
  /**
   * @returns {Segments | Undefined} - the result of segmenting the start search
   *     space using Intl.Segmenter, or undefined if a segmenter was not
   *     provided.
   */


  getStartSegments() {
    return this.mode === this.Mode.SHARED_START_AND_END ? this.sharedSegments : this.startSegments;
  }
  /**
   * @return {String} - the string to be used as the search space for textEnd
   */


  getEndSearchSpace() {
    return this.mode === this.Mode.SHARED_START_AND_END ? this.sharedSearchSpace : this.endSearchSpace;
  }
  /**
   * @returns {Segments | Undefined} - the result of segmenting the end search
   *     space using Intl.Segmenter, or undefined if a segmenter was not
   *     provided.
   */


  getEndSegments() {
    return this.mode === this.Mode.SHARED_START_AND_END ? this.sharedSegments : this.endSegments;
  }
  /**
   * @return {String} - the string to be used as the search space for textEnd,
   *     backwards.
   */


  getBackwardsEndSearchSpace() {
    return this.mode === this.Mode.SHARED_START_AND_END ? this.backwardsSharedSearchSpace : this.backwardsEndSearchSpace;
  }
  /**
   * @return {String} - the string to be used as the search space for prefix
   */


  getPrefixSearchSpace() {
    return this.prefixSearchSpace;
  }
  /**
   * @returns {Segments | Undefined} - the result of segmenting the prefix
   *     search space using Intl.Segmenter, or undefined if a segmenter was not
   *     provided.
   */


  getPrefixSegments() {
    return this.prefixSegments;
  }
  /**
   * @return {String} - the string to be used as the search space for prefix,
   *     backwards.
   */


  getBackwardsPrefixSearchSpace() {
    return this.backwardsPrefixSearchSpace;
  }
  /**
   * @return {String} - the string to be used as the search space for suffix
   */


  getSuffixSearchSpace() {
    return this.suffixSearchSpace;
  }
  /**
   * @returns {Segments | Undefined} - the result of segmenting the suffix
   *     search space using Intl.Segmenter, or undefined if a segmenter was not
   *     provided.
   */


  getSuffixSegments() {
    return this.suffixSegments;
  }
  /**
   * Helper method for doing arithmetic in the backwards search space.
   * @return {Number} - the current end offset, as a start offset in the
   *     backwards search space
   */


  backwardsEndOffset() {
    return this.getEndSearchSpace().length - this.endOffset;
  }
  /**
   * Helper method for doing arithmetic in the backwards search space.
   * @param {Number} backwardsEndOffset - the desired new value of the start
   *     offset in the backwards search space
   */


  setBackwardsEndOffset(backwardsEndOffset) {
    this.endOffset = this.getEndSearchSpace().length - backwardsEndOffset;
  }
  /**
   * Helper method for doing arithmetic in the backwards search space.
   * @return {Number} - the current prefix offset, as a start offset in the
   *     backwards search space
   */


  backwardsPrefixOffset() {
    if (this.prefixOffset == null) return null;
    return this.getPrefixSearchSpace().length - this.prefixOffset;
  }
  /**
   * Helper method for doing arithmetic in the backwards search space.
   * @param {Number} backwardsPrefixOffset - the desired new value of the prefix
   *     offset in the backwards search space
   */


  setBackwardsPrefixOffset(backwardsPrefixOffset) {
    if (this.prefixOffset == null) return;
    this.prefixOffset = this.getPrefixSearchSpace().length - backwardsPrefixOffset;
  }

};
/**
 * Helper class to calculate visible text from the start or end of a range
 * until a block boundary is reached or the range is exhausted.
 */

const BlockTextAccumulator = class {
  /**
   * @param {Range} searchRange - the range for which the text in the last or
   *     first non empty block boundary will be calculated
   * @param {boolean} isForwardTraversal - true if nodes in
   *     searchRange will be forward traversed
   */
  constructor(searchRange, isForwardTraversal) {
    this.searchRange = searchRange;
    this.isForwardTraversal = isForwardTraversal;
    this.textFound = false;
    this.textNodes = [];
    this.textInBlock = null;
  }
  /**
   * Adds the next node in the search space range traversal to the accumulator.
   * The accumulator then will keep track of the text nodes in the range until a
   * block boundary is found. Once a block boundary is found and the content of
   * the text nodes in the boundary is non empty, the property textInBlock will
   * be set with the content of the text nodes, trimmed of leading and trailing
   * whitespaces.
   * @param {Node} node - next node in the traversal of the searchRange
   */


  appendNode(node) {
    // If we already calculated the text in the block boundary just ignore any
    // calls to append nodes.
    if (this.textInBlock !== null) {
      return;
    } // We found a block boundary, check if there's text inside and set it to
    // textInBlock or keep going to the next block boundary.


    if (isBlock(node)) {
      if (this.textFound) {
        // When traversing backwards the nodes are pushed in reverse order.
        // Reversing them to get them in the right order.
        if (!this.isForwardTraversal) {
          this.textNodes.reverse();
        } // Concatenate all the text nodes in the block boundary and trim any
        // trailing and leading whitespaces.


        this.textInBlock = this.textNodes.map(textNode => textNode.textContent).join('').trim();
      } else {
        // Discard the text nodes visited so far since they are empty and we'll
        // continue searching in the next block boundary.
        this.textNodes = [];
      }

      return;
    } // Ignore non text nodes.


    if (!isText(node)) return; // Get the part of node inside the search range. This is to avoid
    // accumulating text that's not inside the range.

    const nodeToInsert = this.getNodeIntersectionWithRange(node); // Keep track of any text found in the block boundary.

    this.textFound = this.textFound || nodeToInsert.textContent.trim() !== '';
    this.textNodes.push(nodeToInsert);
  }
  /**
   * Calculates the intersection of a node with searchRange and returns a Text
   * Node with the intersection
   * @param {Node} node - the node to intercept with searchRange
   * @returns {Node} - node if node is fully within searchRange or a Text Node
   *     with the substring of the content of node inside the search range
   */


  getNodeIntersectionWithRange(node) {
    let startOffset = null;
    let endOffset = null;

    if (node === this.searchRange.startContainer && this.searchRange.startOffset !== 0) {
      startOffset = this.searchRange.startOffset;
    }

    if (node === this.searchRange.endContainer && this.searchRange.endOffset !== node.textContent.length) {
      endOffset = this.searchRange.endOffset;
    }

    if (startOffset !== null || endOffset !== null) {
      return {
        textContent: node.textContent.substring(startOffset ?? 0, endOffset ?? node.textContent.length)
      };
    }

    return node;
  }

};
/**
 * @param {TextFragment} fragment - the candidate fragment
 * @return {boolean} - true iff the candidate fragment identifies exactly one
 *     portion of the document.
 */

const isUniquelyIdentifying = fragment => {
  return processTextFragmentDirective(fragment).length === 1;
};
/**
 * Reverses a string. Compound unicode characters are preserved.
 * @param {String} string - the string to reverse
 * @return {String} - sdrawkcab |gnirts|
 */


const reverseString = string => {
  // Spread operator (...) splits full characters, rather than code points, to
  // avoid breaking compound unicode characters upon reverse.
  return [...(string || '')].reverse().join('');
};
/**
 * Determines whether the conditions for an exact match are met.
 * @param {Range} range - the range for which a fragment is being generated.
 * @return {boolean} - true if exact matching (i.e., only
 *     textStart) can be used; false if range matching (i.e., both textStart and
 *     textEnd) must be used.
 */


const canUseExactMatch = range => {
  if (range.toString().length > MAX_EXACT_MATCH_LENGTH) return false;
  return !containsBlockBoundary(range);
};
/**
 * Finds the node at which a forward traversal through |range| should begin,
 * based on the range's start container and offset values.
 * @param {Range} range - the range which will be traversed
 * @return {Node} - the node where traversal should begin
 */


const getFirstNodeForBlockSearch = range => {
  // Get a handle on the first node inside the range. For text nodes, this
  // is the start container; for element nodes, we use the offset to find
  // where it actually starts.
  let node = range.startContainer;

  if (node.nodeType == Node.ELEMENT_NODE && range.startOffset < node.childNodes.length) {
    node = node.childNodes[range.startOffset];
  }

  return node;
};
/**
 * Finds the node at which a backward traversal through |range| should begin,
 * based on the range's end container and offset values.
 * @param {Range} range - the range which will be traversed
 * @return {Node} - the node where traversal should begin
 */


const getLastNodeForBlockSearch = range => {
  // Get a handle on the last node inside the range. For text nodes, this
  // is the end container; for element nodes, we use the offset to find
  // where it actually ends. If the offset is 0, the node itself is returned.
  let node = range.endContainer;

  if (node.nodeType == Node.ELEMENT_NODE && range.endOffset > 0) {
    node = node.childNodes[range.endOffset - 1];
  }

  return node;
};
/**
 * Finds the first visible text node within a given range.
 * @param {Range} range - range in which to find the first visible text node
 * @returns {Node} - first visible text node within |range| or null if there are
 * no visible text nodes within |range|
 */


const getFirstTextNode = range => {
  // Check if first node in the range is a visible text node.
  const firstNode = getFirstNodeForBlockSearch(range);

  if (isText(firstNode) && internal.isNodeVisible(firstNode)) {
    return firstNode;
  } // First node is not visible text, use a tree walker to find the first visible
  // text node.


  const walker = internal.makeTextNodeWalker(range);
  walker.currentNode = firstNode;
  return walker.nextNode();
};
/**
 * Finds the last visible text node within a given range.
 * @param {Range} range - range in which to find the last visible text node
 * @returns {Node} - last visible text node within |range| or null if there are
 * no visible text nodes within |range|
 */


const getLastTextNode = range => {
  // Check if last node in the range is a visible text node.
  const lastNode = getLastNodeForBlockSearch(range);

  if (isText(lastNode) && internal.isNodeVisible(lastNode)) {
    return lastNode;
  } // Last node is not visible text, traverse the range backwards to find the
  // last visible text node.


  const walker = internal.makeTextNodeWalker(range);
  walker.currentNode = lastNode;
  return internal.backwardTraverse(walker, new Set());
};
/**
 * Determines whether or not a range crosses a block boundary.
 * @param {Range} range - the range to investigate
 * @return {boolean} - true if a block boundary was found,
 *     false if no such boundary was found.
 */


const containsBlockBoundary = range => {
  const tempRange = range.cloneRange();
  let node = getFirstNodeForBlockSearch(tempRange);
  const walker = makeWalkerForNode(node);

  if (!walker) {
    return false;
  }

  const finishedSubtrees = new Set();

  while (!tempRange.collapsed && node != null) {
    if (isBlock(node)) return true;
    if (node != null) tempRange.setStartAfter(node);
    node = internal.forwardTraverse(walker, finishedSubtrees);
    checkTimeout();
  }

  return false;
};
/**
 * Attempts to find a word start within the given text node, starting at
 * |offset| and working backwards.
 *
 * @param {Node} node - a node to be searched
 * @param {Number|Undefined} startOffset - the character offset within |node|
 *     where the selected text begins. If undefined, the entire node will be
 *     searched.
 * @return {Number} the number indicating the offset to which a range should
 *     be set to ensure it starts on a word bound. Returns -1 if the node is not
 *     a text node, or if no word boundary character could be found.
 */


const findWordStartBoundInTextNode = (node, startOffset) => {
  if (node.nodeType !== Node.TEXT_NODE) return -1;
  const offset = startOffset != null ? startOffset : node.data.length; // If the first character in the range is a boundary character, we don't
  // need to do anything.

  if (offset < node.data.length && internal.BOUNDARY_CHARS.test(node.data[offset])) return offset;
  const precedingText = node.data.substring(0, offset);
  const boundaryIndex = reverseString(precedingText).search(internal.BOUNDARY_CHARS);

  if (boundaryIndex !== -1) {
    // Because we did a backwards search, the found index counts backwards
    // from offset, so we subtract to find the start of the word.
    return offset - boundaryIndex;
  }

  return -1;
};
/**
 * Attempts to find a word end within the given text node, starting at |offset|.
 *
 * @param {Node} node - a node to be searched
 * @param {Number|Undefined} endOffset - the character offset within |node|
 *     where the selected text end. If undefined, the entire node will be
 *     searched.
 * @return {Number} the number indicating the offset to which a range should
 *     be set to ensure it ends on a word bound. Returns -1 if the node is not
 *     a text node, or if no word boundary character could be found.
 */


const findWordEndBoundInTextNode = (node, endOffset) => {
  if (node.nodeType !== Node.TEXT_NODE) return -1;
  const offset = endOffset != null ? endOffset : 0; // If the last character in the range is a boundary character, we don't
  // need to do anything.

  if (offset < node.data.length && offset > 0 && internal.BOUNDARY_CHARS.test(node.data[offset - 1])) {
    return offset;
  }

  const followingText = node.data.substring(offset);
  const boundaryIndex = followingText.search(internal.BOUNDARY_CHARS);

  if (boundaryIndex !== -1) {
    return offset + boundaryIndex;
  }

  return -1;
};
/**
 * Helper method to create a TreeWalker useful for finding a block boundary near
 * a given node.
 * @param {Node} node - the node where the search should start
 * @param {Node|Undefined} endNode - optional; if included, the root of the
 *     walker will be chosen to ensure it can traverse at least as far as this
 *     node.
 * @return {TreeWalker} - a TreeWalker, rooted in a block ancestor of |node|,
 *     currently pointing to |node|, which will traverse only visible text and
 *     element nodes.
 */


const makeWalkerForNode = (node, endNode) => {
  if (!node) {
    return undefined;
  } // Find a block-level ancestor of the node by walking up the tree. This
  // will be used as the root of the tree walker.


  let blockAncestor = node;
  const endNodeNotNull = endNode != null ? endNode : node;

  while (!blockAncestor.contains(endNodeNotNull) || !isBlock(blockAncestor)) {
    if (blockAncestor.parentNode) {
      blockAncestor = blockAncestor.parentNode;
    }
  }

  const walker = document.createTreeWalker(blockAncestor, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, node => {
    return internal.acceptNodeIfVisibleInRange(node);
  });
  walker.currentNode = node;
  return walker;
};
/**
 * Modifies the start of the range, if necessary, to ensure the selection text
 * starts after a boundary char (whitespace, etc.) or a block boundary. Can only
 * expand the range, not shrink it.
 * @param {Range} range - the range to be modified
 */


const expandRangeStartToWordBound = range => {
  const segmenter = internal.makeNewSegmenter();

  if (segmenter) {
    // Find the starting text node and offset (since the range may start with a
    // non-text node).
    const startNode = getFirstNodeForBlockSearch(range);

    if (startNode !== range.startContainer) {
      range.setStartBefore(startNode);
    }

    expandToNearestWordBoundaryPointUsingSegments(segmenter,
    /* expandForward= */
    false, range);
  } else {
    // Simplest case: If we're in a text node, try to find a boundary char in
    // the same text node.
    const newOffset = findWordStartBoundInTextNode(range.startContainer, range.startOffset);

    if (newOffset !== -1) {
      range.setStart(range.startContainer, newOffset);
      return;
    } // Also, skip doing any traversal if we're already at the inside edge of
    // a block node.


    if (isBlock(range.startContainer) && range.startOffset === 0) {
      return;
    }

    const walker = makeWalkerForNode(range.startContainer);

    if (!walker) {
      return;
    }

    const finishedSubtrees = new Set();
    let node = internal.backwardTraverse(walker, finishedSubtrees);

    while (node != null) {
      const newOffset = findWordStartBoundInTextNode(node);

      if (newOffset !== -1) {
        range.setStart(node, newOffset);
        return;
      } // If |node| is a block node, then we've hit a block boundary, which
      // counts as a word boundary.


      if (isBlock(node)) {
        if (node.contains(range.startContainer)) {
          // If the selection starts inside |node|, then the correct range
          // boundary is the *leading* edge of |node|.
          range.setStart(node, 0);
        } else {
          // Otherwise, |node| is before the selection, so the correct boundary
          // is the *trailing* edge of |node|.
          range.setStartAfter(node);
        }

        return;
      }

      node = internal.backwardTraverse(walker, finishedSubtrees); // We should never get here; the walker should eventually hit a block node
      // or the root of the document. Collapse range so the caller can handle
      // this as an error.

      range.collapse();
    }
  }
};
/**
 * Moves the range edges to the first and last visible text nodes inside of it.
 * If there are no visible text nodes in the range then it is collapsed.
 * @param {Range} range - the range to be modified
 */


const moveRangeEdgesToTextNodes = range => {
  const firstTextNode = getFirstTextNode(range); // No text nodes in range. Collapsing the range and early return.

  if (firstTextNode == null) {
    range.collapse();
    return;
  }

  const firstNode = getFirstNodeForBlockSearch(range); // Making sure the range starts with visible text.

  if (firstNode !== firstTextNode) {
    range.setStart(firstTextNode, 0);
  }

  const lastNode = getLastNodeForBlockSearch(range);
  const lastTextNode = getLastTextNode(range); // No need for no text node checks here because we know at there's at least
  // firstTextNode in the range.
  // Making sure the range ends with visible text.

  if (lastNode !== lastTextNode) {
    range.setEnd(lastTextNode, lastTextNode.textContent.length);
  }
};
/**
 * Uses Intl.Segmenter to shift the start or end of a range to a word boundary.
 * Helper method for expandWord*ToWordBound methods.
 * @param {Intl.Segmenter} segmenter - object to use for word segmenting
 * @param {boolean} isRangeEnd - true if the range end should be modified, false
 *     if the range start should be modified
 * @param {Range} range - the range to modify
 */


const expandToNearestWordBoundaryPointUsingSegments = (segmenter, isRangeEnd, range) => {
  // Find the index as an offset in the full text of the block in which
  // boundary occurs.
  const boundary = isRangeEnd ? {
    node: range.endContainer,
    offset: range.endOffset
  } : {
    node: range.startContainer,
    offset: range.startOffset
  };
  const nodes = getTextNodesInSameBlock(boundary.node);
  const preNodeText = nodes.preNodes.reduce((prev, cur) => {
    return prev.concat(cur.textContent);
  }, '');
  const innerNodeText = nodes.innerNodes.reduce((prev, cur) => {
    return prev.concat(cur.textContent);
  }, '');
  let offsetInText = preNodeText.length;

  if (boundary.node.nodeType === Node.TEXT_NODE) {
    offsetInText += boundary.offset;
  } else if (isRangeEnd) {
    offsetInText += innerNodeText.length;
  } // Find the segment of the full block text containing the range start.


  const postNodeText = nodes.postNodes.reduce((prev, cur) => {
    return prev.concat(cur.textContent);
  }, '');
  const allNodes = [...nodes.preNodes, ...nodes.innerNodes, ...nodes.postNodes]; // Edge case: There's no text nodes in the block.
  // In that case there's nothing to do because there is no word boundary
  // to find.

  if (allNodes.length == 0) {
    return;
  }

  const text = preNodeText.concat(innerNodeText, postNodeText);
  const segments = segmenter.segment(text);
  const foundSegment = segments.containing(offsetInText);

  if (!foundSegment) {
    if (isRangeEnd) {
      range.setEndAfter(allNodes[allNodes.length - 1]);
    } else {
      range.setEndBefore(allNodes[0]);
    }

    return;
  } // Easy case: if the segment is not word-like (i.e., contains whitespace,
  // punctuation, etc.) then nothing needs to be done because this
  // boundary point is between words.


  if (!foundSegment.isWordLike) {
    return;
  } // Another easy case: if we are at the first/last character of the
  // segment, then we're done.


  if (offsetInText === foundSegment.index || offsetInText === foundSegment.index + foundSegment.segment.length) {
    return;
  } // We're inside a word. Based on |isRangeEnd|, the target offset will
  // either be the start or the end of the found segment.


  const desiredOffsetInText = isRangeEnd ? foundSegment.index + foundSegment.segment.length : foundSegment.index;
  let newNodeIndexInText = 0;

  for (const node of allNodes) {
    if (newNodeIndexInText <= desiredOffsetInText && desiredOffsetInText < newNodeIndexInText + node.textContent.length) {
      const offsetInNode = desiredOffsetInText - newNodeIndexInText;

      if (isRangeEnd) {
        if (offsetInNode >= node.textContent.length) {
          range.setEndAfter(node);
        } else {
          range.setEnd(node, offsetInNode);
        }
      } else {
        if (offsetInNode >= node.textContent.length) {
          range.setStartAfter(node);
        } else {
          range.setStart(node, offsetInNode);
        }
      }

      return;
    }

    newNodeIndexInText += node.textContent.length;
  } // If we got here, then somehow the offset didn't fall within a node. As a
  // fallback, move the range to the start/end of the block.


  if (isRangeEnd) {
    range.setEndAfter(allNodes[allNodes.length - 1]);
  } else {
    range.setStartBefore(allNodes[0]);
  }
};
/**
 * @typedef {Object} TextNodeLists - the result of traversing the DOM to
 *     extract TextNodes
 * @property {TextNode[]} preNodes - the nodes appearing before a specified
 *     starting node
 * @property {TextNode[]} innerNodes - a list containing |node| if it is a
 *     text node, or any text node children of |node|.
 * @property {TextNode[]} postNodes - the nodes appearing after a specified
 *     starting node
 */

/**
 * Traverses the DOM to extract all TextNodes appearing in the same block level
 * as |node| (i.e., those that are descendents of a common ancestor of |node|
 * with no other block elements in between.)
 * @param {TextNode} node
 * @returns {TextNodeLists}
 */


const getTextNodesInSameBlock = node => {
  const preNodes = []; // First, backtraverse to get to a block boundary

  const backWalker = makeWalkerForNode(node);

  if (!backWalker) {
    return;
  }

  const finishedSubtrees = new Set();
  let backNode = internal.backwardTraverse(backWalker, finishedSubtrees);

  while (backNode != null && !isBlock(backNode)) {
    checkTimeout();

    if (backNode.nodeType === Node.TEXT_NODE) {
      preNodes.push(backNode);
    }

    backNode = internal.backwardTraverse(backWalker, finishedSubtrees);
  }

  preNodes.reverse();
  const innerNodes = [];

  if (node.nodeType === Node.TEXT_NODE) {
    innerNodes.push(node);
  } else {
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, node => {
      return internal.acceptNodeIfVisibleInRange(node);
    });
    walker.currentNode = node;
    let child = walker.nextNode();

    while (child != null) {
      checkTimeout();

      if (child.nodeType === Node.TEXT_NODE) {
        innerNodes.push(child);
      }

      child = walker.nextNode();
    }
  }

  const postNodes = [];
  const forwardWalker = makeWalkerForNode(node);

  if (!forwardWalker) {
    return;
  } // Forward traverse from node after having finished its subtree
  // to get text nodes after it until we find a block boundary.


  const finishedSubtreesForward = new Set([node]);
  let forwardNode = internal.forwardTraverse(forwardWalker, finishedSubtreesForward);

  while (forwardNode != null && !isBlock(forwardNode)) {
    checkTimeout();

    if (forwardNode.nodeType === Node.TEXT_NODE) {
      postNodes.push(forwardNode);
    }

    forwardNode = internal.forwardTraverse(forwardWalker, finishedSubtreesForward);
  }

  return {
    preNodes: preNodes,
    innerNodes: innerNodes,
    postNodes: postNodes
  };
};
/**
 * Modifies the end of the range, if necessary, to ensure the selection text
 * ends before a boundary char (whitespace, etc.) or a block boundary. Can only
 * expand the range, not shrink it.
 * @param {Range} range - the range to be modified
 */


const expandRangeEndToWordBound = range => {
  const segmenter = internal.makeNewSegmenter();

  if (segmenter) {
    // Find the ending text node and offset (since the range may end with a
    // non-text node).
    const endNode = getLastNodeForBlockSearch(range);

    if (endNode !== range.endContainer) {
      range.setEndAfter(endNode);
    }

    expandToNearestWordBoundaryPointUsingSegments(segmenter,
    /* expandForward= */
    true, range);
  } else {
    let initialOffset = range.endOffset;
    let node = range.endContainer;

    if (node.nodeType === Node.ELEMENT_NODE) {
      if (range.endOffset < node.childNodes.length) {
        node = node.childNodes[range.endOffset];
      }
    }

    const walker = makeWalkerForNode(node);

    if (!walker) {
      return;
    } // We'll traverse the dom after node's subtree to try to find
    // either a word or block boundary.


    const finishedSubtrees = new Set([node]);

    while (node != null) {
      checkTimeout();
      const newOffset = findWordEndBoundInTextNode(node, initialOffset); // Future iterations should not use initialOffset; null it out so it is
      // discarded.

      initialOffset = null;

      if (newOffset !== -1) {
        range.setEnd(node, newOffset);
        return;
      } // If |node| is a block node, then we've hit a block boundary, which
      // counts as a word boundary.


      if (isBlock(node)) {
        if (node.contains(range.endContainer)) {
          // If the selection starts inside |node|, then the correct range
          // boundary is the *trailing* edge of |node|.
          range.setEnd(node, node.childNodes.length);
        } else {
          // Otherwise, |node| is after the selection, so the correct boundary
          // is the *leading* edge of |node|.
          range.setEndBefore(node);
        }

        return;
      }

      node = internal.forwardTraverse(walker, finishedSubtrees);
    } // We should never get here; the walker should eventually hit a block node
    // or the root of the document. Collapse range so the caller can handle this
    // as an error.


    range.collapse();
  }
};
/**
 * Helper to determine if a node is a block element or not.
 * @param {Node} node - the node to evaluate
 * @return {Boolean} - true if the node is an element classified as block-level
 */


const isBlock = node => {
  return node.nodeType === Node.ELEMENT_NODE && (internal.BLOCK_ELEMENTS.includes(node.tagName) || node.tagName === 'HTML' || node.tagName === 'BODY');
};
/**
 * Helper to determine if a node is a Text Node or not
 * @param {Node} node - the node to evaluate
 * @returns {Boolean} - true if the node is a Text Node
 */


const isText = node => {
  return node.nodeType === Node.TEXT_NODE;
};

const forTesting = {
  containsBlockBoundary: containsBlockBoundary,
  doGenerateFragment: doGenerateFragment,
  expandRangeEndToWordBound: expandRangeEndToWordBound,
  expandRangeStartToWordBound: expandRangeStartToWordBound,
  findWordEndBoundInTextNode: findWordEndBoundInTextNode,
  findWordStartBoundInTextNode: findWordStartBoundInTextNode,
  FragmentFactory: FragmentFactory,
  getSearchSpaceForEnd: getSearchSpaceForEnd,
  getSearchSpaceForStart: getSearchSpaceForStart,
  getTextNodesInSameBlock: getTextNodesInSameBlock,
  recordStartTime: recordStartTime,
  BlockTextAccumulator: BlockTextAccumulator,
  getFirstTextNode: getFirstTextNode,
  getLastTextNode: getLastTextNode,
  moveRangeEdgesToTextNodes: moveRangeEdgesToTextNodes
}; // Allow importing module from closure-compiler projects that haven't migrated
// to ES6 modules.

exports.forTesting = forTesting;

if (typeof goog !== 'undefined') {
  // clang-format off
  goog.declareModuleId('googleChromeLabs.textFragmentPolyfill.fragmentGenerationUtils'); // clang-format on
}
