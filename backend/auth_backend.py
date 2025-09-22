# backend/auth_backend.py
import os
from flask import Flask, request, jsonify
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials, auth, firestore
import bcrypt

# Load environment variables
load_dotenv()

# Initialize Firebase Admin SDK
# Make sure your service account JSON file is in the same directory
cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

app = Flask(__name__)

# This single endpoint handles both user creation and login
@app.route('/api/auth', methods=['POST'])
def handle_auth():
    data = request.json
    phone_number = data.get('phoneNumber')
    pin = data.get('pin')

    if not phone_number or not pin or len(pin) != 6:
        return jsonify({'message': 'Invalid input'}), 400

    users_ref = db.collection('users')
    query = users_ref.where('phoneNumber', '==', phone_number).limit(1)
    user_doc = next(query.stream(), None)

    try:
        if user_doc:
            # User exists, verify PIN
            user_data = user_doc.to_dict()
            hashed_pin = user_data['pin_hash'].encode('utf-8')
            if bcrypt.checkpw(pin.encode('utf-8'), hashed_pin):
                # PIN is correct, generate custom token
                firebase_user = auth.get_user_by_phone_number(phone_number)
                custom_token = auth.create_custom_token(firebase_user.uid)
                return jsonify({'token': custom_token.decode('utf-8')}), 200
            else:
                return jsonify({'message': 'Invalid PIN'}), 401
        else:
            # User does not exist, create new user
            pin_hash = bcrypt.hashpw(pin.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            new_firebase_user = auth.create_user(phone_number=phone_number)
            
            # Save user data to Firestore
            users_ref.document(new_firebase_user.uid).set({
                'phoneNumber': phone_number,
                'pin_hash': pin_hash,
                'created_at': firestore.SERVER_TIMESTAMP
            })
            
            # Generate custom token for new user
            custom_token = auth.create_custom_token(new_firebase_user.uid)
            return jsonify({'token': custom_token.decode('utf-8')}), 201
    
    except Exception as e:
        print(f"Auth error: {e}")
        return jsonify({'message': 'Authentication failed'}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)