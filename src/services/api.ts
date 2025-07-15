// API service for pharmaceutical data
const OPENFDA_BASE_URL = 'https://api.fda.gov/drug'

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
  private static async makeRequest<T>(endpoint: string): Promise<T> {
    try {
      const response = await fetch(`${OPENFDA_BASE_URL}${endpoint}`)
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('API request error:', error)
      throw error
    }
  }

  // Search drugs by name (brand or generic) - improved search
  static async searchDrugs(query: string, limit: number = 10): Promise<OpenFDASearchResponse> {
    const encodedQuery = encodeURIComponent(query)
    // More flexible search that includes substance name and generic name
    const endpoint = `/label.json?search=openfda.brand_name:"${encodedQuery}"+OR+openfda.generic_name:"${encodedQuery}"+OR+openfda.substance_name:"${encodedQuery}"&limit=${limit}`
    
    return this.makeRequest<OpenFDASearchResponse>(endpoint)
  }

  // Get drug details by application number
  static async getDrugDetails(applicationNumber: string): Promise<OpenFDADrug> {
    const endpoint = `/label.json?search=openfda.application_number:"${applicationNumber}"&limit=1`
    const response = await this.makeRequest<OpenFDASearchResponse>(endpoint)
    
    if (response.results.length === 0) {
      throw new Error('Drug not found')
    }
    
    return response.results[0]
  }

  // Search by active ingredient - improved search
  static async searchByActiveIngredient(ingredient: string, limit: number = 10): Promise<OpenFDASearchResponse> {
    const encodedIngredient = encodeURIComponent(ingredient)
    // Search in active ingredients and substance names
    const endpoint = `/label.json?search=active_ingredients.name:"${encodedIngredient}"+OR+openfda.substance_name:"${encodedIngredient}"&limit=${limit}`
    
    return this.makeRequest<OpenFDASearchResponse>(endpoint)
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

  // Test API connectivity
  static async testAPI(): Promise<boolean> {
    try {
      const response = await fetch(`${OPENFDA_BASE_URL}/label.json?limit=1`)
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