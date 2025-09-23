import os
from flask import Flask, request, jsonify
from dotenv import load_dotenv
import firebase_admin # 👈 Add this import
from firebase_admin import credentials, auth, firestore # 👈 Add this import
import bcrypt
import json
import google.generativeai as genai


# Make sure you have loaded your environment variables (e.g., from .env)
# from dotenv import load_dotenv
# load_dotenv()

# Load the service account key from an environment variable
cred_json_string = os.getenv("FIREBASE_SERVICE_ACCOUNT_KEY")
if not cred_json_string:
    raise ValueError("FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set.")

# Parse the JSON string into a dictionary
cred_dict = json.loads(cred_json_string)
cred = credentials.Certificate(cred_dict)

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
    
genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))
model = genai.GenerativeModel('gemini-pro')

SYSTEM_PROMPT = """
You are Ann Dhan, a helpful Indian agriculture assistant for smallholder farmers.
Be concise, practical and give one clear immediate action the farmer can take.
Answer in the requested language. If the user asked about a crop, tailor advice for that crop.
"""

@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.json
    q = data.get("question", "")
    crop = data.get("crop", "")
    history = data.get("history", [])

    # Format conversation history for the prompt
    history_string = ""
    for msg in history:
        role = "Farmer" if msg['from'] == 'user' else "Ann Dhan"
        history_string += f"{role}: {msg['text']}\n"

    final_prompt = f"""
    {SYSTEM_PROMPT}
    
    Conversation History:
    {history_string}

    Farmer's Crop: {crop}
    New Question: {q}
    """

    try:
        response = model.generate_content(final_prompt)
        answer = response.text
        return jsonify({"answer": answer})
    except Exception as e:
        print(f"Gemini API error: {e}")
        return jsonify({"answer": "An error occurred with the AI."}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)