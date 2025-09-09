FROM python:3.13-slim

RUN apt-get update && apt-get upgrade -y && apt-get clean

RUN useradd --create-home appuser

WORKDIR /app

COPY requirements.txt ./

RUN pip install --no-cache-dir --upgrade pip \
	&& pip install --no-cache-dir -r requirements.txt

COPY . .

RUN mkdir -p /app/data && \
    chown -R appuser:appuser /app

USER appuser

ENV DATABASE_URL=sqlite+aiosqlite:///app/data/db.db
ENV PORT=8000

EXPOSE $PORT

VOLUME ["/app/data"]

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]