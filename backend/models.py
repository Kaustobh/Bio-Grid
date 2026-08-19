import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel
from sqlalchemy import Column, Integer, String, DateTime, Numeric, ForeignKey, Text, Boolean
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

# SQLAlchemy Models
class UserModel(Base):
    __tablename__ = "users"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String(50), unique=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    telemetry = relationship("TelemetryModel", back_populates="user", cascade="all, delete-orphan")
    metabolic_log = relationship("MetabolicLogModel", back_populates="user", cascade="all, delete-orphan", uselist=False)
    genetic_switches = relationship("GeneticSwitchModel", back_populates="user", cascade="all, delete-orphan", uselist=False)
    supplements = relationship("PharmacokineticModel", back_populates="user", cascade="all, delete-orphan")

class TelemetryModel(Base):
    __tablename__ = "biometric_telemetry"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    heart_rate = Column(Integer, nullable=False)
    blood_oxygen = Column(Numeric(4, 2), nullable=False)
    core_temperature = Column(Numeric(4, 2), nullable=False)
    recorded_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    user = relationship("UserModel", back_populates="telemetry")

class MetabolicLogModel(Base):
    __tablename__ = "metabolic_logs"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    calories = Column(Integer, default=2200)
    hydration = Column(Numeric(4, 2), default=2.8) # in Liters
    protein = Column(Integer, default=135) # in Grams
    carbs = Column(Integer, default=240) # in Grams
    fat = Column(Integer, default=65) # in Grams
    glucose_curve = Column(Text, default="95,98,102,105,108,110,105,100,98,96,95,94") # Comma separated list of values
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("UserModel", back_populates="metabolic_log")

class GeneticSwitchModel(Base):
    __tablename__ = "genetic_switches"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    apoe4 = Column(Boolean, default=False)  # False = Normal/Disabled, True = CRISPR Modified
    foxo3 = Column(Boolean, default=False)
    sirt1 = Column(Boolean, default=False)
    brca1 = Column(Boolean, default=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("UserModel", back_populates="genetic_switches")

class PharmacokineticModel(Base):
    __tablename__ = "pharmacokinetics"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    compound_name = Column(String(100), nullable=False)
    intake_time = Column(DateTime(timezone=True), default=datetime.utcnow)
    dosage_mg = Column(Numeric(8, 2), nullable=False)
    half_life_hours = Column(Numeric(6, 2), nullable=False)
    decay_curve = Column(Text, default="") # Comma-separated list representing hourly decay for UI representation

    user = relationship("UserModel", back_populates="supplements")


# Pydantic Schemas
class UserCreate(BaseModel):
    username: str

class UserResponse(BaseModel):
    id: str
    username: str
    created_at: datetime

    class Config:
        from_attributes = True

class TelemetryResponse(BaseModel):
    id: int
    user_id: str
    heart_rate: int
    blood_oxygen: float
    core_temperature: float
    recorded_at: datetime

    class Config:
        from_attributes = True

class MetabolicLogUpdate(BaseModel):
    calories: Optional[int] = None
    hydration: Optional[float] = None
    protein: Optional[int] = None
    carbs: Optional[int] = None
    fat: Optional[int] = None
    glucose_curve: Optional[str] = None

class MetabolicLogResponse(BaseModel):
    user_id: str
    calories: int
    hydration: float
    protein: int
    carbs: int
    fat: int
    glucose_curve: str
    updated_at: datetime

    class Config:
        from_attributes = True

class GeneticSwitchUpdate(BaseModel):
    apoe4: Optional[bool] = None
    foxo3: Optional[bool] = None
    sirt1: Optional[bool] = None
    brca1: Optional[bool] = None

class GeneticSwitchResponse(BaseModel):
    user_id: str
    apoe4: bool
    foxo3: bool
    sirt1: bool
    brca1: bool
    updated_at: datetime

    class Config:
        from_attributes = True

class SupplementLogCreate(BaseModel):
    compound_name: str
    dosage_mg: float
    half_life_hours: float

class SupplementLogResponse(BaseModel):
    id: int
    user_id: str
    compound_name: str
    intake_time: datetime
    dosage_mg: float
    half_life_hours: float
    decay_curve: str

    class Config:
        from_attributes = True

class AIDiagnoseRequest(BaseModel):
    symptoms: str

class AIDiagnoseResponse(BaseModel):
    probable_illness: str
    probability_percent: float
    risk_factors: List[str]
    chrono_recs: str
    clinical_actions: List[str]
    affected_organs: List[str]

