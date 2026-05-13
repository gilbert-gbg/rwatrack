"""
RWATRACK - AI Model Training Script
====================================
Trains 3 models using rwanda_employee_dataset.csv:
  1. Classification Model  → Is the address valid?
  2. Anomaly Detection     → Is this employee suspicious?
  3. Predictive Model      → Will this employee relocate?

Install dependencies first:
  pip install pandas scikit-learn matplotlib seaborn joblib
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import joblib
import os
from sklearn.ensemble import RandomForestClassifier, IsolationForest
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import (
    classification_report, confusion_matrix,
    accuracy_score, roc_auc_score
)

# ─────────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────────
DATASET_PATH = "rwanda_employee_dataset.csv"
MODELS_DIR = "trained_models"
os.makedirs(MODELS_DIR, exist_ok=True)

print("=" * 55)
print("  RWATRACK - AI Model Training")
print("=" * 55)

# ─────────────────────────────────────────────
# STEP 1 — LOAD & PREPARE DATA
# ─────────────────────────────────────────────
print("\n📂 Loading dataset...")
df = pd.read_csv(DATASET_PATH)
print(f"   Rows: {len(df)}, Columns: {len(df.columns)}")

# Encode categorical columns
le_dept = LabelEncoder()
le_job  = LabelEncoder()
le_dist = LabelEncoder()

df["department_enc"]    = le_dept.fit_transform(df["department"])
df["job_title_enc"]     = le_job.fit_transform(df["job_title"])
df["home_district_enc"] = le_dist.fit_transform(df["home_district"])
df["work_district_enc"] = le_dist.transform(df["work_district"])

# Shared feature columns
FEATURES = [
    "home_lat", "home_lng",
    "reported_lat", "reported_lng",
    "work_lat", "work_lng",
    "distance_home_to_work_km",
    "address_changes_last_year",
    "department_enc",
    "job_title_enc",
    "home_district_enc",
    "work_district_enc",
]

X = df[FEATURES]
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# Save scaler for later use
joblib.dump(scaler, f"{MODELS_DIR}/scaler.pkl")
print("   ✅ Data prepared and scaler saved")


# ─────────────────────────────────────────────
# MODEL 1 — CLASSIFICATION (Address Validity)
# ─────────────────────────────────────────────
print("\n" + "─" * 55)
print("🔵 MODEL 1: Address Classification")
print("   Goal: Predict if an employee's address is valid")
print("─" * 55)

y_class = df["address_valid"]

X_train, X_test, y_train, y_test = train_test_split(
    X_scaled, y_class, test_size=0.2, random_state=42, stratify=y_class
)

clf_model = RandomForestClassifier(
    n_estimators=100,
    max_depth=8,
    random_state=42,
    class_weight="balanced"
)
clf_model.fit(X_train, y_train)
y_pred_clf = clf_model.predict(X_test)

acc = accuracy_score(y_test, y_pred_clf)
print(f"\n   Accuracy  : {acc:.2%}")
print(f"\n   Classification Report:")
print(classification_report(y_test, y_pred_clf,
      target_names=["Invalid", "Valid"]))

# Feature importance plot
importances = clf_model.feature_importances_
feat_df = pd.DataFrame({
    "Feature": FEATURES,
    "Importance": importances
}).sort_values("Importance", ascending=False)

plt.figure(figsize=(8, 5))
sns.barplot(data=feat_df, x="Importance", y="Feature", palette="Blues_r")
plt.title("Model 1 — Feature Importance (Address Classification)")
plt.tight_layout()
plt.savefig(f"{MODELS_DIR}/model1_feature_importance.png")
plt.close()

# Confusion matrix
cm = confusion_matrix(y_test, y_pred_clf)
plt.figure(figsize=(5, 4))
sns.heatmap(cm, annot=True, fmt="d", cmap="Blues",
            xticklabels=["Invalid", "Valid"],
            yticklabels=["Invalid", "Valid"])
plt.title("Model 1 — Confusion Matrix")
plt.ylabel("Actual")
plt.xlabel("Predicted")
plt.tight_layout()
plt.savefig(f"{MODELS_DIR}/model1_confusion_matrix.png")
plt.close()

joblib.dump(clf_model, f"{MODELS_DIR}/model1_classification.pkl")
print("   ✅ Model 1 saved → trained_models/model1_classification.pkl")


# ─────────────────────────────────────────────
# MODEL 2 — ANOMALY DETECTION
# ─────────────────────────────────────────────
print("\n" + "─" * 55)
print("🔴 MODEL 2: Anomaly Detection")
print("   Goal: Detect suspicious employee behavior")
print("─" * 55)

y_anomaly = df["is_anomaly"]

# Isolation Forest is unsupervised — trains on all data
anomaly_model = IsolationForest(
    n_estimators=100,
    contamination=0.05,   # expect ~5% anomalies
    random_state=42
)
anomaly_model.fit(X_scaled)

# Predict: IsolationForest returns -1 (anomaly) or 1 (normal)
raw_preds = anomaly_model.predict(X_scaled)
y_pred_anomaly = (raw_preds == -1).astype(int)  # convert to 0/1

# Evaluate against our labels
acc_anomaly = accuracy_score(y_anomaly, y_pred_anomaly)
print(f"\n   Accuracy  : {acc_anomaly:.2%}")
print(f"\n   Detection Report:")
print(classification_report(y_anomaly, y_pred_anomaly,
      target_names=["Normal", "Anomaly"]))

# Anomaly score distribution
scores = anomaly_model.decision_function(X_scaled)
plt.figure(figsize=(8, 4))
plt.hist(scores[y_anomaly == 0], bins=40, alpha=0.6,
         color="steelblue", label="Normal")
plt.hist(scores[y_anomaly == 1], bins=40, alpha=0.6,
         color="crimson", label="Anomaly")
plt.axvline(0, color="black", linestyle="--", linewidth=1)
plt.title("Model 2 — Anomaly Score Distribution")
plt.xlabel("Anomaly Score (lower = more suspicious)")
plt.ylabel("Count")
plt.legend()
plt.tight_layout()
plt.savefig(f"{MODELS_DIR}/model2_score_distribution.png")
plt.close()

joblib.dump(anomaly_model, f"{MODELS_DIR}/model2_anomaly_detection.pkl")
print("   ✅ Model 2 saved → trained_models/model2_anomaly_detection.pkl")


# ─────────────────────────────────────────────
# MODEL 3 — PREDICTIVE (Relocation Likelihood)
# ─────────────────────────────────────────────
print("\n" + "─" * 55)
print("🟢 MODEL 3: Predictive Model (Relocation)")
print("   Goal: Predict which employees are likely to relocate")
print("─" * 55)

y_reloc = df["likely_to_relocate"]

X_train3, X_test3, y_train3, y_test3 = train_test_split(
    X_scaled, y_reloc, test_size=0.2, random_state=42, stratify=y_reloc
)

pred_model = LogisticRegression(
    max_iter=1000,
    random_state=42,
    class_weight="balanced"
)
pred_model.fit(X_train3, y_train3)
y_pred_reloc = pred_model.predict(X_test3)
y_prob_reloc = pred_model.predict_proba(X_test3)[:, 1]

acc_reloc = accuracy_score(y_test3, y_pred_reloc)
try:
    auc = roc_auc_score(y_test3, y_prob_reloc)
    print(f"\n   Accuracy  : {acc_reloc:.2%}")
    print(f"   AUC Score : {auc:.2%}")
except Exception:
    print(f"\n   Accuracy  : {acc_reloc:.2%}")

print(f"\n   Relocation Report:")
print(classification_report(y_test3, y_pred_reloc,
      target_names=["Stays", "Relocates"]))

# Top employees likely to relocate
df["relocation_probability"] = pred_model.predict_proba(X_scaled)[:, 1]
top_movers = df[["employee_id", "first_name", "last_name",
                  "home_district", "department",
                  "relocation_probability"]].sort_values(
    "relocation_probability", ascending=False
).head(10)

print("\n   🔮 Top 10 employees most likely to relocate:")
print(top_movers.to_string(index=False))

# Relocation probability histogram
plt.figure(figsize=(8, 4))
plt.hist(df["relocation_probability"], bins=40, color="seagreen", alpha=0.7)
plt.title("Model 3 — Relocation Probability Distribution")
plt.xlabel("Probability of Relocation")
plt.ylabel("Number of Employees")
plt.tight_layout()
plt.savefig(f"{MODELS_DIR}/model3_relocation_distribution.png")
plt.close()

joblib.dump(pred_model, f"{MODELS_DIR}/model3_predictive.pkl")
print("\n   ✅ Model 3 saved → trained_models/model3_predictive.pkl")


# ─────────────────────────────────────────────
# FINAL SUMMARY
# ─────────────────────────────────────────────
print("\n" + "=" * 55)
print("  ✅ ALL MODELS TRAINED SUCCESSFULLY")
print("=" * 55)
print(f"\n  Saved to: {MODELS_DIR}/")
print("  ├── scaler.pkl")
print("  ├── model1_classification.pkl")
print("  ├── model2_anomaly_detection.pkl")
print("  ├── model3_predictive.pkl")
print("  ├── model1_feature_importance.png")
print("  ├── model1_confusion_matrix.png")
print("  ├── model2_score_distribution.png")
print("  └── model3_relocation_distribution.png")
print("\n  Next step: Connect models to RWATRACK backend API")
print("=" * 55)