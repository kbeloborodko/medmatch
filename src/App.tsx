import { useState } from 'react'
import { MedicationService, type SearchResult } from './services/medicationService'
import { LocalMedicationService, type SuggestionItem } from './services/api'
import { AutocompleteInput } from './components/AutocompleteInput'
import { AnaloguesTable } from './components/AnaloguesTable'
import './App.css'

function App() {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [isNewSearch, setIsNewSearch] = useState(false)

  // Fetch suggestions using LocalMedicationService
  const fetchSuggestions = async (query: string): Promise<SuggestionItem[]> => {
    try {
      console.log('Fetching suggestions from LocalMedicationService')
      const suggestions = LocalMedicationService.searchAutocompleteSuggestions(query, 10)
      console.log('LocalMedicationService suggestions found:', suggestions.length)
      return suggestions
    } catch (error) {
      console.error('Error fetching suggestions:', error)
      return []
    }
  }

  const handleAutocompleteSelect = (value: string, suggestion?: SuggestionItem) => {
    setSearchTerm(value)
    setIsNewSearch(false)
    if (suggestion) {
      searchMedicationsWithSuggestion(suggestion)
    } else {
      searchMedications(value)
    }
  }

  const handleSearchInputChange = (value: string) => {
    // If user is typing and we have search results, clear them and start fresh
    if (searchResults && !isNewSearch) {
      setSearchResults(null)
      setIsNewSearch(true)
    }
    setSearchTerm(value)
  }

  const handleClearSearch = () => {
    setSearchTerm('')
    setSearchResults(null)
    setIsNewSearch(false)
  }

  const searchMedicationsWithSuggestion = (suggestion: SuggestionItem) => {
    setIsSearching(true)
    setSearchResults(null)
    try {
      // Debug: check what methods are available
      console.log('MedicationService methods:', Object.getOwnPropertyNames(MedicationService))
      console.log('searchMedications exists:', typeof MedicationService.searchMedications)
      
      // First, find the original medication to get its analogue list
      const originalMedication = LocalMedicationService.findOriginalMedication(suggestion.name)
      if (!originalMedication) {
        setSearchResults(null)
        return
      }
      
      console.log('Original medication found:', originalMedication)
      console.log('Original medication analogues:', originalMedication.analogues)
      
      const sourceCountry = suggestion.country
      const destinationCountries = ['US', 'EU', 'CA'].filter(country => country !== sourceCountry)
      
      let allAnalogues: any[] = []
      
      // Get related medications from the analogue list
      if (originalMedication.analogues && originalMedication.analogues.length > 0) {
        const relatedMedications = LocalMedicationService.getRelatedMedications(originalMedication.analogues, 15)
        console.log('Related medications found:', relatedMedications)
        
        // Filter to only include medications from other countries
        const otherCountryMedications = relatedMedications.filter(drug => 
          destinationCountries.includes(drug.country)
        )
        
        console.log('Other country medications:', otherCountryMedications)
        
        // Convert to the expected format
        allAnalogues = otherCountryMedications.map(drug => ({
          id: drug.id,
          name: drug.name,
          activeIngredient: drug.activeIngredient,
          dosageForm: drug.dosageForm,
          strength: drug.strength,
          country: drug.country,
          brandName: drug.brandName,
          genericName: drug.genericName,
          manufacturer: drug.manufacturer,
          availability: drug.availability,
          lastUpdated: drug.lastUpdated,
          warnings: drug.warnings,
          interactions: drug.interactions,
          description: drug.description
        }))
      }
      
      console.log('Final analogues:', allAnalogues)
      
      // Create a combined result
      const combinedResult = {
        originalMedication: {
          id: originalMedication.id,
          name: originalMedication.name,
          activeIngredient: originalMedication.activeIngredient,
          dosageForm: originalMedication.dosageForm,
          strength: originalMedication.strength,
          country: sourceCountry,
          brandName: originalMedication.brandName,
          genericName: originalMedication.genericName,
          manufacturer: originalMedication.manufacturer,
          availability: originalMedication.availability,
          lastUpdated: originalMedication.lastUpdated,
          warnings: originalMedication.warnings,
          interactions: originalMedication.interactions,
          description: originalMedication.description
        },
        analogues: allAnalogues,
        confidence: allAnalogues.length > 0 ? 0.9 : 0.3,
        warnings: [
          'This information is for educational purposes only',
          'Always consult with a healthcare provider before taking any medication',
          'Dosage and availability may vary by country',
          'Only over-the-counter medications are included',
          'Drug interactions and contraindications may differ',
          'Regulations and approval status vary by country'
        ],
        apiSource: 'Local Medication Database',
        noAnaloguesFound: allAnalogues.length === 0,
        fallbackMessage: allAnalogues.length === 0 ? `No analogues found for ${suggestion.name} in other countries.` : undefined
      }
      
      console.log('Combined search result:', combinedResult)
      
      if (combinedResult.analogues.length > 0) {
        console.log('Setting search results:', combinedResult)
        setSearchResults(combinedResult)
      } else {
        console.log('No analogues found')
        setSearchResults(combinedResult)
      }
    } catch (error) {
      console.error('Search error:', error)
      setSearchResults(null)
    } finally {
      setIsSearching(false)
    }
  }

  const searchMedications = (medicationName: string) => {
    if (!medicationName.trim()) return
    setIsSearching(true)
    setSearchResults(null)
    try {
      // Find the original medication first to get its country
      const selectedMedication = LocalMedicationService.findOriginalMedication(medicationName)
      if (!selectedMedication) {
        setSearchResults(null)
        return
      }
      
      // Use the searchMedicationsInAllCountries method
      const result = MedicationService.searchMedicationsInAllCountries(
        medicationName,
        selectedMedication.country
      )
      
      if (result) {
        setSearchResults(result)
      } else {
        setSearchResults(null)
      }
    } catch (error) {
      console.error('Search error:', error)
      setSearchResults(null)
    } finally {
      setIsSearching(false)
    }
  }

  // Format the search term to show selected medication info
  const getDisplayValue = () => {
    if (!searchResults?.originalMedication || isNewSearch) {
      return searchTerm
    }
    
    const med = searchResults.originalMedication
    const countryFlag = {
      'US': '🇺🇸',
      'EU': '🇪🇺', 
      'CA': '🇨🇦'
    }[med.country] || med.country
    
    let displayValue = `${med.name}`
    
    if (med.brandName && med.brandName !== med.name) {
      displayValue += ` (${med.brandName})`
    }
    
    displayValue += ` - ${med.strength} ${med.dosageForm}`
    displayValue += ` - ${countryFlag} ${med.country}`
    
    if (med.manufacturer && med.manufacturer !== 'Various') {
      displayValue += ` - ${med.manufacturer}`
    }
    
    return displayValue
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              MedMatch 💊
            </h1>
            <p className="text-lg text-gray-600">
              Find equivalent medications when traveling abroad
            </p>
          </div>

          {/* Search Section */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="mb-6">
              <label htmlFor="medication-search" className="block text-sm font-medium text-gray-700 mb-2">
                Search for a medication
              </label>
              <div className="relative">
                <AutocompleteInput
                  value={getDisplayValue()}
                  onChange={handleSearchInputChange}
                  onSelect={handleAutocompleteSelect}
                  fetchSuggestions={fetchSuggestions}
                  placeholder="Enter medication name, brand, or active ingredient..."
                  disabled={isSearching}
                />
                {searchResults && (
                  <button
                    onClick={handleClearSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Clear search"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {isSearching && (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-2 text-gray-600">Searching for analogues...</span>
              </div>
            )}
          </div>

          {/* Results Section */}
          {searchResults && searchResults.originalMedication && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Analogues in Other Countries
                </h3>
                {searchResults.noAnaloguesFound ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-yellow-800 whitespace-pre-line">
                      {searchResults.fallbackMessage}
                    </p>
                  </div>
                ) : (
                  <AnaloguesTable analogues={searchResults.analogues} />
                )}
              </div>

              {/* Warnings */}
              <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-red-800 mb-2">Important Warnings</h4>
                <ul className="text-sm text-red-700 space-y-1">
                  {searchResults.warnings.map((warning, index) => (
                    <li key={index} className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>{warning}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
