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
  // Use mock service for development, switch to real API in production
  private static useMockAPI = true

  private static convertOpenFDADrugToMedication(drug: OpenFDADrug, country: string): Medication {
    const brandName = drug.openfda.brand_name?.[0] || ''
    const genericName = drug.openfda.generic_name?.[0] || ''
    const activeIngredient = drug.active_ingredients?.[0]?.name || ''
    const strength = drug.active_ingredients?.[0]?.strength || ''
    const dosageForm = drug.openfda.dosage_form?.[0] || ''
    const manufacturer = drug.openfda.manufacturer_name?.[0] || ''

    return {
      id: `${country}-${brandName}-${genericName}`.toLowerCase().replace(/\s+/g, '-'),
      name: brandName || genericName,
      activeIngredient,
      dosageForm,
      strength,
      country,
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
      const sourceResults = await apiService.searchDrugs(query, 5)
      
      if (sourceResults.results.length === 0) {
        return null
      }

      const originalDrug = sourceResults.results[0]
      const originalMedication = this.convertOpenFDADrugToMedication(originalDrug, sourceCountry)

      // Search for analogues by active ingredient in destination country
      const activeIngredient = originalMedication.activeIngredient
      const analogueResults = await apiService.searchByActiveIngredient(activeIngredient, 10)
      
      const analogues = analogueResults.results
        .filter(drug => {
          // Filter out the same drug from source country
          const drugBrand = drug.openfda.brand_name?.[0] || ''
          const drugGeneric = drug.openfda.generic_name?.[0] || ''
          return !(drugBrand === originalMedication.brandName && drugGeneric === originalMedication.genericName)
        })
        .map(drug => this.convertOpenFDADrugToMedication(drug, destinationCountry))

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