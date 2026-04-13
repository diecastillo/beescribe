# models/transformacion.py

from sqlalchemy import Column, Integer, String, DateTime, JSON, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from core.database import Base

class Transformacion(Base):
    __tablename__ = "transformaciones"

    id = Column(Integer, primary_key=True, index=True)
    reunion_id = Column(Integer, ForeignKey("reuniones.id"))
    tipo = Column(String, index=True) # breve, detallado, cuestionario, guion
    contenido_md = Column(Text, nullable=True)
    metadatos = Column(JSON, nullable=True)
    fecha_creacion = Column(DateTime, default=datetime.utcnow)
    
    reunion = relationship("Reunion", back_populates="transformaciones")
