// API service for pharmaceutical data
const OPENFDA_BASE_URL = 'https://api.fda.gov'

export interface OpenFDADrug {
  openfda: {
    brand_name: string[]
    generic_name: string[]
    manufacturer_name: string[]
    substance_name: string[]
    dosage_form: string[]
    route: string[]
  }
  active_ingredients: Array<{
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
        const params = new URLSearchParams()
        params.append('search', searchQuery)
        params.append('limit', limit.toString())
        
        const fullUrl = `${baseUrl}?${params.toString()}`
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
    
    if (cleanQuery.length < 2) return [cleanQuery]
    
    // Strategy 1: Exact field search
    variations.push(`openfda.generic_name:${cleanQuery}+OR+openfda.brand_name:${cleanQuery}+OR+openfda.substance_name:${cleanQuery}`)
    
    // Strategy 2: Generic search
    variations.push(cleanQuery)
    
    // Strategy 3: Uppercase search
    variations.push(`openfda.generic_name:${cleanQuery.toUpperCase()}+OR+openfda.brand_name:${cleanQuery.toUpperCase()}+OR+openfda.substance_name:${cleanQuery.toUpperCase()}`)
    
    // Strategy 4: Try shorter prefixes for better partial matching
    if (cleanQuery.length > 3) {
      const prefix3 = cleanQuery.substring(0, 3)
      variations.push(`openfda.generic_name:${prefix3}+OR+openfda.brand_name:${prefix3}+OR+openfda.substance_name:${prefix3}`)
    }
    
    if (cleanQuery.length > 4) {
      const prefix4 = cleanQuery.substring(0, 4)
      variations.push(`openfda.generic_name:${prefix4}+OR+openfda.brand_name:${prefix4}+OR+openfda.substance_name:${prefix4}`)
    }
    
    // Strategy 5: Try common medication name patterns
    if (cleanQuery.toLowerCase().includes('ibu')) {
      variations.push('openfda.generic_name:IBUPROFEN')
    }
    if (cleanQuery.toLowerCase().includes('ace') || cleanQuery.toLowerCase().includes('tyl')) {
      variations.push('openfda.generic_name:ACETAMINOPHEN')
    }
    if (cleanQuery.toLowerCase().includes('asp')) {
      variations.push('openfda.generic_name:ASPIRIN')
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
    params.append('search', `active_ingredients.name:${ingredient}+OR+openfda.substance_name:${ingredient}+OR+openfda.generic_name:${ingredient}`)
    params.append('limit', limit.toString())
    const url = `${baseUrl}?${params.toString()}`
    
    return this.makeRequest<OpenFDASearchResponse>(url)
  }

  // Get drug interactions
  static async getDrugInteractions(drugName: string): Promise<string[]> {
    try {
      const searchResponse = await this.searchDrugs(drugName, 1)
      
      if (searchResponse.results.length === 0) {
        return []
      }
      
      const drug = searchResponse.results[0]
      return drug.drug_interactions || []
    } catch (error) {
      console.error('Error fetching drug interactions:', error)
      return []
    }
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

// Mock API service for development/testing
export class MockDrugAPIService {
  private static mockDrugs = [
    {
      openfda: {
        brand_name: ['Tylenol'],
        generic_name: ['Acetaminophen'],
        manufacturer_name: ['Johnson & Johnson'],
        substance_name: ['ACETAMINOPHEN'],
        dosage_form: ['TABLET'],
        route: ['ORAL']
      },
      active_ingredients: [{ name: 'ACETAMINOPHEN', strength: '500 MG' }],
      drug_interactions: ['Alcohol may increase liver damage'],
      warnings: ['Do not exceed recommended dosage'],
      description: ['Pain reliever and fever reducer'],
      clinical_pharmacology: ['Inhibits prostaglandin synthesis']
    },
    {
      openfda: {
        brand_name: ['Advil'],
        generic_name: ['Ibuprofen'],
        manufacturer_name: ['Pfizer'],
        substance_name: ['IBUPROFEN'],
        dosage_form: ['TABLET'],
        route: ['ORAL']
      },
      active_ingredients: [{ name: 'IBUPROFEN', strength: '200 MG' }],
      drug_interactions: ['May interact with blood thinners'],
      warnings: ['May cause stomach upset'],
      description: ['Non-steroidal anti-inflammatory drug'],
      clinical_pharmacology: ['Inhibits cyclooxygenase enzymes']
    },
    {
      openfda: {
        brand_name: ['Paracetamol'],
        generic_name: ['Acetaminophen'],
        manufacturer_name: ['Various'],
        substance_name: ['ACETAMINOPHEN'],
        dosage_form: ['TABLET'],
        route: ['ORAL']
      },
      active_ingredients: [{ name: 'ACETAMINOPHEN', strength: '500 MG' }],
      drug_interactions: ['Alcohol may increase liver damage'],
      warnings: ['Do not exceed recommended dosage'],
      description: ['Pain reliever and fever reducer'],
      clinical_pharmacology: ['Inhibits prostaglandin synthesis']
    }
  ]

  static async searchDrugs(query: string, limit: number = 10): Promise<OpenFDASearchResponse> {
    const filteredDrugs = this.mockDrugs.filter(drug => 
      drug.openfda.brand_name.some(name => 
        name.toLowerCase().includes(query.toLowerCase())
      ) ||
      drug.openfda.generic_name.some(name => 
        name.toLowerCase().includes(query.toLowerCase())
      ) ||
      drug.openfda.substance_name.some(name => 
        name.toLowerCase().includes(query.toLowerCase())
      )
    )

    return {
      meta: {
        disclaimer: 'This is mock data for development',
        terms: 'Mock terms',
        license: 'Mock license',
        last_updated: new Date().toISOString(),
        results: {
          skip: 0,
          limit,
          total: filteredDrugs.length
        }
      },
      results: filteredDrugs
    }
  }

  static async searchByActiveIngredient(ingredient: string, limit: number = 10): Promise<OpenFDASearchResponse> {
    const filteredDrugs = this.mockDrugs.filter(drug => 
      drug.active_ingredients.some(ai => 
        ai.name.toLowerCase().includes(ingredient.toLowerCase())
      ) ||
      drug.openfda.substance_name.some(name => 
        name.toLowerCase().includes(ingredient.toLowerCase())
      )
    )

    return {
      meta: {
        disclaimer: 'This is mock data for development',
        terms: 'Mock terms',
        license: 'Mock license',
        last_updated: new Date().toISOString(),
        results: {
          skip: 0,
          limit,
          total: filteredDrugs.length
        }
      },
      results: filteredDrugs
    }
  }

  // Get drug interactions
  static async getDrugInteractions(drugName: string): Promise<string[]> {
    try {
      const searchResponse = await this.searchDrugs(drugName, 1)
      
      if (searchResponse.results.length === 0) {
        return []
      }
      
      const drug = searchResponse.results[0]
      return drug.drug_interactions || []
    } catch (error) {
      console.error('Error fetching drug interactions:', error)
      return []
    }
  }
} 