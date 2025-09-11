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
gcloud run deploy $SERVICE_NAME \
    --image gcr.io/$PROJECT_ID/$SERVICE_NAME \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --add-cloudsql-instances $CONNECTION_NAME \
    --set-env-vars INSTANCE_CONNECTION_NAME=$CONNECTION_NAME,DB_USER=$DB_USER,DB_PASS=$DB_PASS,DB_NAME=$DB_NAME \
    --project $PROJECT_ID
