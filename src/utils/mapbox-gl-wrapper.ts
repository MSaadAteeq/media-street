// Wrapper to handle mapbox-gl CommonJS import in Vite
// Import using namespace import to get all exports
// @ts-ignore - mapbox-gl is a CommonJS module
import * as mapboxglModule from 'mapbox-gl';

// mapbox-gl exports an object with Map, Marker, etc. as properties
// The default export (if any) or the module itself contains these
const mapboxglOriginal = (mapboxglModule as any).default || mapboxglModule;

// Debug: Log what we actually got (remove after debugging)
if (typeof window !== 'undefined') {
  console.log('mapboxglOriginal keys:', Object.keys(mapboxglOriginal));
  console.log('mapboxglOriginal.Map:', typeof mapboxglOriginal.Map);
  console.log('mapboxglOriginal has Map?', 'Map' in mapboxglOriginal);
}

// Simply export the original object - no wrapper
// Components will set accessToken directly, and if it fails, they'll handle it
// This preserves all constructors perfectly
export default mapboxglOriginal;
