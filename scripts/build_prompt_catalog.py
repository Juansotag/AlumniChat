import json
import os

with open('data/catalog.json', 'r', encoding='utf-8') as f:
    programs = json.load(f)

formatted_items = []
for p in programs:
    desc = p.get('descripcion', '').replace('\n', ' ')[:250]
    ingreso = p.get('perfil_ingreso', '').replace('\n', ' ')[:200]
    item = (
        f"ID: {p['id']} | PROGRAMA: {p['nombre']} ({p['nivel']})\n"
        f"FACULTAD: {p['facultad']} | MODALIDAD: {p['modalidad']}\n"
        f"DESCRIPCION: {desc}\n"
        f"PERFIL INGRESO: {ingreso}\n"
        f"COMPETENCIAS: {p['competencias']}\n"
        f"URL: {p['url']}"
    )
    formatted_items.append(item)

catalog_text = "\n\n---\n\n".join(formatted_items)

js_content = f"export const UNISABANA_CATALOG_TEXT = {json.dumps(catalog_text, ensure_ascii=False)};\n"

with open('data/catalog_formatted.js', 'w', encoding='utf-8') as f:
    f.write(js_content)

print(f"Generated catalog_formatted.js with {len(programs)} programs. Total chars: {len(catalog_text)}")
