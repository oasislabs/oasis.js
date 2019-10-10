import { ecdhTweak as node } from './node';
import { ecdhTweak as browser } from './browser';

/**
 * ecdhTweak applies the X25519 scalar multiply with the given public and
 * private keys, and applies a HMAC based tweak to the resulting output.
 *
 * This module supplies two different versions, depending upon whether we're
 * in browser or node.
 */
export const ecdhTweak = typeof window !== 'undefined' ? browser : node;
