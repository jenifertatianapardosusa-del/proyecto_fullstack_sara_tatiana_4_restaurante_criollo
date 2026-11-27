
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Annotated
from datetime import datetime
from bson import ObjectId
from pydantic_core import core_schema


# Validación del identificador de MongoDB
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


# Modelo base: información de los platos
class PlatoBase(BaseModel):

    nombre_plato: str = Field(
        ...,
        min_length=3,
        max_length=150,
        description="Titulo descriptivo del plato"
    )

    categoria: list[str] = Field(
        default_factory=list,
        max_length=50,
        description="Categorias correspondientes al plato"
    )

    precio: int = Field(
        gt=0,
        description="Precio unitario del plato"
    )

    disponible_hoy: bool = Field(
        default=False,
        description="Estado de disponibilidad del plato"
    )

    imagen_url: Optional[str] = Field(
        default=None,
        description="URL o ruta de la imagen del plato"
    )


# Modelo para crear platos
class PlatoCreate(PlatoBase):
    pass


# Modelo para consultar platos
class Plato(PlatoBase):

    id: PyObjectId = Field(
        alias="_id",
        description="Identificador único de MongoDB"
    )

    fecha_creacion: datetime

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True
    )


# Modelo para actualizar platos
class PlatoUpdate(BaseModel):

    nombre_plato: Optional[str] = Field(
        default=None,
        min_length=3,
        max_length=150
    )

    categoria: Optional[list[str]] = None

    precio: Optional[int] = Field(
        default=None,
        gt=0
    )

    disponible_hoy: Optional[bool] = None

    imagen_url: Optional[str] = None
