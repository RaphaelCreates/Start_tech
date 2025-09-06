import requests
import json

try:
    response = requests.get('http://localhost:8000/lines?state=SP')
    if response.status_code == 200:
        lines = response.json()
        for line in lines:
            print(f'Linha: {line["name"]}')
            if line['schedules']:
                print('   Horarios ordenados:')
                for schedule in line['schedules']:
                    print(f'   - {schedule["departure_time"]} (ID: {schedule["id"]})')
            else:
                print('   Sem horarios')
    else:
        print(f'Erro: {response.status_code}')
except Exception as e:
    print(f'Erro: {e}')
