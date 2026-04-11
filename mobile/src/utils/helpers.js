import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';

/**
 * Format a date to a readable string (e.g., "Mar 15, 2026")
 */
export const formatDate = (date, formatStr = 'MMM d, yyyy') => {
  if (!date) return '';
  const dateObj = date instanceof Date ? date : new Date(date);
  return format(dateObj, formatStr);
};

/**
 * Format a time to 12-hour format (e.g., "2:30 PM")
 */
export const formatTime12 = (date, includeSeconds = false) => {
  if (!date) return '';
  const dateObj = date instanceof Date ? date : new Date(date);
  const formatStr = includeSeconds ? 'h:mm:ss a' : 'h:mm a';
  return format(dateObj, formatStr);
};

/**
 * Get time relative to now (e.g., "2 hours ago", "in 3 days")
 */
export const getTimeAgo = (date) => {
  if (!date) return '';
  const dateObj = date instanceof Date ? date : new Date(date);

  if (isToday(dateObj)) {
    return formatDistanceToNow(dateObj, { addSuffix: true });
  }

  if (isYesterday(dateObj)) {
    return 'Yesterday';
  }

  return formatDistanceToNow(dateObj, { addSuffix: true });
};

/**
 * Format a number as currency (e.g., "$250.00")
 */
export const formatCurrency = (amount, currency = 'USD') => {
  if (amount === null || amount === undefined) return '';

  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return formatter.format(amount);
};

/**
 * Get initials from a name (e.g., "John Doe" -> "JD")
 */
export const getInitials = (name) => {
  if (!name) return '?';

  return name
    .split(' ')
    .filter((part) => part.length > 0)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
};

/**
 * Escape HTML special characters for safe display
 */
export const escapeHtml = (text) => {
  if (!text) return '';

  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };

  return text.replace(/[&<>"']/g, (char) => map[char]);
};

/**
 * Capitalize first letter of a string
 */
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Truncate a string to a maximum length with ellipsis
 */
export const truncate = (str, maxLength = 50, ellipsis = '...') => {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - ellipsis.length) + ellipsis;
};

/**
 * Check if an email is valid
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Check if a phone number is valid (basic US format)
 */
export const isValidPhone = (phone) => {
  const phoneRegex = /^\d{10}$|^\(\d{3}\) \d{3}-\d{4}$|^\d{3}-\d{3}-\d{4}$/;
  return phoneRegex.test(phone.replace(/\D/g, ''));
};

/**
 * Format a phone number to (XXX) XXX-XXXX format
 */
export const formatPhone = (phone) => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length !== 10) return phone;
  return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
};

/**
 * Convert file size in bytes to readable format
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Check if a URL is valid
 */
export const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Combine multiple class names, filtering out falsy values
 */
export const cn = (...classes) => {
  return classes.filter(Boolean).join(' ');
};

export default {
  formatDate,
  formatTime12,
  getTimeAgo,
  formatCurrency,
  getInitials,
  escapeHtml,
  capitalize,
  truncate,
  isValidEmail,
  isValidPhone,
  formatPhone,
  formatFileSize,
  isValidUrl,
  cn,
};
