#!/bin/bash

# Configurações
export PROJECT_ID=totvs-colab5
export REGION=us-east4
export CONNECTION_NAME=totvs-colab5:us-east4:fretotvs
export SERVICE_NAME=fretotvs-interface

# Build da imagem Docker e envio para o Container Registry
gcloud builds submit \
    --tag gcr.io/$PROJECT_ID/$SERVICE_NAME \
    --project $PROJECT_ID

# Deploy no Cloud Run
gcloud run deploy $SERVICE_NAME \
  --image gcr.io/$PROJECT_ID/$SERVICE_NAME \
  --platform managed \
  --set-env-vars NEXT_PUBLIC_API_BASE_URL=https://api-backend-506595925688.us-east4.run.app \
  --region us-east4 \
  --allow-unauthenticated \
  --add-cloudsql-instances $CONNECTION_NAME \
  --project $PROJECT_ID

