#!/usr/bin/env python3
"""
Teste do novo sistema simplificado
"""

import sys
import os
import requests
from datetime import datetime

# Adicionar o diretório atual ao path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_new_system():
    """Testar o novo sistema simplificado"""
    print("🧪 TESTANDO NOVO SISTEMA SIMPLIFICADO")
    print("=" * 50)
    
    base_url = "http://localhost:8000"
    
    try:
        # 1. Testar busca de próximo horário
        print("1. Testando busca de próximo horário...")
        response = requests.get(f"{base_url}/schedules/next?line_id=1")
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Próximo horário: {data['departure_time']} (linha {data['line_name']})")
        else:
            print(f"   ❌ Erro: {response.status_code}")
        
        # 2. Testar busca por horário específico
        print("\n2. Testando busca por horário específico...")
        response = requests.get(f"{base_url}/schedules/by-line-time?line_id=1&departure_time=12:30")
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Horário encontrado: {data['departure_time']} (interesse: {data['interest']})")
        else:
            print(f"   ❌ Erro: {response.status_code}")
        
        # 3. Testar registro de interesse
        print("\n3. Testando registro de interesse...")
        response = requests.post(f"{base_url}/schedules/register-interest", params={
            "line_id": 1,
            "departure_time": "12:30"
        })
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Interesse registrado: {data.get('message', 'OK')}")
        else:
            print(f"   ❌ Erro: {response.status_code} - {response.text}")
        
        # 4. Testar listagem de todas as linhas
        print("\n4. Testando listagem de linhas...")
        response = requests.get(f"{base_url}/lines")
        if response.status_code == 200:
            lines = response.json()
            print(f"   ✅ Encontradas {len(lines)} linhas")
            for line in lines[:3]:
                print(f"      - {line['name']} (ID: {line['id']})")
        else:
            print(f"   ❌ Erro: {response.status_code}")
        
        print("\n✨ TESTE CONCLUÍDO!")
        print("Se todos os testes passaram, o sistema está funcionando!")
        
    except requests.exceptions.ConnectionError:
        print("❌ Erro: Servidor não está rodando na porta 8000")
        print("Execute: uvicorn main:app --reload --host 0.0.0.0 --port 8000")
    except Exception as e:
        print(f"❌ Erro inesperado: {e}")

if __name__ == "__main__":
    test_new_system()
