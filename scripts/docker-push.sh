#!/usr/bin/env bash

set -e

# Default values
DOCKER_USER="${DOCKER_USER:-${1:-k0bus}}"
TAG="${TAG:-${2:-latest}}"

if [ -z "$DOCKER_USER" ]; then
  echo "❌ Error: DOCKER_USER is not set."
  echo "Usage: ./scripts/docker-push.sh <DOCKER_USER> [TAG]"
  echo "Example: DOCKER_USER=k0bus TAG=1.0.0 ./scripts/docker-push.sh"
  exit 1
fi

SERVICES=("backend" "frontend" "worker" "bot")

echo "🚀 Starting Docker build & push to Docker Hub..."
echo "👤 Docker Username / Namespace: ${DOCKER_USER}"
echo "🏷️  Tag: ${TAG}"
echo "--------------------------------------------------"

for SERVICE in "${SERVICES[@]}"; do
  IMAGE_NAME="${DOCKER_USER}/feedcraft-${SERVICE}"
  DOCKERFILE="apps/${SERVICE}/Dockerfile"

  if [ ! -f "$DOCKERFILE" ]; then
    echo "⚠️  Warning: $DOCKERFILE not found, skipping $SERVICE."
    continue
  fi

  echo ""
  echo "📦 Building ${SERVICE} -> ${IMAGE_NAME}:${TAG}..."
  docker build -f "$DOCKERFILE" -t "${IMAGE_NAME}:${TAG}" .

  if [ "$TAG" != "latest" ]; then
    echo "🏷️  Tagging ${SERVICE} as latest..."
    docker tag "${IMAGE_NAME}:${TAG}" "${IMAGE_NAME}:latest"
  fi

  echo "⬆️  Pushing ${IMAGE_NAME}:${TAG} to Docker Hub..."
  docker push "${IMAGE_NAME}:${TAG}"

  if [ "$TAG" != "latest" ]; then
    echo "⬆️  Pushing ${IMAGE_NAME}:latest to Docker Hub..."
    docker push "${IMAGE_NAME}:latest"
  fi

  echo "✅ ${SERVICE} successfully pushed!"
done

echo "--------------------------------------------------"
echo "🎉 All images successfully built and pushed to Docker Hub!"
