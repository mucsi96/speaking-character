#!/bin/bash

set -e  # Exit immediately if a command exits with a non-zero status

: "${AZURE_KEYVAULT_NAME:?Environment variable AZURE_KEYVAULT_NAME is required}"
: "${DOCKERHUB_USERNAME:?Environment variable DOCKERHUB_USERNAME is required}"

RELEASE_NAME=speaking-character

# Create a temporary file in /dev/shm (RAM) to avoid writing to disk
KUBECONFIG=$(mktemp /dev/shm/kubeconfig.XXXXXX)
export KUBECONFIG

# Ensure the temporary file is deleted when the script exits
trap 'rm -f "$KUBECONFIG"' EXIT

"$(dirname "$0")/pull_kubeconfig.sh"

# Pull deployment configuration and secrets from the Azure Key Vault.
HOSTNAME=$(az keyvault secret show --vault-name "$AZURE_KEYVAULT_NAME" --name hostname --query value -o tsv)
API_CLIENT_ID=$(az keyvault secret show --vault-name "$AZURE_KEYVAULT_NAME" --name api-client-id --query value -o tsv)
ELEVENLABS_API_KEY=$(az keyvault secret show --vault-name "$AZURE_KEYVAULT_NAME" --name elevenlabs-api-key --query value -o tsv)
ELEVENLABS_VOICE_ID=$(az keyvault secret show --vault-name "$AZURE_KEYVAULT_NAME" --name elevenlabs-voice-id --query value -o tsv)

# Latest published image tag (skip the floating "latest" tag).
latestTag=$(curl -s "https://registry.hub.docker.com/v2/repositories/$DOCKERHUB_USERNAME/speaking-character/tags" | jq -r '.results | map(select(.name != "latest")) | sort_by(.last_updated) | reverse | .[0].name')

echo "Updating Helm repositories..."
helm repo add mucsi96 https://mucsi96.github.io/k8s-helm-charts --force-update

nodeAppChartVersion=$(helm search repo mucsi96/node-app --output json | jq -r '.[0].version')

echo "Deploying $DOCKERHUB_USERNAME/speaking-character:$latestTag using node-app chart $nodeAppChartVersion"

helm upgrade $RELEASE_NAME mucsi96/node-app \
    --install \
    --version $nodeAppChartVersion \
    --set image=$DOCKERHUB_USERNAME/speaking-character:$latestTag \
    --set host=$HOSTNAME \
    --set appPort=8080 \
    --set basePath=/ \
    --set clientId=$API_CLIENT_ID \
    --set serviceAccountName=speaking-character-workload-identity \
    --set env.PORT=8080 \
    --set env.CACHE_DIR=/app/cache \
    --set env.ELEVENLABS_MODEL_ID=eleven_multilingual_v2 \
    --set env.ELEVENLABS_API_KEY=$ELEVENLABS_API_KEY \
    --set env.ELEVENLABS_VOICE_ID=$ELEVENLABS_VOICE_ID \
    --set resources.requests.memory=128Mi \
    --set resources.requests.cpu=50m \
    --set resources.limits.memory=256Mi \
    --set resources.limits.cpu=500m \
    --wait
