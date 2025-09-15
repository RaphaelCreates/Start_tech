import json
import sys

def load_drivers(path):
    try:
        with open(path, "r", encoding='utf-8') as f:
            print("[INFO] Ficheiro de motoristas 'drivers.json' carregado com sucesso.")
            return json.load(f)
    except FileNotFoundError:
        # AGORA, em vez de continuar silenciosamente, ele vai parar e avisar.
        print(f"\n[ERRO CRÍTICO] O ficheiro de motoristas '{path}' não foi encontrado!")
        print("Certifique-se de que o ficheiro 'drivers.json' existe e está na mesma pasta que o 'main.py'.\n")
        sys.exit(1)

def validate_driver(card_id, drivers):
    return any(d["id"] == card_id for d in drivers)