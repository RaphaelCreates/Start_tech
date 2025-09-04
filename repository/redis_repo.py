import redis
from schemas.pass_schema import PassPayload

redis_url = "redis://rate-limiter:rpEhJNujv79=@redis-19019.c91.us-east-1-3.ec2.redns.redis-cloud.com:19019/0"

r = redis.from_url(redis_url, encoding="utf-8", decode_responses=True)


def pass_person(payload: PassPayload):
    set_key = f"trip:{payload.schedule_id}:people"
    count_key = f"trip:{payload.schedule_id}:count"

    # verifica se a pessoa já está na fila
    if r.sismember(set_key, payload.user_id):
        # já passou antes → remove da fila
        r.srem(set_key, payload.user_id)
        r.decr(count_key)
        action = "removed"
    else:
        # primeira vez → adiciona na fila
        r.sadd(set_key, payload.user_id)
        r.incr(count_key)
        action = "added"

    # retorna status atual da fila
    current_count = int(r.get(count_key) or 0)
    return {
        "action": action,
        "current_count": current_count,
        "people_in_queue": r.smembers(set_key)
    }
    
    
def get_trip_count(schedule_id: int):
    count_key = f"trip:{schedule_id}:count"
    set_key = f"trip:{schedule_id}:people"
    return {
        "count": int(r.get(count_key) or 0),
        "people_in_queue": list(r.smembers(set_key))
    }