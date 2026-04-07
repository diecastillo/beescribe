import os
import re

# Carpeta donde están tus archivos
root_dir = "./"

# Patrón que busca OpenAI()
pattern = re.compile(r'OpenAI\s*\(\s*api_key\s*=\s*[^)]+\)')

# Recorre todos los archivos .py
for subdir, _, files in os.walk(root_dir):
    for file in files:
        if file.endswith(".py"):
            file_path = os.path.join(subdir, file)
            with open(file_path, 'r') as f:
                code = f.read()
            new_code = pattern.sub("OpenAI()", code)
            with open(file_path, 'w') as f:
                f.write(new_code)

print("Reemplazo completado en todos los archivos .py")
