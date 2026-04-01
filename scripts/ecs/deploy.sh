#!/usr/bin/env bash

set -euo pipefail

APP_NAME="personal-web"
IMAGE_NAME="personal-web"
ENV_FILE=".env.server"
PORT="${PORT:-80}"
CONTAINER_PORT="${CONTAINER_PORT:-3000}"
ASSET_3DGS_DIR="${ASSET_3DGS_DIR:-/home/ecs-assist-user/personal-web/public/3dgs}"
BUILD_3DGS_DIR="$(pwd)/public/3dgs"

if [[ -z "${FITNESS_API_UPSTREAM_BASE_URL:-}" && -z "${GEMINI_API_KEY:-}" ]]; then
  echo "Either FITNESS_API_UPSTREAM_BASE_URL or GEMINI_API_KEY must be set." >&2
  exit 1
fi

cat > "${ENV_FILE}" <<EOF
FITNESS_API_UPSTREAM_BASE_URL=${FITNESS_API_UPSTREAM_BASE_URL:-}
GEMINI_API_KEY=${GEMINI_API_KEY:-}
GEMINI_MODEL=${GEMINI_MODEL:-gemini-2.5-flash}
EOF

if [[ ! -f "${ASSET_3DGS_DIR}/scene-metadata.json" ]]; then
  echo "Missing 3DGS asset manifest at ${ASSET_3DGS_DIR}/scene-metadata.json" >&2
  exit 1
fi

if [[ "$(readlink -f "${ASSET_3DGS_DIR}")" != "$(readlink -f "${BUILD_3DGS_DIR}")" ]]; then
  mkdir -p "$(dirname "${BUILD_3DGS_DIR}")"
  rm -rf "${BUILD_3DGS_DIR}"
  cp -a "${ASSET_3DGS_DIR}" "${BUILD_3DGS_DIR}"
fi

docker build -t "${IMAGE_NAME}" .
docker rm -f "${APP_NAME}" 2>/dev/null || true
docker run -d \
  --name "${APP_NAME}" \
  --restart unless-stopped \
  -p "${PORT}:${CONTAINER_PORT}" \
  --env-file "${ENV_FILE}" \
  "${IMAGE_NAME}"

sleep 3
curl -fsS "http://127.0.0.1:${PORT}/healthz" >/dev/null
echo "Deploy complete."
