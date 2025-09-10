import paho.mqtt.client as mqtt
import time


# Apontando para o  broker de teste público
MQTT_BROKER = "test.mosquitto.org"
MQTT_PORT = 1883
MQTT_TOPIC = "bus/#"

def on_connect(client, userdata, flags, rc):
    """Função chamada quando a conexão é estabelecida."""
    if rc == 0:
        print("Ouvinte conectado ao Broker MQTT público com sucesso!")
        client.subscribe(MQTT_TOPIC)
        print(f"A escutar no tópico: '{MQTT_TOPIC}'")
    else:

        print(f"Falha na conexão, código de retorno: {rc}")