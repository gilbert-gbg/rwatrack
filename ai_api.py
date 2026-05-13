"""
RWATRACK - AI Flask API
========================
Serves the 3 trained ML models via REST API endpoints.

Install dependencies:
  pip install flask flask-cors joblib scikit-learn pandas numpy

Run:
  python ai_api.py
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import os

app = Flask(__name__)
CORS(app)

# ─────────────────────────────────────────────
# LOAD MODELS
# ─────────────────────────────────────────────
MODELS_DIR = "trained_models"

print("Loading models...")
try:
    scaler      = joblib.load(f"{MODELS_DIR}/scaler.pkl")
    model1_clf  = joblib.load(f"{MODELS_DIR}/model1_classification.pkl")
    model2_anom = joblib.load(f"{MODELS_DIR}/model2_anomaly_detection.pkl")
    model3_pred = joblib.load(f"{MODELS_DIR}/model3_predictive.pkl")
    print("✅ All models loaded successfully")
except Exception as e:
    print(f"❌ Error loading models: {e}")

# Encodings — must match training order
DEPARTMENTS = [
    "Ministry of Finance", "Ministry of Health", "Ministry of Education",
    "Ministry of Infrastructure", "Rwanda Development Board",
    "Rwanda Revenue Authority", "Ministry of Justice",
    "Ministry of Agriculture", "Ministry of ICT", "Rwanda National Police",
]
JOB_TITLES = [
    "Senior Officer", "Director", "Analyst", "Coordinator",
    "Specialist", "Manager", "Officer", "Inspector",
    "Accountant", "Engineer", "Nurse", "Teacher",
    "Administrator", "Supervisor", "Technician",
]
DISTRICTS = [
    "Nyarugenge", "Gasabo", "Kicukiro", "Huye", "Muhanga",
    "Musanze", "Rubavu", "Rusizi", "Kayonza", "Rwamagana",
]

def to_bool(val):
    """Convert numpy bool or any value to Python bool"""
    return True if val else False

def to_float(val):
    """Convert numpy float to Python float"""
    return float(val)

def encode(value, options):
    try:
        return options.index(value)
    except ValueError:
        return 0

def prepare_features(data):
    features = [
        float(data.get("home_lat", 0)),
        float(data.get("home_lng", 0)),
        float(data.get("reported_lat", 0)),
        float(data.get("reported_lng", 0)),
        float(data.get("work_lat", 0)),
        float(data.get("work_lng", 0)),
        float(data.get("distance_home_to_work_km", 0)),
        float(data.get("address_changes_last_year", 0)),
        encode(data.get("department", ""), DEPARTMENTS),
        encode(data.get("job_title", ""), JOB_TITLES),
        encode(data.get("home_district", ""), DISTRICTS),
        encode(data.get("work_district", ""), DISTRICTS),
    ]
    return scaler.transform([features])


# ─────────────────────────────────────────────
# ROUTES
# ─────────────────────────────────────────────

@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "name": "RWATRACK AI API",
        "status": "running",
        "endpoints": {
            "POST /predict/address":   "Check if address is valid",
            "POST /predict/anomaly":   "Detect suspicious behavior",
            "POST /predict/relocation":"Predict relocation likelihood",
            "POST /predict/all":       "Run all 3 models at once",
        }
    })


@app.route("/predict/address", methods=["POST"])
def predict_address():
    try:
        data = request.get_json()
        X = prepare_features(data)

        pred = int(model1_clf.predict(X)[0])
        prob = model1_clf.predict_proba(X)[0]

        valid   = pred == 1
        conf    = round(to_float(max(prob)) * 100, 2)
        p_valid = round(to_float(prob[1]) * 100, 2)
        p_inv   = round(to_float(prob[0]) * 100, 2)

        return jsonify({
            "model": "Address Classification",
            "result": "valid" if valid else "invalid",
            "confidence": conf,
            "probability_valid": p_valid,
            "probability_invalid": p_inv,
            "alert": not valid,
            "message": "Address appears valid" if valid
                       else "Address may be invalid — review required"
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@app.route("/predict/anomaly", methods=["POST"])
def predict_anomaly():
    try:
        data = request.get_json()
        X = prepare_features(data)

        raw_pred   = int(model2_anom.predict(X)[0])
        score      = to_float(model2_anom.decision_function(X)[0])
        is_anomaly = raw_pred == -1

        risk = "high" if score < -0.1 else "medium" if score < 0 else "low"

        freq  = int(data.get("address_changes_last_year", 0)) >= 4
        far   = float(data.get("distance_home_to_work_km", 0)) > 50
        gpsdiff = abs(float(data.get("home_lat", 0)) - float(data.get("reported_lat", 0))) > 0.1

        return jsonify({
            "model": "Anomaly Detection",
            "result": "anomaly" if is_anomaly else "normal",
            "anomaly_score": round(score, 4),
            "risk_level": risk,
            "alert": is_anomaly,
            "message": "Suspicious activity detected — investigation recommended"
                       if is_anomaly else "Employee behavior appears normal",
            "flags": {
                "frequent_address_changes": freq,
                "far_from_workplace": far,
                "gps_mismatch": gpsdiff,
            }
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@app.route("/predict/relocation", methods=["POST"])
def predict_relocation():
    try:
        data = request.get_json()
        X = prepare_features(data)

        pred      = int(model3_pred.predict(X)[0])
        prob      = model3_pred.predict_proba(X)[0]
        reloc_prob = to_float(prob[1])
        relocates  = pred == 1

        risk = "high" if reloc_prob > 0.7 else "medium" if reloc_prob > 0.4 else "low"

        return jsonify({
            "model": "Relocation Prediction",
            "result": "likely_to_relocate" if relocates else "stable",
            "relocation_probability": round(reloc_prob * 100, 2),
            "risk_level": risk,
            "alert": relocates,
            "message": f"Employee has {round(reloc_prob*100, 1)}% chance of relocating"
                       if relocates else "Employee is likely to remain at current residence"
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@app.route("/predict/all", methods=["POST"])
def predict_all():
    try:
        data = request.get_json()
        X = prepare_features(data)

        # Model 1
        clf_pred  = int(model1_clf.predict(X)[0])
        clf_prob  = model1_clf.predict_proba(X)[0]
        clf_valid = clf_pred == 1
        clf_conf  = round(to_float(max(clf_prob)) * 100, 2)

        # Model 2
        anom_raw   = int(model2_anom.predict(X)[0])
        anom_score = to_float(model2_anom.decision_function(X)[0])
        is_anomaly = anom_raw == -1
        anom_risk  = "high" if anom_score < -0.1 else "medium" if anom_score < 0 else "low"

        # Model 3
        reloc_pred = int(model3_pred.predict(X)[0])
        reloc_prob = to_float(model3_pred.predict_proba(X)[0][1])
        relocates  = reloc_pred == 1
        reloc_risk = "high" if reloc_prob > 0.7 else "medium" if reloc_prob > 0.4 else "low"

        # Flags
        freq    = int(data.get("address_changes_last_year", 0)) >= 4
        far     = float(data.get("distance_home_to_work_km", 0)) > 50
        gpsdiff = abs(float(data.get("home_lat", 0)) - float(data.get("reported_lat", 0))) > 0.1

        # Overall risk
        risk_count   = sum([not clf_valid, is_anomaly, relocates])
        overall_risk = "high" if risk_count >= 2 else "medium" if risk_count == 1 else "low"

        return jsonify({
            "overall_risk": overall_risk,
            "requires_action": risk_count >= 2,
            "address_classification": {
                "valid": clf_valid,
                "confidence": clf_conf,
                "alert": not clf_valid,
            },
            "anomaly_detection": {
                "is_anomaly": is_anomaly,
                "score": round(anom_score, 4),
                "risk_level": anom_risk,
                "alert": is_anomaly,
                "flags": {
                    "frequent_address_changes": freq,
                    "far_from_workplace": far,
                    "gps_mismatch": gpsdiff,
                }
            },
            "relocation_prediction": {
                "likely_to_relocate": relocates,
                "probability": round(reloc_prob * 100, 2),
                "risk_level": reloc_risk,
                "alert": relocates,
            }
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 400


# ─────────────────────────────────────────────
# RUN
# ─────────────────────────────────────────────
if __name__ == "__main__":
    print("\n" + "=" * 45)
    print("  RWATRACK AI API starting...")
    print("  URL: http://localhost:5000")
    print("=" * 45 + "\n")
    app.run(debug=True, host="0.0.0.0", port=5000)