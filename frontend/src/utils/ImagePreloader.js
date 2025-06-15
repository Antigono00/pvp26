/**
 * Utility to preload images
 */
export class ImagePreloader {
  constructor() {
    this.images = {};
  }

  /**
   * Load multiple images and return a promise that resolves when all images are loaded
   * @param {Object} sources - Object with keys as image names and values as image paths
   * @returns {Promise} - Promise that resolves with an object of loaded images
   */
  loadImages(sources) {
    const promises = Object.entries(sources).map(([name, src]) => {
      return this.loadImage(src).then(img => {
        this.images[name] = img;
        return { [name]: img };
      });
    });

    return Promise.all(promises).then(results => {
      return results.reduce((acc, result) => {
        return { ...acc, ...result };
      }, {});
    });
  }

  /**
   * Load a single image and return a promise
   * @param {string} src - Image path
   * @returns {Promise} - Promise that resolves with the loaded image
   */
  loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
      img.src = src;
    });
  }

  /**
   * Get a loaded image by name
   * @param {string} name - Image name
   * @returns {Image|null} - The loaded image or null if not found
   */
  getImage(name) {
    return this.images[name] || null;
  }

  /**
   * Get all loaded images
   * @returns {Object} - Object with all loaded images
   */
  getAllImages() {
    return { ...this.images };
  }
}

export default new ImagePreloader();
