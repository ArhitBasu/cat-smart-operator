import sys
import os
from fastapi.testclient import TestClient

from app.main import app

def run_all_tests():
    print("[*] Running comprehensive API & Intelligence test suite...")
    
    with TestClient(app) as client:
        # 1. Health check
        res = client.get("/health")
        assert res.status_code == 200, f"Health check failed: {res.text}"
        assert res.json()["status"] == "healthy"
        print("[+] GET /health PASSED")

        # 2. Machines list
        res = client.get("/api/machines")
        assert res.status_code == 200, f"Machines list failed: {res.text}"
        machines = res.json()["machines"]
        assert len(machines) >= 8
        assert any(m["machine_id"] == "EXC001" for m in machines)
        print(f"[+] GET /api/machines PASSED ({len(machines)} machines returned)")

        # 3. Dashboard summary for EXC001
        res = client.get("/api/dashboard/EXC001")
        assert res.status_code == 200, f"Dashboard EXC001 failed: {res.text}"
        dash = res.json()
        assert dash["machine_id"] == "EXC001"
        assert "safety_status" in dash
        assert "seatbelt_compliance" in dash
        print(f"[+] GET /api/dashboard/EXC001 PASSED (Safety Status: {dash['safety_status']}, Compliance: {dash['seatbelt_compliance']}%)")

        # 4. Safety status for EXC001
        res = client.get("/api/safety/EXC001")
        assert res.status_code == 200, f"Safety EXC001 failed: {res.text}"
        safety = res.json()
        assert safety["machine_id"] == "EXC001"
        assert "risk_level" in safety
        print(f"[+] GET /api/safety/EXC001 PASSED (Risk Level: {safety['risk_level']})")

        # 5. Analytics for EXC001
        res = client.get("/api/analytics/EXC001")
        assert res.status_code == 200, f"Analytics EXC001 failed: {res.text}"
        analytics = res.json()
        assert "fuel" in analytics and len(analytics["fuel"]) > 0
        assert "idle_time" in analytics
        print(f"[+] GET /api/analytics/EXC001 PASSED ({len(analytics['fuel'])} fuel data points)")

        # 6. Explainable Anomaly check for EXC001
        res = client.get("/api/anomalies/EXC001")
        assert res.status_code == 200, f"Anomalies EXC001 failed: {res.text}"
        anomaly = res.json()
        assert "anomaly" in anomaly
        assert "reason" in anomaly
        assert "contributing_factors" in anomaly
        print(f"[+] GET /api/anomalies/EXC001 PASSED (Anomaly: {anomaly['anomaly']}, Severity: {anomaly.get('severity')}, Factors: {len(anomaly['contributing_factors'])})")

        # 7. Machine Intelligence Summary for EXC001
        res = client.get("/api/machine-intelligence/EXC001")
        assert res.status_code == 200, f"Machine Intelligence failed: {res.text}"
        intel = res.json()
        assert intel["machine_id"] == "EXC001"
        assert 0 <= intel["overall_risk"] <= 100
        assert 0 <= intel["safety_score"] <= 100
        assert 0 <= intel["efficiency_score"] <= 100
        assert 0 <= intel["machine_health_score"] <= 100
        assert 0 <= intel["operator_safety_score"] <= 100
        assert len(intel["key_findings"]) > 0
        print(f"[+] GET /api/machine-intelligence/EXC001 PASSED (Overall Risk: {intel['overall_risk']}/100 [{intel['risk_level']}], Safety Score: {intel['safety_score']}/100, Efficiency Score: {intel['efficiency_score']}/100)")

        # 8. Task prediction with key_factors
        predict_payload = {
            "task_type": "Excavation",
            "load_cycles": 20,
            "terrain": "Hard Clay",
            "temperature": 32,
            "operator_experience": 3,
            "machine_type": "Excavator"
        }
        res = client.post("/api/task/predict", json=predict_payload)
        assert res.status_code == 200, f"Task prediction failed: {res.text}"
        pred = res.json()
        assert "estimated_minutes" in pred
        assert "lower_bound" in pred
        assert "upper_bound" in pred
        assert "key_factors" in pred and len(pred["key_factors"]) > 0
        print(f"[+] POST /api/task/predict PASSED (Est: {pred['estimated_minutes']} min, Range: {pred['prediction_range']}, Top Factor: {pred['key_factors'][0]['feature']} [{pred['key_factors'][0]['importance']}])")

        # 9. Get Incidents & Create Incident
        res = client.get("/api/incidents")
        assert res.status_code == 200, f"Get incidents failed: {res.text}"
        incidents = res.json()
        assert len(incidents) >= 3
        print(f"[+] GET /api/incidents PASSED ({len(incidents)} incidents found)")

        new_incident = {
            "machine_id": "EXC001",
            "operator_id": "OP1001",
            "type": "Seatbelt Violation",
            "severity": "HIGH",
            "description": "Test incident creation from test suite."
        }
        res = client.post("/api/incidents", json=new_incident)
        assert res.status_code == 201, f"Create incident failed: {res.text}"
        created_inc = res.json()
        assert created_inc["status"] == "OPEN"
        print(f"[+] POST /api/incidents PASSED (Created ID: {created_inc['id']})")

        # 10. Training hub
        res = client.get("/api/training?machine_id=EXC001")
        assert res.status_code == 200, f"Training failed: {res.text}"
        trn = res.json()
        assert len(trn["modules"]) >= 5
        print(f"[+] GET /api/training PASSED ({len(trn['modules'])} modules available)")

        # 11. AI Assistant query
        assistant_payload = {
            "machine_id": "EXC001",
            "operator_id": "OP1001",
            "message": "Why did I receive a safety alert?"
        }
        res = client.post("/api/assistant", json=assistant_payload)
        assert res.status_code == 200, f"Assistant failed: {res.text}"
        ast = res.json()
        assert "answer" in ast and len(ast["answer"]) > 0
        assert "recommendations" in ast
        print(f"[+] POST /api/assistant PASSED (Answer: '{ast['answer']}')")

        # 12. Signature 'Why?' Alert Explanation API
        explain_payload = {
            "machine_id": "EXC001"
        }
        res = client.post("/api/assistant/explain-alert", json=explain_payload)
        assert res.status_code == 200, f"Explain alert failed: {res.text}"
        exp = res.json()
        assert "alert" in exp
        assert "why" in exp and len(exp["why"]) > 0
        assert "evidence" in exp and len(exp["evidence"]) > 0
        print(f"[+] POST /api/assistant/explain-alert PASSED (Alert: '{exp['alert']}', Evidence items: {len(exp['evidence'])})")

        # 13. Error handling test (404 Machine Not Found)
        res = client.get("/api/dashboard/NON_EXISTENT")
        assert res.status_code == 404, "Expected 404 for non-existent machine"
        print("[+] 404 Error handling PASSED")

    print("\n==================================================")
    print("ALL API ENDPOINTS & MACHINE INTELLIGENCE SERVICES PASSED!")
    print("==================================================")

if __name__ == "__main__":
    run_all_tests()
