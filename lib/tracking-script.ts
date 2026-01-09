/**
 * Client-Side Click Tracking Script
 * Injected into pages to track CTA clicks
 * Triple fallback: sendBeacon → fetch → img
 */

/**
 * Generate tracking script to inject into pages
 * This runs in the browser and tracks clicks on CTA elements
 */
export function generateTrackingScript(
    visitId: string,
    trackingEndpoint: string = '/api/track-click'
): string {
    return `
(function() {
  'use strict';
  
  // Configuration
  const VISIT_ID = '${visitId}';
  const TRACKING_ENDPOINT = '${trackingEndpoint}';
  const CLICK_SELECTOR = '[data-cta], .cta-button, button[type="submit"], a.btn-primary';
  
  // Track if already sent (prevent duplicates)
  let clickSent = false;
  
  // Rate limiting
  const lastClickTime = 0;
  const RATE_LIMIT_MS = 1000; // Max 1 click per second
  
  /**
   * Send click event with triple fallback
   */
  function sendClick() {
    if (clickSent) return;
    
    const now = Date.now();
    if (now - lastClickTime < RATE_LIMIT_MS) return;
    
    clickSent = true;
    
    const payload = {
      visitId: VISIT_ID,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      referrer: document.referrer || undefined,
    };
    
    // Method 1: sendBeacon (best - non-blocking, works on unload)
    if (navigator.sendBeacon) {
      try {
        const sent = navigator.sendBeacon(
          TRACKING_ENDPOINT,
          JSON.stringify(payload)
        );
        if (sent) {
          console.log('[Tracking] Click sent via sendBeacon');
          return;
        }
      } catch (e) {
        console.warn('[Tracking] sendBeacon failed:', e);
      }
    }
    
    // Method 2: fetch (fallback)
    if (window.fetch) {
      try {
        fetch(TRACKING_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          keepalive: true, // Important for unload events
        }).then(() => {
          console.log('[Tracking] Click sent via fetch');
        }).catch((e) => {
          console.warn('[Tracking] fetch failed:', e);
          // Fall through to image beacon
          sendViaImage(payload);
        });
        return;
      } catch (e) {
        console.warn('[Tracking] fetch error:', e);
      }
    }
    
    // Method 3: Image beacon (ultimate fallback)
    sendViaImage(payload);
  }
  
  /**
   * Send via image beacon (works everywhere)
   */
  function sendViaImage(payload) {
    try {
      const img = new Image();
      const params = new URLSearchParams({
        visitId: payload.visitId,
        timestamp: payload.timestamp,
      });
      img.src = TRACKING_ENDPOINT + '?' + params.toString();
      console.log('[Tracking] Click sent via image beacon');
    } catch (e) {
      console.error('[Tracking] All tracking methods failed:', e);
    }
  }
  
  /**
   * Setup click listeners
   */
  function setupTracking() {
    // Find all CTA elements
    const ctaElements = document.querySelectorAll(CLICK_SELECTOR);
    
    if (ctaElements.length === 0) {
      console.warn('[Tracking] No CTA elements found with selector:', CLICK_SELECTOR);
      return;
    }
    
    console.log('[Tracking] Found', ctaElements.length, 'CTA elements');
    
    // Add click listeners
    ctaElements.forEach((element) => {
      element.addEventListener('click', (e) => {
        console.log('[Tracking] CTA clicked:', element);
        sendClick();
      }, { once: true }); // Only track first click
    });
    
    // Also track on beforeunload if CTA was clicked
    window.addEventListener('beforeunload', () => {
      // Send beacon on page unload (user might have clicked and navigated away)
      if (!clickSent && document.activeElement) {
        const activeEl = document.activeElement;
        if (activeEl.matches && activeEl.matches(CLICK_SELECTOR)) {
          sendClick();
        }
      }
    });
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupTracking);
  } else {
    setupTracking();
  }
  
  console.log('[Tracking] Click tracking initialized for visit:', VISIT_ID);
})();
`.trim();
}

/**
 * Inject tracking script into HTML
 */
export function injectTrackingScript(html: string, visitId: string): string {
    const script = generateTrackingScript(visitId);
    const scriptTag = `<script>${script}</script>`;

    // Try to inject before </body>
    if (html.includes('</body>')) {
        return html.replace('</body>', `${scriptTag}\n</body>`);
    }

    // Fallback: inject before </html>
    if (html.includes('</html>')) {
        return html.replace('</html>', `${scriptTag}\n</html>`);
    }

    // Ultimate fallback: append to end
    return html + scriptTag;
}
