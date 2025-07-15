// API service for pharmaceutical data
const OPENFDA_BASE_URL = 'https://api.fda.gov'
const EMA_BASE_URL = 'https://www.ema.europa.eu/en/medicines/api'
const HEALTH_CANADA_BASE_URL = 'https://health-products.canada.ca/api/drug'
const WHO_BASE_URL = 'https://www.who.int/medicines/regulation/medicines-safety'

export interface OpenFDADrug {
  openfda: {
    brand_name: string[]
    generic_name: string[]
    manufacturer_name: string[]
    substance_name: string[]
    dosage_form: string[]
    route: string[]
  }
  active_ingredient: string[]
  active_ingredients?: Array<{
    name: string
    strength: string
  }>
  drug_interactions: string[]
  warnings: string[]
  description: string[]
  clinical_pharmacology: string[]
}

export interface OpenFDASearchResponse {
  meta: {
    disclaimer: string
    terms: string
    license: string
    last_updated: string
    results: {
      skip: number
      limit: number
      total: number
    }
  }
  results: OpenFDADrug[]
}

// EU/EMA Drug interface
export interface EMADrug {
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

// Canadian Drug interface
export interface CanadianDrug {
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

export class DrugAPIService {
  private static async makeRequest<T>(url: string): Promise<T> {
    try {
      console.log('Making API request to:', url)
      
      const response = await fetch(url)
      
      if (!response.ok) {
        console.error('API response not ok:', response.status, response.statusText)
        throw new Error(`API request failed: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('API response received, results count:', data.results?.length || 0)
      return data
    } catch (error) {
      console.error('API request error:', error)
      throw error
    }
  }

  // Search drugs by name (brand or generic) - improved search
  static async searchDrugs(query: string, limit: number = 10): Promise<OpenFDASearchResponse> {
    console.log('Searching for drugs with query:', query)
    
    const baseUrl = `${OPENFDA_BASE_URL}/drug/label.json`
    
    // Generate search variations for better partial matching
    const searchVariations = this.generateSearchVariations(query)
    
    for (let i = 0; i < searchVariations.length; i++) {
      try {
        const searchQuery = searchVariations[i]
        // Manually construct the URL to avoid encoding issues with : and +
        const fullUrl = `${baseUrl}?search=${encodeURIComponent(searchQuery)}&limit=${limit}`
        console.log(`Trying search variation ${i + 1}:`, fullUrl)
        
        const response = await this.makeRequest<OpenFDASearchResponse>(fullUrl)
        console.log(`Variation ${i + 1} results:`, response.results.length)
        
        if (response.results.length > 0) {
          return response
        }
      } catch (error) {
        console.error(`Variation ${i + 1} failed:`, error)
        // Continue to next variation
      }
    }
    
    // If all variations fail, return empty results
    console.log('All search variations failed, returning empty results')
    return {
      meta: {
        disclaimer: 'No results found',
        terms: '',
        license: '',
        last_updated: new Date().toISOString(),
        results: {
          skip: 0,
          limit,
          total: 0
        }
      },
      results: []
    }
  }

  // Generate smart search variations for partial matching
  private static generateSearchVariations(query: string): string[] {
    const variations: string[] = []
    const cleanQuery = query.trim()
    if (cleanQuery.length < 3) return []

    // First, try exact matches for common medications
    const lowerQuery = cleanQuery.toLowerCase()
    if (lowerQuery.includes('ibuprofen') || lowerQuery.includes('ibu')) {
      variations.push('openfda.generic_name:IBUPROFEN')
    }
    if (lowerQuery.includes('acetaminophen') || lowerQuery.includes('tylenol') || lowerQuery.includes('ace') || lowerQuery.includes('tyl')) {
      variations.push('openfda.generic_name:ACETAMINOPHEN')
    }
    if (lowerQuery.includes('aspirin') || lowerQuery.includes('asp')) {
      variations.push('openfda.generic_name:ASPIRIN')
    }

    // Then try exact matches for the full query
    variations.push(`openfda.generic_name:${cleanQuery.toUpperCase()}`)
    variations.push(`openfda.brand_name:${cleanQuery}`)
    variations.push(`openfda.substance_name:${cleanQuery.toUpperCase()}`)

    // Finally, try partial matches (but with higher minimum length to avoid too many false positives)
    if (cleanQuery.length >= 4) {
      for (let len = 4; len <= cleanQuery.length; len++) {
        const prefix = cleanQuery.substring(0, len)
        variations.push(`openfda.generic_name:${prefix}`)
        variations.push(`openfda.brand_name:${prefix}`)
        variations.push(`openfda.substance_name:${prefix}`)
      }
    }

    return variations
  }

  // Get drug details by application number
  static async getDrugDetails(applicationNumber: string): Promise<OpenFDADrug> {
    const baseUrl = `${OPENFDA_BASE_URL}/drug/label.json`
    const params = new URLSearchParams()
    params.append('search', `openfda.application_number:${applicationNumber}`)
    params.append('limit', '1')
    const url = `${baseUrl}?${params.toString()}`
    const response = await this.makeRequest<OpenFDASearchResponse>(url)
    
    if (response.results.length === 0) {
      throw new Error('Drug not found')
    }
    
    return response.results[0]
  }

  // Search by active ingredient - improved search
  static async searchByActiveIngredient(ingredient: string, limit: number = 10): Promise<OpenFDASearchResponse> {
    // More flexible search that includes partial matches
    const baseUrl = `${OPENFDA_BASE_URL}/drug/label.json`
    const params = new URLSearchParams()
    params.append('search', `active_ingredient:${ingredient}+OR+openfda.substance_name:${ingredient}+OR+openfda.generic_name:${ingredient}`)
    params.append('limit', limit.toString())
    const url = `${baseUrl}?${params.toString()}`
    
    return this.makeRequest<OpenFDASearchResponse>(url)
  }

  // Simple test to check if API is working
  static async testBasicAPI(): Promise<void> {
    try {
      console.log('Testing basic API access...')
      const testUrl = `${OPENFDA_BASE_URL}/drug/label.json?limit=1`
      console.log('Test URL:', testUrl)
      
      const response = await fetch(testUrl)
      console.log('Test response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Test successful, found', data.results?.length || 0, 'results')
        
        // Test a simple search
        console.log('Testing simple search...')
        const searchUrl = `${OPENFDA_BASE_URL}/drug/label.json?search=openfda.generic_name:"IBUPROFEN"&limit=1`
        console.log('Search test URL:', searchUrl)
        
        const searchResponse = await fetch(searchUrl)
        console.log('Search test response status:', searchResponse.status)
        
        if (searchResponse.ok) {
          const searchData = await searchResponse.json()
          console.log('Search test successful, found', searchData.results?.length || 0, 'results')
        } else {
          console.error('Search test failed with status:', searchResponse.status)
        }
      } else {
        console.error('Test failed with status:', response.status)
      }
    } catch (error) {
      console.error('Test failed with error:', error)
    }
  }

  // Test API connectivity
  static async testAPI(): Promise<boolean> {
    try {
      console.log('Testing API connectivity...')
      const response = await fetch(`${OPENFDA_BASE_URL}/drug/label.json?limit=1`)
      console.log('API test response status:', response.status)
      return response.ok
    } catch (error) {
      console.error('API connectivity test failed:', error)
      return false
    }
  }
}

// EU/EMA API Service for European medications
export class EMADrugAPIService {
  private static async makeRequest<T>(url: string): Promise<T> {
    try {
      console.log('Making EMA API request to:', url)
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'MedMatch/1.0'
        }
      })
      
      if (!response.ok) {
        console.error('EMA API response not ok:', response.status, response.statusText)
        throw new Error(`EMA API request failed: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('EMA API response received')
      return data
    } catch (error) {
      console.error('EMA API request error:', error)
      throw error
    }
  }

  // Search EU medications by active ingredient
  static async searchEUMedications(activeIngredient: string, limit: number = 10): Promise<EMADrug[]> {
    try {
      console.log('Searching EU medications for:', activeIngredient)
      
      // Try multiple search strategies for EU medications
      const searchStrategies = [
        // Direct API call to EMA (if available)
        `${EMA_BASE_URL}/medicines?search=${encodeURIComponent(activeIngredient)}&limit=${limit}`,
        // Alternative: Use WHO drug database for EU medications
        `${WHO_BASE_URL}/api/drugs?substance=${encodeURIComponent(activeIngredient)}&region=EU&limit=${limit}`
      ]

      for (const url of searchStrategies) {
        try {
          const response = await this.makeRequest<any>(url)
          if (response && response.results && response.results.length > 0) {
            return this.convertToEMADrugs(response.results, activeIngredient)
          }
        } catch (error) {
          console.error('EMA search strategy failed:', error)
          continue
        }
      }

      // No fallback data - return empty array
      console.log('No EU analogues found for:', activeIngredient)
      return []
      
    } catch (error) {
      console.error('Error searching EU medications:', error)
      return []
    }
  }

  private static convertToEMADrugs(results: any[], activeIngredient: string): EMADrug[] {
    return results.map((drug, index) => ({
      id: `eu-${drug.name?.toLowerCase().replace(/\s+/g, '-')}-${activeIngredient.toLowerCase()}`,
      name: drug.name || drug.brandName || 'Unknown',
      activeIngredient: activeIngredient.toUpperCase(),
      dosageForm: drug.dosageForm || 'Tablet',
      strength: drug.strength || 'Unknown',
      country: 'EU',
      brandName: drug.brandName || drug.name,
      genericName: drug.genericName || activeIngredient.toUpperCase(),
      manufacturer: drug.manufacturer || 'Unknown',
      availability: drug.availability || 'otc',
      lastUpdated: new Date(),
      warnings: drug.warnings || ['Consult healthcare provider'],
      interactions: drug.interactions || [],
      description: drug.description || 'EU medication'
    }))
  }
}

// Canadian Drug API Service
export class CanadianDrugAPIService {
  private static async makeRequest<T>(url: string): Promise<T> {
    try {
      console.log('Making Canadian API request to:', url)
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'MedMatch/1.0'
        }
      })
      
      if (!response.ok) {
        console.error('Canadian API response not ok:', response.status, response.statusText)
        throw new Error(`Canadian API request failed: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('Canadian API response received')
      return data
    } catch (error) {
      console.error('Canadian API request error:', error)
      throw error
    }
  }

  // Search Canadian medications by active ingredient
  static async searchCanadianMedications(activeIngredient: string, limit: number = 10): Promise<CanadianDrug[]> {
    try {
      console.log('Searching Canadian medications for:', activeIngredient)
      
      // Try multiple search strategies for Canadian medications
      const searchStrategies = [
        // Health Canada Drug Product Database
        `${HEALTH_CANADA_BASE_URL}/products?ingredient=${encodeURIComponent(activeIngredient)}&limit=${limit}`,
        // Alternative: Use WHO drug database for Canadian medications
        `${WHO_BASE_URL}/api/drugs?substance=${encodeURIComponent(activeIngredient)}&region=CA&limit=${limit}`
      ]

      for (const url of searchStrategies) {
        try {
          const response = await this.makeRequest<any>(url)
          if (response && response.results && response.results.length > 0) {
            return this.convertToCanadianDrugs(response.results, activeIngredient)
          }
        } catch (error) {
          console.error('Canadian search strategy failed:', error)
          continue
        }
      }

      // No fallback data - return empty array
      console.log('No Canadian analogues found for:', activeIngredient)
      return []
      
    } catch (error) {
      console.error('Error searching Canadian medications:', error)
      return []
    }
  }

  private static convertToCanadianDrugs(results: any[], activeIngredient: string): CanadianDrug[] {
    return results.map((drug, index) => ({
      id: `ca-${drug.name?.toLowerCase().replace(/\s+/g, '-')}-${activeIngredient.toLowerCase()}`,
      name: drug.name || drug.brandName || 'Unknown',
      activeIngredient: activeIngredient.toUpperCase(),
      dosageForm: drug.dosageForm || 'Tablet',
      strength: drug.strength || 'Unknown',
      country: 'Canada',
      brandName: drug.brandName || drug.name,
      genericName: drug.genericName || activeIngredient.toUpperCase(),
      manufacturer: drug.manufacturer || 'Unknown',
      availability: drug.availability || 'otc',
      lastUpdated: new Date(),
      warnings: drug.warnings || ['Consult healthcare provider'],
      interactions: drug.interactions || [],
      description: drug.description || 'Canadian medication'
    }))
  }
} 