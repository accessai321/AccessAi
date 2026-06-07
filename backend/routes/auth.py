from flask import Blueprint, request, jsonify
from firebase_admin import auth, firestore
from firebase_config import db
from middleware.validators import validate_register, validate_login
from datetime import datetime, timezone

auth_bp = Blueprint("auth", __name__)


# POST /register
@auth_bp.route("/register", methods=["POST"])
def register():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Request body is required"}), 400

        error = validate_register(data)
        if error:
            return jsonify({"error": error}), 400

        user_record = auth.create_user(
            email=data["email"].strip(),
            password=data["password"],
            display_name=data["name"].strip(),
        )

        db.collection("users").document(user_record.uid).set({
            "name":           data["name"].strip(),
            "email":          data["email"].strip(),
            "disabilityType": data["disabilityType"].strip(),
            "createdAt":      datetime.now(timezone.utc).isoformat(),
        })

        return jsonify({"message": "User registered"}), 201

    except auth.EmailAlreadyExistsError:
        return jsonify({"error": "Email already in use"}), 409
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# POST /login
@auth_bp.route("/login", methods=["POST"])
def login():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Request body is required"}), 400

        error = validate_login(data)
        if error:
            return jsonify({"error": error}), 400

        decoded  = auth.verify_id_token(data["idToken"])
        uid      = decoded["uid"]
        email    = decoded.get("email", "")

        user_doc = db.collection("users").document(uid).get()
        profile  = user_doc.to_dict() if user_doc.exists else {}

        return jsonify({
            "message": "Login successful",
            "uid":     uid,
            "email":   email,
            "profile": profile,
        }), 200

    except auth.ExpiredIdTokenError:
        return jsonify({"error": "Token has expired. Please log in again."}), 401
    except auth.InvalidIdTokenError:
        return jsonify({"error": "Invalid token"}), 401
    except Exception as e:
        return jsonify({"error": str(e)}), 500