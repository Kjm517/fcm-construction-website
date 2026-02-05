// Common utility functions

/**
 * Format a number with comma and .00 (e.g., 2900 -> "2,900.00")
 */
export function formatAmountDisplay(val: string | number): string {
  if (val === '' || val == null) return '';
  const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/[^0-9.]/g, ''));
  if (isNaN(num)) return typeof val === 'string' ? val : '';
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Format a number or string as currency (Php format)
 */
export function formatCurrency(amount: string | number): string {
  const num = typeof amount === 'string' 
    ? parseFloat(amount.replace(/[^0-9.]/g, '')) 
    : amount;
  
  if (isNaN(num)) return typeof amount === 'string' ? amount : 'Php 0.00';
  
  return `Php ${num.toLocaleString('en-US', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })}`;
}

/**
 * Calculate total from quotation items
 */
export function calculateTotalFromItems(items: Array<{ price?: string | number }>): string {
  let sum = 0;
  if (items && Array.isArray(items)) {
    items.forEach((item) => {
      if (item && item.price) {
        const priceStr = item.price.toString().replace(/[^0-9.]/g, '');
        const priceNum = parseFloat(priceStr);
        if (!isNaN(priceNum)) {
          sum += priceNum;
        }
      }
    });
  }
  return formatCurrency(sum);
}

/**
 * Format date for PDF display (MM/DD/YY)
 */
export function formatDateForPDF(dateString: string): string {
  try {
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${month}/${day}/${year}`;
  } catch {
    return dateString;
  }
}

/**
 * Format date for display
 */
export function formatDate(date: Date | string | number, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' 
    ? new Date(date) 
    : date;
  
  if (isNaN(dateObj.getTime())) return 'Invalid Date';
  
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  });
}

/**
 * Truncate file name with ellipsis
 */
export function truncateFileName(fileName: string, maxLength: number = 30): string {
  if (!fileName || fileName.length <= maxLength) return fileName;
  return fileName.substring(0, maxLength - 3) + '...';
}

/**
 * Validate email address
 */
export function validateEmail(email: string): string {
  if (!email) return '';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Please enter a valid email address';
  }
  return '';
}

/**
 * Validate Philippine phone number
 */
export function validatePhone(phone: string): string {
  if (!phone) return '';
  const phoneRegex = /^(\+63|0)?9[0-9]{9}$/;
  if (!phoneRegex.test(phone)) {
    return 'Please enter a valid Philippine phone number (e.g., +639123456789 or 09123456789)';
  }
  return '';
}

/**
 * Capitalize first letter of each word in a string
 * Handles multiple spaces and preserves special characters
 */
export function capitalizeFirstLetters(text: string): string {
  if (!text) return text;
  
  // Split by whitespace (spaces, tabs, etc.) and process each word
  return text
    .split(/\s+/)
    .map(word => {
      if (!word) return word;
      // Capitalize first letter, lowercase the rest
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

/**
 * Capitalize only the first letter of the first word, and first letter after periods
 * Example: "the fox is jumping" -> "The fox is jumping"
 * Example: "hello. world" -> "Hello. World"
 */
export function capitalizeSentence(text: string): string {
  if (!text) return text;
  
  // Split by periods followed by space, capitalize first letter after each
  return text
    .split(/(\.\s+)/)
    .map((segment, index) => {
      if (!segment) return segment;
      
      // If it's a period with space, keep it as is
      if (segment.match(/^\.\s+$/)) {
        return segment;
      }
      
      // For the first segment or segments after periods, capitalize first letter
      if (index === 0 || (index > 0 && text.split(/(\.\s+)/)[index - 1]?.match(/^\.\s+$/))) {
        // Capitalize first letter, keep rest as is
        return segment.charAt(0).toUpperCase() + segment.slice(1);
      }
      
      return segment;
    })
    .join('');
}
