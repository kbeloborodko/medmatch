import React, { useState, useMemo } from 'react'
import type { Medication } from '../services/medicationService'

interface AnaloguesTableProps {
  analogues: Medication[]
}

type SortField = 'name' | 'genericName' | 'strength' | 'country'
type SortDirection = 'asc' | 'desc'

interface AnalogueWithConfidence extends Medication {
  confidence: number
}

export const AnaloguesTable: React.FC<AnaloguesTableProps> = ({ analogues }) => {
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  // Calculate confidence for each analogue
  const analoguesWithConfidence = useMemo((): AnalogueWithConfidence[] => {
    return analogues.map(analogue => {
      let confidence = 0.7 // Base confidence

      if (analogue.genericName && analogue.activeIngredient) {
        confidence = 0.8
      }

      return {
        ...analogue,
        confidence
      }
    })
  }, [analogues])

  // Sort analogues
  const sortedAnalogues = useMemo(() => {
    let sorted = [...analoguesWithConfidence]

    // Sort analogues
    sorted.sort((a, b) => {
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
        case 'strength':
          aValue = a.strength.toLowerCase()
          bValue = b.strength.toLowerCase()
          break
        case 'country':
          aValue = a.country.toLowerCase()
          bValue = b.country.toLowerCase()
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
    sorted.sort((a, b) => b.confidence - a.confidence)

    return sorted
  }, [analoguesWithConfidence, sortField, sortDirection])

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

  const getCountryDisplay = (country: string) => {
    const countryFlag = {
      'US': '🇺🇸',
      'EU': '🇪🇺',
      'CA': '🇨🇦'
    }[country] || country
    
    return `${countryFlag} ${country}`
  }

  const getCountryColor = (country: string) => {
    switch (country) {
      case 'US':
        return 'text-blue-800 bg-blue-100'
      case 'EU':
        return 'text-green-800 bg-green-100'
      case 'CA':
        return 'text-red-800 bg-red-100'
      default:
        return 'text-gray-800 bg-gray-100'
    }
  }

  if (sortedAnalogues.length === 0) {
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
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('strength')}>
                <div className="flex items-center gap-1">
                  Strength
                  {sortField === 'strength' && (
                    <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('country')}>
                <div className="flex items-center gap-1">
                  Country
                  {sortField === 'country' && (
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
            {sortedAnalogues.map((analogue, index) => (
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
                  {analogue.strength}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getCountryColor(analogue.country)}`}>
                    {getCountryDisplay(analogue.country)}
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getConfidenceColor(analogue.confidence)}`}>
                    {Math.round(analogue.confidence * 100)}% Match
                  </span>
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