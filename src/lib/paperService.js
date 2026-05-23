const SUBJECT_MAP = {
  // A Levels
  '9702': { level: 'A Levels', name: 'Physics (9702)' },
  '9709': { level: 'A Levels', name: 'Mathematics (9709)' },
  '9701': { level: 'A Levels', name: 'Chemistry (9701)' },
  '9700': { level: 'A Levels', name: 'Biology (9700)' },
  '9618': { level: 'A Levels', name: 'Computer Science (9618)' },
  '9608': { level: 'A Levels', name: 'Computer Science (9608)' },
  '9708': { level: 'A Levels', name: 'Economics (9708)' },
  '9696': { level: 'A Levels', name: 'Geography (9696)' },
  '9699': { level: 'A Levels', name: 'Sociology (9699)' },
  '9706': { level: 'A Levels', name: 'Accounting (9706)' },
  '9707': { level: 'A Levels', name: 'Business Studies (9707)' },
  '9609': { level: 'A Levels', name: 'Business (9609)' },

  // IGCSE
  '0625': { level: 'IGCSE', name: 'Physics (0625)' },
  '0580': { level: 'IGCSE', name: 'Mathematics (0580)' },
  '0620': { level: 'IGCSE', name: 'Chemistry (0620)' },
  '0610': { level: 'IGCSE', name: 'Biology (0610)' },
  '0478': { level: 'IGCSE', name: 'Computer Science (0478)' },
  '0452': { level: 'IGCSE', name: 'Accounting (0452)' },
  '0450': { level: 'IGCSE', name: 'Business Studies (0450)' },
  '0455': { level: 'IGCSE', name: 'Economics (0455)' },
};

// Cambridge series codes → human-readable month labels
export const TERM_MAP = [
  { code: 'm', label: 'Feb / Mar', shortLabel: 'Feb-Mar' },
  { code: 's', label: 'May / Jun', shortLabel: 'May-Jun' },
  { code: 'w', label: 'Oct / Nov', shortLabel: 'Oct-Nov' },
];

export const getSubjectInfo = (subjectCode) => {
  if (SUBJECT_MAP[subjectCode]) {
    return SUBJECT_MAP[subjectCode];
  }
  const isIGCSE = subjectCode.startsWith('0');
  const level = isIGCSE ? 'IGCSE' : 'A Levels';
  return { level, name: `Subject (${subjectCode})` };
}
// Helper to build URLs for a subject code (sanitized)
const buildUrl = (subjectCode, subjectInfo, year, seriesCode, comp, paperNum, variant) => {
  const levelPath = subjectInfo.level === 'IGCSE' ? 'cambridge-igcse' : 'cambridge-international-a-level';
  // Sanitize code for filenames
  const cleanCode = subjectCode.replace(/[^A-Za-z0-9]/g, '').trim();
  // Encode subject code for URL path (preserves slashes)
  const encodedSubject = encodeURIComponent(subjectCode);
  let subjectPath;
  if (subjectInfo.name.startsWith('Subject (')) {
    // Generic subject: use encoded subject code only
    subjectPath = encodedSubject;
  } else {
    const cleanSubjectName = subjectInfo.name
      .toLowerCase()
      .replace(/\s*\(\d{4}\)/g, '')
      .trim()
      .replace(/\s+/g, '-');
    subjectPath = `${cleanSubjectName}-${encodedSubject}`;
  }
  const yy = year.toString().slice(-2);
  const fileName = `${cleanCode}_${seriesCode}${yy}_${comp}_${paperNum}${variant}.pdf`;
  return {
    fileName,
    url: `https://bestexamhelp.com/exam/${levelPath}/${subjectPath}/${year}/${fileName}`,
  };
};


/**
 * Generates the full candidate list for a subject.
 * Optional filters: { years, terms, paperNumbers, variants, component }
 *   years:        number[]  e.g. [2023, 2022]
 *   terms:        string[]  e.g. ['s', 'w']  (series codes)
 *   paperNumbers: number[]  e.g. [1, 2, 3]
 *   variants:     number[]  e.g. [1, 2]
 *   component:    string    'qp' | 'ms' | undefined (both)
 */
export const generatePaperList = (subjectCode, filters = {}) => {
  const subjectInfo = getSubjectInfo(subjectCode);

  const years        = filters.years        ?? [2023, 2022, 2021, 2020, 2019, 2018];
  const terms        = filters.terms        ?? TERM_MAP.map(t => t.code);
  const paperNumbers = filters.paperNumbers ?? [1, 2, 3, 4, 5, 6];
  const variants     = filters.variants     ?? [1, 2, 3];
  const components   = filters.component    ? [filters.component] : ['qp', 'ms'];

  const papers = [];

  for (const year of years) {
    for (const seriesCode of terms) {
      const termInfo = TERM_MAP.find(t => t.code === seriesCode);
      for (const comp of components) {
        for (const paperNum of paperNumbers) {
          for (const variant of variants) {
            const { fileName, url } = buildUrl(
              subjectCode, subjectInfo, year, seriesCode, comp, paperNum, variant
            );
            papers.push({
              id:          `${year}-${seriesCode}-${comp}-${paperNum}${variant}`,
              year,
              term:        seriesCode,
              termLabel:   termInfo?.label ?? seriesCode,
              paperNumber: paperNum,
              variant,
              component:   comp.toUpperCase(),
              fileName,
              url,
            });
          }
        }
      }
    }
  }

  return papers;
};

/**
 * Performs parallel HEAD requests (batched at `concurrency`) to discover
 * which candidate papers actually exist on bestexamhelp.com.
 * Returns the subset of `papers` that responded 200 OK.
 */
const FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'application/pdf,*/*',
  'Referer': 'https://bestexamhelp.com/',
};

export const filterExistingPapers = async (papers, concurrency = 15) => {
  const results = [];
  for (let i = 0; i < papers.length; i += concurrency) {
    const chunk = papers.slice(i, i + concurrency);
    const chunkResults = await Promise.all(
      chunk.map(async (paper) => {
        try {
          const res = await fetch(paper.url, { method: 'HEAD', headers: FETCH_HEADERS });
          return res.ok ? paper : null;
        } catch {
          return null;
        }
      })
    );
    results.push(...chunkResults.filter(Boolean));
  }
  return results;
};

/**
 * Discovers which years / terms / paper numbers / variants actually exist
 * for a given subject code by running HEAD checks on all QP candidates.
 * Returns:
 * {
 *   years:        number[],
 *   terms:        { code, label, shortLabel }[],
 *   paperNumbers: number[],
 *   variants:     number[],
 * }
 */
export const getAvailablePaperOptions = async (subjectCode) => {
  // Only check QP — existence of QP implies MS exists for the same variant
  const candidates = generatePaperList(subjectCode, { component: 'qp' });
  const existing   = await filterExistingPapers(candidates, 20);

  const yearsSet        = new Set();
  const termsSet        = new Set();
  const paperNumbersSet = new Set();
  const variantsSet     = new Set();

  for (const p of existing) {
    yearsSet.add(p.year);
    termsSet.add(p.term);
    paperNumbersSet.add(p.paperNumber);
    variantsSet.add(p.variant);
  }

  const years        = [...yearsSet].sort((a, b) => b - a);
  const terms        = TERM_MAP.filter(t => termsSet.has(t.code));
  const paperNumbers = [...paperNumbersSet].sort((a, b) => a - b);
  const variants     = [...variantsSet].sort((a, b) => a - b);

  return { years, terms, paperNumbers, variants };
};

export const fetchPaperMetadata = async (subjectCode) => {
  return generatePaperList(subjectCode);
};
