import { LocalMedicationService } from './api'
import type { LocalDrug } from './api'

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
  noAnaloguesFound?: boolean
  fallbackMessage?: string
}

export class MedicationService {

  private static convertLocalDrugToMedication(drug: LocalDrug, country: string): Medication {
    return {
      id: drug.id,
      name: drug.name,
      activeIngredient: drug.activeIngredient,
      dosageForm: drug.dosageForm,
      strength: drug.strength,
      country: country,
      brandName: drug.brandName,
      genericName: drug.genericName,
      manufacturer: drug.manufacturer,
      availability: drug.availability,
      lastUpdated: drug.lastUpdated,
      warnings: drug.warnings,
      interactions: drug.interactions,
      description: drug.description
    }
  }

  static async searchMedications(
    query: string,
    sourceCountry: string,
    destinationCountry: string
  ): Promise<SearchResult | null> {
    try {
      console.log('Searching for original medication:', query)
      
      // Step 1: Find original medication using local database
      const originalMedication = await LocalMedicationService.findOriginalMedication(query)
      
      if (!originalMedication) {
        console.log('No original medication found')
        return null
      }

      console.log('Original medication found:', {
        name: originalMedication.name,
        activeIngredient: originalMedication.activeIngredient,
        country: originalMedication.country
      })

      // Step 2: Search for analogues in destination country
      const analogues = await LocalMedicationService.searchAnalogues(
        originalMedication.activeIngredient, 
        destinationCountry, 
        15
      )
      
      console.log('Analogue search results found:', analogues.length)
      
      // Step 3: Get related medications if analogues are found
      let allAnalogues: LocalDrug[] = []
      
      if (analogues.length > 0) {
        // Get related medications from analogue IDs
        const analogueIds = analogues.map(drug => drug.id)
        const relatedMedications = await LocalMedicationService.getRelatedMedications(analogueIds, 15)
        allAnalogues = [...analogues, ...relatedMedications]
      }
      
      // Step 4: Convert to medication format and filter by destination country
      const convertedAnalogues = allAnalogues
        .filter(drug => drug.country === destinationCountry)
        .map(drug => this.convertLocalDrugToMedication(drug, destinationCountry))
      
      // Step 5: Filter out only the exact same medication (by id)
      const finalAnalogues = convertedAnalogues.filter(analogue => 
        analogue.id !== originalMedication.id
      )
      
      console.log('Final analogues count after filtering:', finalAnalogues.length)
      
      // Log the first few analogues for debugging
      console.log('First 3 analogues found:')
      finalAnalogues.slice(0, 3).forEach((analogue, index) => {
        console.log(`  ${index + 1}. ${analogue.name} (${analogue.activeIngredient}) - ${analogue.country}`)
      })

      // Calculate confidence based on matches
      const confidence = finalAnalogues.length > 0 ? 0.9 : 0.3

      // Generate warnings
      const warnings = [
        'This information is for educational purposes only',
        'Always consult with a healthcare provider before taking any medication',
        'Dosage and availability may vary by country',
        'Only over-the-counter medications are included',
        'Drug interactions and contraindications may differ',
        'Regulations and approval status vary by country'
      ]

      // If no analogues found, add fallback message
      const result: SearchResult = {
        originalMedication: this.convertLocalDrugToMedication(originalMedication, sourceCountry),
        analogues: finalAnalogues,
        confidence,
        warnings,
        apiSource: 'Local Medication Database'
      }

      if (finalAnalogues.length === 0) {
        result.noAnaloguesFound = true
        result.fallbackMessage = `No ${destinationCountry} analogues found for ${originalMedication.name} (${originalMedication.activeIngredient}). This could be due to:\n\n• Different regulatory approval status\n• Different brand names or formulations\n• Limited data availability\n• Regional restrictions\n\nPlease consult a local healthcare provider or pharmacist for medication alternatives.`
      }

      return result

    } catch (error) {
      console.error('Error searching medications:', error)
      return null
    }
  }

  // Helper method to check if a medication is available in a country
  static async checkAvailability(medicationName: string, country: string): Promise<'otc' | 'prescription' | 'unavailable'> {
    try {
      const medication = await LocalMedicationService.findOriginalMedication(medicationName)
      
      if (!medication) {
        return 'unavailable'
      }

      // Check if medication is available in the specified country
      const countryMedication = await LocalMedicationService.searchAnalogues(medication.activeIngredient, country, 1)
      
      if (countryMedication.length > 0) {
        return countryMedication[0].availability
      }

      return 'unavailable'
    } catch (error) {
      console.error('Error checking availability:', error)
      return 'unavailable'
    }
  }
} 