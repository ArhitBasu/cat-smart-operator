import os
import sqlite3
import json
import pandas as pd
from typing import List, Dict, Any

DB_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(DB_DIR, "cat_assistant.db")
DATA_DIR = os.path.normpath(os.path.join(DB_DIR, "..", "data"))

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """
    Creates tables if they don't exist and seeds initial data idempotently.
    Restarting Uvicorn will not duplicate records.
    """
    os.makedirs(DB_DIR, exist_ok=True)
    conn = get_db_connection()
    cursor = conn.cursor()

    # Create Tables
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS machines (
        machine_id TEXT PRIMARY KEY,
        machine_type TEXT NOT NULL,
        status TEXT NOT NULL
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS operators (
        operator_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        experience_years INTEGER NOT NULL
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS machine_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        machine_id TEXT NOT NULL,
        operator_id TEXT NOT NULL,
        machine_type TEXT NOT NULL,
        engine_hours REAL NOT NULL,
        fuel_used REAL NOT NULL,
        load_cycles INTEGER NOT NULL,
        idling_time INTEGER NOT NULL,
        seatbelt_status TEXT NOT NULL,
        safety_alert_triggered TEXT NOT NULL,
        task_type TEXT NOT NULL,
        terrain TEXT NOT NULL,
        temperature INTEGER NOT NULL,
        operator_experience INTEGER NOT NULL,
        task_completion_time INTEGER NOT NULL
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS incidents (
        id TEXT PRIMARY KEY,
        timestamp TEXT NOT NULL,
        machine_id TEXT NOT NULL,
        operator_id TEXT NOT NULL,
        type TEXT NOT NULL,
        severity TEXT NOT NULL,
        description TEXT NOT NULL,
        status TEXT NOT NULL
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS training_modules (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        duration TEXT NOT NULL,
        category TEXT NOT NULL,
        completion_percentage INTEGER NOT NULL,
        recommended BOOLEAN NOT NULL
    );
    """)

    conn.commit()

    # Seed Machines
    cursor.execute("SELECT COUNT(*) FROM machines")
    if cursor.fetchone()[0] == 0:
        default_machines = [
            ("EXC001", "Excavator", "ONLINE"),
            ("EXC002", "Excavator", "ONLINE"),
            ("BKH001", "Backhoe", "ONLINE"),
            ("TRK001", "Haul Truck", "ONLINE"),
            ("WLD001", "Wheel Loader", "ONLINE"),
            ("CRN001", "Crane", "OFFLINE"),
            ("EXC003", "Excavator", "ONLINE"),
            ("TRK002", "Haul Truck", "MAINTENANCE")
        ]
        cursor.executemany("INSERT INTO machines (machine_id, machine_type, status) VALUES (?, ?, ?)", default_machines)
        conn.commit()

    # Seed Operators
    cursor.execute("SELECT COUNT(*) FROM operators")
    if cursor.fetchone()[0] == 0:
        default_operators = [
            (f"OP10{i:02d}", f"Operator {i}", random_exp)
            for i, random_exp in enumerate([5, 8, 3, 12, 2, 7, 10, 4, 6, 9, 1, 11], start=1)
        ]
        cursor.executemany("INSERT INTO operators (operator_id, name, experience_years) VALUES (?, ?, ?)", default_operators)
        conn.commit()

    # Seed Machine Logs from CSV if available
    csv_path = os.path.join(DATA_DIR, "machinery.csv")
    cursor.execute("SELECT COUNT(*) FROM machine_logs")
    if cursor.fetchone()[0] == 0 and os.path.exists(csv_path):
        df = pd.read_csv(csv_path)
        logs_data = df[[
            "timestamp", "machine_id", "operator_id", "machine_type",
            "engine_hours", "fuel_used", "load_cycles", "idling_time",
            "seatbelt_status", "safety_alert_triggered", "task_type",
            "terrain", "temperature", "operator_experience", "task_completion_time"
        ]].values.tolist()
        cursor.executemany("""
            INSERT INTO machine_logs (
                timestamp, machine_id, operator_id, machine_type,
                engine_hours, fuel_used, load_cycles, idling_time,
                seatbelt_status, safety_alert_triggered, task_type,
                terrain, temperature, operator_experience, task_completion_time
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, logs_data)
        conn.commit()

    # Seed Incidents from JSON if available
    incidents_path = os.path.join(DATA_DIR, "incidents.json")
    cursor.execute("SELECT COUNT(*) FROM incidents")
    if cursor.fetchone()[0] == 0 and os.path.exists(incidents_path):
        with open(incidents_path, "r") as f:
            incidents_data = json.load(f)
            insert_rows = [
                (inc["id"], inc["timestamp"], inc["machine_id"], inc["operator_id"], inc["type"], inc["severity"], inc["description"], inc["status"])
                for inc in incidents_data
            ]
            cursor.executemany("""
                INSERT INTO incidents (id, timestamp, machine_id, operator_id, type, severity, description, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, insert_rows)
            conn.commit()

    # Seed Training Modules from JSON if available
    training_path = os.path.join(DATA_DIR, "training.json")
    cursor.execute("SELECT COUNT(*) FROM training_modules")
    if cursor.fetchone()[0] == 0 and os.path.exists(training_path):
        with open(training_path, "r") as f:
            training_data = json.load(f)
            insert_rows = [
                (trn["id"], trn["title"], trn["description"], trn["duration"], trn["category"], trn["completion_percentage"], trn["recommended"])
                for trn in training_data
            ]
            cursor.executemany("""
                INSERT INTO training_modules (id, title, description, duration, category, completion_percentage, recommended)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, insert_rows)
            conn.commit()

    conn.close()
    print("[+] SQLite database initialized and seeded idempotently.")
