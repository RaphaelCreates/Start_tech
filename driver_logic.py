import threading
from utils import intermittent_beep, current_timestamp
from queue_func import Queue

# Variáveis globais para gerir o estado da viagem
route_confirmed = False
current_line = None
current_driver = None

def request_driver_route(app_input_func, card_id, mqtt_client, bus_prefix, max_capacity):
    """Função que corre em segundo plano para pedir a rota ao motorista."""
    global route_confirmed, current_line
    print(f"[APP] Motorista {card_id} deve selecionar a rota.")
    current_line = app_input_func() # Espera o input do motorista
    route_confirmed = True
    print(f"[APP] Rota confirmada: {current_line}")
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
    """
    Função principal que processa cada leitura de crachá.
    """
    global route_confirmed, current_line, current_driver

    if card_id in driver_ids:
        # LÓGICA DO MOTORISTA
        current_driver = card_id
        if not route_confirmed:
            # Primeira vez que o motorista passa o cartão: pede a rota
            print(f"[AÇÃO] Motorista {card_id} iniciou o processo de abertura de rota.")
            threading.Thread(
                target=request_driver_route,
                args=(lambda: input("Digite a linha escolhida: ").strip(), card_id, mqtt_client, bus_prefix, queue.max_capacity)
            ).start()
        else:
            # Segunda vez: encerra a rota
            payload = {
                "action": "end_route",
                "bus_prefix": bus_prefix,
                "driver_id": card_id,
                "line": current_line,
                "queue_count": queue.count(),
                "timestamp": current_timestamp()
            }
            mqtt_client.publish(f"bus/{bus_prefix}/driver_event", payload=str(payload), qos=1)
            print(f"[AÇÃO] Rota encerrada pelo motorista {card_id}.")
            queue.reset()
            route_confirmed = False
            current_line = None
            current_driver = None
    else:
        # LÓGICA DO PASSAGEIRO
        if not route_confirmed:
            print("[AVISO] A viagem ainda não foi iniciada. Embarque não permitido.")
            intermittent_beep()
            return
        
        # Lógica de Check-in e Check-out
        action_result = queue.process_passenger(card_id)

        if action_result == "CHECKIN":
            payload = {
                "action": "passenger_entry",
                "line": current_line,
                "passenger_id": card_id,
                "queue_count": queue.count(),
                "timestamp": current_timestamp()
            }
            mqtt_client.publish(f"bus/{bus_prefix}/queue", payload=str(payload), qos=1)
            print(f"[AÇÃO] Passageiro {card_id} entrou (Check-in).")

        elif action_result == "CHECKOUT":
            payload = {
                "action": "passenger_exit", 
                "line": current_line,
                "passenger_id": card_id,
                "queue_count": queue.count(),
                "timestamp": current_timestamp()
            }
            mqtt_client.publish(f"bus/{bus_prefix}/queue", payload=str(payload), qos=1)
            print(f"[AÇÃO] Passageiro {card_id} saiu (Check-out).")
        else:
            # Se action_result for None, a fila está cheia
            print(f"[AVISO] Fila cheia. O passageiro {card_id} não pode entrar.")

