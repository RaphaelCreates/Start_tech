#!/usr/bin/env python3
import requests

def test_all_lines():
    print("Testando todas as linhas:")
    for i in range(1, 9):
        try:
            response = requests.get(f"http://localhost:8000/schedules/next?line_id={i}")
            if response.status_code == 200:
                data = response.json()
                if data:
                    print(f"Linha {i}: {data['line_name']} - {data['departure_time']} (em {data['minutes_until']} min)")
                else:
                    print(f"Linha {i}: Sem horários")
            else:
                print(f"Linha {i}: Erro {response.status_code}")
        except Exception as e:
            print(f"Linha {i}: Erro de conexão - {e}")

if __name__ == "__main__":
    test_all_lines()
