import React, { useState, useRef, useEffect } from 'react'

interface AutocompleteInputProps {
  value: string
  onChange: (value: string) => void
  onSelect: (value: string) => void
  fetchSuggestions: (query: string) => Promise<string[]>
  placeholder?: string
  disabled?: boolean
}

export const AutocompleteInput: React.FC<AutocompleteInputProps> = ({
  value,
  onChange,
  onSelect,
  fetchSuggestions,
  placeholder,
  disabled
}) => {
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [loading, setLoading] = useState(false)
  const debounceTimeout = useRef<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const blurTimeoutRef = useRef<number | null>(null)
  const justSelectedRef = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!value) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }
    
    // Don't fetch suggestions if we just selected one
    if (justSelectedRef.current) {
      justSelectedRef.current = false
      return
    }
    
    setLoading(true)
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current)
    debounceTimeout.current = window.setTimeout(async () => {
      try {
        const results = await fetchSuggestions(value)
        setSuggestions(results)
        setShowSuggestions(true)
      } catch {
        setSuggestions([])
        setShowSuggestions(false)
      } finally {
        setLoading(false)
      }
    }, 250)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  // Handle clicks outside the component
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
        setHighlightedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
    setHighlightedIndex(-1)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return
    if (e.key === 'ArrowDown') {
      setHighlightedIndex((prev) => (prev + 1) % suggestions.length)
    } else if (e.key === 'ArrowUp') {
      setHighlightedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length)
    } else if (e.key === 'Enter') {
      if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
        justSelectedRef.current = true
        onSelect(suggestions[highlightedIndex])
        setShowSuggestions(false)
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    // Clear any pending blur timeout
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current)
      blurTimeoutRef.current = null
    }
    justSelectedRef.current = true
    onSelect(suggestion)
    setShowSuggestions(false)
    setHighlightedIndex(-1)
  }

  return (
    <div className="relative" ref={containerRef}>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 placeholder-gray-500"
        onFocus={() => {
          if (blurTimeoutRef.current) {
            clearTimeout(blurTimeoutRef.current)
            blurTimeoutRef.current = null
          }
        }}
      />
      {loading && (
        <div className="absolute right-3 top-3 text-gray-400 animate-spin">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
          </svg>
        </div>
      )}
      {showSuggestions && suggestions.length > 0 && (
        <ul className="absolute z-10 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-auto">
          {suggestions.map((suggestion, idx) => (
            <li
              key={suggestion + idx}
              className={`px-4 py-2 cursor-pointer ${
                idx === highlightedIndex ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'
              }`}
              onClick={() => handleSuggestionClick(suggestion)}
              onMouseEnter={() => setHighlightedIndex(idx)}
            >
              {suggestion}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
} 