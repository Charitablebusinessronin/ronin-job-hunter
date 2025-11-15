#!/bin/bash
# Check if Chrome/CDP session is available and logged into job boards

CHROME_DEBUG_PORT=${CHROME_DEBUG_PORT:-9222}
CHROME_URL="http://localhost:${CHROME_DEBUG_PORT}"

echo "Checking CDP session availability..."

# Check if Chrome debug port is accessible
if ! curl -s "${CHROME_URL}/json/version" > /dev/null 2>&1; then
    echo "ERROR: Chrome DevTools Protocol not accessible on port ${CHROME_DEBUG_PORT}"
    echo "Please ensure Chrome is running with --remote-debugging-port=${CHROME_DEBUG_PORT}"
    exit 1
fi

echo "✓ CDP port ${CHROME_DEBUG_PORT} is accessible"

# Check for available browser targets
TARGETS=$(curl -s "${CHROME_URL}/json/list" | jq -r '.[].url' 2>/dev/null || echo "")

if [ -z "$TARGETS" ]; then
    echo "WARNING: No browser targets found"
    exit 1
fi

echo "✓ Browser targets available"
exit 0

