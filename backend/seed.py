import asyncio
from datetime import datetime
from database import coleccion_platos_menu

PLATOS = [
    {"nombre_plato": "Ajiaco Santafereño", "categoria": ["Sopas y Sancochos"],
     "precio": 28000, "disponible_hoy": True, "imagen_url": "img/platos/Ajiaco santafereño.webp"},
    {"nombre_plato": "Bandeja Paisa", "categoria": ["Platos Tipicos"],
     "precio": 35000, "disponible_hoy": True, "imagen_url": "img/platos/Bandeja paisa.jpg"},
    {"nombre_plato": "Tamal Tolimense", "categoria": ["Entradas y Amasijos"],
     "precio": 15000, "disponible_hoy": True, "imagen_url": "img/platos/Tamal tolimense.jpg"},
    {"nombre_plato": "Cocido Boyacense", "categoria": ["Sopas y Sancochos"],
     "precio": 25000, "disponible_hoy": False, "imagen_url": "img/platos/Cocido Boyacense.jpg"},
    {"nombre_plato": "Sancocho de Gallina", "categoria": ["Sopas y Sancochos"],
     "precio": 27000, "disponible_hoy": False, "imagen_url": "img/platos/Sancocho de Gallina.jpg"},
    {"nombre_plato": "Arroz con Leche", "categoria": ["Postres y Bebidas"],
     "precio": 9000, "disponible_hoy": False, "imagen_url": "img/platos/Arroz con Leche."},
]


async def main():
    for plato in PLATOS:
        if await coleccion_platos_menu.find_one({"nombre_plato": plato["nombre_plato"]}):
            continue
        await coleccion_platos_menu.insert_one({**plato, "fecha_creacion": datetime.now()})
    print("Platos cargados")


asyncio.run(main())