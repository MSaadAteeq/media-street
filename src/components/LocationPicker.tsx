import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin, Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';

const MAPBOX_TOKEN = 'pk.eyJ1IjoibXMtbWFwYm94MjAyNSIsImEiOiJjbWd0cHZhc20wNGc1Mm1xMmZwY2NnbjdwIn0.vAUXdUR3_gZwu35mLimvCg';

interface LocationPickerProps {
  onLocationSelect: (latitude: number, longitude: number, locationName?: string) => void;
  initialLatitude?: number;
  initialLongitude?: number;
  height?: string;
}

interface GeocodingResult {
  id: string;
  place_name: string;
  center: [number, number]; // [longitude, latitude]
  text: string;
  context?: Array<{ text: string }>;
}

const LocationPicker: React.FC<LocationPickerProps> = ({
  onLocationSelect,
  initialLatitude,
  initialLongitude,
  height = '400px'
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number; name?: string } | null>(
    initialLatitude && initialLongitude 
      ? { lat: initialLatitude, lng: initialLongitude }
      : null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodingResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [hasSelectedLocation, setHasSelectedLocation] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Popular worldwide locations for quick search
  const quickLocations = [
    { name: 'New York, USA', query: 'New York, NY, USA' },
    { name: 'London, UK', query: 'London, England, UK' },
    { name: 'Tokyo, Japan', query: 'Tokyo, Japan' },
    { name: 'Paris, France', query: 'Paris, France' },
    { name: 'Sydney, Australia', query: 'Sydney, Australia' },
    { name: 'Dubai, UAE', query: 'Dubai, UAE' },
    { name: 'Singapore', query: 'Singapore' },
    { name: 'Mumbai, India', query: 'Mumbai, India' },
    { name: 'Toronto, Canada', query: 'Toronto, Canada' },
    { name: 'Berlin, Germany', query: 'Berlin, Germany' },
  ];

  // Geocode search query
  const searchLocation = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    try {
      // Use Mapbox Geocoding API with better parameters for location search
      // Mapbox API maximum limit is 10, so we'll request the maximum
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&limit=10&types=place,locality,neighborhood,address,poi,postcode,country,region&autocomplete=true`
      );
      
      if (!response.ok) {
        throw new Error(`Geocoding API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        setSearchResults(data.features);
        setShowResults(!hasSelectedLocation);
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      setSearchResults([]);
      setShowResults(false);
    } finally {
      setIsSearching(false);
    }
  }, [hasSelectedLocation]);

  // Reverse geocode coordinates to get address
  const reverseGeocode = useCallback(async (lng: number, lat: number) => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&limit=1`
      );
      const data = await response.json();
      if (data.features && data.features.length > 0) {
        return data.features[0].place_name;
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
    }
    return null;
  }, []);

  // Update location when marker is dragged
  const updateLocationFromMarker = useCallback(async (lng: number, lat: number, userInitiated = false) => {
    const locationName = await reverseGeocode(lng, lat);
    setSelectedLocation({ lat, lng, name: locationName || undefined });
    onLocationSelect(lat, lng, locationName || undefined);
    if (locationName) {
      setSearchQuery(locationName);
    }
    if (userInitiated) {
      setHasSelectedLocation(true);
      setShowResults(false);
      setSearchResults([]);
    }
  }, [reverseGeocode, onLocationSelect]);

  // Handle search input change with debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Only search if query is at least 2 characters
    if (searchQuery && searchQuery.trim().length >= 2) {
      searchTimeoutRef.current = setTimeout(() => {
        searchLocation(searchQuery.trim());
      }, 300);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, searchLocation]);

  // Handle ESC key to close dropdown
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showResults) {
        setShowResults(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showResults]);

  // Handle selecting a search result
  const handleSelectResult = async (result: GeocodingResult) => {
    const [lng, lat] = result.center;
    const locationName = result.place_name;

    setSelectedLocation({ lat, lng, name: locationName });
    setSearchQuery(locationName);
    onLocationSelect(lat, lng, locationName);
    setHasSelectedLocation(true);
    setSearchResults([]);
    setShowResults(false);

    // Update map
    if (map.current) {
      map.current.flyTo({
        center: [lng, lat],
        zoom: 14,
        duration: 1000
      });
    }

    // Update marker position
    if (markerRef.current) {
      markerRef.current.setLngLat([lng, lat]);
    } else {
      // Create marker if it doesn't exist
      const el = document.createElement('div');
      el.className = 'custom-marker';
      el.innerHTML = '<div style="background-color: #3b82f6; width: 30px; height: 30px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); cursor: move;"></div>';
      
      markerRef.current = new mapboxgl.Marker({ 
        element: el,
        draggable: true 
      })
        .setLngLat([lng, lat])
        .addTo(map.current!);

      // Listen to drag events
      markerRef.current.on('dragend', () => {
        const lngLat = markerRef.current!.getLngLat();
        updateLocationFromMarker(lngLat.lng, lngLat.lat);
      });
    }
  };

  // Handle quick location click
  const handleQuickLocationClick = (query: string) => {
    setSearchQuery(query);
    setHasSelectedLocation(false);
    searchLocation(query);
  };

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize map
    mapboxgl.accessToken = MAPBOX_TOKEN;
    
    const center: [number, number] = initialLongitude && initialLatitude
      ? [initialLongitude, initialLatitude]
      : [-98.5795, 39.8283]; // Default: Center of USA

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: center,
      zoom: initialLatitude && initialLongitude ? 12 : 3
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Create draggable marker
    const el = document.createElement('div');
    el.className = 'custom-marker';
    el.innerHTML = '<div style="background-color: #3b82f6; width: 30px; height: 30px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); cursor: move;"></div>';
    
    const initialLng = initialLongitude || center[0];
    const initialLat = initialLatitude || center[1];

    markerRef.current = new mapboxgl.Marker({ 
      element: el,
      draggable: true 
    })
      .setLngLat([initialLng, initialLat])
      .addTo(map.current);

    // Listen to drag events
    markerRef.current.on('dragend', () => {
      const lngLat = markerRef.current!.getLngLat();
      updateLocationFromMarker(lngLat.lng, lngLat.lat, true);
    });

    // Initial location update
    if (initialLatitude && initialLongitude) {
      updateLocationFromMarker(initialLongitude, initialLatitude);
    } else {
      // Set initial location at center
      updateLocationFromMarker(initialLng, initialLat);
    }

    // Handle map click to move marker
    const handleMapClick = async (e: mapboxgl.MapMouseEvent) => {
      const { lng, lat } = e.lngLat;
      
      // Move marker to clicked location
      if (markerRef.current) {
        markerRef.current.setLngLat([lng, lat]);
        await updateLocationFromMarker(lng, lat, true);
      }
    };

    map.current.on('click', handleMapClick);

    // Cleanup
    return () => {
      if (markerRef.current) {
        markerRef.current.remove();
      }
      map.current?.off('click', handleMapClick);
      map.current?.remove();
    };
  }, []); // Only run once on mount

  return (
    <div className="w-full">
      {/* Search Bar */}
      <div className="relative mb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search for a location worldwide..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setHasSelectedLocation(false);
            }}
            onFocus={() => {
              if (hasSelectedLocation) return;
              if (searchResults.length > 0 && searchQuery.trim().length >= 2) {
                setShowResults(true);
              }
            }}
            onBlur={() => {
              // Delay hiding results to allow click on results
              setTimeout(() => {
                setShowResults(false);
              }, 200);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setShowResults(false);
              }
            }}
            className="pl-10 pr-10"
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
          )}
        </div>

        {/* Quick Locations */}
        {!searchQuery && searchResults.length === 0 && (
          <div className="mt-2">
            <p className="text-xs font-medium text-muted-foreground mb-2">Quick Search:</p>
            <div className="flex flex-wrap gap-2">
              {quickLocations.map((location, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleQuickLocationClick(location.query)}
                  className="text-xs px-3 py-1.5 bg-accent hover:bg-accent/80 rounded-md transition-colors border border-border"
                >
                  {location.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search Results Dropdown */}
        {showResults && searchResults.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
            {searchResults.map((result) => (
              <button
                key={result.id}
                type="button"
                onMouseDown={(e) => {
                  // Prevent blur from hiding results before click
                  e.preventDefault();
                }}
                onClick={() => {
                  handleSelectResult(result);
                  setShowResults(false);
                }}
                className="w-full text-left px-4 py-2 hover:bg-accent transition-colors border-b border-border last:border-b-0 cursor-pointer"
              >
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{result.text}</p>
                    {result.context && result.context.length > 0 && (
                      <p className="text-xs text-muted-foreground truncate">
                        {result.context.map((ctx) => ctx.text).join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
        
        {/* Show message when searching */}
        {isSearching && searchQuery && searchQuery.trim().length >= 2 && (
          <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <p className="text-sm">Searching for locations...</p>
            </div>
          </div>
        )}
        
        {/* Show message when no results */}
        {!isSearching && searchQuery && searchQuery.trim().length >= 2 && showResults && searchResults.length === 0 && (
          <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg p-4">
            <p className="text-sm text-muted-foreground">No locations found. Try a different search term.</p>
          </div>
        )}
      </div>

      {/* Map */}
      <div 
        ref={mapContainer} 
        className="w-full rounded-md border overflow-hidden"
        style={{ height }}
        onClick={() => setShowResults(false)}
      />

      {/* Selected Location Info */}
      {selectedLocation && (
        <div className="mt-3 p-3 bg-accent/50 rounded-md">
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              {selectedLocation.name ? (
                <div>
                  <p className="text-sm font-medium text-foreground">{selectedLocation.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Latitude: {selectedLocation.lat.toFixed(6)}, Longitude: {selectedLocation.lng.toFixed(6)}
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-medium text-foreground">Selected Location</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Latitude: {selectedLocation.lat.toFixed(6)}, Longitude: {selectedLocation.lng.toFixed(6)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <p className="mt-2 text-xs text-muted-foreground">
        💡 Drag the marker on the map or search for a location to set coordinates
      </p>
    </div>
  );
};

export default LocationPicker;

