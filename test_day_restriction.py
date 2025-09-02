#!/usr/bin/env python3
"""
Teste para verificar se só é possível registrar interesse no dia atual da semana
"""

import sys
import os
import requests
from datetime import datetime

# Adicionar o diretório atual ao path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_day_week_restriction():
    """Testar se registro de interesse está restrito ao dia atual da semana"""
    print("🧪 TESTANDO RESTRIÇÃO POR DIA DA SEMANA")
    print("=" * 60)
    
    base_url = "http://localhost:8000"
    
    # Verificar qual é o dia atual
    now = datetime.now()
    current_day = now.weekday() + 1  # Segunda = 1, Terça = 2, etc.
    days = ['', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo']
    
    print(f"📅 Hoje é {days[current_day]} (dia {current_day})")
    print(f"⏰ Horário atual: {now.strftime('%H:%M')}")
    
    try:
        # 1. Testar horário do dia atual (deve ser possível)
        print(f"\n1. 🟢 Testando horário de HOJE ({days[current_day]})...")
        response = requests.get(f"{base_url}/schedules/can-register-interest", params={
            "line_id": 1,
            "departure_time": "12:30"
        })
        
        if response.status_code == 200:
            data = response.json()
            can_register = data.get('can_register', False)
            print(f"   Resultado: {'✅ PERMITIDO' if can_register else '❌ NEGADO'}")
            if can_register:
                print(f"   ✅ Correto: Pode registrar interesse no dia atual")
            else:
                print(f"   ⚠️  Horário pode ter passado ou não existir para hoje")
        else:
            print(f"   ❌ Erro na API: {response.status_code}")
        
        # 2. Testar tentativa de registro no dia atual
        print(f"\n2. 🟢 Tentando REGISTRAR interesse hoje...")
        response = requests.post(f"{base_url}/schedules/register-interest", params={
            "line_id": 1,
            "departure_time": "12:30"
        })
        
        if response.status_code == 200:
            data = response.json()
            if 'message' in data:
                print(f"   ✅ SUCESSO: {data['message']}")
            else:
                print(f"   ⚠️  Resposta: {data}")
        else:
            print(f"   ❌ FALHOU: {response.text}")
        
        # 3. Verificar outros dias da semana (deve ser negado)
        print(f"\n3. 🔴 Testando outros dias da semana...")
        
        # Buscar horários de outros dias
        response = requests.get(f"{base_url}/lines")
        if response.status_code == 200:
            lines = response.json()
            if lines:
                line = lines[0]
                schedules = line.get('schedules', [])
                
                # Procurar um schedule de outro dia
                other_day_schedule = None
                for schedule in schedules:
                    if schedule.get('day_week') != current_day:
                        other_day_schedule = schedule
                        break
                
                if other_day_schedule:
                    other_day = other_day_schedule['day_week']
                    departure_time = other_day_schedule.get('departure_time_str', '06:00')
                    
                    print(f"   Testando horário de {days[other_day]} ({departure_time})...")
                    
                    # Testar can-register-interest
                    response = requests.get(f"{base_url}/schedules/can-register-interest", params={
                        "line_id": line['id'],
                        "departure_time": departure_time
                    })
                    
                    if response.status_code == 200:
                        data = response.json()
                        can_register = data.get('can_register', False)
                        print(f"   Resultado: {'❌ ERRO - PERMITIU' if can_register else '✅ CORRETO - NEGADO'}")
                        
                        if can_register:
                            print(f"   🚨 PROBLEMA: Sistema permitiu registro em outro dia!")
                        else:
                            print(f"   ✅ Correto: Sistema negou registro em outro dia")
                    else:
                        print(f"   ❌ Erro na API: {response.status_code}")
                else:
                    print(f"   ⚠️  Não encontrados schedules de outros dias para testar")
        
        print(f"\n4. 📋 RESUMO DO TESTE:")
        print(f"   • Só deve permitir registro no dia atual: {days[current_day]}")
        print(f"   • Outros dias devem ser negados automaticamente")
        print(f"   • API can-register-interest deve retornar false para outros dias")
        
    except requests.exceptions.ConnectionError:
        print("❌ Erro: Servidor não está rodando na porta 8000")
    except Exception as e:
        print(f"❌ Erro inesperado: {e}")

if __name__ == "__main__":
    test_day_week_restriction()
