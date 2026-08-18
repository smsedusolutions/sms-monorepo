/**
 * Utility for natural and numerical sorting of School Classes.
 * Correctly orders Pre-school/KG, Arabic numerals (Class 1, Class 2, ... Class 12),
 * Roman numerals (Class I, Class X), and class-section combinations (Class 1-A, Class 1-B).
 */

export const extractClassRank = (name: string): number => {
    if (!name || typeof name !== 'string') return 999;
    const lower = name.toLowerCase().trim();

    // Kindergarten & Early Childhood
    if (lower.includes('play') || lower.includes('daycare') || lower.includes('creche')) return -50;
    if (lower.includes('nursery') || lower.includes('pre-kg') || lower.includes('prekg')) return -40;
    if (lower.includes('lkg') || lower.includes('jr') || lower.includes('junior')) return -30;
    if (lower.includes('ukg') || lower.includes('sr') || lower.includes('senior')) return -20;
    if (lower.includes('kg') || lower.includes('kindergarten')) return -10;

    // Check for Arabic numbers (e.g. "Class 1", "Grade 10", "1st", "10th", "Class 1 - A")
    const numMatch = lower.match(/\b\d+\b/) || lower.match(/\d+/);
    if (numMatch) {
        return parseInt(numMatch[0], 10);
    }

    // Check for Roman numerals at word boundaries (e.g. "Class I", "Class X", "Grade XII")
    const romanMap: Record<string, number> = {
        'xii': 12,
        'xi': 11,
        'x': 10,
        'ix': 9,
        'viii': 8,
        'vii': 7,
        'vi': 6,
        'v': 5,
        'iv': 4,
        'iii': 3,
        'ii': 2,
        'i': 1,
    };

    const words = lower.split(/[\s-_/]+/);
    for (const word of words) {
        if (romanMap[word] !== undefined) {
            return romanMap[word];
        }
    }

    return 999;
};

/**
 * Compare two classes or items with a name property numerically.
 */
export const compareClassesNumerically = (
    a: { name?: string; className?: string } | string | null | undefined,
    b: { name?: string; className?: string } | string | null | undefined
): number => {
    const nameA = typeof a === 'string' ? a : (a?.name || a?.className || '');
    const nameB = typeof b === 'string' ? b : (b?.name || b?.className || '');

    const rankA = extractClassRank(nameA);
    const rankB = extractClassRank(nameB);

    if (rankA !== rankB) {
        return rankA - rankB;
    }

    // Fallback to natural string localeCompare with numeric option for section differences
    return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
};

/**
 * Sorts an array of class objects or strings numerically.
 */
export const sortClassesNumerically = <T extends { name?: string; className?: string } | string>(
    classes: T[]
): T[] => {
    if (!Array.isArray(classes)) return [];
    return [...classes].sort(compareClassesNumerically);
};
