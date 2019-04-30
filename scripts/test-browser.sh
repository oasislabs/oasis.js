#!/bin/bash

# Source common for cleanup on exit.
source scripts/common.sh

# Build JS artifacts.
yarn build

# Serve the files.
python3 -m http.server 8000 &

# Run the browser test.
node test/browser/test.js
