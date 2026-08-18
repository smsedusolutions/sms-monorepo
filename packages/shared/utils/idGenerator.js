/**
 * Robust sequential ID generator helper
 * Prevents NaN corruption (e.g., STU00NaN) by strictly querying regex-valid IDs,
 * safely parsing numeric values, and checking for collisions.
 */

/**
 * @param {import('mongoose').Model} Model
 * @param {string} idField - Name of ID field (e.g., 'studentId', 'teacherId')
 * @param {string} prefix - ID prefix (e.g., 'STU', 'TCH', 'PRT')
 * @param {number} [padLength=5] - Number of padded digits (default: 5)
 * @param {object} [additionalFilter={}] - Additional query filter (e.g., { schoolId })
 * @returns {Promise<string>}
 */
const generateNextId = async (Model, idField, prefix, padLength = 5, additionalFilter = {}) => {
  try {
    const validIdRegex = new RegExp(`^${prefix}\\d+$`);
    const filter = {
      [idField]: validIdRegex,
      ...additionalFilter,
    };

    const lastDoc = await Model.findOne(filter)
      .sort({ [idField]: -1 })
      .select(idField)
      .lean();

    let nextNumber = 1;

    if (lastDoc && lastDoc[idField]) {
      const rawId = String(lastDoc[idField]);
      const match = rawId.match(new RegExp(`^${prefix}(\\d+)$`));
      if (match && match[1]) {
        const parsed = parseInt(match[1], 10);
        if (!isNaN(parsed) && parsed > 0) {
          nextNumber = parsed + 1;
        }
      }
    }

    let candidateId = `${prefix}${String(nextNumber).padStart(padLength, "0")}`;

    // Collision safety check
    let collision = await Model.exists({ [idField]: candidateId, ...additionalFilter });
    while (collision) {
      nextNumber += 1;
      candidateId = `${prefix}${String(nextNumber).padStart(padLength, "0")}`;
      collision = await Model.exists({ [idField]: candidateId, ...additionalFilter });
    }

    return candidateId;
  } catch (error) {
    console.error(`Error generating ID for ${prefix}:`, error);
    return `${prefix}${Date.now().toString().slice(-padLength)}`;
  }
};

module.exports = {
  generateNextId,
};
