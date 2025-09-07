from datetime import datetime

def current_timestamp():
    return datetime.now().isoformat()

# Simulated beeps
def intermittent_beep():
    print("🔔 Intermittent beep! Route not confirmed.")

def single_beep():
    print("🔔 Entry registered!")

def double_beep():
    print("🔔🔔 Bus full!")