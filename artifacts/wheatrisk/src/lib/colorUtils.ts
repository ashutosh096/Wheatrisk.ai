export const LAYER_COLORS = {
  wheat_risk: {
    'Very Low': '#4CAF50',
    'Low': '#00BCD4',
    'Moderate': '#FFB800',
    'High': '#FF6B00',
    'Very High': '#e53935'
  },
  drought_stress: {
    'Excess': '#2196F3',
    'Normal': '#4CAF50',
    'Deficient': '#FF9800',
    'Scanty': '#FFEB3B',
    'No Rain': '#9E9E9E'
  },
  heat_stress: {
    'Cooler': '#2196F3',
    'Normal': '#81C784',
    'Warm': '#FFD54F',
    'Hot': '#FF7043',
    'Extreme': '#B71C1C'
  }
} as const;

export type LayerType = keyof typeof LAYER_COLORS;

export function getCategoryColor(layer: LayerType, category: string): string {
  const layerPalettes = LAYER_COLORS[layer] as Record<string, string>;
  return layerPalettes[category] || '#CCCCCC'; // Fallback gray
}

export function getCategoryForDistrict(districtData: any, layer: LayerType): string {
  if (!districtData) return 'Unknown';
  switch (layer) {
    case 'wheat_risk':
      return districtData.risk?.level || 'Unknown';
    case 'drought_stress':
      return districtData.rainfall?.category || 'Unknown';
    case 'heat_stress':
      return districtData.temperature?.category || 'Unknown';
    default:
      return 'Unknown';
  }
}

export const LAYER_LABELS: Record<LayerType, string> = {
  wheat_risk: 'Wheat Risk Index',
  drought_stress: 'Drought Stress',
  heat_stress: 'Heat Stress'
};

export const LAYER_THRESHOLDS: Record<LayerType, {label: string, color: string}[]> = {
  wheat_risk: [
    { label: 'Very Low', color: '#4CAF50' },
    { label: 'Low', color: '#00BCD4' },
    { label: 'Moderate', color: '#FFB800' },
    { label: 'High', color: '#FF6B00' },
    { label: 'Very High', color: '#e53935' }
  ],
  drought_stress: [
    { label: 'Excess', color: '#2196F3' },
    { label: 'Normal', color: '#4CAF50' },
    { label: 'Deficient', color: '#FF9800' },
    { label: 'Scanty', color: '#FFEB3B' },
    { label: 'No Rain', color: '#9E9E9E' }
  ],
  heat_stress: [
    { label: 'Cooler', color: '#2196F3' },
    { label: 'Normal', color: '#81C784' },
    { label: 'Warm', color: '#FFD54F' },
    { label: 'Hot', color: '#FF7043' },
    { label: 'Extreme', color: '#B71C1C' }
  ]
};
