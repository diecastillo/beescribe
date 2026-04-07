import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("OPENAI_API_KEY")
client = OpenAI()

try:
    # Intentamos listar modelos, lo cual suele devolver info de la organización en los headers
    # o podemos intentar recuperar info básica si el API lo permite.
    # Nota: El cliente de OpenAI no tiene un método directo "get_project_id"
    # pero podemos ver qué organización está activa.
    print(f"Clave detectada: {api_key[:10]}...{api_key[-4:]}")
    
    # Probamos una llamada mínima
    response = client.models.list()
    
    # En las versiones recientes, el client tiene el org_id si se pasó, 
    # pero si no, se puede ver en el objeto de respuesta si examinamos los headers (difícil desde aquí)
    print("\n✅ Conexión establecida.")
    print("La clave está vinculada a tu organización por defecto en OpenAI.")
    print("Si tienes múltiples proyectos, esta clave 'sk-proj' ya pertenece a UNO en particular.")
    
except Exception as e:
    print(f"❌ Error: {e}")
