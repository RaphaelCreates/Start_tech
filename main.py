from config import BUS_PREFIX, DRIVERS_JSON, ROUTES_JSON
from drivers import load_drivers
from routes import load_routes
from queue_func import Queue
from driver_logic import process_card
from mqtt_client import create_mqtt_client

def main():
    print("=== Raspberry Queue Simulator ===")
    print(f"Bus prefix: {BUS_PREFIX}")

    # Carrega os dados de motoristas e rotas no início
    drivers = load_drivers(DRIVERS_JSON)
    routes = load_routes(ROUTES_JSON)
    driver_ids = {d["id"] for d in drivers}

    # A fila começa sem uma capacidade máxima definida.
    
    queue = Queue() 
    mqtt_client = create_mqtt_client()

    while True:
        card_id = input("Swipe card (enter ID): ").strip()
        if card_id:
            # Passa a lista de rotas para o processador de cartões
            process_card(card_id, driver_ids, queue, mqtt_client, BUS_PREFIX, routes)

if __name__ == "__main__":
    main()

