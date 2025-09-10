import json
import sys

def load_routes(path):
    """Carrega a lista de rotas a partir de um ficheiro JSON."""
    try:
        with open(path, "r") as f:
            print("[INFO] Ficheiro de rotas 'routes.json' carregado com sucesso.")
            return json.load(f)
    except FileNotFoundError:
        print(f"[ERRO CRÍTICO] O ficheiro de rotas '{path}' não foi encontrado!")
        sys.exit(1)

def get_route_by_name(route_name, routes):
    """Procura uma rota pelo nome e retorna os seus dados."""
    for route in routes:
        if route["name"].lower() == route_name.lower():
            return route
    return None