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

  // Fetch suggestions using LocalMedicationService
  const fetchSuggestions = async (query: string): Promise<SuggestionItem[]> => {
    try {
      console.log('Fetching suggestions from LocalMedicationService')
      const suggestions = await LocalMedicationService.searchAutocompleteSuggestions(query, 10)
      console.log('LocalMedicationService suggestions found:', suggestions.length)
      return suggestions
    } catch (error) {
      console.error('Error fetching suggestions:', error)
      return []
    }
  }

  const searchMedications = async (medicationName: string) => {
    if (!medicationName.trim()) return

    setIsSearching(true)
    setSearchResults(null)
    
    try {
      // Find the selected medication to determine its country
      const selectedMedication = await LocalMedicationService.findOriginalMedication(medicationName)
      
      if (!selectedMedication) {
        setSearchResults(null)
        return
      }

      const sourceCountry = selectedMedication.country
      
      // Get analogues from the other two countries
      const allAnalogues: SearchResult['analogues'] = []
      
      const countries = ['US', 'EU', 'CA'].filter(country => country !== sourceCountry)
      
      for (const destinationCountry of countries) {
        const analogues = await LocalMedicationService.searchAnalogues(
          selectedMedication.activeIngredient, 
          destinationCountry, 
          10
        )
        
        // Convert to medication format
        const convertedAnalogues = analogues
          .filter(drug => drug.id !== selectedMedication.id)
          .map(drug => ({
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
        
        allAnalogues.push(...convertedAnalogues)
      }
      
      // Create search result
      const result: SearchResult = {
        originalMedication: {
          id: selectedMedication.id,
          name: selectedMedication.name,
          activeIngredient: selectedMedication.activeIngredient,
          dosageForm: selectedMedication.dosageForm,
          strength: selectedMedication.strength,
          country: selectedMedication.country,
          brandName: selectedMedication.brandName,
          genericName: selectedMedication.genericName,
          manufacturer: selectedMedication.manufacturer,
          availability: selectedMedication.availability,
          lastUpdated: selectedMedication.lastUpdated,
          warnings: selectedMedication.warnings,
          interactions: selectedMedication.interactions,
          description: selectedMedication.description
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
        apiSource: 'Local Medication Database'
      }

      if (allAnalogues.length === 0) {
        result.noAnaloguesFound = true
        result.fallbackMessage = `No analogues found for ${selectedMedication.name} (${selectedMedication.activeIngredient}) in other countries. This could be due to:\n\n• Different regulatory approval status\n• Different brand names or formulations\n• Limited data availability\n• Regional restrictions\n\nPlease consult a healthcare provider or pharmacist for medication alternatives.`
      }
      
      setSearchResults(result)
    } catch (error) {
      console.error('Search error:', error)
      setSearchResults(null)
    } finally {
      setIsSearching(false)
    }
  }

  const handleAutocompleteSelect = (value: string) => {
    setSearchTerm(value)
    searchMedications(value)
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
              <AutocompleteInput
                value={searchTerm}
                onChange={setSearchTerm}
                onSelect={handleAutocompleteSelect}
                fetchSuggestions={fetchSuggestions}
                placeholder="Enter medication name, brand, or active ingredient..."
                disabled={isSearching}
              />
            </div>

            {isSearching && (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-2 text-gray-600">Searching for analogues...</span>
              </div>
            )}
          </div>

          {/* Results Section */}
          {searchResults && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Original Medication */}
                <div className="lg:col-span-1">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-blue-900 mb-2">
                      Selected Medication
                    </h3>
                    <div className="space-y-2">
                      <div>
                        <span className="font-medium text-gray-700">Name:</span>
                        <span className="ml-2 text-gray-900">{searchResults.originalMedication.name}</span>
                      </div>
                      {searchResults.originalMedication.brandName && (
                        <div>
                          <span className="font-medium text-gray-700">Brand:</span>
                          <span className="ml-2 text-gray-900">{searchResults.originalMedication.brandName}</span>
                        </div>
                      )}
                      <div>
                        <span className="font-medium text-gray-700">Active Ingredient:</span>
                        <span className="ml-2 text-gray-900">{searchResults.originalMedication.activeIngredient}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Country:</span>
                        <span className="ml-2 text-gray-900">{searchResults.originalMedication.country}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Dosage:</span>
                        <span className="ml-2 text-gray-900">{searchResults.originalMedication.strength} {searchResults.originalMedication.dosageForm}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Analogues Table */}
                <div className="lg:col-span-3">
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
