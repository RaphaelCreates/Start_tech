from datetime import datetime

now = datetime.now()
current_day = now.weekday() + 1
days = ['', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo']

print(f'Hoje é {days[current_day]} (dia {current_day})')
print(f'Horário atual: {now.strftime("%H:%M:%S")}')
