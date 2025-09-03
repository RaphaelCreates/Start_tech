import redis, os

redis_url = "redis://rate-limiter:rpEhJNujv79=@redis-19019.c91.us-east-1-3.ec2.redns.redis-cloud.com:19019/0"

r = redis.from_url(redis_url, encoding="utf-8", decode_responses=True)

def enqueue_request(request_id: str, ):
    r.lpush("request_queue", request_id)

def dequeue_request() -> str | None:
    return r.rpop("request_queue")
