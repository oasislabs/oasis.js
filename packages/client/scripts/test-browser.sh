#!/bin/bash

# Source common for cleanup on exit.
source scripts/common.sh

# Serve the files.
python3 -m http.server 8000 &

# Run the browser tests.
node test/browser/service/test.js
node test/browser/confidential/test.js
# Do not run the e2e test in CI as it requires
# an external network.
#node test/browser/e2e/test.js
