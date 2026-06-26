#!/bin/bash

set -e # Exit immediately if a command exits with a non-zero status

AZURE_KEYVAULT_NAME="${AZURE_KEYVAULT_NAME:-speaking-character}"
NAMESPACE="${NAMESPACE:-speaking-character}"
export KUBECONFIG="${KUBECONFIG:-.kube/config}"

mkdir -p "$(dirname "$KUBECONFIG")"

az keyvault secret show --vault-name "$AZURE_KEYVAULT_NAME" --name k8s-config --query value --output tsv > "$KUBECONFIG"

chmod 0600 "$KUBECONFIG"

kubectl config set-context --current --namespace="$NAMESPACE" > /dev/null
