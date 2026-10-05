/**
 * Compresses and resizes an image file to a crisp, lightweight Base64 JPEG data URL.
 * Ideal for profile photos / DPs: crops to square & optimizes to ~40-80KB.
 * 
 * @param {File} file - Image file from file input or drag-and-drop
 * @param {Object} options - { maxSize: 400, quality: 0.85 }
 * @returns {Promise<{ dataUrl: string, sizeKB: number, width: number, height: number }>}
 */
export const compressImage = (file, { maxSize = 400, quality = 0.85 } = {}) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new Error("No file selected"));
    }

    if (!file.type || !file.type.startsWith("image/")) {
      return reject(new Error("Selected file must be an image (JPG, PNG, WebP)"));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onerror = () => reject(new Error("Failed to load image"));
      img.onload = () => {
        try {
          // Center crop to square aspect ratio for round DP
          const originalWidth = img.width;
          const originalHeight = img.height;
          const minEdge = Math.min(originalWidth, originalHeight);

          const cropX = (originalWidth - minEdge) / 2;
          const cropY = (originalHeight - minEdge) / 2;

          const targetSize = Math.min(maxSize, minEdge);

          const canvas = document.createElement("canvas");
          canvas.width = targetSize;
          canvas.height = targetSize;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            return reject(new Error("Could not initialize 2D canvas"));
          }

          // Use high quality image smoothing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";

          // Draw cropped center square
          ctx.drawImage(
            img,
            cropX,
            cropY,
            minEdge,
            minEdge,
            0,
            0,
            targetSize,
            targetSize
          );

          // Export as JPEG with optimal quality
          const dataUrl = canvas.toDataURL("image/jpeg", quality);
          const sizeInBytes = Math.round((dataUrl.length * 3) / 4);
          const sizeKB = Math.round(sizeInBytes / 1024);

          resolve({
            dataUrl,
            sizeKB,
            width: targetSize,
            height: targetSize,
          });
        } catch (err) {
          reject(err);
        }
      };
      img.src = readerEvent.target.result;
    };
    reader.readAsDataURL(file);
  });
};
