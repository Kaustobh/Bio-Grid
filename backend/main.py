import asyncio
import random
import json
import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Set
from fastapi import FastAPI, Depends, WebSocket, WebSocketDisconnect, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from backend.database import init_db, get_db
from backend.models import (
    UserModel, TelemetryModel, MetabolicLogModel, GeneticSwitchModel, PharmacokineticModel,
    UserCreate, UserResponse, MetabolicLogUpdate, MetabolicLogResponse,
    GeneticSwitchUpdate, GeneticSwitchResponse, SupplementLogCreate, SupplementLogResponse,
    AIDiagnoseRequest, AIDiagnoseResponse
)

app = FastAPI(title="BioGrid AntiGravity API", version="1.1.0")

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ConnectionManager:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        if not self.active_connections:
            return
        await asyncio.gather(
            *[connection.send_json(message) for connection in self.active_connections],
            return_exceptions=True
        )

manager = ConnectionManager()

@app.on_event("startup")
def on_startup():
    init_db()

@app.get("/health")
def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

# User Endpoints
@app.post("/v1/users", response_model=UserResponse)
def create_user(user_data: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(UserModel).filter(UserModel.username == user_data.username).first()
    if db_user:
        return db_user
    
    # Create new user
    new_user = UserModel(id=str(uuid.uuid4()), username=user_data.username)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Initialize associated default metabolic log
    default_metabolic = MetabolicLogModel(
        user_id=new_user.id,
        calories=2200,
        hydration=2.8,
        protein=135,
        carbs=240,
        fat=65,
        glucose_curve="95,98,102,105,108,110,105,100,98,96,95,94"
    )
    db.add(default_metabolic)

    # Initialize default genetic switches
    default_genetics = GeneticSwitchModel(
        user_id=new_user.id,
        apoe4=False,
        foxo3=False,
        sirt1=False,
        brca1=False
    )
    db.add(default_genetics)

    # Log initial default supplement (Caffeine, Ginkgo Biloba)
    default_supp1 = PharmacokineticModel(
        user_id=new_user.id,
        compound_name="Caffeine",
        dosage_mg=150.0,
        half_life_hours=5.0,
        decay_curve="150,131,114,99,86,75,65,57,49,43,37,32"
    )
    default_supp2 = PharmacokineticModel(
        user_id=new_user.id,
        compound_name="Ginkgo Biloba",
        dosage_mg=120.0,
        half_life_hours=6.0,
        decay_curve="120,106,95,84,75,67,59,53,47,42,37,33"
    )
    db.add(default_supp1)
    db.add(default_supp2)

    db.commit()
    return new_user

@app.get("/v1/users/{username}", response_model=UserResponse)
def get_user(username: str, db: Session = Depends(get_db)):
    db_user = db.query(UserModel).filter(UserModel.username == username).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

# Metabolic Log Endpoints
@app.get("/v1/users/{user_id}/metabolic", response_model=MetabolicLogResponse)
def get_metabolic_log(user_id: str, db: Session = Depends(get_db)):
    log = db.query(MetabolicLogModel).filter(MetabolicLogModel.user_id == user_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Metabolic log not found")
    return log

@app.patch("/v1/users/{user_id}/metabolic", response_model=MetabolicLogResponse)
def update_metabolic_log(user_id: str, updates: MetabolicLogUpdate, db: Session = Depends(get_db)):
    log = db.query(MetabolicLogModel).filter(MetabolicLogModel.user_id == user_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Metabolic log not found")
    
    for key, value in updates.dict(exclude_unset=True).items():
        setattr(log, key, value)
    
    db.commit()
    db.refresh(log)
    return log

# Genetic Switch Endpoints
@app.get("/v1/users/{user_id}/genetic", response_model=GeneticSwitchResponse)
def get_genetic_switches(user_id: str, db: Session = Depends(get_db)):
    switches = db.query(GeneticSwitchModel).filter(GeneticSwitchModel.user_id == user_id).first()
    if not switches:
        raise HTTPException(status_code=404, detail="Genetic switches not found")
    return switches

@app.patch("/v1/users/{user_id}/genetic", response_model=GeneticSwitchResponse)
def update_genetic_switches(user_id: str, updates: GeneticSwitchUpdate, db: Session = Depends(get_db)):
    switches = db.query(GeneticSwitchModel).filter(GeneticSwitchModel.user_id == user_id).first()
    if not switches:
        raise HTTPException(status_code=404, detail="Genetic switches not found")
    
    for key, value in updates.dict(exclude_unset=True).items():
        setattr(switches, key, value)
    
    db.commit()
    db.refresh(switches)
    return switches

# Supplements / Pharmacokinetics Endpoints
@app.get("/v1/users/{user_id}/supplements", response_model=List[SupplementLogResponse])
def get_supplements(user_id: str, db: Session = Depends(get_db)):
    return db.query(PharmacokineticModel).filter(PharmacokineticModel.user_id == user_id).all()

@app.post("/v1/users/{user_id}/supplements", response_model=SupplementLogResponse)
def log_supplement(user_id: str, supplement: SupplementLogCreate, db: Session = Depends(get_db)):
    # Calculate exponential decay curve (12 increments)
    curves = []
    base_dosage = supplement.dosage_mg
    half_life = supplement.half_life_hours
    
    for hour in range(12):
        amount = base_dosage * (0.5 ** (hour / half_life))
        curves.append(f"{amount:.1f}")
        
    decay_curve = ",".join(curves)
    
    new_supp = PharmacokineticModel(
        user_id=user_id,
        compound_name=supplement.compound_name,
        dosage_mg=supplement.dosage_mg,
        half_life_hours=supplement.half_life_hours,
        decay_curve=decay_curve
    )
    db.add(new_supp)
    db.commit()
    db.refresh(new_supp)
    return new_supp

@app.post("/v1/users/{user_id}/ai/diagnose", response_model=AIDiagnoseResponse)
def ai_diagnose(user_id: str, payload: AIDiagnoseRequest, db: Session = Depends(get_db)):
    # Query latest telemetry
    latest_telemetry = db.query(TelemetryModel)\
        .filter(TelemetryModel.user_id == user_id)\
        .order_by(TelemetryModel.recorded_at.desc())\
        .first()
    
    # Query genetic switches
    switches = db.query(GeneticSwitchModel).filter(GeneticSwitchModel.user_id == user_id).first()
    
    # Defaults
    hr = latest_telemetry.heart_rate if latest_telemetry else 72
    o2 = float(latest_telemetry.blood_oxygen) if latest_telemetry else 98.5
    temp = float(latest_telemetry.core_temperature) if latest_telemetry else 36.8
    
    apoe4 = switches.apoe4 if switches else False
    foxo3 = switches.foxo3 if switches else False
    
    symptoms_lower = payload.symptoms.lower()

    # Rule Engine logic
    if o2 < 95 or "short of breath" in symptoms_lower or "dizzy" in symptoms_lower or "chest pain" in symptoms_lower:
      probable = "Cardiovascular Hypoxemic Shock / Respiratory Distress"
      prob_pct = 85.5 if o2 < 95 else 64.2
      risk_factors = [
          f"Oxygen concentration depletion (SpO2: {o2}%)",
          f"Elevated cardiac strain (HR: {hr} BPM)"
      ]
      chrono_recs = "Deliver 500ml cellular hydration log. Silence Caffeine intakes. Limit carbohydrates to <120g."
      clinical_actions = [
          "Administer supplementary oxygen infusion",
          "Deploy diagnostic pulmonary stabilizer patch",
          "Initiate cardiac core HUD calibration"
      ]
      affected_organs = ["heart", "lungs"]
    elif apoe4 and ("forgetful" in symptoms_lower or "confused" in symptoms_lower or "memory" in symptoms_lower):
      probable = "Early Epigenetic Cognitive Decline (APOE4 Pathway)"
      prob_pct = 76.8
      risk_factors = [
          "APOE4 gene activation (CRISPR Switch Active)",
          "Cognitive synapse latency detected"
      ]
      chrono_recs = "Dispatch Ginkgo Biloba clearance log. Adjust lipids/fats down to <40g. Supplement GABA."
      clinical_actions = [
          "Trigger occipital scan and prefrontal sync",
          "Silence BRCA1 tumor suppression alerts"
      ]
      affected_organs = ["brain"]
    elif "thirsty" in symptoms_lower or "fatigue" in symptoms_lower or "weakness" in symptoms_lower:
      probable = "Glycemic Metabolic Strain / Acute Dehydration"
      prob_pct = 68.4
      risk_factors = [
          "Cellular hydration depletion",
          "Elevated glucose levels (>115 mg/dL)"
      ]
      chrono_recs = "Log 1.2L cellular hydration patch. Reduce carbohydrates. Set protein goal to 150g."
      clinical_actions = [
          "Deploy metabolic insulin regulator log",
          "Calibrate liver strain clearances"
      ]
      affected_organs = ["liver", "kidneys"]
    else:
      probable = "Acute Physical Fatigue / Sleep Deprivation"
      prob_pct = 45.0
      risk_factors = [
          "Mild circadian phase offset",
          "Transient neural stress load"
      ]
      chrono_recs = "Log 300ml cellular hydration. Maintain 2200 kcal goal. Maintain standard sleep wave cycles."
      clinical_actions = [
          "Run circadian zenith sync",
          "Execute console diagnostic core calibration"
      ]
      affected_organs = ["brain", "liver"]
      
    return AIDiagnoseResponse(
        probable_illness=probable,
        probability_percent=prob_pct,
        risk_factors=risk_factors,
        chrono_recs=chrono_recs,
        clinical_actions=clinical_actions,
        affected_organs=affected_organs
    )


# Background Broadcaster for WebSockets
async def biometric_generator():
    base_hr = 72
    base_o2 = 98.5
    base_temp = 36.8
    base_glucose = 100
    
    circadian_hour = 8 # Starts at 08:00
    
    while True:
        await asyncio.sleep(2.0)
        if not manager.active_connections:
            continue
        
        # Increment circadian hour
        circadian_hour = (circadian_hour + 1) % 24

        hr_drift = random.randint(-4, 4)
        o2_drift = round(random.uniform(-0.4, 0.3), 1)
        temp_drift = round(random.uniform(-0.1, 0.1), 2)
        glucose_drift = random.randint(-5, 5)

        # 4% chance of anomaly
        if random.random() < 0.04:
            anomaly_type = random.choice(["heart_spike", "oxygen_drop"])
            if anomaly_type == "heart_spike":
                heart_rate = random.randint(130, 155)
                blood_oxygen = round(random.uniform(96.0, 97.2), 1)
                glucose_level = random.randint(135, 150)
            else:
                heart_rate = random.randint(80, 92)
                blood_oxygen = round(random.uniform(91.5, 94.5), 1)
                glucose_level = random.randint(82, 89)
        else:
            heart_rate = max(55, min(110, base_hr + hr_drift))
            blood_oxygen = max(93.0, min(100.0, base_o2 + o2_drift))
            glucose_level = max(70, min(150, base_glucose + glucose_drift))

        core_temp = round(max(35.8, min(38.8, base_temp + temp_drift)), 2)
        stress_index = round(random.uniform(15, 88), 1)

        # Persist to SQL Database
        from backend.database import SessionLocal
        db = SessionLocal()
        try:
            first_user = db.query(UserModel).first()
            if first_user:
                telemetry_record = TelemetryModel(
                    user_id=first_user.id,
                    heart_rate=heart_rate,
                    blood_oxygen=blood_oxygen,
                    core_temperature=core_temp,
                    recorded_at=datetime.utcnow()
                )
                db.add(telemetry_record)
                db.commit()
        except Exception as err:
            print(f"Failed to log live vitals: {err}")
        finally:
            db.close()

        # Calculate organ strain based on vitals
        brain_strain = round(stress_index * 1.05, 1)
        # HR above 90 increments heart strain
        heart_strain = round(max(15, min(100, (heart_rate / 150) * 100)), 1)
        # SpO2 below 98 increments lung strain
        lung_strain = round(max(10, min(100, ((100 - blood_oxygen) / 8) * 100)), 1)
        # Liver strain maps to generic toxic clearance rate + stress
        liver_strain = round(max(20, min(100, 30 + (stress_index * 0.4))), 1)
        # Kidneys strain maps to hydration and stress
        kidneys_strain = round(max(15, min(100, 45 + (stress_index * 0.3) - (o2_drift * 10))), 1)
        # Stomach strain maps to glucose level
        stomach_strain = round(max(10, min(100, 25 + (glucose_level / 150) * 40)), 1)

        payload = {
            "timestamp": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
            "heart_rate": heart_rate,
            "blood_oxygen": blood_oxygen,
            "core_temperature": core_temp,
            "glucose_level": glucose_level,
            "stress_index": stress_index,
            
            # Augmented Real-time parameters
            "organ_strain": {
                "brain": min(100, brain_strain),
                "heart": min(100, heart_strain),
                "lungs": min(100, lung_strain),
                "liver": min(100, liver_strain),
                "kidneys": min(100, kidneys_strain),
                "stomach": min(100, stomach_strain)
            },
            "circadian_offset": circadian_hour,
            "toxic_load": round(random.uniform(5.0, 45.0), 1)
        }
        await manager.broadcast(payload)

@app.on_event("startup")
async def start_biometric_broadcast():
    asyncio.create_task(biometric_generator())

# WebSockets
@app.websocket("/ws/biometrics")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            await websocket.send_text(json.dumps({"status": "ping_received"}))
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)

@app.websocket("/v1/biometrics/stream")
async def websocket_stream_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            await websocket.send_text(json.dumps({"status": "ping_received"}))
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)
