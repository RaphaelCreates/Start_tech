from utils import single_beep, double_beep

class Queue:
    """
    Classe que gere o estado da fila de passageiros.
    """
    def __init__(self, max_capacity=0): # A fila agora começa com capacidade 0
        self.max_capacity = max_capacity
        self.passengers = set()

    def update_capacity(self, new_capacity: int):
        """Atualiza a capacidade máxima da fila."""
        self.max_capacity = new_capacity
        print(f"[INFO] Capacidade da fila atualizada para: {self.max_capacity}")

    def process_passenger(self, passenger_id: str) -> str | None:
        if passenger_id in self.passengers:
            self.passengers.remove(passenger_id)
            single_beep()
            return "CHECKOUT"
        else:
            if self.max_capacity == 0:
                 print("[AVISO] Embarque bloqueado. A capacidade da rota ainda não foi definida.")
                 return None
            if len(self.passengers) >= self.max_capacity:
                double_beep()
                return None
            
            self.passengers.add(passenger_id)
            single_beep()
            return "CHECKIN"

    def count(self) -> int:
        return len(self.passengers)

    def reset(self):
        self.passengers.clear()
        self.update_capacity(0) # Reinicia a capacidade para 0

