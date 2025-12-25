#!/bin/sh
# pwa.sh — Convert the current folder into a minimal PWA
# Usage:
#   ./pwa.sh --name "My App" --short "App"

# Defaults
APP_NAME="Placeholder App"
SHORT_NAME="App"
START_URL="/"
SCOPE="/"
THEME_COLOR="#0d1117"
BACKGROUND_COLOR="#0d1117"
DISPLAY_MODE="standalone"
ICON_SRC=""
INDEX_HTML=""

# Parse options
while [ $# -gt 0 ]; do
  case "$1" in
    --name) APP_NAME="$2"; shift 2 ;;
    --short) SHORT_NAME="$2"; shift 2 ;;
    --start) START_URL="$2"; shift 2 ;;
    --scope) SCOPE="$2"; shift 2 ;;
    --theme) THEME_COLOR="$2"; shift 2 ;;
    --bg) BACKGROUND_COLOR="$2"; shift 2 ;;
    --color) DISPLAY_MODE="$2"; shift 2 ;;
    --icon) ICON_SRC="$2"; shift 2 ;;
    --index) INDEX_HTML="$2"; shift 2 ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

# Auto-detect index if not provided
if [ -z "$INDEX_HTML" ]; then
  for f in index.html index.htm home.html default.html; do
    if [ -f "$f" ]; then INDEX_HTML="$f"; break; fi
  done
fi
if [ -z "$INDEX_HTML" ]; then
  echo "Error: Could not find an entry HTML file. Use --index to specify one." >&2
  exit 1
fi

# Create assets directory
mkdir -p pwa

# Generate placeholder icons
make_icon() {
  size="$1"
  out="pwa/icon-${size}.png"
  if [ -n "$ICON_SRC" ] && [ -f "$ICON_SRC" ]; then
    if command -v convert >/dev/null 2>&1; then
      convert "$ICON_SRC" -resize "${size}x${size}" "$out"
    else
      echo "Warning: 'convert' not found; using placeholder for ${size}x${size}" >&2
      ICON_SRC=""
    fi
  fi
  if [ -z "$ICON_SRC" ]; then
    if command -v convert >/dev/null 2>&1; then
      convert -size "${size}x${size}" canvas:"#444" \
        -fill "#fff" -gravity center -pointsize $(expr $size / 6) \
        -annotate +0+0 "$SHORT_NAME" "$out"
    else
      # Minimal 1x1 PNG placeholder
      printf '\x89PNG\r\n\x1A\n\0\0\0\rIHDR\0\0\0\1\0\0\0\1\0\0\0\0\0\0\0\0\0\0\0\0IDATx^\xcb\0\1\0\0\5\0\1\0\0\0\0\0\0\0\0\0\0IEND\xaeB`\x82' > "$out"
    fi
  fi
}
for s in 192 256 384 512; do make_icon "$s"; done

# Create manifest.json
cat > pwa/manifest.json <<EOF
{
  "name": "${APP_NAME}",
  "short_name": "${SHORT_NAME}",
  "start_url": "${START_URL}",
  "scope": "${SCOPE}",
  "display": "${DISPLAY_MODE}",
  "background_color": "${BACKGROUND_COLOR}",
  "theme_color": "${THEME_COLOR}",
  "icons": [
    { "src": "pwa/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "pwa/icon-256.png", "sizes": "256x256", "type": "image/png" },
    { "src": "pwa/icon-384.png", "sizes": "384x384", "type": "image/png" },
    { "src": "pwa/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
EOF

# Offline fallback page
cat > pwa/offline.html <<'EOF'
<!doctype html>
<html lang="en">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Offline</title>
<style>
  body { margin:0; font-family:sans-serif; display:grid; place-items:center; min-height:100vh; background:#0d1117; color:#c9d1d9; }
  .card { max-width: 38rem; padding: 2rem; border-radius: 16px; background: #161b22; }
</style>
<div class="card">
  <h1>You’re offline</h1>
  <p>This app works offline for cached pages. The requested page isn’t cached yet.</p>
  <p>Try again when you’re online, or go back to the <a href="/">home page</a>.</p>
</div>
</html>
EOF

# Service worker
cat > pwa/sw.js <<'EOF'
const VERSION = 'pwaify-v1';
const APP_SHELL = ['/', 'pwa/manifest.json', 'pwa/offline.html'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(VERSION);
    cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || (await caches.match('pwa/offline.html'));
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  const cache = await caches.open(VERSION);
  cache.put(request, response.clone());
  return response;
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (APP_SHELL.includes(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }
  if (request.destination === 'document') {
    event.respondWith(networkFirst(request));
    return;
  }
  if (['style','script','image','font'].includes(request.destination)) {
    event.respondWith(cacheFirst(request));
    return;
  }
});
EOF

# Inject manifest and SW registration
backup="${INDEX_HTML}.bak"
cp "$INDEX_HTML" "$backup"

if ! grep -qi 'rel=.*manifest' "$INDEX_HTML"; then
  awk -v theme="$THEME_COLOR" '
    /<head[^>]*>/ && !added {
      print
      print "  <link rel=\"manifest\" href=\"pwa/manifest.json\">"
      print "  <meta name=\"theme-color\" content=\"" theme "\">"
      added=1
      next
    }
    { print }
  ' "$backup" > "$INDEX_HTML.tmp" && mv "$INDEX_HTML.tmp" "$INDEX_HTML"
fi

if ! grep -qi 'navigator.serviceWorker.register' "$INDEX_HTML"; then
  awk '
    BEGIN { inserted=0 }
    /<\/body>/ && !inserted {
      print "  <script>"
      print "  if (\"serviceWorker\" in navigator) {"
      print "    window.addEventListener(\"load\", function() {"
      print "      navigator.serviceWorker.register(\"/pwa/sw.js\").catch(console.error);"
      print "    });"
      print "  }"
      print "  </script>"
      print
      inserted=1
      next
    }
    { print }
  ' "$INDEX_HTML" > "$INDEX_HTML.tmp" && mv "$INDEX_HTML.tmp" "$INDEX_HTML"
fi

echo "PWA scaffolding complete."
echo "Backed up original HTML to: $backup"
echo "Created: pwa/manifest.json, pwa/sw.js, pwa/offline.html, icons in pwa/"

