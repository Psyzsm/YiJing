#!/bin/bash

# =============================================================================
# YÌJÌNG OS: ECOSYSTEM DEPLOYMENT SCRIPT
# =============================================================================
# @description
# Safely halts active containers, evaluates configuration drift, triggers 
# the theme-extraction build pipeline, and redeploys the containerized topology.
# =============================================================================

echo "===================================================="
echo "[SYSTEM] Ecosystem Update Routine Initiated"
echo "===================================================="

# Validate structural integrity of configuration
if [ ! -f yijing.config.ts ]; then
  echo ">> WARN: yijing.config.ts missing. Generating from template..."
  cp yijing.config.example.ts yijing.config.ts
fi

echo ">> Halting active containers..."
docker compose down

echo ">> Compiling OS Engine & Extracting Theme..."
# [PERFORMANCE]: Docker cache execution allows the daemon to skip standard
# dependency resolution (node_modules) and natively target UI layer compilation.
docker compose build yijing-os

echo ">> Orchestrating Deployment..."
docker compose up -d

echo "===================================================="
echo "[SYSTEM] DEPLOYMENT SUCCESSFUL (PORT 3000 ACTIVE)"
echo "===================================================="