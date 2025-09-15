import threading
from utils import intermittent_beep, current_timestamp
from queue_func import Queue
from routes import get_route_by_name

# As variáveis de estado permanecem as mesmas
route_confirmed = False
current_line = None
current_driver = None

def request_driver_route_and_set_capacity(card_id, mqtt_client, bus_prefix, queue: Queue, routes: list):
    """
    Função SIMPLIFICADA que agora corre no fluxo principal.
    Pede a rota, valida-a e define a capacidade da fila.
    """
    global route_confirmed, current_line
    
    print(f"[APP] Motorista {card_id} deve selecionar uma rota válida.")
    
    selected_route_data = None
    while not selected_route_data:
        # O input agora acontece aqui, de forma direta.
        chosen_line = input("Digite a linha escolhida: ").strip()
        selected_route_data = get_route_by_name(chosen_line, routes)
        if not selected_route_data:
            print(f"[AVISO] Rota '{chosen_line}' não encontrada. Tente novamente (Ex: LINHA-CENTRO).")

    current_line = selected_route_data["name"]
    route_capacity = selected_route_data["capacity"]
    
    queue.update_capacity(route_capacity)
    route_confirmed = True
    print(f"[APP] Rota confirmada: {current_line}")
    
    payload = {
        "action": "start_route",
        "bus_prefix": bus_prefix,
        "driver_id": card_id,
        "line": current_line,
        "capacity": route_capacity,
        "timestamp": current_timestamp()
    }
    mqtt_client.publish(f"bus/{bus_prefix}/driver_event", payload=str(payload), qos=1)

def process_card(card_id, driver_ids, queue: Queue, mqtt_client, bus_prefix, routes: list):
    """
    Função principal de processamento, agora sem threading para pedir a rota.
    """
    global route_confirmed, current_line, current_driver

    if card_id in driver_ids:
        current_driver = card_id
        if not route_confirmed:
            
            # O programa  espera que a rota seja inserida.
            request_driver_route_and_set_capacity(card_id, mqtt_client, bus_prefix, queue, routes)
        else:
            #  lógica para terminar a rota 
            payload = { "action": "end_route", "bus_prefix": bus_prefix, "driver_id": card_id, "line": current_line, "queue_count": queue.count(), "timestamp": current_timestamp() }
            mqtt_client.publish(f"bus/{bus_prefix}/driver_event", payload=str(payload), qos=1)
            print(f"[AÇÃO] Rota encerrada pelo motorista {card_id}.")
            queue.reset()
            route_confirmed = False
            current_line = None
            current_driver = None
    else:
        # lógica do passageiro .
        if not route_confirmed:
            print("[AVISO] A viagem ainda não foi iniciada. Embarque não permitido.")
            intermittent_beep()
            return
        
        action_result = queue.process_passenger(card_id)

        if action_result == "CHECKIN":
            payload = { "action": "passenger_entry", "line": current_line, "passenger_id": card_id, "queue_count": queue.count(), "timestamp": current_timestamp() }
            mqtt_client.publish(f"bus/{bus_prefix}/queue", payload=str(payload), qos=1)
            print(f"[AÇÃO] Passageiro {card_id} entrou (Check-in).")
        elif action_result == "CHECKOUT":
            payload = { "action": "passenger_exit", "line": current_line, "passenger_id": card_id, "queue_count": queue.count(), "timestamp": current_timestamp() }
            mqtt_client.publish(f"bus/{bus_prefix}/queue", payload=str(payload), qos=1)
            print(f"[AÇÃO] Passageiro {card_id} saiu (Check-out).")

