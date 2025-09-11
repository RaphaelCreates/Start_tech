FROM python:3.13-slim

# Instalar dependências do sistema
RUN apt-get update && apt-get install -y \
    wget \
    netcat-traditional \
    postgresql-client \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

RUN useradd --create-home appuser

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

COPY . .

# Configurar permissões
RUN mkdir -p /app/data \
    && chown -R appuser:appuser /app \
    && chmod +x entrypoint.sh

USER appuser

# Variáveis de ambiente
ENV DB_USER=postgres
ENV DB_PASS=""
ENV DB_NAME=postgres
ENV INSTANCE_CONNECTION_NAME=totvs-colab5:us-east4:fretotvs

VOLUME ["/app/data"]

EXPOSE 8080

# Usar script de entrypoint
ENTRYPOINT ["/app/entrypoint.sh"]