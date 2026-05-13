"""
Rwanda Government Employee Dataset Generator
Generates synthetic but realistic employee data for AI model training
"""

import csv
import random
import math
from datetime import datetime, timedelta

# Rwanda districts with approximate GPS coordinates
DISTRICTS = {
    "Nyarugenge": {"lat": -1.9441, "lng": 30.0619, "province": "Kigali"},
    "Gasabo": {"lat": -1.8960, "lng": 30.1127, "province": "Kigali"},
    "Kicukiro": {"lat": -1.9940, "lng": 30.0988, "province": "Kigali"},
    "Huye": {"lat": -2.5967, "lng": 29.7395, "province": "Southern"},
    "Muhanga": {"lat": -2.0833, "lng": 29.7500, "province": "Southern"},
    "Musanze": {"lat": -1.4990, "lng": 29.6350, "province": "Northern"},
    "Rubavu": {"lat": -1.6830, "lng": 29.2590, "province": "Western"},
    "Rusizi": {"lat": -2.4796, "lng": 28.9071, "province": "Western"},
    "Kayonza": {"lat": -1.8833, "lng": 30.6500, "province": "Eastern"},
    "Rwamagana": {"lat": -1.9500, "lng": 30.4333, "province": "Eastern"},
}

# Rwanda government ministries/departments
DEPARTMENTS = [
    "Ministry of Finance",
    "Ministry of Health",
    "Ministry of Education",
    "Ministry of Infrastructure",
    "Rwanda Development Board",
    "Rwanda Revenue Authority",
    "Ministry of Justice",
    "Ministry of Agriculture",
    "Ministry of ICT",
    "Rwanda National Police",
]

# Job titles
JOB_TITLES = [
    "Senior Officer", "Director", "Analyst", "Coordinator",
    "Specialist", "Manager", "Officer", "Inspector",
    "Accountant", "Engineer", "Nurse", "Teacher",
    "Administrator", "Supervisor", "Technician",
]

# Rwanda first names
FIRST_NAMES = [
    "Amina", "Jean", "Marie", "Patrick", "Claudine",
    "Eric", "Josiane", "Pierre", "Esperance", "Emmanuel",
    "Vestine", "Innocent", "Chantal", "Alexis", "Beatrice",
    "Olivier", "Fabiola", "Celestin", "Immaculee", "Rodrigue",
    "Yvonne", "Fidele", "Solange", "Janvier", "Odette",
]

# Rwanda last names
LAST_NAMES = [
    "Uwimana", "Bizimana", "Habimana", "Niyonzima", "Mukamana",
    "Nkurunziza", "Habyarimana", "Mutabazi", "Kayitesi", "Ntirenganya",
    "Uwitonze", "Gashumba", "Ntakirutimana", "Uwase", "Sibomana",
    "Ingabire", "Ndayisaba", "Munyakazi", "Tuyisenge", "Abayisenga",
]

def add_noise_to_coords(lat, lng, radius_km=5):
    """Add random offset to GPS coordinates within a radius"""
    radius_deg = radius_km / 111.0
    angle = random.uniform(0, 2 * math.pi)
    distance = random.uniform(0, radius_deg)
    return (
        round(lat + distance * math.cos(angle), 6),
        round(lng + distance * math.sin(angle), 6)
    )

def calc_distance_km(lat1, lng1, lat2, lng2):
    """Calculate distance in km between two coordinates"""
    return round(math.sqrt((lat1 - lat2)**2 + (lng1 - lng2)**2) * 111, 2)

def generate_address(district):
    """Generate a realistic Rwanda address"""
    streets = ["KG", "KN", "KK", "RN", "NR"]
    street = random.choice(streets)
    number = random.randint(1, 500)
    sector = random.choice([
        "Remera", "Kimironko", "Kacyiru", "Gikondo", "Nyamirambo",
        "Gisozi", "Kibagabaga", "Kagugu", "Kanombe", "Masaka"
    ])
    return f"{street} {number} St, {sector}, {district}"

def generate_employee(emp_id):
    """Generate a single employee record"""

    # Most employees (85%) live and work in the same or nearby district
    home_district = random.choice(list(DISTRICTS.keys()))
    if random.random() < 0.85:
        work_district = home_district
    else:
        work_district = random.choice(list(DISTRICTS.keys()))

    home_info = DISTRICTS[home_district]
    work_info = DISTRICTS[work_district]

    # Generate GPS coordinates with small noise
    home_lat, home_lng = add_noise_to_coords(home_info["lat"], home_info["lng"], radius_km=2)
    work_lat, work_lng = add_noise_to_coords(work_info["lat"], work_info["lng"], radius_km=1)

    # GPS mismatch — only 5% of employees have suspicious GPS
    anomaly_gps = random.random() < 0.05
    if anomaly_gps:
        reported_lat, reported_lng = add_noise_to_coords(home_lat, home_lng, radius_km=20)
    else:
        reported_lat, reported_lng = add_noise_to_coords(home_lat, home_lng, radius_km=0.5)

    # Address changes — most employees rarely change address
    address_changes = random.choices(
        [0, 1, 2, 3, 4, 5],
        weights=[60, 20, 10, 5, 3, 2]
    )[0]

    # Distance from home to work
    distance_km = calc_distance_km(home_lat, home_lng, work_lat, work_lng)
    distance_anomaly = distance_km > 50

    # Address validity — 90% valid
    address_valid = random.random() > 0.10

    # Anomaly requires at least 2 red flags (more realistic)
    anomaly_flags = sum([
        address_changes >= 4,
        distance_anomaly,
        anomaly_gps,
        not address_valid,
    ])
    is_anomaly = anomaly_flags >= 2

    # Relocation likelihood
    relocation_score = round(
        (min(address_changes, 5) / 5 * 0.4) +
        (min(distance_km, 100) / 100 * 0.3) +
        (0.2 if anomaly_gps else 0) +
        random.uniform(0, 0.1),
        2
    )
    likely_to_relocate = relocation_score > 0.5

    # Hire and verification dates
    hire_date = datetime(2018, 1, 1) + timedelta(days=random.randint(0, 2000))
    last_verified = datetime(2024, 1, 1) + timedelta(days=random.randint(0, 365))

    return {
        "employee_id": f"RW-EMP-{emp_id:05d}",
        "first_name": random.choice(FIRST_NAMES),
        "last_name": random.choice(LAST_NAMES),
        "department": random.choice(DEPARTMENTS),
        "job_title": random.choice(JOB_TITLES),
        "hire_date": hire_date.strftime("%Y-%m-%d"),
        "home_district": home_district,
        "home_address": generate_address(home_district),
        "home_lat": home_lat,
        "home_lng": home_lng,
        "reported_lat": reported_lat,
        "reported_lng": reported_lng,
        "work_district": work_district,
        "work_address": generate_address(work_district),
        "work_lat": work_lat,
        "work_lng": work_lng,
        "distance_home_to_work_km": distance_km,
        "address_changes_last_year": address_changes,
        "last_verified_date": last_verified.strftime("%Y-%m-%d"),
        # Labels for AI models
        "address_valid": int(address_valid),              # Classification model
        "gps_location_mismatch": int(anomaly_gps),       # Anomaly detection
        "is_anomaly": int(is_anomaly),                    # Anomaly detection
        "likely_to_relocate": int(likely_to_relocate),   # Predictive model
        "relocation_score": min(relocation_score, 1.0),  # Predictive model
    }

def main():
    NUM_EMPLOYEES = 1000
    OUTPUT_FILE = "rwanda_employee_dataset.csv"

    print(f"Generating {NUM_EMPLOYEES} employee records...")

    employees = [generate_employee(i + 1) for i in range(NUM_EMPLOYEES)]

    # Write to CSV
    with open(OUTPUT_FILE, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=employees[0].keys())
        writer.writeheader()
        writer.writerows(employees)

    # Print summary
    total = len(employees)
    anomalies = sum(e["is_anomaly"] for e in employees)
    relocations = sum(e["likely_to_relocate"] for e in employees)
    invalid_addr = sum(1 for e in employees if not e["address_valid"])
    gps_mismatch = sum(e["gps_location_mismatch"] for e in employees)

    print(f"\n✅ Dataset saved to: {OUTPUT_FILE}")
    print(f"\n📊 Dataset Summary:")
    print(f"   Total employees     : {total}")
    print(f"   Anomalies detected  : {anomalies} ({anomalies/total*100:.1f}%)")
    print(f"   Likely to relocate  : {relocations} ({relocations/total*100:.1f}%)")
    print(f"   Invalid addresses   : {invalid_addr} ({invalid_addr/total*100:.1f}%)")
    print(f"   GPS mismatches      : {gps_mismatch} ({gps_mismatch/total*100:.1f}%)")
    print(f"\n🏷️  Columns for AI models:")
    print(f"   Classification  → address_valid")
    print(f"   Anomaly detect  → is_anomaly, gps_location_mismatch")
    print(f"   Predictive      → likely_to_relocate, relocation_score")

if __name__ == "__main__":
    main()