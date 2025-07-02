from flask import Flask, request, jsonify
from flask_cors import CORS
from transformers import ViTImageProcessor, ViTForImageClassification
from PIL import Image, UnidentifiedImageError
import io
import torch
import logging
import socket
from flask import Flask, request, jsonify

def is_port_in_use(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('localhost', port)) == 0

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger('FoodRecognition')

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Load model and processor
try:
    logger.info("Loading model...")
    processor = ViTImageProcessor.from_pretrained("Utsav201247/food_recognition")
    model = ViTForImageClassification.from_pretrained("Utsav201247/food_recognition")
    model.eval()
    logger.info("Model loaded successfully!")
except Exception as e:
    logger.error(f"Model loading failed: {str(e)}")
    processor = None
    model = None

@app.route('/')
def home():
    return "Food Recognition Service is running. Use /predict for recognition."

@app.route('/predict', methods=['POST'])
def predict():
    logger.info("Received prediction request")
    
    if not processor or not model:
        return jsonify({'error': 'Model not loaded'}), 500
    
    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400
    
    try:
        # Load image
        image_file = request.files['image']
        logger.info(f"Processing image: {image_file.filename}")
        
        # Read and verify image
        image_bytes = image_file.read()
        if len(image_bytes) == 0:
            return jsonify({'error': 'Empty image file'}), 400
            
        try:
            image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        except UnidentifiedImageError:
            return jsonify({'error': 'Invalid image format'}), 400
        
        # Process image
        inputs = processor(images=image, return_tensors="pt")
        
        # Run inference
        with torch.no_grad():
            outputs = model(**inputs)
        
        # Get results
        logits = outputs.logits
        probabilities = torch.nn.functional.softmax(logits, dim=-1)[0]
        top_prob, top_idx = torch.topk(probabilities, 1)
        
        food_label = model.config.id2label[top_idx.item()]
        confidence = float(top_prob.item())
        
        logger.info(f"Prediction: {food_label} ({confidence:.2f})")
        
        return jsonify({
            'food': food_label,
            'confidence': confidence
        })
    except Exception as e:
        logger.error(f"Processing error: {str(e)}")
        return jsonify({
            'error': 'Image processing failed',
            'details': str(e)
        }), 500

if __name__ == '__main__':
    port = 5000
    if is_port_in_use(port):
        print(f"⚠️ Port {port} is already in use! Trying port 5001")
        port = 5001
        
    app.run(host='0.0.0.0', port=port, threaded=True)
    print(f"✅ Service running on http://0.0.0.0:{port}")