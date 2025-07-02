const ort = require('onnxruntime-node');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const https = require('https');
const { promisify } = require('util');
const pipeline = promisify(require('stream').pipeline);

class FoodRecognizer {
    static session = null;
    static labels = [];
    static modelPath = path.join(__dirname, 'food-classifier.onnx');
    static labelsPath = path.join(__dirname, 'food-labels.txt');

    static async initialize() {
        if (!this.session) {
            // Download model if it doesn't exist
            if (!fs.existsSync(this.modelPath)) {
                console.log('Downloading model...');
                await this.downloadFile('https://maulik-recipe-models.s3.amazonaws.com/food-classifier.onnx', this.modelPath);
            }
            
            // Download labels if they don't exist
            if (!fs.existsSync(this.labelsPath)) {
                console.log('Downloading labels...');
                await this.downloadFile('https://maulik-recipe-models.s3.amazonaws.com/food-labels.txt', this.labelsPath);
            }

            // Load model
            try {
                this.session = await ort.InferenceSession.create(this.modelPath);
                console.log('Model loaded successfully');
            } catch (e) {
                console.error('Model loading failed:', e);
                throw e;
            }
            
            // Load labels
            const labelsText = fs.readFileSync(this.labelsPath, 'utf8');
            this.labels = labelsText.split('\n').filter(label => label.trim());
            console.log(`Loaded ${this.labels.length} food labels`);
        }
    }

    static async downloadFile(url, filePath) {
        const response = await new Promise((resolve, reject) => {
            https.get(url, resolve).on('error', reject);
        });
        
        if (response.statusCode !== 200) {
            throw new Error(`Failed to download file: ${response.statusCode}`);
        }
        
        const fileStream = fs.createWriteStream(filePath);
        await pipeline(response, fileStream);
    }

    static async recognize(imagePath) {
        await this.initialize();
        
        // Preprocess image
        const imageBuffer = await sharp(imagePath)
            .resize(224, 224)
            .normalize()
            .raw()
            .toBuffer();
        
        // Convert to tensor (RGB format with ImageNet normalization)
        const tensorData = new Float32Array(3 * 224 * 224);
        const mean = [0.485, 0.456, 0.406];
        const std = [0.229, 0.224, 0.225];
        
        for (let i = 0; i < 224 * 224; i++) {
            const r = imageBuffer[i * 3] / 255;
            const g = imageBuffer[i * 3 + 1] / 255;
            const b = imageBuffer[i * 3 + 2] / 255;
            
            tensorData[i] = (r - mean[0]) / std[0];
            tensorData[i + 224 * 224] = (g - mean[1]) / std[1];
            tensorData[i + 2 * 224 * 224] = (b - mean[2]) / std[2];
        }
        
        // Create tensor
        const tensor = new ort.Tensor('float32', tensorData, [1, 3, 224, 224]);
        
        // Run inference
        const results = await this.session.run({ input: tensor });
        const output = results.output.data;
        
        // Find top prediction
        let maxIdx = 0;
        let maxValue = output[0];
        for (let i = 1; i < output.length; i++) {
            if (output[i] > maxValue) {
                maxValue = output[i];
                maxIdx = i;
            }
        }
        
        return {
            label: this.labels[maxIdx],
            confidence: maxValue
        };
    }
}

module.exports = FoodRecognizer;