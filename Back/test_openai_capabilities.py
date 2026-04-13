import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("OPENAI_API_KEY")
client = OpenAI()

try:
    print("Testing Chat Completion...")
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": "Hola, ¿estás funcionando?"}],
        max_tokens=10
    )
    print(f"✅ Chat Completion success: {response.choices[0].message.content}")
except Exception as e:
    print(f"❌ Chat Completion failed: {e}")

try:
    print("\nTesting TTS (Audio Speech)...")
    response = client.audio.speech.create(
        model="tts-1",
        voice="alloy",
        input="Prueba de audio"
    )
    print("✅ TTS success (received content)")
except Exception as e:
    print(f"❌ TTS failed: {e}")
