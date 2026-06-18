import os

BASE_DIR    = os.path.dirname(os.path.abspath(__file__))
DATA_DIR    = os.path.join(BASE_DIR, "data")
REPORTS_DIR = os.path.join(BASE_DIR, "reports")
DB_PATH     = os.path.join(DATA_DIR, "cti_tracker.db")

# Public, no-key APIs used by this project
MALWAREBAZAAR_API    = "https://mb-api.abuse.ch/api/v1/"
URLHAUS_API          = "https://urlhaus-api.abuse.ch/v1/"
MITRE_ATTACK_STIX    = (
    "https://raw.githubusercontent.com/mitre/cti/master/"
    "enterprise-attack/enterprise-attack.json"
)

os.makedirs(DATA_DIR,    exist_ok=True)
os.makedirs(REPORTS_DIR, exist_ok=True)
