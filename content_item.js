export class ContentItem {
  /**
   * @param {'video' | 'image'} type - The content type (e.g., video or image)
   * @param {string} url - The URL or blob path of the content
   * @param {number} duration - Duration in seconds to display/play the content
   */
  constructor(type, url, duration) {
    this.type = type;         // 'video' or 'image'
    this.url = url;           // Full URL or Blob URL
    this.duration = duration; // In seconds
  }

  /**
   * Returns a plain JSON object version of this instance
   */
  toJSON() {
    return {
      type: this.type,
      url: this.url,
      duration: this.duration
    };
  }

  /**
   * Create a ContentItem from a plain object (e.g., from localStorage or JSON)
   * @param {Object} obj
   * @returns {ContentItem}
   */
  static fromJSON(obj) {
    return new ContentItem(obj.type, obj.url, obj.duration);
  }
}
