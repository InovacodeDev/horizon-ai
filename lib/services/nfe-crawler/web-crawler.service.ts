/**
 * NFe Web Crawler Service
 *
 * Handles fetching HTML content from government portals and extracting
 * invoice keys from URLs and HTML pages.
 */
import {
  DEFAULT_CRAWLER_CONFIG,
  GOVERNMENT_PORTAL_URLS,
  INVOICE_KEY_LENGTH,
  INVOICE_KEY_PATTERNS,
  MAX_HTML_SIZE,
} from './constants';
import { HTMLFetchError, InvoiceKeyNotFoundError, NetworkError, TimeoutError } from './errors';
import { IWebCrawlerServiceExtended } from './interfaces';
import { loggerService } from './logger.service';

export class WebCrawlerService implements IWebCrawlerServiceExtended {
  private config = DEFAULT_CRAWLER_CONFIG;

  /**
   * Extract invoice key from URL by fetching and parsing HTML
   * Requirement 1.1, 1.2, 1.3, 1.4
   */
  async extractInvoiceKey(url: string): Promise<string> {
    const startTime = loggerService.startPerformanceTracking('extract-invoice-key');

    try {
      loggerService.info('web-crawler', 'extract-invoice-key', 'Starting invoice key extraction', { url });

      // Fetch the HTML content
      const html = await this.fetchWithRedirects(url, this.config.maxRedirects);

      // Extract key from HTML
      const key = this.extractKeyFromHtml(html);

      if (!key) {
        loggerService.error('web-crawler', 'extract-invoice-key', 'Invoice key not found in HTML', { url });
        throw new InvoiceKeyNotFoundError(url, {
          message: 'No 44-digit invoice key found in HTML content',
        });
      }

      loggerService.info('web-crawler', 'extract-invoice-key', 'Invoice key extracted successfully', {
        url,
        invoiceKey: key,
      });
      loggerService.endPerformanceTracking(startTime, true);

      return key;
    } catch (error) {
      loggerService.endPerformanceTracking(startTime, false, error instanceof Error ? error.message : String(error));

      if (error instanceof InvoiceKeyNotFoundError) {
        throw error;
      }
      throw new InvoiceKeyNotFoundError(url, {
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Fetch full invoice page HTML
   * Requirement 2.2, 2.3
   */
  async fetchInvoiceHtml(url: string): Promise<string> {
    const startTime = loggerService.startPerformanceTracking('fetch-invoice-html');

    try {
      loggerService.info('web-crawler', 'fetch-invoice-html', 'Fetching invoice HTML', { url });

      const html = await this.fetchWithRedirects(url, this.config.maxRedirects);

      loggerService.info('web-crawler', 'fetch-invoice-html', 'Invoice HTML fetched successfully', {
        url,
        htmlSize: html.length,
      });
      loggerService.endPerformanceTracking(startTime, true);

      return html;
    } catch (error) {
      loggerService.error('web-crawler', 'fetch-invoice-html', 'Failed to fetch invoice HTML', {
        url,
        error: error instanceof Error ? error.message : String(error),
      });
      loggerService.endPerformanceTracking(startTime, false, error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Follow redirects and handle different portal formats with timeout and retry logic
   * Requirement 2.1, 2.4, 2.5
   */
  async fetchWithRedirects(url: string, maxRedirects: number): Promise<string> {
    let attempt = 0;
    let lastError: Error | null = null;

    // Retry logic
    while (attempt <= this.config.retryAttempts) {
      try {
        if (attempt > 0) {
          loggerService.info('web-crawler', 'fetch-with-redirects', `Retry attempt ${attempt}`, { url, attempt });
        }

        return await this.fetchWithTimeout(url, maxRedirects);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        attempt++;

        // Don't retry on certain errors
        if (error instanceof TimeoutError || error instanceof HTMLFetchError) {
          if (attempt <= this.config.retryAttempts) {
            const delay = this.config.retryDelay * attempt;
            loggerService.warn('web-crawler', 'fetch-with-redirects', `Request failed, retrying in ${delay}ms`, {
              url,
              attempt,
              error: lastError.message,
            });

            // Wait before retrying with exponential backoff
            await this.sleep(delay);
            continue;
          }
        }

        // If it's not a retryable error or we've exhausted retries, throw
        throw error;
      }
    }

    // If we get here, all retries failed
    loggerService.error('web-crawler', 'fetch-with-redirects', 'All retry attempts exhausted', {
      url,
      attempts: this.config.retryAttempts + 1,
      lastError: lastError?.message,
    });

    throw new NetworkError(url, `Failed after ${this.config.retryAttempts + 1} attempts: ${lastError?.message}`, {
      lastError: lastError?.message,
    });
  }

  /**
   * Fetch with timeout and redirect handling
   */
  private async fetchWithTimeout(url: string, maxRedirects: number): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': this.config.userAgent,
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          Connection: 'keep-alive',
        },
        redirect: 'follow',
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new HTMLFetchError(url, `HTTP ${response.status}: ${response.statusText}`, {
          statusCode: response.status,
          statusText: response.statusText,
        });
      }

      // Check content length to prevent memory issues
      const contentLength = response.headers.get('content-length');
      if (contentLength && parseInt(contentLength) > MAX_HTML_SIZE) {
        throw new HTMLFetchError(url, `Content too large: ${contentLength} bytes`, {
          contentLength: parseInt(contentLength),
          maxSize: MAX_HTML_SIZE,
        });
      }

      const html = await response.text();

      // Verify HTML size after fetching
      if (html.length > MAX_HTML_SIZE) {
        throw new HTMLFetchError(url, `HTML content too large: ${html.length} bytes`, {
          contentLength: html.length,
          maxSize: MAX_HTML_SIZE,
        });
      }

      return html;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new TimeoutError(url, this.config.timeout);
      }

      if (error instanceof HTMLFetchError || error instanceof TimeoutError) {
        throw error;
      }

      // Network or other fetch errors
      throw new NetworkError(url, error instanceof Error ? error.message : String(error), {
        originalError: error instanceof Error ? error.name : typeof error,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Extract invoice key from HTML content
   * Supports multiple regex patterns and normalizes the key
   * Requirement 1.1, 1.2, 1.3
   */
  extractKeyFromHtml(html: string): string | null {
    // Try pattern 1: 44 consecutive digits
    let match = html.match(INVOICE_KEY_PATTERNS.CONSECUTIVE);
    if (match) {
      return match[0];
    }

    // Try pattern 2: 44 digits with spaces (e.g., "4225 1109 4776 5200...")
    match = html.match(INVOICE_KEY_PATTERNS.WITH_SPACES);
    if (match) {
      // Remove all spaces to get the 44-digit key
      const normalized = match[0].replace(/\s/g, '');
      if (normalized.length === INVOICE_KEY_LENGTH) {
        return normalized;
      }
    }

    // Try pattern 3: In span.chave element
    match = html.match(INVOICE_KEY_PATTERNS.IN_CHAVE_ELEMENT);
    if (match && match[1]) {
      // Remove all spaces and validate length
      const normalized = match[1].replace(/\s/g, '');
      if (normalized.length === INVOICE_KEY_LENGTH) {
        return normalized;
      }
    }

    return null;
  }

  /**
   * Validate URL points to known government portal
   */
  isGovernmentPortalUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return GOVERNMENT_PORTAL_URLS.some((portalUrl) => {
        const portalObj = new URL(portalUrl);
        return urlObj.hostname === portalObj.hostname;
      });
    } catch {
      return false;
    }
  }

  /**
   * Construct government portal URL from invoice key
   * Uses Santa Catarina portal as default
   */
  constructUrlFromKey(invoiceKey: string): string {
    // Validate key length
    if (invoiceKey.length !== INVOICE_KEY_LENGTH) {
      throw new Error(`Invalid invoice key length: expected ${INVOICE_KEY_LENGTH}, got ${invoiceKey.length}`);
    }

    // Use Santa Catarina portal as default
    // Format: https://sat.sef.sc.gov.br/nfce/consulta?p={key}
    return `https://sat.sef.sc.gov.br/nfce/consulta?p=${invoiceKey}`;
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const webCrawlerService = new WebCrawlerService();
