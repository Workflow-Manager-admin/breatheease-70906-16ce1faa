#!/bin/bash
cd /home/kavia/workspace/code-generation/breatheease-70906-16ce1faa/breathing_app_frontend_workspace/breathing_app_frontend
npm run lint
ESLINT_EXIT_CODE=$?
npm run build
BUILD_EXIT_CODE=$?
if [ $ESLINT_EXIT_CODE -ne 0 ] || [ $BUILD_EXIT_CODE -ne 0 ]; then
   exit 1
fi

