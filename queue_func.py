from utils import single_beep, double_beep

class Queue:
    """
    Classe que gere o estado da fila de passageiros.
    """
    def __init__(self, max_capacity):
        self.max_capacity = max_capacity
        self.passengers = set()

    def process_passenger(self, passenger_id: str) -> str | None:
        
        if passenger_id in self.passengers:
            # Lógica de CHECK-OUT: O passageiro já está a bordo, então está a sair.
            self.passengers.remove(passenger_id)
            single_beep()
            return "CHECKOUT"
        else:
            # Lógica de CHECK-IN: O passageiro não está a bordo.
            if len(self.passengers) >= self.max_capacity:
                double_beep() # Alerta de fila cheia
                return None
            
            self.passengers.add(passenger_id)
            single_beep()
            return "CHECKIN"

    def count(self) -> int:
        """Retorna o número atual de passageiros."""
        return len(self.passengers)

    def reset(self):
        """Limpa a lista de passageiros no final da viagem."""
        self.passengers.clear()

