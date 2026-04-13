import os
import sys
from openai import OpenAI
from dotenv import load_dotenv

def verify():
    print("🔍 DIAGNÓSTICO DEFINITIVO DE CLAVE OPENAI")
    print("-" * 40)
    
    # Cargar .env
    load_dotenv()
    api_key = os.getenv("OPENAI_API_KEY")
    model_env = os.getenv("OPENAI_MODEL", "No definido")
    
    if not api_key:
        print("❌ ERROR: No se encontró OPENAI_API_KEY en el archivo .env")
        return

    print(f"📡 Clave detectada: {api_key[:10]}...{api_key[-4:]}")
    print(f"⚙️ Modelo en .env: {model_env}")
    
    client = OpenAI(api_key=api_key)
    
    # 1. Prueba de Modelos
    print("\n1️⃣ Probando acceso a modelos...")
    try:
        models = client.models.list()
        print("✅ Acceso a la lista de modelos: OK")
        
        # Verificar si gpt-4o-mini está en la lista
        has_mini = any(m.id == "gpt-4o-mini" for m in models)
        if has_mini:
            print("✅ El modelo 'gpt-4o-mini' ESTÁ disponible para esta clave.")
        else:
            print("⚠️ El modelo 'gpt-4o-mini' NO aparece en tu lista. Prueba con 'gpt-3.5-turbo'.")
            
    except Exception as e:
        print(f"❌ Error al listar modelos: {e}")
        if "401" in str(e):
            print("👉 MOTIVO: Tu clave no tiene permisos de 'Read' o 'Write' en Model Capabilities.")

    # 2. Prueba de Generación (Chat)
    print("\n2️⃣ Probando generación de texto (Chat)...")
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": "Hola, responde con la palabra 'LISTO'"}],
            max_tokens=5
        )
        print(f"✅ Generación exitosa: {response.choices[0].message.content.strip()}")
    except Exception as e:
        print(f"❌ Error en generación: {e}")
        if "401" in str(e):
            print("👉 MOTIVO: Tu clave no tiene el scope 'model.request'. Activa 'Write' en Model Capabilities.")

    print("-" * 40)
    print("🚀 Si ambos puntos salen con ✅, Bee-Scribe funcionará perfectamente.")

if __name__ == "__main__":
    verify()
