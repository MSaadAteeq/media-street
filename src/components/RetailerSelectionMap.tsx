import React, { useEffect, useRef } from 'react';
import mapboxgl from '@/utils/mapbox-gl-wrapper';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = 'pk.eyJ1IjoibXMtbWFwYm94MjAyNSIsImEiOiJjbWd0cHZhc20wNGc1Mm1xMmZwY2NnbjdwIn0.vAUXdUR3_gZwu35mLimvCg';

interface Retailer {
  id: string;
  business_name: string;
  location_name: string;
  latitude: number;
  longitude: number;
}

interface RetailerSelectionMapProps {
  retailers: Retailer[];
  selectedRetailerIds: string[];
  onRetailerSelect: (retailer: Retailer) => void;
}

const RetailerSelectionMap: React.FC<RetailerSelectionMapProps> = ({
  retailers,
  selectedRetailerIds,
  onRetailerSelect
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize map
    mapboxgl.accessToken = MAPBOX_TOKEN;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-98.5795, 39.8283], // Center of USA
      zoom: 3
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Cleanup
    return () => {
      map.current?.remove();
      markersRef.current.clear();
    };
  }, []);

  // Update markers when retailers or selection changes
  useEffect(() => {
    if (!map.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current.clear();

    // Add markers for each retailer
    retailers.forEach((retailer, index) => {
      if (!map.current) return;

      const isSelected = selectedRetailerIds.includes(retailer.id);
      
      // Create custom marker element
      const markerElement = document.createElement('div');
      markerElement.className = 'retailer-marker cursor-pointer';
      markerElement.innerHTML = `
        <div class="marker-content ${isSelected ? 'bg-green-600' : 'bg-primary'} hover:scale-110 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-lg border-2 border-white transition-all">
          ${index + 1}
        </div>
      `;

      // Create popup content
      const popupContent = document.createElement('div');
      popupContent.className = 'p-2';
      popupContent.innerHTML = `
        <div class="space-y-2">
          <h3 class="font-semibold text-sm">${retailer.business_name}</h3>
          <p class="text-xs text-gray-600">${retailer.location_name}</p>
          <button class="select-btn w-full ${isSelected ? 'bg-red-600 hover:bg-red-700' : 'bg-primary hover:bg-primary/90'} text-white px-3 py-1.5 rounded text-xs font-medium">
            ${isSelected ? 'Deselect' : 'Select'}
          </button>
        </div>
      `;

      // Add click handler for button
      const selectBtn = popupContent.querySelector('.select-btn');
      selectBtn?.addEventListener('click', () => {
        onRetailerSelect(retailer);
      });

      // Create popup
      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: true
      }).setDOMContent(popupContent);

      // Create marker
      const marker = new mapboxgl.Marker(markerElement)
        .setLngLat([retailer.longitude, retailer.latitude])
        .setPopup(popup)
        .addTo(map.current);

      // Store marker reference
      markersRef.current.set(retailer.id, marker);

      // Handle marker click to open popup
      markerElement.addEventListener('click', () => {
        marker.togglePopup();
      });
    });

    // Fit map to show all markers
    if (retailers.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      retailers.forEach(retailer => {
        bounds.extend([retailer.longitude, retailer.latitude]);
      });
      map.current.fitBounds(bounds, {
        padding: 50,
        maxZoom: 15
      });
    }
  }, [retailers, selectedRetailerIds, onRetailerSelect]);

  return (
    <div ref={mapContainer} className="w-full h-full" />
  );
};

export default RetailerSelectionMap;
