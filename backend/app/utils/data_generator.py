import os
import json
import random
from datetime import datetime, timedelta
import pandas as pd
import numpy as np

def generate_synthetic_data(data_dir: str):
    """
    Generates realistic synthetic telemetry data, initial incidents, and training modules.
    Ensures deterministic demo scenarios for machine EXC001 using random_state=42.
    """
    os.makedirs(data_dir, exist_ok=True)
    random.seed(42)
    np.random.seed(42)

    machines = [
        {"machine_id": "EXC001", "machine_type": "Excavator", "status": "ONLINE"},
        {"machine_id": "EXC002", "machine_type": "Excavator", "status": "ONLINE"},
        {"machine_id": "BKH001", "machine_type": "Backhoe", "status": "ONLINE"},
        {"machine_id": "TRK001", "machine_type": "Haul Truck", "status": "ONLINE"},
        {"machine_id": "WLD001", "machine_type": "Wheel Loader", "status": "ONLINE"},
        {"machine_id": "CRN001", "machine_type": "Crane", "status": "OFFLINE"},
        {"machine_id": "EXC003", "machine_type": "Excavator", "status": "ONLINE"},
        {"machine_id": "TRK002", "machine_type": "Haul Truck", "status": "MAINTENANCE"}
    ]

    operators = [
        {"operator_id": f"OP10{i:02d}", "name": f"Operator {i}", "experience_years": random.randint(1, 15)}
        for i in range(1, 13)
    ]

    task_types = ["Excavation", "Material Hauling", "Trenching", "Loading", "Site Grading"]
    terrains = ["Soft Mud", "Hard Clay", "Rocky", "Gravel", "Paved"]

    records = []
    base_time = datetime(2025, 5, 1, 8, 0, 0)

    # 1. Deterministic Scenarios for EXC001 (Crucial for Demo)
    demo_latest_time = datetime(2025, 5, 15, 14, 0, 0)
    exc001_scenarios = [
        # Scenario 1: Normal operation
        {
            "timestamp": (demo_latest_time - timedelta(hours=6)).strftime("%Y-%m-%d %H:%M:%S"),
            "machine_id": "EXC001",
            "operator_id": "OP1001",
            "machine_type": "Excavator",
            "engine_hours": 1523.5,
            "fuel_used": 5.2,
            "load_cycles": 12,
            "idling_time": 15,
            "seatbelt_status": "Fastened",
            "safety_alert_triggered": "No",
            "task_type": "Excavation",
            "terrain": "Hard Clay",
            "temperature": 28,
            "operator_experience": 5,
            "task_completion_time": 42
        },
        # Scenario 2: Safety Violation (Unfastened seatbelt, alert)
        {
            "timestamp": (demo_latest_time - timedelta(hours=4)).strftime("%Y-%m-%d %H:%M:%S"),
            "machine_id": "EXC001",
            "operator_id": "OP1001",
            "machine_type": "Excavator",
            "engine_hours": 1524.8,
            "fuel_used": 3.8,
            "load_cycles": 2,
            "idling_time": 55,
            "seatbelt_status": "Unfastened",
            "safety_alert_triggered": "Yes",
            "task_type": "Excavation",
            "terrain": "Hard Clay",
            "temperature": 30,
            "operator_experience": 5,
            "task_completion_time": 58
        },
        # Scenario 3: Excessive Idling + Seatbelt Violation + Operational Anomaly (Latest Record for EXC001)
        {
            "timestamp": demo_latest_time.strftime("%Y-%m-%d %H:%M:%S"),
            "machine_id": "EXC001",
            "operator_id": "OP1001",
            "machine_type": "Excavator",
            "engine_hours": 1530.2,
            "fuel_used": 14.5,  # Abnormally high fuel
            "load_cycles": 1,
            "idling_time": 65,  # Excessive idle
            "seatbelt_status": "Unfastened",
            "safety_alert_triggered": "Yes",
            "task_type": "Excavation",
            "terrain": "Rocky",
            "temperature": 34,
            "operator_experience": 5,
            "task_completion_time": 75
        }
    ]
    records.extend(exc001_scenarios)

    # 2. General synthetic records across 14 days for all machines
    start_date = datetime(2025, 5, 1, 8, 0, 0)
    current_engine_hours = {m["machine_id"]: 1200.0 + random.uniform(100, 1000) for m in machines}

    for day in range(14):
        for hour in range(8, 18, 2):  # 5 readings per machine per day
            current_time = start_date + timedelta(days=day, hours=hour)
            
            for m in machines:
                # Skip extra EXC001 records for day 14 overlapping with fixed demo scenarios
                if m["machine_id"] == "EXC001" and day == 14 and hour in [8, 10, 14]:
                    continue

                m_id = m["machine_id"]
                m_type = m["machine_type"]
                op = random.choice(operators)
                op_id = op["operator_id"]
                op_exp = op["experience_years"]

                current_engine_hours[m_id] += random.uniform(1.0, 2.0)
                engine_hrs = round(current_engine_hours[m_id], 1)

                task = random.choice(task_types)
                terrain = random.choice(terrains)
                temp = random.randint(15, 38)
                load_cycles = random.randint(2, 25)

                # Induce normal vs anomalous behavior (approx 8% anomaly rate)
                is_anomalous = random.random() < 0.08

                if is_anomalous:
                    idling = random.randint(50, 80)
                    fuel = round(random.uniform(8.0, 16.0), 1)
                    seatbelt = "Unfastened" if random.random() < 0.7 else "Fastened"
                    alert = "Yes"
                else:
                    idling = random.randint(5, 40)
                    fuel = round(load_cycles * random.uniform(0.2, 0.4) + idling * 0.05 + random.uniform(1.0, 3.0), 1)
                    seatbelt = "Fastened" if random.random() < 0.92 else "Unfastened"
                    alert = "Yes" if seatbelt == "Unfastened" or idling > 45 else "No"

                # Estimate completion time for training target
                base_task_time = {"Excavation": 40, "Material Hauling": 30, "Trenching": 50, "Loading": 25, "Site Grading": 45}[task]
                completion_time = int(base_task_time + (load_cycles * 0.8) + (15 - op_exp) * 0.5 + random.randint(-5, 5))
                completion_time = max(15, completion_time)

                records.append({
                    "timestamp": current_time.strftime("%Y-%m-%d %H:%M:%S"),
                    "machine_id": m_id,
                    "operator_id": op_id,
                    "machine_type": m_type,
                    "engine_hours": engine_hrs,
                    "fuel_used": fuel,
                    "load_cycles": load_cycles,
                    "idling_time": idling,
                    "seatbelt_status": seatbelt,
                    "safety_alert_triggered": alert,
                    "task_type": task,
                    "terrain": terrain,
                    "temperature": temp,
                    "operator_experience": op_exp,
                    "task_completion_time": completion_time
                })

    df = pd.DataFrame(records)
    csv_path = os.path.join(data_dir, "machinery.csv")
    df.to_csv(csv_path, index=False)
    print(f"[+] Machinery telemetry saved to {csv_path} ({len(df)} rows)")

    # 3. Initial Incidents JSON
    incidents = [
        {
            "id": "INC-1001",
            "timestamp": "2025-05-01 10:00:00",
            "machine_id": "EXC001",
            "operator_id": "OP1001",
            "type": "Seatbelt Violation",
            "severity": "HIGH",
            "description": "Operator operated machine without seatbelt fastened during excavation shift.",
            "status": "OPEN"
        },
        {
            "id": "INC-1002",
            "timestamp": "2025-05-01 14:00:00",
            "machine_id": "EXC001",
            "operator_id": "OP1001",
            "type": "Excessive Idling",
            "severity": "MEDIUM",
            "description": "Machine remained idle for 65 consecutive minutes with engine running.",
            "status": "INVESTIGATING"
        },
        {
            "id": "INC-1003",
            "timestamp": "2025-05-02 08:30:00",
            "machine_id": "TRK001",
            "operator_id": "OP1004",
            "type": "Hazard Proximity",
            "severity": "LOW",
            "description": "Approached unstable trench boundary at site B.",
            "status": "RESOLVED"
        }
    ]
    incidents_path = os.path.join(data_dir, "incidents.json")
    with open(incidents_path, "w") as f:
        json.dump(incidents, f, indent=2)
    print(f"[+] Initial incidents saved to {incidents_path}")

    # 4. Initial Training Modules JSON
    training_modules = [
        {
            "id": "TRN-01",
            "title": "Seatbelt Safety & Protocols",
            "description": "Mandatory safety compliance module covering seatbelt restraint usage, interlock mechanisms, and site injury prevention.",
            "duration": "15 min",
            "category": "Safety Compliance",
            "completion_percentage": 0,
            "recommended": True
        },
        {
            "id": "TRN-02",
            "title": "Excavator Safe Operation",
            "description": "Best practices for excavator stabilization, boom swing safety, trench clearing, and load limits.",
            "duration": "30 min",
            "category": "Machine Handling",
            "completion_percentage": 45,
            "recommended": True
        },
        {
            "id": "TRN-03",
            "title": "Fuel Efficiency & Idle Management",
            "description": "Strategies to reduce engine idling, optimize RPM during cycle work, and conserve fuel.",
            "duration": "20 min",
            "category": "Operational Efficiency",
            "completion_percentage": 20,
            "recommended": False
        },
        {
            "id": "TRN-04",
            "title": "Hazard Awareness & Site Safety",
            "description": "Identifying overhead powerlines, ground instability, pedestrian zones, and blind spots.",
            "duration": "25 min",
            "category": "Hazard Prevention",
            "completion_percentage": 80,
            "recommended": False
        },
        {
            "id": "TRN-05",
            "title": "Emergency Procedures & Shutdown",
            "description": "Emergency kill-switch operation, fire suppression, and emergency evacuation protocols.",
            "duration": "15 min",
            "category": "Emergency Response",
            "completion_percentage": 100,
            "recommended": False
        }
    ]
    training_path = os.path.join(data_dir, "training.json")
    with open(training_path, "w") as f:
        json.dump(training_modules, f, indent=2)
    print(f"[+] Initial training modules saved to {training_path}")

    return df, machines, operators, incidents, training_modules

if __name__ == "__main__":
    generate_synthetic_data("backend/data")
