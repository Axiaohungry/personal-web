#!/usr/bin/env bash

set -euo pipefail

APP_NAME="personal-web"
IMAGE_NAME="personal-web"
ENV_FILE=".env.server"
MODE="${MODE:-proxy}"
PORT="${PORT:-80}"
CONTAINER_PORT="${CONTAINER_PORT:-3000}"
HEALTHCHECK_RETRIES="${HEALTHCHECK_RETRIES:-10}"
HEALTHCHECK_DELAY_SECONDS="${HEALTHCHECK_DELAY_SECONDS:-2}"
ASSET_3DGS_DIR="${ASSET_3DGS_DIR:-/home/ecs-assist-user/personal-web/public/3dgs}"
BUILD_3DGS_DIR="$(pwd)/public/3dgs"

case "${MODE}" in
  proxy)
    if [[ -z "${FITNESS_API_UPSTREAM_BASE_URL:-}" ]]; then
      echo "MODE=proxy requires FITNESS_API_UPSTREAM_BASE_URL" >&2
      exit 1
    fi

    cat > "${ENV_FILE}" <<EOF
FITNESS_API_UPSTREAM_BASE_URL=${FITNESS_API_UPSTREAM_BASE_URL}
GEMINI_API_KEY=
GEMINI_MODEL=
EOF

    echo "Deploy mode: proxy"
    echo "Upstream fitness API: ${FITNESS_API_UPSTREAM_BASE_URL}"
    ;;
  local)
    if [[ -z "${GEMINI_API_KEY:-}" ]]; then
      echo "MODE=local requires GEMINI_API_KEY" >&2
      exit 1
    fi

    cat > "${ENV_FILE}" <<EOF
FITNESS_API_UPSTREAM_BASE_URL=
GEMINI_API_KEY=${GEMINI_API_KEY}
GEMINI_MODEL=${GEMINI_MODEL:-gemini-2.5-flash}
EOF

    echo "Deploy mode: local"
    echo "Local Gemini model: ${GEMINI_MODEL:-gemini-2.5-flash}"
    ;;
  *)
    echo "MODE must be proxy or local" >&2
    exit 1
    ;;
esac

if [[ ! -f "${ASSET_3DGS_DIR}/scene-metadata.json" ]]; then
  echo "Missing 3DGS asset manifest at ${ASSET_3DGS_DIR}/scene-metadata.json" >&2
  exit 1
fi

if [[ "$(readlink -f "${ASSET_3DGS_DIR}")" != "$(readlink -f "${BUILD_3DGS_DIR}")" ]]; then
  echo "Syncing 3DGS assets from ${ASSET_3DGS_DIR} to ${BUILD_3DGS_DIR}"
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

for attempt in $(seq 1 "${HEALTHCHECK_RETRIES}"); do
  if curl -fsS "http://127.0.0.1:${PORT}/healthz" >/dev/null; then
    echo "Deploy complete."
    exit 0
  fi

  sleep "${HEALTHCHECK_DELAY_SECONDS}"
done

echo "Health check failed. Container state:"
docker ps -a
echo "Container logs:"
docker logs "${APP_NAME}" --tail 200 || true
exit 1
