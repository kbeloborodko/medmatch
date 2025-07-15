import { useState, useEffect } from 'react'
import { MedicationService, type SearchResult } from './services/medicationService'
import { DrugAPIService, MockDrugAPIService } from './services/api'
import { AutocompleteInput } from './components/AutocompleteInput'
import './App.css'

const COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'EU', name: 'European Union' },
  { code: 'CA', name: 'Canada' }
]

function App() {
  const [searchTerm, setSearchTerm] = useState('')
  const [sourceCountry, setSourceCountry] = useState('US')
  const [destinationCountry, setDestinationCountry] = useState('EU')
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [apiStatus, setApiStatus] = useState(MedicationService.getAPIStatus())

  // Test API on component mount
  useEffect(() => {
    if (!apiStatus.usingMock) {
      DrugAPIService.testBasicAPI()
    }
  }, [apiStatus.usingMock])

  // Fetch suggestions from the API (brand, generic, substance names)
  const fetchSuggestions = async (query: string): Promise<string[]> => {
    const apiService = apiStatus.usingMock ? MockDrugAPIService : DrugAPIService
    try {
      const response = await apiService.searchDrugs(query, 7)
      // Collect unique names from brand, generic, and substance
      const namesMap = new Map<string, string>() // lowercase -> original
      response.results.forEach(drug => {
        drug.openfda.brand_name?.forEach(name => {
          const lowerName = name.toLowerCase()
          if (!namesMap.has(lowerName)) {
            namesMap.set(lowerName, name)
          }
        })
        drug.openfda.generic_name?.forEach(name => {
          const lowerName = name.toLowerCase()
          if (!namesMap.has(lowerName)) {
            namesMap.set(lowerName, name)
          }
        })
        drug.openfda.substance_name?.forEach(name => {
          const lowerName = name.toLowerCase()
          if (!namesMap.has(lowerName)) {
            namesMap.set(lowerName, name)
          }
        })
      })
      return Array.from(namesMap.values())
    } catch {
      return []
    }
  }

  const searchMedications = async () => {
    if (!searchTerm.trim()) return

    setIsSearching(true)
    setSearchResults(null)
    
    try {
      const results = await MedicationService.searchMedications(
        searchTerm,
        sourceCountry,
        destinationCountry
      )
      
      setSearchResults(results)
    } catch (error) {
      console.error('Search error:', error)
      setSearchResults(null)
    } finally {
      setIsSearching(false)
    }
  }

  const handleAutocompleteSelect = (value: string) => {
    setSearchTerm(value)
  }

  const toggleAPI = () => {
    const newUseMock = !apiStatus.usingMock
    MedicationService.setUseMockAPI(newUseMock)
    setApiStatus(MedicationService.getAPIStatus())
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-gray-50 to-blue-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-2">
          💊 MedMatch
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Find equivalent medications when traveling abroad
        </p>
        
        {/* API Status */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${apiStatus.usingMock ? 'bg-yellow-400' : 'bg-green-400'}`}></div>
              <span className="text-sm text-gray-600">
                API: {apiStatus.source} ({apiStatus.status})
              </span>
            </div>
            <button
              onClick={toggleAPI}
              className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
            >
              Switch to {apiStatus.usingMock ? 'Real API' : 'Mock Data'}
            </button>
          </div>
        </div>
        
        {/* Safety Disclaimer */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Important Safety Information
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  This tool provides educational information only. Always consult with a healthcare provider 
                  before taking any medication. Dosage, availability, and regulations vary by country.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Medication Name
              </label>
              <AutocompleteInput
                value={searchTerm}
                onChange={setSearchTerm}
                onSelect={handleAutocompleteSelect}
                fetchSuggestions={fetchSuggestions}
                placeholder="Enter medication name (e.g., Tylenol, Advil)"
                disabled={isSearching}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From Country
              </label>
              <select
                value={sourceCountry}
                onChange={(e) => setSourceCountry(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700"
              >
                {COUNTRIES.map(country => (
                  <option key={country.code} value={country.code}>
                    {country.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                To Country
              </label>
              <select
                value={destinationCountry}
                onChange={(e) => setDestinationCountry(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700"
              >
                {COUNTRIES.map(country => (
                  <option key={country.code} value={country.code}>
                    {country.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="mt-4">
            <button
              onClick={searchMedications}
              disabled={isSearching || !searchTerm.trim()}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-medium transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSearching ? 'Searching...' : 'Find Analogues'}
            </button>
          </div>
        </div>

        {/* Search Results */}
        {searchResults && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                Search Results
              </h2>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Confidence: {Math.round(searchResults.confidence * 100)}%</span>
                <span>•</span>
                <span>{searchResults.analogues.length} analogue(s) found</span>
                <span>•</span>
                <span>Source: {searchResults.apiSource}</span>
              </div>
            </div>

            {/* Original Medication */}
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-medium text-gray-800 mb-3">
                Original Medication ({sourceCountry})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-medium">{searchResults.originalMedication.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Active Ingredient</p>
                  <p className="font-medium">{searchResults.originalMedication.activeIngredient}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Dosage Form</p>
                  <p className="font-medium">{searchResults.originalMedication.dosageForm}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Strength</p>
                  <p className="font-medium">{searchResults.originalMedication.strength}</p>
                </div>
                {searchResults.originalMedication.description && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-600">Description</p>
                    <p className="font-medium">{searchResults.originalMedication.description}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Analogues */}
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-800 mb-4">
                Available Analogues ({destinationCountry})
              </h3>
              
              {searchResults.analogues.length > 0 ? (
                <div className="space-y-4">
                  {searchResults.analogues.map((analogue, index) => (
                    <div key={analogue.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Brand Name</p>
                          <p className="font-medium">{analogue.brandName || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Generic Name</p>
                          <p className="font-medium">{analogue.genericName || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Manufacturer</p>
                          <p className="font-medium">{analogue.manufacturer}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Dosage Form</p>
                          <p className="font-medium">{analogue.dosageForm}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Strength</p>
                          <p className="font-medium">{analogue.strength}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Availability</p>
                          <p className="font-medium capitalize">{analogue.availability}</p>
                        </div>
                        {analogue.description && (
                          <div className="md:col-span-3">
                            <p className="text-sm text-gray-600">Description</p>
                            <p className="font-medium">{analogue.description}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No analogues found for this medication.</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Try searching for the generic name or active ingredient.
                  </p>
                </div>
              )}
            </div>

            {/* Warnings */}
            <div className="px-6 py-4 bg-red-50 border-t border-red-200">
              <h4 className="text-sm font-medium text-red-800 mb-2">Important Warnings:</h4>
              <ul className="text-sm text-red-700 space-y-1">
                {searchResults.warnings.map((warning, index) => (
                  <li key={index}>• {warning}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* No Results */}
        {searchResults === null && searchTerm && !isSearching && (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center border border-gray-200">
            <div className="text-gray-300 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-gray-600 text-lg">No medications found.</p>
            <p className="text-gray-400 mt-2">Try a different search term or check the spelling.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
