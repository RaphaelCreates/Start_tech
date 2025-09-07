import threading
from utils import intermittent_beep, current_timestamp
from queue import Queue

route_confirmed = False
current_line = None
current_driver = None

def request_driver_route(app_input_func, card_id, mqtt_client, bus_prefix, max_capacity):
    global route_confirmed, current_line
    print(f"[APP] Driver {card_id} must select a route.")
    current_line = app_input_func()
    route_confirmed = True
    print(f"[APP] Route confirmed: {current_line}")
    payload = {
        "action": "start_route",
        "bus_prefix": bus_prefix,
        "driver_id": card_id,
        "line": current_line,
        "capacity": max_capacity,
        "timestamp": current_timestamp()
    }
    mqtt_client.publish(f"bus/{bus_prefix}/driver_event", payload=str(payload), qos=1)

def process_card(card_id, driver_ids, queue: Queue, mqtt_client, bus_prefix):
    global route_confirmed, current_line, current_driver

    if card_id in driver_ids:
        current_driver = card_id
        if not route_confirmed:
            threading.Thread(
                target=request_driver_route,
                args=(lambda: input("Enter chosen line: ").strip(), card_id, mqtt_client, bus_prefix, queue.max_capacity)
            ).start()
        else:
            payload = {
                "action": "end_route",
                "bus_prefix": bus_prefix,
                "driver_id": card_id,
                "line": current_line,
                "queue_count": queue.count(),
                "timestamp": current_timestamp()
            }
            mqtt_client.publish(f"bus/{bus_prefix}/driver_event", payload=str(payload), qos=1)
            print(f"[INFO] Route ended by driver {card_id}.")
            queue.reset()
            route_confirmed = False
            current_line = None
            current_driver = None
    else:
        if not route_confirmed:
            intermittent_beep()
            return
        if queue.add_passenger(card_id):
            payload = {
                "action": "passenger_entry",
                "line": current_line,
                "passenger_id": card_id,
                "queue_count": queue.count(),
                "timestamp": current_timestamp()
            }
            mqtt_client.publish(f"bus/{bus_prefix}/queue", payload=str(payload), qos=1)
