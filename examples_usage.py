#!/usr/bin/env python3
"""
Exemplos de como usar o novo sistema simplificado
"""

import sys
import os
from datetime import datetime

# Adicionar o diretório atual ao path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from populate_simple import add_simple_schedule

def exemplos_uso():
    """Exemplos de como adicionar horários facilmente"""
    print("📝 EXEMPLOS DE USO DO NOVO SISTEMA")
    print("=" * 50)
    
    # Adicionar horário agora para teste (terça-feira às 10:45)
    print("1. Adicionando horário para agora + 15 minutos:")
    now = datetime.now()
    current_day = now.weekday() + 1
    test_time = f"{now.hour}:{now.minute + 15:02d}"
    
    success = add_simple_schedule('Santana', current_day, test_time)
    if success:
        print(f"   ✅ Horário {test_time} adicionado para hoje!")
    
    print("\n2. Adicionando horários para amanhã:")
    tomorrow_day = current_day + 1 if current_day < 5 else 1
    add_simple_schedule('Vila Madalena', tomorrow_day, '08:30')
    add_simple_schedule('Vila Madalena', tomorrow_day, '14:30')
    add_simple_schedule('Vila Madalena', tomorrow_day, '18:30')
    
    print("\n3. Adicionando horários especiais de sexta:")
    add_simple_schedule('Santana', 5, '21:00')
    add_simple_schedule('Ipiranga', 5, '21:30')
    
    print("\n✨ VANTAGENS DO NOVO SISTEMA:")
    print("   • Muito mais simples: apenas HH:MM + day_week")
    print("   • Não precisa calcular datas específicas")
    print("   • Sistema calcula automaticamente a próxima ocorrência")
    print("   • Fácil de manter e expandir")
    print("   • JSON mais limpo e legível")
    
    print("\n📋 FORMATO JSON PARA API:")
    print("""
    {
        "line_id": 1,
        "departure_time_str": "14:30",
        "day_week": 2,
        "interest": 0
    }
    """)

if __name__ == "__main__":
    exemplos_uso()
