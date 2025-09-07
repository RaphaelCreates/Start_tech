import json

def load_drivers(path):
    try:
        with open(path, "r") as f:
            return json.load(f)
    except FileNotFoundError:
        return []

def validate_driver(card_id, drivers):
    return any(d["id"] == card_id for d in drivers)