// utils/chart-utils.js
import { format } from 'date-fns';

/**
 * Format data for time series chart
 * @param {Array} data - Data points
 * @param {string} dateField - Field containing date
 * @param {string} valueField - Field containing value
 * @param {string} dateFormat - Format for the date (default: 'MMM d')
 * @returns {Array} - Formatted data for charting
 */
export const formatTimeSeriesData = (data, dateField, valueField, dateFormat = 'MMM d') => {
  return data.map(item => ({
    date: format(new Date(item[dateField]), dateFormat),
    value: item[valueField]
  }));
};

/**
 * Format data for pie/donut chart
 * @param {Object} data - Object with category keys and values
 * @returns {Array} - Formatted data for charting
 */
export const formatPieChartData = (data) => {
  return Object.entries(data).map(([name, value]) => ({
    name,
    value
  }));
};

/**
 * Get color scheme for charts
 * @param {string} type - Chart type
 * @returns {Array} - Array of color hex codes
 */
export const getChartColors = (type = 'default') => {
  const colorSchemes = {
    default: ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A163F7'],
    blue: ['#0088FE', '#2E93fA', '#66B2FF', '#99D0FF', '#CCE5FF'],
    green: ['#00C49F', '#00A36C', '#00824A', '#006627', '#004D40'],
    sequential: ['#E8F5E9', '#C8E6C9', '#A5D6A7', '#81C784', '#66BB6A', '#4CAF50', '#43A047', '#388E3C', '#2E7D32', '#1B5E20']
  };
  
  return colorSchemes[type] || colorSchemes.default;
};

/**
 * Calculate percentage change between two values
 * @param {number} current - Current value
 * @param {number} previous - Previous value
 * @returns {number} - Percentage change
 */
export const calculatePercentageChange = (current, previous) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};