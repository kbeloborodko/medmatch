import { DrugAPIService, MockDrugAPIService } from './api'
import type { OpenFDADrug } from './api'

export interface Medication {
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
}

export interface SearchResult {
  originalMedication: Medication
  analogues: Medication[]
  confidence: number
  warnings: string[]
  apiSource: string
}

export class MedicationService {
  // Use real API by default, switch to mock API for development if needed
  private static useMockAPI = false

  private static convertOpenFDADrugToMedication(drug: OpenFDADrug, country: string): Medication {
    const brandName = drug.openfda.brand_name?.[0] || ''
    const genericName = drug.openfda.generic_name?.[0] || ''
    const activeIngredient = drug.active_ingredient?.[0] || drug.active_ingredients?.[0]?.name || ''
    const strength = drug.active_ingredients?.[0]?.strength || ''
    const dosageForm = drug.openfda.dosage_form?.[0] || ''
    const manufacturer = drug.openfda.manufacturer_name?.[0] || ''

    // For API-sourced drugs, use 'US' as the country since OpenFDA is US-focused
    const sourceCountry = 'US'

    return {
      id: `${sourceCountry}-${brandName}-${genericName}`.toLowerCase().replace(/\s+/g, '-'),
      name: brandName || genericName,
      activeIngredient,
      dosageForm,
      strength,
      country: sourceCountry, // Always 'US' for API-sourced drugs
      brandName: brandName || undefined,
      genericName: genericName || undefined,
      manufacturer,
      availability: 'otc', // Default to OTC for safety
      lastUpdated: new Date(),
      warnings: drug.warnings || [],
      interactions: drug.drug_interactions || [],
      description: drug.description?.[0] || ''
    }
  }

  static async searchMedications(
    query: string,
    sourceCountry: string,
    destinationCountry: string
  ): Promise<SearchResult | null> {
    try {
      const apiService = this.useMockAPI ? MockDrugAPIService : DrugAPIService

      // Search for original medication in source country
      console.log('Searching for original medication:', query)
      const sourceResults = await apiService.searchDrugs(query, 10)
      console.log('Source results found:', sourceResults.results.length)
      
      if (sourceResults.results.length === 0) {
        console.log('No source medication found')
        return null
      }

      // Find the best match from the results
      const bestMatch = this.findBestMatch(sourceResults.results, query)
      const originalMedication = this.convertOpenFDADrugToMedication(bestMatch, sourceCountry)

      // Search for analogues by active ingredient in destination country
      const activeIngredient = originalMedication.activeIngredient
      console.log('Searching for analogues with active ingredient:', activeIngredient)
      
      // If no active ingredient, return empty analogues and low confidence
      if (!activeIngredient || !activeIngredient.trim()) {
        return {
          originalMedication,
          analogues: [],
          confidence: 0.2,
          warnings: [
            'This information is for educational purposes only',
            'Always consult with a healthcare provider before taking any medication',
            'Dosage and availability may vary by country',
            'Only over-the-counter medications are included',
            'Drug interactions and contraindications may differ',
            'Regulations and approval status vary by country'
          ],
          apiSource: this.useMockAPI ? 'Mock Data (Development)' : 'OpenFDA API'
        }
      }

      // Try multiple search strategies for analogues
      let analogueResults = await apiService.searchByActiveIngredient(activeIngredient, 15)
      console.log('Analogue search by active ingredient found:', analogueResults.results.length)
      
      // If no results, try searching by generic name
      if (analogueResults.results.length === 0 && originalMedication.genericName) {
        console.log('No results with active ingredient, trying generic name:', originalMedication.genericName)
        analogueResults = await apiService.searchDrugs(originalMedication.genericName, 15)
        console.log('Analogue search by generic name found:', analogueResults.results.length)
      }
      
      // If still no results, try searching by substance name
      if (analogueResults.results.length === 0) {
        console.log('No results with generic name, trying substance name search')
        analogueResults = await apiService.searchDrugs(activeIngredient, 15)
        console.log('Analogue search by substance name found:', analogueResults.results.length)
      }
      
      // If still no results, try a broader search
      if (analogueResults.results.length === 0) {
        console.log('No results with substance name, trying broader search')
        analogueResults = await apiService.searchDrugs(originalMedication.genericName || activeIngredient, 20)
        console.log('Analogue search by broader search found:', analogueResults.results.length)
      }
      
      console.log('Total analogue results found:', analogueResults.results.length)
      
      const analogues = analogueResults.results
        .filter(drug => {
          // Filter out the same drug from source country
          const drugBrand = drug.openfda.brand_name?.[0] || ''
          const drugGeneric = drug.openfda.generic_name?.[0] || ''
          return !(drugBrand === originalMedication.brandName && drugGeneric === originalMedication.genericName)
        })
        .map(drug => this.convertOpenFDADrugToMedication(drug, destinationCountry))

      console.log('Filtered analogues count:', analogues.length)
      console.log('Destination country:', destinationCountry)

      // Add EU-specific analogues if destination is EU
      if (destinationCountry === 'EU') {
        console.log('Adding EU-specific analogues for', originalMedication.activeIngredient)
        const euAnalogues = this.getEUAnalogues(originalMedication.activeIngredient)
        console.log('EU analogues found:', euAnalogues.length)
        analogues.push(...euAnalogues)
      }

      // Add Canadian analogues if destination is Canada
      if (destinationCountry === 'Canada') {
        console.log('Adding Canadian analogues for', originalMedication.activeIngredient)
        const canadianAnalogues = this.getCanadianAnalogues(originalMedication.activeIngredient)
        console.log('Canadian analogues found:', canadianAnalogues.length)
        analogues.push(...canadianAnalogues)
      }

      console.log('Final analogues count:', analogues.length)

      // Calculate confidence based on matches
      const confidence = analogues.length > 0 ? 0.8 : 0.3

      // Generate warnings
      const warnings = [
        'This information is for educational purposes only',
        'Always consult with a healthcare provider before taking any medication',
        'Dosage and availability may vary by country',
        'Only over-the-counter medications are included',
        'Drug interactions and contraindications may differ',
        'Regulations and approval status vary by country'
      ]

      return {
        originalMedication,
        analogues,
        confidence,
        warnings,
        apiSource: this.useMockAPI ? 'Mock Data (Development)' : 'OpenFDA API'
      }

    } catch (error) {
      console.error('Error searching medications:', error)
      return null
    }
  }

  // Helper method to find the best match from search results
  private static findBestMatch(results: OpenFDADrug[], query: string): OpenFDADrug {
    const cleanQuery = query.toLowerCase().trim()
    console.log('Finding best match for query:', cleanQuery)
    console.log('Available results:', results.length)
    
    // Log all available options
    results.forEach((drug, index) => {
      const genericName = drug.openfda.generic_name?.[0] || ''
      const brandName = drug.openfda.brand_name?.[0] || ''
      console.log(`Result ${index}: Generic="${genericName}", Brand="${brandName}"`)
    })
    
    // First, try to find an exact match
    for (const drug of results) {
      const genericName = drug.openfda.generic_name?.[0]?.toLowerCase() || ''
      const brandName = drug.openfda.brand_name?.[0]?.toLowerCase() || ''
      
      if (genericName === cleanQuery || brandName === cleanQuery) {
        console.log('Found exact match:', genericName || brandName)
        return drug
      }
    }
    
    // If no exact match, find the closest match
    for (const drug of results) {
      const genericName = drug.openfda.generic_name?.[0]?.toLowerCase() || ''
      const brandName = drug.openfda.brand_name?.[0]?.toLowerCase() || ''
      
      if (genericName.includes(cleanQuery) || brandName.includes(cleanQuery)) {
        console.log('Found partial match:', genericName || brandName)
        return drug
      }
    }
    
    // If still no match, return the first result
    console.log('No match found, returning first result:', results[0].openfda.generic_name?.[0] || results[0].openfda.brand_name?.[0])
    return results[0]
  }

  // Helper method to get EU-specific analogues
  private static getEUAnalogues(activeIngredient: string): Medication[] {
    const ingredient = activeIngredient.toLowerCase()
    const euAnalogues: Medication[] = []

    if (ingredient.includes('ibuprofen')) {
      euAnalogues.push(
        {
          id: 'eu-nurofen-ibuprofen',
          name: 'Nurofen',
          activeIngredient: 'IBUPROFEN',
          dosageForm: 'Tablet',
          strength: '200mg',
          country: 'EU',
          brandName: 'Nurofen',
          genericName: 'IBUPROFEN',
          manufacturer: 'Reckitt Benckiser',
          availability: 'otc',
          lastUpdated: new Date(),
          warnings: ['May cause stomach upset'],
          interactions: ['May interact with blood thinners'],
          description: 'Non-steroidal anti-inflammatory drug for pain relief'
        },
        {
          id: 'eu-brufen-ibuprofen',
          name: 'Brufen',
          activeIngredient: 'IBUPROFEN',
          dosageForm: 'Tablet',
          strength: '400mg',
          country: 'EU',
          brandName: 'Brufen',
          genericName: 'IBUPROFEN',
          manufacturer: 'Abbott',
          availability: 'otc',
          lastUpdated: new Date(),
          warnings: ['May cause stomach upset'],
          interactions: ['May interact with blood thinners'],
          description: 'Non-steroidal anti-inflammatory drug for pain relief'
        }
      )
    } else if (ingredient.includes('acetaminophen') || ingredient.includes('paracetamol')) {
      euAnalogues.push(
        {
          id: 'eu-panadol-paracetamol',
          name: 'Panadol',
          activeIngredient: 'PARACETAMOL',
          dosageForm: 'Tablet',
          strength: '500mg',
          country: 'EU',
          brandName: 'Panadol',
          genericName: 'PARACETAMOL',
          manufacturer: 'GlaxoSmithKline',
          availability: 'otc',
          lastUpdated: new Date(),
          warnings: ['Do not exceed recommended dosage'],
          interactions: ['Alcohol may increase liver damage'],
          description: 'Pain reliever and fever reducer'
        },
        {
          id: 'eu-calpol-paracetamol',
          name: 'Calpol',
          activeIngredient: 'PARACETAMOL',
          dosageForm: 'Suspension',
          strength: '120mg/5ml',
          country: 'EU',
          brandName: 'Calpol',
          genericName: 'PARACETAMOL',
          manufacturer: 'Johnson & Johnson',
          availability: 'otc',
          lastUpdated: new Date(),
          warnings: ['Do not exceed recommended dosage'],
          interactions: ['Alcohol may increase liver damage'],
          description: 'Pain reliever and fever reducer for children'
        }
      )
    } else if (ingredient.includes('aspirin')) {
      euAnalogues.push(
        {
          id: 'eu-bayer-aspirin',
          name: 'Bayer Aspirin',
          activeIngredient: 'ASPIRIN',
          dosageForm: 'Tablet',
          strength: '100mg',
          country: 'EU',
          brandName: 'Bayer Aspirin',
          genericName: 'ASPIRIN',
          manufacturer: 'Bayer',
          availability: 'otc',
          lastUpdated: new Date(),
          warnings: ['May cause stomach upset'],
          interactions: ['May interact with blood thinners'],
          description: 'Pain reliever and blood thinner'
        }
      )
    }

    return euAnalogues
  }

  // Helper method to get Canadian analogues
  private static getCanadianAnalogues(activeIngredient: string): Medication[] {
    const ingredient = activeIngredient.toLowerCase()
    const canadianAnalogues: Medication[] = []

    if (ingredient.includes('ibuprofen')) {
      canadianAnalogues.push(
        {
          id: 'ca-nurofen-ibuprofen',
          name: 'Nurofen',
          activeIngredient: 'IBUPROFEN',
          dosageForm: 'Tablet',
          strength: '200mg',
          country: 'Canada',
          brandName: 'Nurofen',
          genericName: 'IBUPROFEN',
          manufacturer: 'Reckitt Benckiser',
          availability: 'otc',
          lastUpdated: new Date(),
          warnings: ['May cause stomach upset'],
          interactions: ['May interact with blood thinners'],
          description: 'Non-steroidal anti-inflammatory drug for pain relief'
        },
        {
          id: 'ca-brufen-ibuprofen',
          name: 'Brufen',
          activeIngredient: 'IBUPROFEN',
          dosageForm: 'Tablet',
          strength: '400mg',
          country: 'Canada',
          brandName: 'Brufen',
          genericName: 'IBUPROFEN',
          manufacturer: 'Abbott',
          availability: 'otc',
          lastUpdated: new Date(),
          warnings: ['May cause stomach upset'],
          interactions: ['May interact with blood thinners'],
          description: 'Non-steroidal anti-inflammatory drug for pain relief'
        }
      )
    } else if (ingredient.includes('acetaminophen') || ingredient.includes('paracetamol')) {
      canadianAnalogues.push(
        {
          id: 'ca-panadol-paracetamol',
          name: 'Panadol',
          activeIngredient: 'PARACETAMOL',
          dosageForm: 'Tablet',
          strength: '500mg',
          country: 'Canada',
          brandName: 'Panadol',
          genericName: 'PARACETAMOL',
          manufacturer: 'GlaxoSmithKline',
          availability: 'otc',
          lastUpdated: new Date(),
          warnings: ['Do not exceed recommended dosage'],
          interactions: ['Alcohol may increase liver damage'],
          description: 'Pain reliever and fever reducer'
        },
        {
          id: 'ca-calpol-paracetamol',
          name: 'Calpol',
          activeIngredient: 'PARACETAMOL',
          dosageForm: 'Suspension',
          strength: '120mg/5ml',
          country: 'Canada',
          brandName: 'Calpol',
          genericName: 'PARACETAMOL',
          manufacturer: 'Johnson & Johnson',
          availability: 'otc',
          lastUpdated: new Date(),
          warnings: ['Do not exceed recommended dosage'],
          interactions: ['Alcohol may increase liver damage'],
          description: 'Pain reliever and fever reducer for children'
        }
      )
    } else if (ingredient.includes('aspirin')) {
      canadianAnalogues.push(
        {
          id: 'ca-bayer-aspirin',
          name: 'Bayer Aspirin',
          activeIngredient: 'ASPIRIN',
          dosageForm: 'Tablet',
          strength: '100mg',
          country: 'Canada',
          brandName: 'Bayer Aspirin',
          genericName: 'ASPIRIN',
          manufacturer: 'Bayer',
          availability: 'otc',
          lastUpdated: new Date(),
          warnings: ['May cause stomach upset'],
          interactions: ['May interact with blood thinners'],
          description: 'Pain reliever and blood thinner'
        }
      )
    }

    return canadianAnalogues
  }

  static async getDrugInteractions(drugName: string): Promise<string[]> {
    try {
      const apiService = this.useMockAPI ? MockDrugAPIService : DrugAPIService
      return await apiService.getDrugInteractions(drugName)
    } catch (error) {
      console.error('Error fetching drug interactions:', error)
      return []
    }
  }

  // Helper method to check if a medication is available in a country
  static async checkAvailability(medicationName: string, country: string): Promise<'otc' | 'prescription' | 'unavailable'> {
    try {
      const apiService = this.useMockAPI ? MockDrugAPIService : DrugAPIService
      const results = await apiService.searchDrugs(medicationName, 1)
      
      if (results.results.length === 0) {
        return 'unavailable'
      }

      // In a real implementation, you would check the drug's approval status
      // For now, we'll assume OTC for safety
      return 'otc'
    } catch (error) {
      console.error('Error checking availability:', error)
      return 'unavailable'
    }
  }

  // Method to switch between mock and real API
  static setUseMockAPI(useMock: boolean) {
    this.useMockAPI = useMock
  }

  // Method to get current API status
  static getAPIStatus() {
    return {
      usingMock: this.useMockAPI,
      source: this.useMockAPI ? 'Mock Data' : 'OpenFDA API',
      status: 'active'
    }
  }
} 