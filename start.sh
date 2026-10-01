#!/usr/bin/env bash
#
# Start the avatar rooms app — the page and its API are one process, so this
# is the only thing to run.
#
# Dev is the default. --prod builds first and then serves the build; the API
# runs inside Vite either way (dev server, or `vite preview`).
#
# Unlike the vx website, the database is required here: users and logins live
# in Neon, so a missing DATABASE_URL is a stop, not a warning.
#
#   ./start.sh                        dev on :3100
#   ./start.sh --prod --port 8080     build, then serve the build on :8080
#   ./start.sh --install --typecheck  install, typecheck, run dev

set -euo pipefail

# Every path here is relative to the project, not to wherever this was invoked.
cd "$(dirname "${BASH_SOURCE[0]}")"

PROD=0
BUILD=0
PORT=3100
INSTALL=0
TYPECHECK=0
CLEAN=0
DRY_RUN=0

if [ -t 1 ] ; then
  CYAN=$'\033[36m' ; YELLOW=$'\033[33m' ; GREEN=$'\033[32m' ; GREY=$'\033[90m' ; OFF=$'\033[0m'
else
  CYAN='' ; YELLOW='' ; GREEN='' ; GREY='' ; OFF=''
fi

step() { printf '%s→ %s%s\n' "$CYAN"   "$1" "$OFF" ; }
warn() { printf '%s! %s%s\n' "$YELLOW" "$1" "$OFF" ; }

usage() {
  cat <<'EOF'
Usage: ./start.sh [options]

  --prod            Build, then serve the build. Without it, the dev server runs.
  --build           Build and exit. Does not serve.
  --port <n>        Port to listen on (default 3100).
  --install         npm install before anything else.
  --typecheck       Run tsc --noEmit and stop if it fails.
  --clean           Delete dist/ before building.
  --dry-run         Print what would run, and run nothing.
  -h, --help        This.
EOF
}

while [ $# -gt 0 ] ; do
  case "$1" in
    --prod)      PROD=1 ;;
    --build)     BUILD=1 ;;
    --port)      PORT="${2:?--port needs a number}" ; shift ;;
    --port=*)    PORT="${1#*=}" ;;
    --install)   INSTALL=1 ;;
    --typecheck) TYPECHECK=1 ;;
    --clean)     CLEAN=1 ;;
    --dry-run)   DRY_RUN=1 ;;
    -h|--help)   usage ; exit 0 ;;
    *)           printf 'Unknown option: %s\n\n' "$1" >&2 ; usage >&2 ; exit 2 ;;
  esac
  shift
done

run() {
  local label="$1" ; shift
  step "$label"

  if [ "$DRY_RUN" -eq 1 ] ; then
    printf '%s  %s%s\n' "$GREY" "$*" "$OFF"
    return 0
  fi

  "$@"
}

[ -f package.json ] || { echo "No package.json here — run this from the project directory." >&2 ; exit 1 ; }

if [ ! -f .env ] ; then
  cp .env.example .env
  echo "Created .env from .env.example — fill in DATABASE_URL, VX_FLOW_API_KEY and VX_VOICEBOT_GPU, then run again." >&2
  exit 1
fi

if ! grep -qE '^[[:space:]]*DATABASE_URL[[:space:]]*=[[:space:]]*[^[:space:]]' .env ; then
  echo "DATABASE_URL is missing from .env — users and logins live in Neon." >&2
  exit 1
fi

if ! grep -qE '^[[:space:]]*VX_FLOW_API_KEY[[:space:]]*=[[:space:]]*[^[:space:]]' .env ; then
  warn 'VX_FLOW_API_KEY is not set — sign-in works, but every room will decline to start.'
fi

# Signs the session cookie. Generated once; changing it signs everyone out.
if ! grep -qE '^[[:space:]]*SESSION_SECRET[[:space:]]*=[[:space:]]*[^[:space:]]' .env \
   || grep -qE '^[[:space:]]*SESSION_SECRET[[:space:]]*=[[:space:]]*change-me[[:space:]]*$' .env ; then
  step 'Generating SESSION_SECRET'
  if [ "$DRY_RUN" -eq 0 ] ; then
    secret=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
    grep -vE '^[[:space:]]*SESSION_SECRET[[:space:]]*=' .env > .env.tmp || true
    echo "SESSION_SECRET=$secret" >> .env.tmp
    mv .env.tmp .env
  fi
fi

if [ "$INSTALL" -eq 1 ] ; then
  run 'Installing dependencies' npm install
elif [ ! -d node_modules ] ; then
  warn 'node_modules is missing — installing.'
  run 'Installing dependencies' npm install
fi

if [ "$TYPECHECK" -eq 1 ] ; then
  run 'Typechecking' npx tsc --noEmit
fi

if [ "$CLEAN" -eq 1 ] ; then
  step 'Cleaning dist/'
  [ "$DRY_RUN" -eq 1 ] || rm -rf dist
fi

if [ "$BUILD" -eq 1 ] ; then
  run 'Building' npm run build
  printf '\n%sBuilt into dist/. Serve it with: ./start.sh --prod --port %s%s\n' "$GREEN" "$PORT" "$OFF"
  exit 0
fi

printf '\n%sNo users yet? Create the super-admin first:%s\n' "$GREY" "$OFF"
printf "%s  npm run add-user -- admin <password> '*' --super%s\n" "$GREY" "$OFF"

if [ "$PROD" -eq 1 ] ; then
  run 'Building' npm run build
  printf '\n%sServing the build on http://localhost:%s%s\n\n' "$GREEN" "$PORT" "$OFF"
  run 'Starting' npx vite preview --port "$PORT"
else
  printf '\n%sDev server on http://localhost:%s%s\n\n' "$GREEN" "$PORT" "$OFF"
  run 'Starting' npx vite dev --port "$PORT"
fi
