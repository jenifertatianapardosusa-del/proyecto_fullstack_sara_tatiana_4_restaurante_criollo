from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Annotated
from datetime import datetime
from bson import ObjectId
from pydantic.json_schema import JsonSchemaValue
from pydantic_core import core_schema

class _ObjectIdPydanticAnnotation:
    @classmethod
    def __get_pydantic_core_schema__(cls, source_type, handler):
        def validate(v):
            if isinstance(v, ObjectId):
                return str(v)
            if isinstance(v, str) and ObjectId.is_valid(v):
                return v
            raise ValueError("ID invalido de MongoDB (ObjectId)")

        return core_schema.json_or_python_schema(
            json_schema=core_schema.str_schema(),
            python_schema=core_schema.no_info_plain_validator_function(validate),
            serialization=core_schema.to_string_ser_schema(),
        )

PyObjectId = Annotated[str, _ObjectIdPydanticAnnotation]

class PlatoBase(BaseModel):
    nombre_plato: str = Field(
        ...,
        min_length=3,
        max_length=150,
        description="Titulo descriptivo del plato",
        example="Cocido Boyacense"
    )
    categoria: list[str] = Field(
        default_factory=list,
        max_length=50,
        description="Lista de categorias correspondientes al plato",
        examples=[["Entradas y Amasijos", "Sopas y Sancochos", "Platos Tipicos", "Postres y Bebidas"]]
    )
    precio: int = Field(
        gt=0,
        description="Precio unitario del plato (debe ser mayor a 0).",
        examples=[45.99]
    )
    disponible_hoy: bool = Field(
        default=False,
        description="Estado de disponibilidad del plato en el día"
    )

class PlatoCreate(PlatoBase):
   
    pass

class Plato(PlatoBase):
    
    id: PyObjectId = Field(alias="_id", description="Identificador único ObjectId de MongoDB")
    fecha_creacion: datetime

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True
    )

class PlatoUpdate(BaseModel):
    
    nombre_plato: str = Field(
            ...,
            min_length=3,
            max_length=150,
            description="Titulo descriptivo del plato",
            example="Cocido Boyacense"
    )
    categoria: list[str] = Field(
            default_factory=list,
            max_length=50,
            description="Lista de categorias correspondientes al plato",
            examples=[["Entradas y Amasijos", "Sopas y Sancochos", "Platos Tipicos", "Postres y Bebidas"]]
    )
    precio: int = Field(
            gt=0,
            description="Precio unitario del plato (debe ser mayor a 0).",
            examples=[45.99]
    )
    disponible_hoy: bool = Field(
            default=False,
            description="Estado de disponibilidad del plato en el día"
    )
