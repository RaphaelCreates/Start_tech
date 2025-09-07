from config import BUS_PREFIX, MAX_CAPACITY, DRIVERS_JSON
from drivers import load_drivers
from queue import Queue
from driver_logic import process_card
from mqtt_client import create_mqtt_client

def main():
    print("=== Raspberry Queue Simulator ===")
    print(f"Bus prefix: {BUS_PREFIX}, max capacity: {MAX_CAPACITY}")

    drivers = load_drivers(DRIVERS_JSON)
    driver_ids = {d["id"] for d in drivers}

    queue = Queue(MAX_CAPACITY)
    mqtt_client = create_mqtt_client()

    while True:
        card_id = input("Swipe card (enter ID): ").strip()
        if card_id:
            process_card(card_id, driver_ids, queue, mqtt_client, BUS_PREFIX)

if __name__ == "__main__":
    main()
