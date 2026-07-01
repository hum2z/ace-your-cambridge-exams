// Official syllabus topic lists per subject code, used to power the topic
// picker on the dashboard. Free-text topics are still allowed — these are
// suggestions that match how Cambridge names topics in the syllabus, which
// is also what gives the AI page-matcher the best hit rate.

const TOPICS = {
  // ---------- A Levels ----------
  '9702': [
    'Physical quantities and units', 'Kinematics', 'Dynamics',
    'Forces, density and pressure', 'Work, energy and power',
    'Deformation of solids', 'Waves', 'Superposition',
    'Electricity', 'D.C. circuits', 'Particle physics',
    'Motion in a circle', 'Gravitational fields', 'Temperature',
    'Ideal gases', 'Thermodynamics', 'Oscillations', 'Electric fields',
    'Capacitance', 'Magnetic fields', 'Electromagnetic induction',
    'Alternating currents', 'Quantum physics', 'Nuclear physics',
    'Medical physics', 'Astronomy and cosmology',
  ],
  '9709': [
    'Quadratics', 'Functions', 'Coordinate geometry', 'Circular measure',
    'Trigonometry', 'Series', 'Differentiation', 'Integration',
    'Algebra', 'Logarithmic and exponential functions',
    'Numerical solution of equations', 'Vectors', 'Differential equations',
    'Complex numbers', 'Forces and equilibrium',
    'Kinematics of motion in a straight line', 'Momentum',
    "Newton's laws of motion", 'Energy, work and power',
    'Representation of data', 'Permutations and combinations', 'Probability',
    'Discrete random variables', 'The normal distribution',
    'Sampling and estimation', 'Hypothesis tests',
  ],
  '9701': [
    'Atomic structure', 'Atoms, molecules and stoichiometry',
    'Chemical bonding', 'States of matter', 'Chemical energetics',
    'Electrochemistry', 'Equilibria', 'Reaction kinetics',
    'The Periodic Table: chemical periodicity', 'Group 2', 'Group 17',
    'Nitrogen and sulfur', 'Introduction to organic chemistry',
    'Hydrocarbons', 'Halogen compounds', 'Hydroxy compounds',
    'Carbonyl compounds', 'Carboxylic acids and derivatives',
    'Nitrogen compounds', 'Polymerisation', 'Analytical techniques',
    'Lattice energy', 'Entropy and Gibbs energy', 'Transition elements',
    'Benzene and aromatic compounds', 'Organic synthesis',
  ],
  '9700': [
    'Cell structure', 'Biological molecules', 'Enzymes',
    'Cell membranes and transport', 'The mitotic cell cycle',
    'Nucleic acids and protein synthesis', 'Transport in plants',
    'Transport in mammals', 'Gas exchange', 'Infectious diseases',
    'Immunity', 'Energy and respiration', 'Photosynthesis', 'Homeostasis',
    'Control and coordination', 'Inherited change', 'Selection and evolution',
    'Biodiversity, classification and conservation', 'Genetic technology',
  ],
  '9618': [
    'Information representation', 'Communication', 'Hardware',
    'Processor fundamentals', 'System software',
    'Security, privacy and data integrity', 'Ethics and ownership',
    'Databases', 'Algorithm design and problem solving',
    'Data types and structures', 'Programming', 'Software development',
    'Data representation', 'Communication and internet technologies',
    'Hardware and virtual machines', 'Artificial intelligence',
    'Computational thinking and problem solving', 'Further programming',
  ],
  '9708': [
    'Basic economic ideas and resource allocation',
    'The price system and the microeconomy',
    'Government microeconomic intervention', 'The macroeconomy',
    'Government macroeconomic intervention', 'International economic issues',
  ],
  '9696': [
    'Hydrology and fluvial geomorphology', 'Atmosphere and weather',
    'Rocks and weathering', 'Population', 'Migration', 'Settlement dynamics',
    'Tropical environments', 'Coastal environments', 'Hazardous environments',
    'Hot arid and semi-arid environments', 'Production, location and change',
    'Environmental management', 'Global interdependence', 'Economic transition',
  ],
  '9699': [
    'Socialisation, identity and methods of research', 'The family',
    'Education', 'Religion', 'Media', 'Globalisation',
  ],
  '9706': [
    'The accounting system', 'Financial accounting',
    'Cost and management accounting',
    'Financial reporting and interpretation',
    'Preparation of financial statements',
  ],
  '9609': [
    'Business and its environment', 'Human resource management', 'Marketing',
    'Operations management', 'Finance and accounting', 'Strategic management',
  ],

  // ---------- IGCSE ----------
  '0625': [
    'Motion, forces and energy', 'Thermal physics', 'Waves',
    'Electricity and magnetism', 'Nuclear physics', 'Space physics',
  ],
  '0580': [
    'Number', 'Algebra and graphs', 'Coordinate geometry', 'Geometry',
    'Mensuration', 'Trigonometry', 'Transformations and vectors',
    'Probability', 'Statistics',
  ],
  '0620': [
    'States of matter', 'Atoms, elements and compounds', 'Stoichiometry',
    'Electrochemistry', 'Chemical energetics', 'Chemical reactions',
    'Acids, bases and salts', 'The Periodic Table', 'Metals',
    'Chemistry of the environment', 'Organic chemistry',
    'Experimental techniques and chemical analysis',
  ],
  '0610': [
    'Characteristics and classification of living organisms',
    'Organisation of the organism', 'Movement into and out of cells',
    'Biological molecules', 'Enzymes', 'Plant nutrition', 'Human nutrition',
    'Transport in plants', 'Transport in animals', 'Diseases and immunity',
    'Gas exchange in humans', 'Respiration', 'Excretion in humans',
    'Coordination and response', 'Reproduction', 'Inheritance',
    'Variation and selection', 'Organisms and their environment',
    'Human influences on ecosystems',
    'Biotechnology and genetic modification',
  ],
  '0478': [
    'Data representation', 'Data transmission', 'Hardware', 'Software',
    'The internet and its uses', 'Automated and emerging technologies',
    'Algorithm design and problem solving', 'Programming', 'Databases',
    'Boolean logic',
  ],
  '0455': [
    'The basic economic problem', 'The allocation of resources',
    'Microeconomic decision makers', 'Government and the macroeconomy',
    'Economic development', 'International trade and globalisation',
  ],
  '0450': [
    'Understanding business activity', 'People in business', 'Marketing',
    'Operations management', 'Financial information and decisions',
    'External influences on business activity',
  ],
  '0452': [
    'The fundamentals of accounting', 'Sources and recording of data',
    'Verification of accounting records', 'Accounting procedures',
    'Preparation of financial statements', 'Analysis and interpretation',
    'Accounting principles and policies',
  ],
};

// Shared lists for closely related syllabuses
TOPICS['9608'] = TOPICS['9618'];
TOPICS['9707'] = TOPICS['9609'];

// Edexcel IAL unit prefix → the Cambridge list that covers the same subject.
// Unit-level granularity isn't needed; the extractor matches topic text.
const EDEXCEL_PREFIX_TOPICS = {
  WMA: '9709', WFM: '9709', WMS: '9709', WMD: '9709', WME: '9709', WST: '9709',
  WPH: '9702', WCH: '9701', WBI: '9700', WEC: '9708', WBS: '9609',
  WAC: '9706', WGE: '9696',
};

export const getTopicsForSubject = (subjectCode) => {
  if (!subjectCode) return [];
  const code = subjectCode.trim().toUpperCase();
  const direct = TOPICS[code];
  if (direct) return direct;
  const mapped = EDEXCEL_PREFIX_TOPICS[code.slice(0, 3)];
  return mapped ? TOPICS[mapped] : [];
};
