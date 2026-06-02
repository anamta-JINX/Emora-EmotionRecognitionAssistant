import cv2
import numpy as np
from tensorflow.keras.models import load_model
import sys
import os

# -----------------------------
# Load trained emotion model
# -----------------------------
model = load_model("emora_model.h5")
print("Emotion model loaded successfully")

emotion_labels = [
    "Angry",
    "Disgust",
    "Fear",
    "Happy",
    "Sad",
    "Surprise",
    "Neutral"
]

# -----------------------------
# Load Haar Cascade
# -----------------------------
face_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
)

# -----------------------------
# CLAHE for low-light enhancement
# -----------------------------
clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))

# -----------------------------
# Gamma correction function
# -----------------------------
def adjust_gamma(image, gamma=1.5):
    invGamma = 1.0 / gamma
    table = np.array([
        ((i / 255.0) ** invGamma) * 255
        for i in range(256)
    ]).astype("uint8")
    return cv2.LUT(image, table)

# -----------------------------
# Main Image Detection Function
# -----------------------------
def detect_emotions_in_image(img_path):
    """Process a single image file using the original app.py logic"""
    
    # Robust image loading (handles spaces & jfif)
    data = np.fromfile(img_path, dtype=np.uint8)
    img = cv2.imdecode(data, cv2.IMREAD_COLOR)

    if img is None:
        print("ERROR: Could not read image.")
        return None

    # Gamma correction (brighten image) - EXACTLY like original
    img = adjust_gamma(img, gamma=1.5)

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Apply CLAHE - EXACTLY like original
    gray = clahe.apply(gray)

    # Detect faces - EXACTLY like original parameters
    faces = face_cascade.detectMultiScale(
        gray,
        scaleFactor=1.2,
        minNeighbors=4,
        minSize=(30, 30)
    )

    print(f"Detected {len(faces)} face(s) in the image")
    
    for (x, y, w, h) in faces:
        face = gray[y:y+h, x:x+w]

        if face.size == 0:
            continue

        # Resize and preprocess - EXACTLY like original
        face = cv2.resize(face, (48, 48))
        face = face / 255.0
        face = face.reshape(1, 48, 48, 1)

        # Predict emotion - EXACTLY like original
        predictions = model.predict(face, verbose=0)
        emotion = emotion_labels[np.argmax(predictions)]
        
        # Calculate confidence
        confidence = np.max(predictions) * 100

        # Draw rectangle and label - EXACTLY like original but with confidence
        cv2.rectangle(img, (x, y), (x+w, y+h), (0, 255, 0), 2)
        
        # Add emotion label with confidence
        label = f"{emotion} ({confidence:.1f}%)"
        cv2.putText(
            img,
            label,
            (x, y - 10),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.9,
            (0, 255, 0),
            2
        )
        
        print(f"  - Face at ({x},{y}): {emotion} ({confidence:.1f}%)")

    return img

# -----------------------------
# Main Execution
# -----------------------------
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python app_modified_image.py <image_path>")
        sys.exit(1)
    
    img_path = sys.argv[1]
    
    if not os.path.exists(img_path):
        print(f"Error: File not found - {img_path}")
        sys.exit(1)
    
    print(f"Processing image: {img_path}")
    result = detect_emotions_in_image(img_path)
    
    if result is not None:
        # Display the result
        window_name = f"EMORA - {os.path.basename(img_path)}"
        cv2.namedWindow(window_name, cv2.WINDOW_NORMAL)
        cv2.resizeWindow(window_name, 800, 600)
        
        # Show the image
        cv2.imshow(window_name, result)
        
        # Instructions
        print("\nPress any key to close the window, or 's' to save the result")
        
        key = cv2.waitKey(0) & 0xFF
        
        if key == ord('s') or key == ord('S'):
            # Save the result
            base_name = os.path.splitext(os.path.basename(img_path))[0]
            save_path = f"{base_name}_emotion_detected.jpg"
            cv2.imwrite(save_path, result)
            print(f"Result saved as: {save_path}")
        
        cv2.destroyAllWindows()
        print("Detection completed.")