export const DIFFICULTY_SYSTEM = {
  NA: {
    novice:       { label: 'Green',        color: '#00E676', textDark: true },
    easy:         { label: 'Green',        color: '#00E676', textDark: true },
    intermediate: { label: 'Blue',         color: '#2979FF', textDark: false },
    advanced:     { label: 'Black',        color: '#1C1C1C', textDark: false, border: '#555' },
    expert:       { label: 'Double Black', color: '#1C1C1C', textDark: false, border: '#555', icon: '◆◆' },
    freeride:     { label: 'Backcountry',  color: '#FF9100', textDark: true },
    park:         { label: 'Park',         color: '#8B5CF6', textDark: false },
  },
  EU: {
    novice:       { label: 'Blue',         color: '#2979FF', textDark: false },
    easy:         { label: 'Blue',         color: '#2979FF', textDark: false },
    intermediate: { label: 'Red',          color: '#FF1744', textDark: false },
    advanced:     { label: 'Black',        color: '#1C1C1C', textDark: false, border: '#555' },
    expert:       { label: 'Off-Piste',    color: '#FF9100', textDark: true },
    freeride:     { label: 'Off-Piste',    color: '#FF9100', textDark: true },
    park:         { label: 'Park',         color: '#8B5CF6', textDark: false },
  },
  JP: {
    novice:       { label: 'Green',        color: '#00E676', textDark: true },
    easy:         { label: 'Green',        color: '#00E676', textDark: true },
    intermediate: { label: 'Red',          color: '#FF1744', textDark: false },
    advanced:     { label: 'Black',        color: '#1C1C1C', textDark: false, border: '#555' },
    expert:       { label: 'Black',        color: '#1C1C1C', textDark: false, border: '#555' },
    freeride:     { label: 'Backcountry',  color: '#FF9100', textDark: true },
    park:         { label: 'Park',         color: '#8B5CF6', textDark: false },
  },
  AU: {
    novice:       { label: 'Green',        color: '#00E676', textDark: true },
    easy:         { label: 'Green',        color: '#00E676', textDark: true },
    intermediate: { label: 'Blue',         color: '#2979FF', textDark: false },
    advanced:     { label: 'Black',        color: '#1C1C1C', textDark: false, border: '#555' },
    expert:       { label: 'Double Black', color: '#1C1C1C', textDark: false, border: '#555', icon: '◆◆' },
    freeride:     { label: 'Backcountry',  color: '#FF9100', textDark: true },
    park:         { label: 'Park',         color: '#8B5CF6', textDark: false },
  },
};

export function getDifficultyDisplay(difficulty, region = 'NA') {
  if (!difficulty) return null;
  const system = DIFFICULTY_SYSTEM[region] || DIFFICULTY_SYSTEM.NA;
  return system[difficulty.toLowerCase()] || null;
}

export function detectRegion() {
  const lang = navigator.language || navigator.userLanguage;
  if (lang.startsWith('ja')) return 'JP';
  if (lang.startsWith('de') || lang.startsWith('fr') || lang.startsWith('it')) return 'EU';
  if (lang.startsWith('en-AU')) return 'AU';
  return 'NA';
}
