#!/bin/bash

# Configurações
export PROJECT_ID=totvs-colab5
export REGION=us-east4
export CONNECTION_NAME=totvs-colab5:us-east4:fretotvs
export SERVICE_NAME=fretotvs-simulator

# Build da imagem Docker e envio para o Container Registry
gcloud builds submit \
    --tag gcr.io/$PROJECT_ID/$SERVICE_NAME \
    --project $PROJECT_ID

# Deploy no Cloud Run
gcloud run deploy fretotvs-simulator \
  --image gcr.io/totvs-colab5/fretotvs-simulator \
  --platform managed \
  --set-env-vars NEXT_PUBLIC_API_BASE_URL=https://api-backend-506595925688.us-east4.run.app \
  --region us-east4 \
  --allow-unauthenticated \
  --add-cloudsql-instances totvs-colab5:us-east4:fretotvs \
  --project totvs-colab5

