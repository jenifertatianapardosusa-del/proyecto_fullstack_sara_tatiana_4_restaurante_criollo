from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from bson import ObjectId
from datetime import datetime

from models import Plato, PlatoCreate, PlatoUpdate
from database import coleccion_platos_menu, verificar_conexion

app = FastAPI(
    title="API Restaurante App Profesional - SENA ADSO",
    description="API RESTful asíncrona con FastAPI y MongoDB (FARM Stack)",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Evento de inicio de servidor 
@app.on_event("startup")
async def startup_db_client():
    await verificar_conexion()

# =============================
# ENDPOINTS RESTful ASÍNCRONOS
# =============================

@app.get("/", tags=["Raíz"])
async def root():
    return {
        "mensaje": "Bienvenido a la API TODO Asíncrona con MongoDB (SEN ADSO)",
        "documentacion": "/docs"
    }

@app.post(
    "/Nuevo_plato",
    response_model=Plato,
    status_code=status.HTTP_201_CREATED,
    tags=["platos"],
    summary="Crear nuevo plato en MongoDB"
)
async def create_plato(plato_in: PlatoCreate):
    
    plato_existente = await coleccion_platos_menu.find_one({"nombre_plato": plato_in.nombre_plato})
    if plato_existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ya existe un plato registrado con el título '{plato_in.nombre_plato}'"
        )
    
    nuevo_plato = plato_in.model_dump()
    nuevo_plato["fecha_creacion"] = datetime.now()

    # 3. Insertar asíncronamente en MongoDB
    resultado = await coleccion_platos_menu.insert_one(nuevo_plato)

    # 4. Recuperar el documento recién creado por su _id ObjectId
    plato_creado = await coleccion_platos_menu.find_one({"_id": resultado.inserted_id})
    return plato_creado

@app.get(
    "/Menu_completo",
    response_model=List[Plato],
    status_code=status.HTTP_200_OK,
    tags=["platos"],
    summary="Listar todos los platos"
)
async def get_platos():
    
    platos = []
    # Usar cursor asíncrono de Motor}
    cursor = coleccion_platos_menu.find()
    async for documento in cursor:
        platos.append(documento)
    return platos

@app.get(
    "/Menu_completo/{id}",
    response_model=Plato,
    status_code=status.HTTP_200_OK,
    tags=["platos"],
    summary="Buscar plato por ObjectId"
)
async def get_plato_por_id(id: str):
    
    if not ObjectId.is_valid(id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El formato del ID '{id}' no es un ObjectId válido de MongoDB"
        )

    Plato = await coleccion_platos_menu.find_one({"_id": ObjectId(id)})
    if Plato:
        return Plato

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"El plato con ID '{id}' no fue encontrado en la base de datos"
    )

@app.put(
    "/Menu_completo/{id}",
    response_model=Plato,
    status_code=status.HTTP_200_OK,
    tags=["platos"],
    summary="Actualizar estado o campos de una tarea"
)
async def update_plato(id: str, plato_update: PlatoUpdate):
    
    if not ObjectId.is_valid(id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El formato del ID '{id}' no es un ObjectId Válido"
        )

   
    datos_a_actualizar = plato_update.model_dump(exclude_unset=True)

    if len(datos_a_actualizar) >= 1:
        resultado_actualizacion = await coleccion_platos_menu.update_one(
            {"_id": ObjectId(id)},
            {"$set": datos_a_actualizar}
        )

        if resultado_actualizacion.modified_count == 1 or resultado_actualizacion.matched_count == 1:
            plato_modificado = await coleccion_platos_menu.find_one({"_id": ObjectId(id)})
            return plato_modificado

   
    plato_existente = await coleccion_platos_menu.find_one({"_id": ObjectId(id)})
    if plato_existente: 
        return plato_existente

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"No es posible actualizar. El plato con ID '{id}' no existe"
    )

@app.delete(
    "/Menu_completo/{id}",
    status_code=status.HTTP_200_OK,
    tags=["platos"],
    summary="Eliminar plato de MongoDB"
)
async def delete_plato(id: str):
    
    if not ObjectId.is_valid(id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El formato del ID '{id}' no es un ObjectId Válido"
        )
    resultado_eliminacion = await coleccion_platos_menu.delete_one({"_id": ObjectId(id)})

    if resultado_eliminacion.deleted_count == 1:
        return {"mensaje": f"Plato con ID '{id}' eliminado exitosamente de MongoDB"}

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"No es posible eliminar. El plato con ID '{id}' no existe en la base de datos"
    )