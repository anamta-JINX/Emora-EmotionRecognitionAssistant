# train_model.py
import numpy as np
import tensorflow as tf
from tensorflow.keras import layers, regularizers, models
from tensorflow.keras.callbacks import (
    EarlyStopping, ReduceLROnPlateau, ModelCheckpoint
)

# -----------------------------
# Load preprocessed data
# -----------------------------
print("Loading preprocessed data...")
data = np.load("preprocessed/images_labels.npz")
X = data["X"]
y = data["y"]

print(f"Data: X={X.shape}, y={y.shape}")

# Safety checks
assert X.shape[1:] == (48, 48, 1), "Expected images shape (48,48,1)"
assert y.shape[1] == 7, "Expected 7 emotion classes"

# -----------------------------
# Shuffle data (important)
# -----------------------------
idx = np.arange(len(X))
np.random.shuffle(idx)
X = X[idx]
y = y[idx]

# -----------------------------
# Data augmentation (helps generalization)
# -----------------------------
augment = tf.keras.Sequential([
    layers.RandomFlip("horizontal"),
    layers.RandomRotation(0.08),
    layers.RandomZoom(0.10),
    layers.RandomTranslation(0.06, 0.06),
    layers.RandomContrast(0.15),
], name="augmentation")

# -----------------------------
# Build a stronger CNN model
# -----------------------------
# Uses:
# - BatchNorm for stability
# - L2 weight decay to reduce overfitting
# - GAP (GlobalAveragePooling) for better generalization than Flatten
# - Dropout
weight_decay = 1e-4

inputs = layers.Input(shape=(48, 48, 1))
x = augment(inputs)

# Block 1
x = layers.Conv2D(64, 3, padding="same", kernel_regularizer=regularizers.l2(weight_decay))(x)
x = layers.BatchNormalization()(x)
x = layers.Activation("relu")(x)
x = layers.Conv2D(64, 3, padding="same", kernel_regularizer=regularizers.l2(weight_decay))(x)
x = layers.BatchNormalization()(x)
x = layers.Activation("relu")(x)
x = layers.MaxPooling2D()(x)
x = layers.Dropout(0.25)(x)

# Block 2
x = layers.Conv2D(128, 3, padding="same", kernel_regularizer=regularizers.l2(weight_decay))(x)
x = layers.BatchNormalization()(x)
x = layers.Activation("relu")(x)
x = layers.Conv2D(128, 3, padding="same", kernel_regularizer=regularizers.l2(weight_decay))(x)
x = layers.BatchNormalization()(x)
x = layers.Activation("relu")(x)
x = layers.MaxPooling2D()(x)
x = layers.Dropout(0.30)(x)

# Block 3
x = layers.Conv2D(256, 3, padding="same", kernel_regularizer=regularizers.l2(weight_decay))(x)
x = layers.BatchNormalization()(x)
x = layers.Activation("relu")(x)
x = layers.Conv2D(256, 3, padding="same", kernel_regularizer=regularizers.l2(weight_decay))(x)
x = layers.BatchNormalization()(x)
x = layers.Activation("relu")(x)
x = layers.MaxPooling2D()(x)
x = layers.Dropout(0.35)(x)

# Block 4 (extra depth)
x = layers.Conv2D(256, 3, padding="same", kernel_regularizer=regularizers.l2(weight_decay))(x)
x = layers.BatchNormalization()(x)
x = layers.Activation("relu")(x)
x = layers.Conv2D(256, 3, padding="same", kernel_regularizer=regularizers.l2(weight_decay))(x)
x = layers.BatchNormalization()(x)
x = layers.Activation("relu")(x)
x = layers.MaxPooling2D()(x)
x = layers.Dropout(0.40)(x)

# Head
x = layers.GlobalAveragePooling2D()(x)
x = layers.Dense(256, activation="relu", kernel_regularizer=regularizers.l2(weight_decay))(x)
x = layers.Dropout(0.50)(x)
outputs = layers.Dense(7, activation="softmax")(x)

model = models.Model(inputs, outputs, name="emora_cnn_v2")
model.summary()

# -----------------------------
# Compile
# -----------------------------
model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3),
    loss="categorical_crossentropy",
    metrics=["accuracy"]
)

# -----------------------------
# Callbacks (makes it better)
# -----------------------------
checkpoint = ModelCheckpoint(
    "emora_model.h5",            # overwrite best model here
    monitor="val_accuracy",
    save_best_only=True,
    mode="max",
    verbose=1
)

reduce_lr = ReduceLROnPlateau(
    monitor="val_loss",
    factor=0.5,
    patience=3,
    min_lr=1e-6,
    verbose=1
)

early_stop = EarlyStopping(
    monitor="val_accuracy",
    patience=7,
    restore_best_weights=True,
    verbose=1
)

# -----------------------------
# Train
# -----------------------------
print("Training model (improved)...")
history = model.fit(
    X, y,
    epochs=60,
    batch_size=64,
    validation_split=0.15,
    callbacks=[checkpoint, reduce_lr, early_stop],
    verbose=1
)

print("\n✅ Training complete.")
print("✅ Best model saved as: emora_model.h5")
