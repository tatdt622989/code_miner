/**
 * Converts a number to a string with thousand separators.
 * @param {number|string} num - The number to be formatted.
 * @returns {string} The formatted number with thousand separators.
 */
function formatWithThousandSeparators(num) {
  if (isNaN(num)) return ''; // Check if the input is not a number

  // Convert to string and format with regex
  return Number(num).toLocaleString();
}

module.exports = formatWithThousandSeparators;