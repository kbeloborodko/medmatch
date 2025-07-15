import { DrugAPIService, EMADrugAPIService, CanadianDrugAPIService } from './api'
import type { OpenFDADrug, EMADrug, CanadianDrug } from './api'

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
      const apiService = DrugAPIService

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
          apiSource: 'OpenFDA API',
          noAnaloguesFound: true,
          fallbackMessage: 'Unable to identify active ingredient for analogue search. Please consult a healthcare provider for medication alternatives.'
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

      // Try to get region-specific analogues from other APIs
      if (destinationCountry === 'EU') {
        console.log('Adding EU-specific analogues for', originalMedication.activeIngredient)
        try {
          const euAnalogues = await EMADrugAPIService.searchEUMedications(originalMedication.activeIngredient, 10)
          console.log('EU analogues found via API:', euAnalogues.length)
          analogues.push(...euAnalogues)
        } catch (error) {
          console.error('Error fetching EU analogues:', error)
          // No fallback to hardcoded data - let it show no analogues
        }
      }

      if (destinationCountry === 'Canada') {
        console.log('Adding Canadian analogues for', originalMedication.activeIngredient)
        try {
          const canadianAnalogues = await CanadianDrugAPIService.searchCanadianMedications(originalMedication.activeIngredient, 10)
          console.log('Canadian analogues found via API:', canadianAnalogues.length)
          analogues.push(...canadianAnalogues)
        } catch (error) {
          console.error('Error fetching Canadian analogues:', error)
          // No fallback to hardcoded data - let it show no analogues
        }
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

      // If no analogues found, add fallback message
      const result: SearchResult = {
        originalMedication,
        analogues,
        confidence,
        warnings,
        apiSource: 'OpenFDA API'
      }

      if (analogues.length === 0) {
        result.noAnaloguesFound = true
        result.fallbackMessage = `No analogues found for ${originalMedication.name} (${originalMedication.activeIngredient}) in ${destinationCountry}. This could be due to:\n\n• Different regulatory approval status\n• Different brand names or formulations\n• Limited data availability\n• Regional restrictions\n\nPlease consult a healthcare provider or pharmacist for medication alternatives.`
      }

      return result

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

  // Helper method to check if a medication is available in a country
  static async checkAvailability(medicationName: string, country: string): Promise<'otc' | 'prescription' | 'unavailable'> {
    try {
      const apiService = DrugAPIService
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


} 