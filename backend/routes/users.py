from flask import Blueprint, request, jsonify, g
from firebase_admin import auth
from firebase_config import db
from middleware.auth_middleware import token_required
from middleware.validators import validate_user_update
from datetime import datetime, timezone

users_bp = Blueprint("users", __name__)


# GET /users/<userId>  — protected
@users_bp.route("/users/<user_id>", methods=["GET"])
@token_required
def get_user(user_id):
    try:
        # Users can only fetch their own profile
        if g.uid != user_id:
            return jsonify({"error": "Unauthorized"}), 403

        doc = db.collection("users").document(user_id).get()
        if not doc.exists:
            return jsonify({"error": "User not found"}), 404

        return jsonify({"user": {"uid": doc.id, **doc.to_dict()}}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# PUT /users/<userId>  — protected
@users_bp.route("/users/<user_id>", methods=["PUT"])
@token_required
def update_user(user_id):
    try:
        if g.uid != user_id:
            return jsonify({"error": "Unauthorized"}), 403

        data = request.get_json()
        if not data:
            return jsonify({"error": "Request body is required"}), 400

        error = validate_user_update(data)
        if error:
            return jsonify({"error": error}), 400

        doc = db.collection("users").document(user_id).get()
        if not doc.exists:
            return jsonify({"error": "User not found"}), 404

        allowed = {"name", "disabilityType"}
        updates = {k: v for k, v in data.items() if k in allowed}
        updates["updatedAt"] = datetime.now(timezone.utc).isoformat()

        db.collection("users").document(user_id).update(updates)

        if "name" in updates:
            auth.update_user(user_id, display_name=updates["name"])

        return jsonify({"message": "User updated successfully"}), 200

    except auth.UserNotFoundError:
        return jsonify({"error": "Firebase Auth user not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# DELETE /users/<userId>  — protected
@users_bp.route("/users/<user_id>", methods=["DELETE"])
@token_required
def delete_user(user_id):
    try:
        if g.uid != user_id:
            return jsonify({"error": "Unauthorized"}), 403

        doc = db.collection("users").document(user_id).get()
        if not doc.exists:
            return jsonify({"error": "User not found"}), 404

        db.collection("users").document(user_id).delete()
        auth.delete_user(user_id)

        return jsonify({"message": "User deleted successfully"}), 200

    except auth.UserNotFoundError:
        return jsonify({"message": "User deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500