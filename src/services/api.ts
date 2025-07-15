// Local Medication Database - Popular OTC medications for US, EU, and Canada
export interface LocalDrug {
  id: string
  name: string
  activeIngredient: string
  dosageForm: string
  strength: string
  country: string
  brandName?: string
  genericName?: string
  manufacturer: string
  availability: 'otc' | 'prescription' | 'unavailable'
  lastUpdated: Date
  warnings?: string[]
  interactions?: string[]
  description?: string
  analogues?: string[] // IDs of related medications
}

// Popular OTC medications database
const POPULAR_OTC_MEDICATIONS: LocalDrug[] = [
  // Pain Relief & Fever
  {
    id: 'us-ibuprofen',
    name: 'Ibuprofen',
    activeIngredient: 'IBUPROFEN',
    dosageForm: 'Tablet',
    strength: '200mg',
    country: 'US',
    brandName: 'Advil',
    genericName: 'Ibuprofen',
    manufacturer: 'Various',
    availability: 'otc',
    lastUpdated: new Date('2024-01-01'),
    warnings: ['Take with food', 'Do not exceed 1200mg per day'],
    interactions: ['Blood thinners', 'Other NSAIDs'],
    description: 'Anti-inflammatory pain reliever and fever reducer',
    analogues: ['eu-ibuprofen', 'ca-ibuprofen', 'us-acetaminophen', 'eu-paracetamol', 'ca-acetaminophen']
  },
  {
    id: 'eu-ibuprofen',
    name: 'Ibuprofen',
    activeIngredient: 'IBUPROFEN',
    dosageForm: 'Tablet',
    strength: '400mg',
    country: 'EU',
    brandName: 'Nurofen',
    genericName: 'Ibuprofen',
    manufacturer: 'Various',
    availability: 'otc',
    lastUpdated: new Date('2024-01-01'),
    warnings: ['Take with food', 'Do not exceed 1200mg per day'],
    interactions: ['Blood thinners', 'Other NSAIDs'],
    description: 'Anti-inflammatory pain reliever and fever reducer',
    analogues: ['us-ibuprofen', 'ca-ibuprofen', 'eu-paracetamol', 'us-acetaminophen', 'ca-acetaminophen']
  },
  {
    id: 'ca-ibuprofen',
    name: 'Ibuprofen',
    activeIngredient: 'IBUPROFEN',
    dosageForm: 'Tablet',
    strength: '200mg',
    country: 'CA',
    brandName: 'Advil',
    genericName: 'Ibuprofen',
    manufacturer: 'Various',
    availability: 'otc',
    lastUpdated: new Date('2024-01-01'),
    warnings: ['Take with food', 'Do not exceed 1200mg per day'],
    interactions: ['Blood thinners', 'Other NSAIDs'],
    description: 'Anti-inflammatory pain reliever and fever reducer',
    analogues: ['us-ibuprofen', 'eu-ibuprofen', 'ca-acetaminophen', 'us-acetaminophen', 'eu-paracetamol']
  },
  {
    id: 'us-acetaminophen',
    name: 'Acetaminophen',
    activeIngredient: 'ACETAMINOPHEN',
    dosageForm: 'Tablet',
    strength: '500mg',
    country: 'US',
    brandName: 'Tylenol',
    genericName: 'Acetaminophen',
    manufacturer: 'Various',
    availability: 'otc',
    lastUpdated: new Date('2024-01-01'),
    warnings: ['Do not exceed 4000mg per day', 'Avoid alcohol'],
    interactions: ['Blood thinners', 'Other pain relievers'],
    description: 'Pain reliever and fever reducer',
    analogues: ['eu-paracetamol', 'ca-acetaminophen', 'us-ibuprofen', 'eu-ibuprofen', 'ca-ibuprofen']
  },
  {
    id: 'eu-paracetamol',
    name: 'Paracetamol',
    activeIngredient: 'PARACETAMOL',
    dosageForm: 'Tablet',
    strength: '500mg',
    country: 'EU',
    brandName: 'Panadol',
    genericName: 'Paracetamol',
    manufacturer: 'Various',
    availability: 'otc',
    lastUpdated: new Date('2024-01-01'),
    warnings: ['Do not exceed 4000mg per day', 'Avoid alcohol'],
    interactions: ['Blood thinners', 'Other pain relievers'],
    description: 'Pain reliever and fever reducer',
    analogues: ['us-acetaminophen', 'ca-acetaminophen', 'eu-ibuprofen', 'us-ibuprofen', 'ca-ibuprofen']
  },
  {
    id: 'ca-acetaminophen',
    name: 'Acetaminophen',
    activeIngredient: 'ACETAMINOPHEN',
    dosageForm: 'Tablet',
    strength: '500mg',
    country: 'CA',
    brandName: 'Tylenol',
    genericName: 'Acetaminophen',
    manufacturer: 'Various',
    availability: 'otc',
    lastUpdated: new Date('2024-01-01'),
    warnings: ['Do not exceed 4000mg per day', 'Avoid alcohol'],
    interactions: ['Blood thinners', 'Other pain relievers'],
    description: 'Pain reliever and fever reducer',
    analogues: ['us-acetaminophen', 'eu-paracetamol', 'ca-ibuprofen', 'us-ibuprofen', 'eu-ibuprofen']
  },
  {
    id: 'us-aspirin',
    name: 'Aspirin',
    activeIngredient: 'ASPIRIN',
    dosageForm: 'Tablet',
    strength: '325mg',
    country: 'US',
    brandName: 'Bayer',
    genericName: 'Aspirin',
    manufacturer: 'Various',
    availability: 'otc',
    lastUpdated: new Date('2024-01-01'),
    warnings: ['Take with food', 'Avoid if bleeding disorder'],
    interactions: ['Blood thinners', 'Other NSAIDs'],
    description: 'Pain reliever and blood thinner',
    analogues: ['eu-aspirin', 'ca-aspirin', 'us-ibuprofen', 'eu-ibuprofen', 'ca-ibuprofen']
  },
  {
    id: 'eu-aspirin',
    name: 'Aspirin',
    activeIngredient: 'ASPIRIN',
    dosageForm: 'Tablet',
    strength: '500mg',
    country: 'EU',
    brandName: 'Bayer',
    genericName: 'Aspirin',
    manufacturer: 'Various',
    availability: 'otc',
    lastUpdated: new Date('2024-01-01'),
    warnings: ['Take with food', 'Avoid if bleeding disorder'],
    interactions: ['Blood thinners', 'Other NSAIDs'],
    description: 'Pain reliever and blood thinner',
    analogues: ['us-aspirin', 'ca-aspirin', 'eu-ibuprofen', 'us-ibuprofen', 'ca-ibuprofen']
  },
  {
    id: 'ca-aspirin',
    name: 'Aspirin',
    activeIngredient: 'ASPIRIN',
    dosageForm: 'Tablet',
    strength: '325mg',
    country: 'CA',
    brandName: 'Bayer',
    genericName: 'Aspirin',
    manufacturer: 'Various',
    availability: 'otc',
    lastUpdated: new Date('2024-01-01'),
    warnings: ['Take with food', 'Avoid if bleeding disorder'],
    interactions: ['Blood thinners', 'Other NSAIDs'],
    description: 'Pain reliever and blood thinner',
    analogues: ['us-aspirin', 'eu-aspirin', 'ca-ibuprofen', 'us-ibuprofen', 'eu-ibuprofen']
  },
  
  // Cold & Allergy
  {
    id: 'us-diphenhydramine',
    name: 'Diphenhydramine',
    activeIngredient: 'DIPHENHYDRAMINE',
    dosageForm: 'Tablet',
    strength: '25mg',
    country: 'US',
    brandName: 'Benadryl',
    genericName: 'Diphenhydramine',
    manufacturer: 'Various',
    availability: 'otc',
    lastUpdated: new Date('2024-01-01'),
    warnings: ['May cause drowsiness', 'Do not drive after taking'],
    interactions: ['Alcohol', 'Other sedatives'],
    description: 'Antihistamine for allergies and sleep aid',
    analogues: ['eu-diphenhydramine', 'ca-diphenhydramine', 'us-cetirizine', 'eu-cetirizine', 'ca-cetirizine']
  },
  {
    id: 'eu-diphenhydramine',
    name: 'Diphenhydramine',
    activeIngredient: 'DIPHENHYDRAMINE',
    dosageForm: 'Tablet',
    strength: '25mg',
    country: 'EU',
    brandName: 'Benadryl',
    genericName: 'Diphenhydramine',
    manufacturer: 'Various',
    availability: 'otc',
    lastUpdated: new Date('2024-01-01'),
    warnings: ['May cause drowsiness', 'Do not drive after taking'],
    interactions: ['Alcohol', 'Other sedatives'],
    description: 'Antihistamine for allergies and sleep aid',
    analogues: ['us-diphenhydramine', 'ca-diphenhydramine', 'eu-cetirizine', 'us-cetirizine', 'ca-cetirizine']
  },
  {
    id: 'ca-diphenhydramine',
    name: 'Diphenhydramine',
    activeIngredient: 'DIPHENHYDRAMINE',
    dosageForm: 'Tablet',
    strength: '25mg',
    country: 'CA',
    brandName: 'Benadryl',
    genericName: 'Diphenhydramine',
    manufacturer: 'Various',
    availability: 'otc',
    lastUpdated: new Date('2024-01-01'),
    warnings: ['May cause drowsiness', 'Do not drive after taking'],
    interactions: ['Alcohol', 'Other sedatives'],
    description: 'Antihistamine for allergies and sleep aid',
    analogues: ['us-diphenhydramine', 'eu-diphenhydramine', 'ca-cetirizine', 'us-cetirizine', 'eu-cetirizine']
  },
  {
    id: 'us-cetirizine',
    name: 'Cetirizine',
    activeIngredient: 'CETIRIZINE',
    dosageForm: 'Tablet',
    strength: '10mg',
    country: 'US',
    brandName: 'Zyrtec',
    genericName: 'Cetirizine',
    manufacturer: 'Various',
    availability: 'otc',
    lastUpdated: new Date('2024-01-01'),
    warnings: ['May cause drowsiness', 'Take once daily'],
    interactions: ['Alcohol', 'Other sedatives'],
    description: 'Non-drowsy antihistamine for allergies',
    analogues: ['eu-cetirizine', 'ca-cetirizine', 'us-diphenhydramine', 'eu-diphenhydramine', 'ca-diphenhydramine']
  },
  {
    id: 'eu-cetirizine',
    name: 'Cetirizine',
    activeIngredient: 'CETIRIZINE',
    dosageForm: 'Tablet',
    strength: '10mg',
    country: 'EU',
    brandName: 'Zyrtec',
    genericName: 'Cetirizine',
    manufacturer: 'Various',
    availability: 'otc',
    lastUpdated: new Date('2024-01-01'),
    warnings: ['May cause drowsiness', 'Take once daily'],
    interactions: ['Alcohol', 'Other sedatives'],
    description: 'Non-drowsy antihistamine for allergies',
    analogues: ['us-cetirizine', 'ca-cetirizine', 'eu-diphenhydramine', 'us-diphenhydramine', 'ca-diphenhydramine']
  },
  {
    id: 'ca-cetirizine',
    name: 'Cetirizine',
    activeIngredient: 'CETIRIZINE',
    dosageForm: 'Tablet',
    strength: '10mg',
    country: 'CA',
    brandName: 'Reactine',
    genericName: 'Cetirizine',
    manufacturer: 'Various',
    availability: 'otc',
    lastUpdated: new Date('2024-01-01'),
    warnings: ['May cause drowsiness', 'Take once daily'],
    interactions: ['Alcohol', 'Other sedatives'],
    description: 'Non-drowsy antihistamine for allergies',
    analogues: ['us-cetirizine', 'eu-cetirizine', 'ca-diphenhydramine', 'us-diphenhydramine', 'eu-diphenhydramine']
  },
  
  // Digestive Health
  {
    id: 'us-omeprazole',
    name: 'Omeprazole',
    activeIngredient: 'OMEPRAZOLE',
    dosageForm: 'Capsule',
    strength: '20mg',
    country: 'US',
    brandName: 'Prilosec',
    genericName: 'Omeprazole',
    manufacturer: 'Various',
    availability: 'otc',
    lastUpdated: new Date('2024-01-01'),
    warnings: ['Take before meals', 'Do not use for more than 14 days'],
    interactions: ['Iron supplements', 'Other medications'],
    description: 'Proton pump inhibitor for heartburn and acid reflux',
    analogues: ['eu-omeprazole', 'ca-omeprazole', 'us-ranitidine', 'eu-ranitidine', 'ca-ranitidine']
  },
  {
    id: 'eu-omeprazole',
    name: 'Omeprazole',
    activeIngredient: 'OMEPRAZOLE',
    dosageForm: 'Capsule',
    strength: '20mg',
    country: 'EU',
    brandName: 'Losec',
    genericName: 'Omeprazole',
    manufacturer: 'Various',
    availability: 'otc',
    lastUpdated: new Date('2024-01-01'),
    warnings: ['Take before meals', 'Do not use for more than 14 days'],
    interactions: ['Iron supplements', 'Other medications'],
    description: 'Proton pump inhibitor for heartburn and acid reflux',
    analogues: ['us-omeprazole', 'ca-omeprazole', 'eu-ranitidine', 'us-ranitidine', 'ca-ranitidine']
  },
  {
    id: 'ca-omeprazole',
    name: 'Omeprazole',
    activeIngredient: 'OMEPRAZOLE',
    dosageForm: 'Capsule',
    strength: '20mg',
    country: 'CA',
    brandName: 'Losec',
    genericName: 'Omeprazole',
    manufacturer: 'Various',
    availability: 'otc',
    lastUpdated: new Date('2024-01-01'),
    warnings: ['Take before meals', 'Do not use for more than 14 days'],
    interactions: ['Iron supplements', 'Other medications'],
    description: 'Proton pump inhibitor for heartburn and acid reflux',
    analogues: ['us-omeprazole', 'eu-omeprazole', 'ca-ranitidine', 'us-ranitidine', 'eu-ranitidine']
  },
  {
    id: 'us-ranitidine',
    name: 'Ranitidine',
    activeIngredient: 'RANITIDINE',
    dosageForm: 'Tablet',
    strength: '150mg',
    country: 'US',
    brandName: 'Zantac',
    genericName: 'Ranitidine',
    manufacturer: 'Various',
    availability: 'otc',
    lastUpdated: new Date('2024-01-01'),
    warnings: ['Take before meals', 'May cause drowsiness'],
    interactions: ['Iron supplements', 'Other medications'],
    description: 'H2 blocker for heartburn and acid reflux',
    analogues: ['eu-ranitidine', 'ca-ranitidine', 'us-omeprazole', 'eu-omeprazole', 'ca-omeprazole']
  },
  {
    id: 'eu-ranitidine',
    name: 'Ranitidine',
    activeIngredient: 'RANITIDINE',
    dosageForm: 'Tablet',
    strength: '150mg',
    country: 'EU',
    brandName: 'Zantac',
    genericName: 'Ranitidine',
    manufacturer: 'Various',
    availability: 'otc',
    lastUpdated: new Date('2024-01-01'),
    warnings: ['Take before meals', 'May cause drowsiness'],
    interactions: ['Iron supplements', 'Other medications'],
    description: 'H2 blocker for heartburn and acid reflux',
    analogues: ['us-ranitidine', 'ca-ranitidine', 'eu-omeprazole', 'us-omeprazole', 'ca-omeprazole']
  },
  {
    id: 'ca-ranitidine',
    name: 'Ranitidine',
    activeIngredient: 'RANITIDINE',
    dosageForm: 'Tablet',
    strength: '150mg',
    country: 'CA',
    brandName: 'Zantac',
    genericName: 'Ranitidine',
    manufacturer: 'Various',
    availability: 'otc',
    lastUpdated: new Date('2024-01-01'),
    warnings: ['Take before meals', 'May cause drowsiness'],
    interactions: ['Iron supplements', 'Other medications'],
    description: 'H2 blocker for heartburn and acid reflux',
    analogues: ['us-ranitidine', 'eu-ranitidine', 'ca-omeprazole', 'us-omeprazole', 'eu-omeprazole']
  },
  
  // Sleep & Relaxation
  {
    id: 'us-melatonin',
    name: 'Melatonin',
    activeIngredient: 'MELATONIN',
    dosageForm: 'Tablet',
    strength: '3mg',
    country: 'US',
    brandName: 'Various',
    genericName: 'Melatonin',
    manufacturer: 'Various',
    availability: 'otc',
    lastUpdated: new Date('2024-01-01'),
    warnings: ['Take 30 minutes before bed', 'May cause drowsiness'],
    interactions: ['Blood pressure medications', 'Sedatives'],
    description: 'Natural sleep hormone supplement',
    analogues: ['eu-melatonin', 'ca-melatonin', 'us-diphenhydramine', 'eu-diphenhydramine', 'ca-diphenhydramine']
  },
  {
    id: 'eu-melatonin',
    name: 'Melatonin',
    activeIngredient: 'MELATONIN',
    dosageForm: 'Tablet',
    strength: '3mg',
    country: 'EU',
    brandName: 'Various',
    genericName: 'Melatonin',
    manufacturer: 'Various',
    availability: 'otc',
    lastUpdated: new Date('2024-01-01'),
    warnings: ['Take 30 minutes before bed', 'May cause drowsiness'],
    interactions: ['Blood pressure medications', 'Sedatives'],
    description: 'Natural sleep hormone supplement',
    analogues: ['us-melatonin', 'ca-melatonin', 'eu-diphenhydramine', 'us-diphenhydramine', 'ca-diphenhydramine']
  },
  {
    id: 'ca-melatonin',
    name: 'Melatonin',
    activeIngredient: 'MELATONIN',
    dosageForm: 'Tablet',
    strength: '3mg',
    country: 'CA',
    brandName: 'Various',
    genericName: 'Melatonin',
    manufacturer: 'Various',
    availability: 'otc',
    lastUpdated: new Date('2024-01-01'),
    warnings: ['Take 30 minutes before bed', 'May cause drowsiness'],
    interactions: ['Blood pressure medications', 'Sedatives'],
    description: 'Natural sleep hormone supplement',
    analogues: ['us-melatonin', 'eu-melatonin', 'ca-diphenhydramine', 'us-diphenhydramine', 'eu-diphenhydramine']
  }
]

export interface SuggestionItem {
  name: string
  brandName?: string
  genericName?: string
  activeIngredient: string
  country: string
  matchType: 'brand' | 'generic' | 'ingredient'
  matchText: string
}

export class LocalMedicationService {
  
  // Search for autocomplete suggestions
  static async searchAutocompleteSuggestions(query: string, limit: number = 10): Promise<SuggestionItem[]> {
    try {
      console.log('Searching local database for:', query)
      
      if (query.length < 2) {
        return []
      }

      const queryLower = query.toLowerCase()
      const matches: SuggestionItem[] = []

      POPULAR_OTC_MEDICATIONS.forEach(drug => {
        // Check brand name match
        if (drug.brandName?.toLowerCase().includes(queryLower)) {
          matches.push({
            name: drug.name,
            brandName: drug.brandName,
            genericName: drug.genericName,
            activeIngredient: drug.activeIngredient,
            country: drug.country,
            matchType: 'brand',
            matchText: drug.brandName
          })
        }
        // Check generic name match
        else if (drug.genericName?.toLowerCase().includes(queryLower)) {
          matches.push({
            name: drug.name,
            brandName: drug.brandName,
            genericName: drug.genericName,
            activeIngredient: drug.activeIngredient,
            country: drug.country,
            matchType: 'generic',
            matchText: drug.genericName
          })
        }
        // Check active ingredient match
        else if (drug.activeIngredient.toLowerCase().includes(queryLower)) {
          matches.push({
            name: drug.name,
            brandName: drug.brandName,
            genericName: drug.genericName,
            activeIngredient: drug.activeIngredient,
            country: drug.country,
            matchType: 'ingredient',
            matchText: drug.activeIngredient
          })
        }
      })

      // Remove duplicates and limit results
      const uniqueMatches = matches.filter((match, index, self) => 
        index === self.findIndex(m => m.name === match.name && m.country === match.country)
      )

      console.log('Found suggestions:', uniqueMatches.length)
      return uniqueMatches.slice(0, limit)
    } catch (error) {
      console.error('Error searching autocomplete suggestions:', error)
      return []
    }
  }

  // Search for original medication
  static async findOriginalMedication(query: string): Promise<LocalDrug | null> {
    try {
      console.log('Finding original medication for:', query)
      
      const queryLower = query.toLowerCase()
      const match = POPULAR_OTC_MEDICATIONS.find(drug => 
        drug.name.toLowerCase() === queryLower ||
        drug.brandName?.toLowerCase() === queryLower ||
        drug.activeIngredient.toLowerCase() === queryLower
      )

      if (match) {
        console.log('Found original medication:', match.name)
        return match
      }

      console.log('No original medication found')
      return null
    } catch (error) {
      console.error('Error finding original medication:', error)
      return null
    }
  }

  // Search for analogues by active ingredient
  static async searchAnalogues(activeIngredient: string, destinationCountry: string, limit: number = 10): Promise<LocalDrug[]> {
    try {
      console.log('Searching analogues for:', activeIngredient, 'in', destinationCountry)
      
      // Find medications with the same active ingredient in the destination country
      const analogues = POPULAR_OTC_MEDICATIONS.filter(drug => 
        drug.activeIngredient === activeIngredient &&
        drug.country === destinationCountry
      )

      console.log('Found analogues:', analogues.length)
      return analogues.slice(0, limit)
    } catch (error) {
      console.error('Error searching analogues:', error)
      return []
    }
  }

  // Get related medications by analogue IDs
  static async getRelatedMedications(analogueIds: string[], limit: number = 10): Promise<LocalDrug[]> {
    try {
      console.log('Getting related medications for:', analogueIds)
      
      const related = POPULAR_OTC_MEDICATIONS.filter(drug => 
        analogueIds.includes(drug.id)
      )

      console.log('Found related medications:', related.length)
      return related.slice(0, limit)
    } catch (error) {
      console.error('Error getting related medications:', error)
      return []
    }
  }

  // Test service connectivity
  static async testService(): Promise<boolean> {
    try {
      console.log('Testing local medication service...')
      return POPULAR_OTC_MEDICATIONS.length > 0
    } catch (error) {
      console.error('Local medication service test failed:', error)
      return false
    }
  }
} 