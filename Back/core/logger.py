import os
from datetime import datetime

def log_step(message):
    """Escribe un mensaje de depuración en un archivo de texto local compartido."""
    # Obtenemos la ruta base (fuera de Back/ para evitar reloads infinitos)
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    log_path = os.path.join(base_dir, "ai_process.log")
    
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with open(log_path, "a", encoding="utf-8") as f:
        f.write(f"[{timestamp}] {message}\n")
    print(message)
