import os
import sys
from pathlib import Path

import firebase_admin
from firebase_admin import credentials, auth as firebase_auth


def init_firebase():
    cred_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    default = Path(__file__).resolve().parents[1] / "serviceAccountKey.json"

    if cred_path and Path(cred_path).exists():
        cred = credentials.Certificate(cred_path)
    elif default.exists():
        cred = credentials.Certificate(str(default))
    else:
        try:
            if not firebase_admin._apps:
                firebase_admin.initialize_app()
            return
        except Exception as e:
            print("No se encontró credencial de servicio. Establece GOOGLE_APPLICATION_CREDENTIALS o coloca serviceAccountKey.json.")
            raise

    if not firebase_admin._apps:
        firebase_admin.initialize_app(cred)


def main():
    if len(sys.argv) < 3:
        print("Uso: python set_role.py <UID> <ROLE>")
        sys.exit(1)

    uid = sys.argv[1]
    role = sys.argv[2]
    init_firebase()

    try:
        firebase_auth.set_custom_user_claims(uid, {"role": role})
        print(f"Set role {role} for {uid}")
    except Exception as e:
        print("Error setting role:", e)
        raise


if __name__ == "__main__":
    main()
