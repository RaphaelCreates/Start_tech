import paho.mqtt.client as mqtt
from config import MQTT_BROKER, MQTT_PORT

def create_mqtt_client(on_connect=None):
    client = mqtt.Client()
    if on_connect:
        client.on_connect = on_connect
    client.connect(MQTT_BROKER, MQTT_PORT, 60)
    client.loop_start()
    return client
