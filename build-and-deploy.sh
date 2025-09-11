#!/bin/bash

export PROJECT_ID=totvs-colab5
export REGION=us-east4
export CONNECTION_NAME=totvs-colab5:us-east4:fretotvs
export SERVICE_NAME=api-backend   # novo nome do serviço

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
    --project $PROJECT_ID
