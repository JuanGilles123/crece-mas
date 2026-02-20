// DOCUMENT HASHING IMPLEMENTATION
import { createHash } from 'crypto';

/**
 * Generate SHA256 hash of document content (string)
 * @param {string} content - Full document content
 * @returns {string} - Hex string
 */
export function generateDocumentHash(content) {
  return createHash('sha256').update(content, 'utf8').digest('hex');
}
