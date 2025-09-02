#!/usr/bin/env python3
"""
Resumo completo dos dados de schedules criados
"""

import requests
from datetime import datetime

def show_complete_summary():
    """Mostra resumo completo dos dados"""
    print("📊 RESUMO COMPLETO DOS SCHEDULES CRIADOS")
    print("=" * 50)
    
    # Data atual
    now = datetime.now()
    print(f"🕐 Data/Hora atual: {now.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"📅 Dia da semana: {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'][now.weekday()]}")
    
    # Buscar todas as linhas
    try:
        lines_response = requests.get("http://127.0.0.1:8000/lines/")
        if lines_response.status_code != 200:
            print("❌ Erro ao buscar linhas")
            return
            
        lines = lines_response.json()
        print(f"\n🚌 {len(lines)} linhas disponíveis")
        
        # Testar schedule_timer para cada linha
        print("\n🎯 STATUS DAS LINHAS (schedule_timer):")
        print("-" * 40)
        
        for line in lines:
            line_id = line['id']
            line_name = line['name']
            
            try:
                timer_response = requests.get(f"http://127.0.0.1:8000/schedules/timer/{line_id}")
                if timer_response.status_code == 200:
                    timer_result = timer_response.json()
                    
                    if timer_result is True:
                        status = "🟢 Ônibus no local"
                        details = ""
                    elif timer_result is False:
                        status = "🔵 Próximo horário hoje"
                        # Buscar detalhes do próximo
                        next_response = requests.get(f"http://127.0.0.1:8000/schedules/next?line_id={line_id}&today_only=true")
                        if next_response.status_code == 200:
                            next_data = next_response.json()
                            if next_data:
                                time_str = next_data.get("departure_time", "")
                                minutes = next_data.get("minutes_until", 0)
                                details = f"({time_str} - em {minutes} min)"
                            else:
                                details = "(erro nos detalhes)"
                        else:
                            details = "(erro nos detalhes)"
                    elif timer_result is None:
                        status = "🔴 Sem horários hoje"
                        details = ""
                    else:
                        status = f"❓ Desconhecido: {timer_result}"
                        details = ""
                    
                    print(f"  {line_name:12} (ID {line_id}): {status} {details}")
                    
                else:
                    print(f"  {line_name:12} (ID {line_id}): ❌ Erro {timer_response.status_code}")
                    
            except Exception as e:
                print(f"  {line_name:12} (ID {line_id}): ❌ Erro - {e}")
        
        # Mostrar estatísticas gerais
        schedules_response = requests.get("http://127.0.0.1:8000/schedules/")
        if schedules_response.status_code == 200:
            schedules = schedules_response.json()
            
            print(f"\n📈 ESTATÍSTICAS GERAIS:")
            print("-" * 30)
            print(f"Total de schedules: {len(schedules)}")
            
            # Contar por dia da semana
            day_counts = {}
            for schedule in schedules:
                day = schedule.get("day_week")
                day_counts[day] = day_counts.get(day, 0) + 1
            
            dia_nomes = {1: "Segunda", 2: "Terça", 3: "Quarta", 4: "Quinta", 5: "Sexta"}
            print("\nPor dia da semana:")
            for day in sorted(day_counts.keys()):
                day_name = dia_nomes.get(day, f"Dia {day}")
                count = day_counts[day]
                print(f"  {day_name}: {count} horários")
                
        print(f"\n✅ Sistema funcionando com {len(lines)} linhas e dados diversificados!")
        
    except Exception as e:
        print(f"❌ Erro geral: {e}")

if __name__ == "__main__":
    show_complete_summary()
