/**
 * Tweetnacl utility module to provide a consistent import for both node and browsers.
 */

import * as _nacl from 'tweetnacl';

let nacl: any = undefined;

// Browser.
if (typeof window !== 'undefined') {
  // @ts-ignore
  nacl = _nacl.default;
}
// Node.
else {
  nacl = require('tweetnacl');
}

export default nacl;
