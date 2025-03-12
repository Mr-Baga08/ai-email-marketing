// utils/file-utils.js
/**
 * Convert a file to a base64 string
 * @param {File} file - The file to convert
 * @returns {Promise<string>} - Base64 string
 */
export const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = error => reject(error);
    });
  };
  
  /**
   * Get file extension from filename
   * @param {string} filename - The filename
   * @returns {string} - The file extension
   */
  export const getFileExtension = (filename) => {
    return filename.split('.').pop().toLowerCase();
  };
  
  /**
   * Check if a file is CSV
   * @param {File} file - The file to check
   * @returns {boolean} - Whether the file is CSV
   */
  export const isCSV = (file) => {
    const extension = getFileExtension(file.name);
    return extension === 'csv' || file.type === 'text/csv';
  };
  
  /**
   * Check if a file is Excel
   * @param {File} file - The file to check
   * @returns {boolean} - Whether the file is Excel
   */
  export const isExcel = (file) => {
    const extension = getFileExtension(file.name);
    return ['xls', 'xlsx'].includes(extension) || 
      ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'].includes(file.type);
  };
  
  /**
   * Format file size for display
   * @param {number} bytes - File size in bytes
   * @returns {string} - Formatted file size
   */
  export const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };