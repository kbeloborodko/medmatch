import React, { useState, useMemo } from 'react'
import type { Medication } from '../services/medicationService'

interface AnaloguesTableProps {
  analogues: Medication[]
}

type SortField = 'name' | 'genericName' | 'manufacturer' | 'strength' | 'availability'
type SortDirection = 'asc' | 'desc'

interface AnalogueWithConfidence extends Medication {
  confidence: number
  matchType: 'exact' | 'partial' | 'region-specific'
}

export const AnaloguesTable: React.FC<AnaloguesTableProps> = ({ analogues }) => {
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [filterAvailability, setFilterAvailability] = useState<string>('all')

  // Calculate confidence and match type for each analogue
  const analoguesWithConfidence = useMemo((): AnalogueWithConfidence[] => {
    return analogues.map(analogue => {
      let confidence = 0.7 // Base confidence
      let matchType: 'exact' | 'partial' | 'region-specific' = 'exact'

      // Check if this is a region-specific analogue by ID pattern and country
      const isRegionSpecific = (analogue.id.includes('eu-') && analogue.country === 'EU') || 
                              (analogue.id.includes('ca-') && analogue.country === 'CA')
      
      if (isRegionSpecific) {
        confidence = 0.9
        matchType = 'region-specific'
      } else if (analogue.genericName && analogue.activeIngredient) {
        confidence = 0.8
        matchType = 'exact'
      }

      return {
        ...analogue,
        confidence,
        matchType
      }
    })
  }, [analogues])

  // Sort and filter analogues
  const sortedAndFilteredAnalogues = useMemo(() => {
    let filtered = analoguesWithConfidence

    // Filter by availability
    if (filterAvailability !== 'all') {
      filtered = filtered.filter(analogue => analogue.availability === filterAvailability)
    }

    // Sort analogues
    filtered.sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case 'genericName':
          aValue = (a.genericName || '').toLowerCase()
          bValue = (b.genericName || '').toLowerCase()
          break
        case 'manufacturer':
          aValue = a.manufacturer.toLowerCase()
          bValue = b.manufacturer.toLowerCase()
          break
        case 'strength':
          aValue = a.strength.toLowerCase()
          bValue = b.strength.toLowerCase()
          break
        case 'availability':
          aValue = a.availability.toLowerCase()
          bValue = b.availability.toLowerCase()
          break
        default:
          return 0
      }

      if (sortDirection === 'asc') {
        return aValue.localeCompare(bValue)
      } else {
        return bValue.localeCompare(aValue)
      }
    })

    // Sort by confidence as secondary sort
    filtered.sort((a, b) => b.confidence - a.confidence)

    return filtered
  }, [analoguesWithConfidence, sortField, sortDirection, filterAvailability])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100'
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getMatchTypeColor = (matchType: string) => {
    switch (matchType) {
      case 'region-specific':
        return 'text-blue-600 bg-blue-100'
      case 'exact':
        return 'text-green-600 bg-green-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  if (sortedAndFilteredAnalogues.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No analogues found for this medication.</p>
        <p className="text-sm text-gray-400 mt-2">
          Try searching for the generic name or active ingredient.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Filter by Availability
          </label>
          <select
            value={filterAvailability}
            onChange={(e) => setFilterAvailability(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All</option>
            <option value="otc">Over-the-Counter</option>
            <option value="prescription">Prescription</option>
            <option value="unavailable">Unavailable</option>
          </select>
        </div>
        

      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('name')}>
                <div className="flex items-center gap-1">
                  Brand Name
                  {sortField === 'name' && (
                    <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('genericName')}>
                <div className="flex items-center gap-1">
                  Generic Name
                  {sortField === 'genericName' && (
                    <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('manufacturer')}>
                <div className="flex items-center gap-1">
                  Manufacturer
                  {sortField === 'manufacturer' && (
                    <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('strength')}>
                <div className="flex items-center gap-1">
                  Strength
                  {sortField === 'strength' && (
                    <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('availability')}>
                <div className="flex items-center gap-1">
                  Availability
                  {sortField === 'availability' && (
                    <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Match Quality
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortedAndFilteredAnalogues.map((analogue, index) => (
              <tr key={`${analogue.id}-${index}`} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-4 whitespace-nowrap">
                  <div>
                    <div className="font-medium text-gray-900">{analogue.brandName || 'N/A'}</div>
                    <div className="text-sm text-gray-500">{analogue.dosageForm}</div>
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{analogue.genericName || 'N/A'}</div>
                  <div className="text-xs text-gray-500">{analogue.activeIngredient}</div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {analogue.manufacturer}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {analogue.strength}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full capitalize ${
                    analogue.availability === 'otc' ? 'text-green-800 bg-green-100' :
                    analogue.availability === 'prescription' ? 'text-blue-800 bg-blue-100' :
                    'text-red-800 bg-red-100'
                  }`}>
                    {analogue.availability}
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="flex flex-col gap-1">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getConfidenceColor(analogue.confidence)}`}>
                      {Math.round(analogue.confidence * 100)}% Match
                    </span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getMatchTypeColor(analogue.matchType)}`}>
                      {analogue.matchType.replace('-', ' ')}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Match Quality Legend:</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full text-green-600 bg-green-100">80-100%</span>
            <span className="text-gray-600">High confidence match</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full text-yellow-600 bg-yellow-100">60-79%</span>
            <span className="text-gray-600">Medium confidence match</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full text-red-600 bg-red-100">Below 60%</span>
            <span className="text-gray-600">Low confidence match</span>
          </div>
        </div>
      </div>
    </div>
  )
} 