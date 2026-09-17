export interface SpecField {
  key: string;
  label: string;
  type: 'select' | 'text' | 'number';
  options?: string[];
  unit?: string;
  placeholder?: string;
}

export interface CategorySpecConfig {
  name: string;
  fields: SpecField[];
}

export const CATEGORY_SPECS: Record<string, CategorySpecConfig> = {
  vehicles: {
    name: 'Vehicle Details',
    fields: [
      { key: 'make', label: 'Make', type: 'text', placeholder: 'e.g. Toyota, Nissan, Isuzu' },
      { key: 'model', label: 'Model', type: 'text', placeholder: 'e.g. Probox, Vitz, D-Max' },
      { key: 'year', label: 'Year of Manufacture', type: 'number', placeholder: 'e.g. 2018' },
      { key: 'mileage', label: 'Mileage', type: 'number', unit: 'km', placeholder: 'e.g. 65000' },
      { key: 'transmission', label: 'Transmission', type: 'select', options: ['Automatic', 'Manual'] },
      { key: 'fuel_type', label: 'Fuel Type', type: 'select', options: ['Petrol', 'Diesel', 'Hybrid', 'Electric'] },
      { key: 'condition', label: 'Condition', type: 'select', options: ['Kenyan Used', 'Foreign Used (Duty Paid)', 'Brand New'] },
    ],
  },
  'real-estate': {
    name: 'Property Details',
    fields: [
      { key: 'property_type', label: 'Property Type', type: 'select', options: ['Apartment / Flat', 'House / Villa', 'Commercial Space', 'Land / Plot', 'Bedsitter / Studio'] },
      { key: 'bedrooms', label: 'Bedrooms', type: 'select', options: ['Bedsitter', '1 Bedroom', '2 Bedrooms', '3 Bedrooms', '4+ Bedrooms'] },
      { key: 'bathrooms', label: 'Bathrooms', type: 'select', options: ['1', '2', '3', '4+'] },
      { key: 'size', label: 'Size', type: 'text', placeholder: 'e.g. 50x100, 1/4 Acre, 120 sqm' },
      { key: 'furnished', label: 'Furnishing', type: 'select', options: ['Unfurnished', 'Semi-Furnished', 'Fully Furnished'] },
    ],
  },
  electronics: {
    name: 'Device Specifications',
    fields: [
      { key: 'brand', label: 'Brand', type: 'text', placeholder: 'e.g. Samsung, Apple, HP, Sony' },
      { key: 'condition', label: 'Condition', type: 'select', options: ['Brand New', 'Refurbished', 'Used - Like New', 'Used - Good'] },
      { key: 'storage', label: 'Internal Storage / Capacity', type: 'text', placeholder: 'e.g. 128GB, 256GB, 1TB' },
      { key: 'ram', label: 'RAM', type: 'text', placeholder: 'e.g. 8GB, 16GB' },
      { key: 'warranty', label: 'Warranty', type: 'select', options: ['No Warranty', '1 Month', '3 Months', '6 Months', '1 Year'] },
    ],
  },
  jobs: {
    name: 'Job / Employment Details',
    fields: [
      { key: 'employment_type', label: 'Employment Type', type: 'select', options: ['Full-time', 'Part-time', 'Contract / Freelance', 'Temporary', 'Internship'] },
      { key: 'salary_range', label: 'Salary / Compensation', type: 'text', placeholder: 'e.g. KSh 30,000 - 45,000' },
      { key: 'experience_level', label: 'Experience Level', type: 'select', options: ['Entry level', 'Mid level (2-5 yrs)', 'Senior (5+ yrs)'] },
    ],
  },
};

/**
 * Identify relevant spec category based on category or item slug/string
 */
export function getSpecCategoryForSlug(slug?: string | null): string | null {
  if (!slug) return null;
  const s = slug.toLowerCase();
  if (s.includes('vehicle') || s.includes('car') || s.includes('motorcycle') || s.includes('truck') || s.includes('auto')) {
    return 'vehicles';
  }
  if (s.includes('real-estate') || s.includes('property') || s.includes('housing') || s.includes('land') || s.includes('house') || s.includes('apartment') || s.includes('bedsitter')) {
    return 'real-estate';
  }
  if (s.includes('electronic') || s.includes('phone') || s.includes('tv') || s.includes('radio') || s.includes('laptop') || s.includes('computer')) {
    return 'electronics';
  }
  if (s.includes('job') || s.includes('service') || s.includes('semi-pro') || s.includes('unskilled')) {
    return 'jobs';
  }
  return null;
}
