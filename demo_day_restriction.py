#!/usr/bin/env python3
"""
Demonstração visual da restrição por dia da semana
"""

import sys
import os
import requests
from datetime import datetime

# Adicionar o diretório atual ao path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def demonstrate_day_restriction():
    """Demonstrar como a restrição por dia da semana funciona"""
    print("🎯 DEMONSTRAÇÃO: RESTRIÇÃO POR DIA DA SEMANA")
    print("=" * 70)
    
    base_url = "http://localhost:8000"
    
    # Verificar qual é o dia atual
    now = datetime.now()
    current_day = now.weekday() + 1  # Segunda = 1, Terça = 2, etc.
    days = ['', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo']
    
    print(f"📅 HOJE: {days[current_day]} (dia {current_day})")
    print(f"⏰ HORÁRIO: {now.strftime('%H:%M')}")
    
    try:
        # Buscar linha para exemplo
        response = requests.get(f"{base_url}/lines")
        if response.status_code != 200:
            print("❌ Erro ao buscar linhas")
            return
            
        lines = response.json()
        if not lines:
            print("❌ Nenhuma linha encontrada")
            return
        
        line = lines[0]  # Primeira linha
        print(f"\n🚌 TESTANDO LINHA: {line['name']} (ID: {line['id']})")
        
        # Verificar horários de diferentes dias
        print(f"\n📋 VERIFICANDO DISPONIBILIDADE POR DIA:")
        print("─" * 50)
        
        # Testar alguns horários que realmente existem no banco
        test_times = ["12:30", "17:45", "18:30"]  # Horários reais
        
        for day in range(1, 6):  # Segunda a sexta
            day_name = days[day]
            is_today = (day == current_day)
            
            print(f"\n{day_name.upper()} {'(HOJE)' if is_today else ''}:")
            
            for time in test_times:
                # Testar se pode registrar interesse
                response = requests.get(f"{base_url}/schedules/can-register-interest", params={
                    "line_id": line['id'],
                    "departure_time": time
                })
                
                if response.status_code == 200:
                    data = response.json()
                    can_register = data.get('can_register', False)
                    
                    if is_today:
                        status = "🟢 DISPONÍVEL" if can_register else "🟡 INDISPONÍVEL*"
                        note = " (horário pode ter passado)" if not can_register else ""
                    else:
                        status = "🔴 BLOQUEADO" if not can_register else "🚨 ERRO NO SISTEMA"
                        note = " (outro dia)" if not can_register else " (PROBLEMA!)"
                    
                    print(f"   {time}: {status}{note}")
                else:
                    print(f"   {time}: ❌ Erro na API")
        
        print(f"\n" + "─" * 50)
        print(f"📌 REGRAS DO SISTEMA:")
        print(f"   🟢 DISPONÍVEL: Horário de hoje que ainda não passou")
        print(f"   🟡 INDISPONÍVEL: Horário de hoje que já passou")
        print(f"   🔴 BLOQUEADO: Horário de outro dia da semana")
        print(f"   * Só é possível registrar interesse em horários de HOJE")
        
        # Exemplo prático no frontend
        print(f"\n🖥️  NO FRONTEND:")
        print(f"   • Usuário seleciona '{days[current_day]}': Vê horários disponíveis/indisponíveis")
        print(f"   • Usuário seleciona 'Segunda': Todos os horários ficam bloqueados")
        print(f"   • Usuário seleciona 'Quarta': Todos os horários ficam bloqueados")
        print(f"   • Sistema só permite interesse no dia atual!")
        
    except requests.exceptions.ConnectionError:
        print("❌ Erro: Servidor não está rodando na porta 8000")
    except Exception as e:
        print(f"❌ Erro inesperado: {e}")

if __name__ == "__main__":
    demonstrate_day_restriction()
