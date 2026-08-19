import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.main import app, get_db
from backend.database import Base

TEST_DATABASE_URL = "sqlite:///./test_biogrid.db"
engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="module", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_create_and_get_user():
    username = "auth_tester"
    create_res = client.post("/v1/users", json={"username": username})
    assert create_res.status_code == 200
    user_data = create_res.json()
    assert user_data["username"] == username
    assert "id" in user_data

    get_res = client.get(f"/v1/users/{username}")
    assert get_res.status_code == 200
    assert get_res.json()["username"] == username

def test_metabolic_log_operations():
    username = "metabolic_console"
    create_res = client.post("/v1/users", json={"username": username})
    user_id = create_res.json()["id"]

    log_res = client.get(f"/v1/users/{user_id}/metabolic")
    assert log_res.status_code == 200
    assert log_res.json()["calories"] == 2200

    patch_res = client.patch(
        f"/v1/users/{user_id}/metabolic",
        json={"calories": 2400, "hydration": 3.0}
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["calories"] == 2400

def test_genetic_switches_operations():
    username = "crispr_tester"
    create_res = client.post("/v1/users", json={"username": username})
    user_id = create_res.json()["id"]

    # Get genetics
    gen_res = client.get(f"/v1/users/{user_id}/genetic")
    assert gen_res.status_code == 200
    assert gen_res.json()["apoe4"] is False

    # Patch genetics
    patch_res = client.patch(
        f"/v1/users/{user_id}/genetic",
        json={"apoe4": True, "foxo3": True}
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["apoe4"] is True
    assert patch_res.json()["foxo3"] is True

def test_supplements_operations():
    username = "pharma_tester"
    create_res = client.post("/v1/users", json={"username": username})
    user_id = create_res.json()["id"]

    # Log supplement intake
    log_res = client.post(
        f"/v1/users/{user_id}/supplements",
        json={"compound_name": "Metformin", "dosage_mg": 500.0, "half_life_hours": 6.2}
    )
    assert log_res.status_code == 200
    data = log_res.json()
    assert data["compound_name"] == "Metformin"
    assert data["dosage_mg"] == 500.0
    assert "decay_curve" in data
    
    # Verify decay calculation contains 12 values
    decay_values = data["decay_curve"].split(",")
    assert len(decay_values) == 12
    # First value should be original dose
    assert float(decay_values[0]) == 500.0

    # Get all logged supplements
    list_res = client.get(f"/v1/users/{user_id}/supplements")
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 1

def test_ai_diagnose():
    username = "ai_tester"
    create_res = client.post("/v1/users", json={"username": username})
    user_id = create_res.json()["id"]

    # Test AI Diagnostic response for short of breath
    diagnose_res = client.post(
        f"/v1/users/{user_id}/ai/diagnose",
        json={"symptoms": "I feel dizzy and short of breath after my cardio test"}
    )
    assert diagnose_res.status_code == 200
    data = diagnose_res.json()
    assert "Cardiovascular Hypoxemic Shock" in data["probable_illness"]
    assert data["probability_percent"] > 0
    assert len(data["risk_factors"]) >= 1
    assert len(data["clinical_actions"]) >= 1

