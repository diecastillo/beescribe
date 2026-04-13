import os
from dotenv import load_dotenv
import sys

# Añadir el path para importar los servicios
sys.path.append(os.path.abspath('.'))

from services.chat import ChatService

load_dotenv()

def test_tts():
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("❌ Error: OPENAI_API_KEY no encontrada en .env")
        return

    print(f"✅ API Key encontrada: {api_key[:10]}...")
    chat = ChatService(api_key=api_key)
    
    print("🔊 Generando audio de prueba...")
    try:
        content = chat.generate_tts("Hola, esto es una prueba de voz de Bee Scribe.", voice="alloy")
        if content:
            print(f"✅ Audio generado correctamente! Tamaño: {len(content)} bytes")
            with open("test_tts.mp3", "wb") as f:
                f.write(content)
            print("📁 Archivo guardado como test_tts.mp3")
        else:
            print("❌ El contenido del audio está vacío.")
    except Exception as e:
        print(f"❌ Error al generar TTS: {e}")

if __name__ == "__main__":
    test_tts()
