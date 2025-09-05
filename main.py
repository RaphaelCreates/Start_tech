import redis
import requests
import time
import threading

# ===========================
# CONFIGURAÇÕES
# ===========================
REDIS_URL = "redis://localhost:6379/0"
CENTRAL_URL = "http://YOUR_CENTRAL_API:8000"   # <-- ALTERE para o endpoint do servidor central
DRIVER_API = "http://YOUR_LOGIN_API/drivers"   # <-- ALTERE para endpoint de motoristas
SYNC_INTERVAL = 60  # tempo em segundos entre sincronizações

# ===========================
# REDIS CONNECTION
# ===========================
r = redis.from_url(REDIS_URL)


# ===========================
# DRIVERS (CACHE)
# ===========================
def sync_drivers():
    """Busca motoristas da API de login e armazena em cache no Redis"""
    try:
        resp = requests.get(DRIVER_API, timeout=5)
        resp.raise_for_status()
        drivers = resp.json()  # esperado: lista [{"id": "1", "name": "John"}, ...]

        for d in drivers:
            r.hset("drivers", d["id"], d["name"])

        print(f"[SYNC] {len(drivers)} drivers updated in cache")

    except Exception as e:
        print(f"[SYNC ERROR] {e}")


def get_driver_name(driver_id: str) -> str:
    """Obtém o nome do motorista pelo ID (do cache Redis)"""
    name = r.hget("drivers", driver_id)
    return name.decode() if name else f"Driver_{driver_id}"


def sync_drivers_loop():
    """Roda em thread separada atualizando os motoristas periodicamente"""
    while True:
        sync_drivers()
        time.sleep(SYNC_INTERVAL)


# ===========================
# DRIVER (QUEUE CONTROL)
# ===========================
def process_driver(driver_id: str):
    """
    Controla a lógica do motorista:
    - 1ª vez abre a fila
    - 2ª vez fecha a fila
    - 3ª vez gera report e reseta
    """
    driver_name = get_driver_name(driver_id)
    key = f"driver:{driver_id}:counter"
    count = r.incr(key)

    if count == 1:
        print(f"[OPENING QUEUE] {driver_name} ({driver_id})")
        r.set("active_driver", driver_id)
        r.set("passengers_count", 0)
        requests.post(f"{CENTRAL_URL}/queue/status", json={
            "driver_id": driver_id,
            "driver_name": driver_name,
            "status": "open"
        })

    elif count == 2:
        print(f"[CLOSING QUEUE] {driver_name} ({driver_id})")
        requests.post(f"{CENTRAL_URL}/queue/status", json={
            "driver_id": driver_id,
            "driver_name": driver_name,
            "status": "closed"
        })

    elif count == 3:
        print(f"[FINALIZING QUEUE] {driver_name} ({driver_id})")
        passengers = int(r.get("passengers_count") or 0)

        requests.post(f"{CENTRAL_URL}/queue/report", json={
            "driver_id": driver_id,
            "driver_name": driver_name,
            "total_passengers": passengers
        })

        # reset
        r.delete(key)
        r.delete("active_driver")
        r.delete("passengers_count")


# ===========================
# PASSENGERS
# ===========================
def process_passenger(passenger_id: str):
    active_driver = r.get("active_driver")
    if not active_driver:
        print("No active queue. Passenger ignored.")
        return

    active_driver = active_driver.decode()
    passenger_key = f"passenger:{passenger_id}"

    if r.exists(passenger_key):
        r.delete(passenger_key)
        r.decr("passengers_count")
        print(f"[PASSENGER LEFT] {passenger_id}")
    else:
        r.set(passenger_key, 1)
        r.incr("passengers_count")
        print(f"[PASSENGER ENTERED] {passenger_id}")

    passengers = int(r.get("passengers_count") or 0)
    requests.post(f"{CENTRAL_URL}/queue/update", json={
        "driver_id": active_driver,
        "count": passengers
    })


# ===========================
# MAIN LOOP
# ===========================
def main():
    print(">>> Queue system running on Raspberry...")

    # inicia sync de motoristas em thread separada
    threading.Thread(target=sync_drivers_loop, daemon=True).start()

    while True:
        badge = input("Scan badge (M{id} or P{id}, sync, exit): ")
        if badge == "exit":
            break

        if badge == "sync":
            sync_drivers()
            continue

        if badge.startswith("M"):
            driver_id = badge.replace("M", "")
            process_driver(driver_id)

        elif badge.startswith("P"):
            passenger_id = badge.replace("P", "")
            process_passenger(passenger_id)

        else:
            print("Invalid badge. Use M{id} or P{id}.")

        time.sleep(1)


if __name__ == "__main__":
    main()