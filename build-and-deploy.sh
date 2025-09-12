#!/bin/bash

# Configurações
export PROJECT_ID=totvs-colab5
export REGION=us-east4
export CONNECTION_NAME=totvs-colab5:us-east4:fretotvs
export SERVICE_NAME=api-backend
export DB_USER=postgres
export DB_PASS=Postgres123!
export DB_NAME=postgres

# Build da imagem Docker e envio para o Container Registry
gcloud builds submit \
    --tag gcr.io/$PROJECT_ID/$SERVICE_NAME \
    --project $PROJECT_ID

# Deploy no Cloud Run
gcloud run deploy api-backend \
  --image gcr.io/totvs-colab5/api-backend \
  --platform managed \
  --region us-east4 \
  --allow-unauthenticated \
  --add-cloudsql-instances totvs-colab5:us-east4:fretotvs \
  --env-vars-file .env.yaml \
  --project totvs-colab5

