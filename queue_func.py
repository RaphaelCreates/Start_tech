from utils import single_beep, double_beep

class Queue:
    def __init__(self, max_capacity):
        self.max_capacity = max_capacity
        self.passengers = set()

    def add_passenger(self, passenger_id):
        if len(self.passengers) >= self.max_capacity:
            double_beep()
            return False
        self.passengers.add(passenger_id)
        single_beep()
        return True

    def count(self):
        return len(self.passengers)

    def reset(self):
        self.passengers.clear()
