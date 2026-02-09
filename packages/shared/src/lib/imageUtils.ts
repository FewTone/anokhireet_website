/**
 * Utility functions for handling image URLs from Supabase Storage
 */

/**
 * Ensures an image URL is a valid, accessible URL
 * If the URL is a storage path, converts it to a public URL
 */
export function ensureImageUrl(imageUrl: string | null | undefined): string | null {
    if (!imageUrl) return null;

    // If it's already a full URL (starts with http:// or https://), return as is
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        return imageUrl;
    }

    // If it's a storage path, we need to construct the public URL
    // This shouldn't happen if uploadImageToSupabase is working correctly,
    // but we'll handle it just in case
    console.warn('Image URL appears to be a path, not a full URL:', imageUrl);
    return null;
}

/**
 * Validates if an image URL is accessible
 */
export function isValidImageUrl(url: string | null | undefined): boolean {
    if (!url) return false;
    return url.startsWith('http://') || url.startsWith('https://');
}

/**
 * Converts an image file to WebP format
 */
export const convertToWebP = (file: File, quality: number = 0.75, maxWidth?: number, maxHeight?: number): Promise<{ blob: Blob; size: number }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            // Use window.Image to access the native browser Image constructor
            const img = new window.Image();
            img.onload = () => {
                const canvas = document.createElement("canvas");

                // Calculate new dimensions if resizing is needed
                let width = img.width;
                let height = img.height;

                if (maxWidth && maxHeight) {
                    const ratio = Math.min(maxWidth / width, maxHeight / height);
                    if (ratio < 1) {
                        width = Math.floor(width * ratio);
                        height = Math.floor(height * ratio);
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                if (!ctx) {
                    reject(new Error("Could not get canvas context"));
                    return;
                }

                // Use better image smoothing for resizing
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            resolve({ blob, size: blob.size });
                        } else {
                            reject(new Error("Failed to convert image to WebP"));
                        }
                    },
                    "image/webp",
                    quality
                );
            };
            img.onerror = () => reject(new Error("Failed to load image"));
            if (e.target?.result) {
                img.src = e.target.result as string;
            }
        };
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
    });
};

/**
 * Converts an image file to optimized WebP format with automatic quality adjustment
 */
export const convertToWebPOptimized = async (file: File): Promise<{ blob: Blob; size: number }> => {
    const originalSize = file.size;
    let bestBlob: Blob | null = null;
    let bestSize = originalSize;
    let bestQuality = 0.75;

    const shouldResize = originalSize > 1024 * 1024; // 1MB
    const maxDimension = shouldResize ? 1920 : undefined;

    const qualityLevels = [0.7, 0.6, 0.5, 0.4, 0.3, 0.25];

    for (const quality of qualityLevels) {
        try {
            const { blob, size } = await convertToWebP(file, quality, maxDimension, maxDimension);
            if (size < bestSize) {
                bestBlob = blob;
                bestSize = size;
                bestQuality = quality;
            }
            if (size < originalSize * 0.7) {
                console.log(`Found good compression at quality ${quality}: ${((1 - size / originalSize) * 100).toFixed(1)}% reduction`);
                break;
            }
        } catch (error) {
            console.warn(`Failed to convert with quality ${quality}:`, error);
            continue;
        }
    }

    if (bestSize >= originalSize && !shouldResize) {
        console.log("Trying with resizing...");
        for (const quality of [0.5, 0.4, 0.3]) {
            try {
                const { blob, size } = await convertToWebP(file, quality, 1920, 1920);
                if (size < bestSize) {
                    bestBlob = blob;
                    bestSize = size;
                    bestQuality = quality;
                }
                if (size < originalSize * 0.7) break;
            } catch (error) {
                continue;
            }
        }
    }

    if (!bestBlob || bestSize >= originalSize) {
        console.log("Using very low quality as last resort...");
        const { blob } = await convertToWebP(file, 0.25, 1920, 1920);
        return { blob, size: blob.size };
    }

    console.log(`Best compression: quality ${bestQuality}, ${((1 - bestSize / originalSize) * 100).toFixed(1)}% reduction`);
    return { blob: bestBlob, size: bestSize };
};

