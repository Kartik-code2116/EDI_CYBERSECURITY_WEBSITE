/**
 * Content Script — collects safe page metadata.
 *
 * PRIVACY GUARANTEE:
 *   ✅ Collects: URL, title, meta description, visible text (truncated),
 *               form count, password field count (not values),
 *               script count, iframe count, link structure
 *   ❌ NEVER collects: passwords, form values, cookies, tokens,
 *                      personal data, session identifiers
 *
 * Responds to COLLECT_PAGE_DATA messages from the background worker.
 */

import type { PageMetadata, CollectPageDataMessage, PageDataCollectedMessage } from '../types';

// ── Safe metadata extraction ──────────────────────────────────────────────────

function collectPageMetadata(): PageMetadata {
  const url = window.location.href;
  const title = document.title || '';
  const metaDescTag = document.querySelector<HTMLMetaElement>('meta[name="description"]');
  const metaDescription = metaDescTag?.content || '';

  // Visible text — truncated to 5000 chars, stripped of script/style content
  const body = document.body;
  let visibleText = '';
  if (body) {
    // Clone and remove script/style elements
    const clone = body.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('script, style, noscript').forEach(el => el.remove());
    visibleText = (clone.innerText || clone.textContent || '').slice(0, 5000);
  }

  // Forms — count only, no values
  const forms = document.querySelectorAll('form');
  const formCount = forms.length;

  // Password fields — count only, NEVER access .value
  const passwordFields = document.querySelectorAll('input[type="password"]');
  const passwordFieldCount = passwordFields.length;

  // External scripts
  const scripts = document.querySelectorAll('script[src]');
  const currentHost = window.location.hostname;
  let externalScriptCount = 0;
  scripts.forEach(script => {
    const src = script.getAttribute('src') || '';
    if (src && !src.startsWith('/') && !src.includes(currentHost)) {
      externalScriptCount++;
    }
  });

  // iFrames
  const iframeCount = document.querySelectorAll('iframe').length;

  // Links
  const links = document.querySelectorAll('a[href]');
  const linkCount = links.length;
  const externalLinks: string[] = [];
  links.forEach(link => {
    const href = link.getAttribute('href') || '';
    try {
      const linkUrl = new URL(href, url);
      if (linkUrl.hostname !== currentHost) {
        externalLinks.push(linkUrl.hostname);
      }
    } catch {
      // Invalid URL — skip
    }
  });
  // Deduplicate and limit
  const uniqueExternalLinks = [...new Set(externalLinks)].slice(0, 30);

  return {
    url,
    title: title.slice(0, 256),
    metaDescription: metaDescription.slice(0, 512),
    visibleText,
    formCount,
    passwordFieldCount,
    externalScriptCount,
    iframeCount,
    linkCount,
    externalLinks: uniqueExternalLinks,
  };
}

// ── Message listener ──────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener(
  (message: CollectPageDataMessage, _sender, sendResponse) => {
    if (message.type === 'COLLECT_PAGE_DATA') {
      try {
        const metadata = collectPageMetadata();
        const response: PageDataCollectedMessage = {
          type: 'PAGE_DATA_COLLECTED',
          payload: metadata,
        };
        sendResponse(response);
      } catch (error) {
        sendResponse({
          type: 'PAGE_DATA_COLLECTED',
          payload: {
            url: window.location.href,
            title: document.title,
            metaDescription: '',
            visibleText: '',
            formCount: 0,
            passwordFieldCount: 0,
            externalScriptCount: 0,
            iframeCount: 0,
            linkCount: 0,
            externalLinks: [],
          } as PageMetadata,
        });
      }
    }
    return true; // Keep message channel open for async response
  }
);
