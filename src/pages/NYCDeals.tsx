import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MapPin, Heart, Store, ArrowLeft, Search, Navigation, X, Clock, QrCode } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link, useNavigate } from "react-router-dom";
import Footer from "@/components/Footer";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { calculateDistance } from "@/utils/distance";
import { QRCodeSVG } from "qrcode.react";
import { get } from "@/services/apis";

interface Offer {
  id: string;
  call_to_action: string;
  created_at: string;
  offer_image_url: string | null;
  business_name: string | null;
  redemption_code: string | null;
  location: {
    id: string;
    name: string;
    address: string;
    latitude?: number;
    longitude?: number;
  };
  is_active: boolean;
  redemption_count: number;
  distance?: number;
}

const isNYCAddress = (address: string): boolean => {
  const addressUpper = address.toUpperCase();
  return addressUpper.includes(', NY ') || 
         addressUpper.includes(' NY ') ||
         addressUpper.includes('NEW YORK');
};

const extractZipFromAddress = (address: string): string => {
  const zipMatch = address.match(/\b(\d{5})\b/);
  return zipMatch ? zipMatch[1] : '';
};

const getBoroughFromZip = (address: string): string => {
  const zipCode = extractZipFromAddress(address);
  if (!zipCode) return "NYC";
  
  const zip = parseInt(zipCode);
  const NYC_ZIP_CODES = {
    manhattan: { min: 10001, max: 10282 },
    bronx: { min: 10451, max: 10475 },
    brooklyn: { min: 11201, max: 11256 },
    queens1: { min: 11004, max: 11109 },
    queens2: { min: 11351, max: 11697 },
    statenIsland: { min: 10301, max: 10314 }
  };
  
  if (zip >= NYC_ZIP_CODES.manhattan.min && zip <= NYC_ZIP_CODES.manhattan.max) return "Manhattan";
  if (zip >= NYC_ZIP_CODES.bronx.min && zip <= NYC_ZIP_CODES.bronx.max) return "Bronx";
  if (zip >= NYC_ZIP_CODES.brooklyn.min && zip <= NYC_ZIP_CODES.brooklyn.max) return "Brooklyn";
  if ((zip >= NYC_ZIP_CODES.queens1.min && zip <= NYC_ZIP_CODES.queens1.max) ||
      (zip >= NYC_ZIP_CODES.queens2.min && zip <= NYC_ZIP_CODES.queens2.max)) return "Queens";
  if (zip >= NYC_ZIP_CODES.statenIsland.min && zip <= NYC_ZIP_CODES.statenIsland.max) return "Staten Island";
  return "NYC";
};

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return date.toLocaleDateString();
};

const MAPBOX_TOKEN = 'pk.eyJ1IjoibXMtbWFwYm94MjAyNSIsImEiOiJjbWd0cHZhc20wNGc1Mm1xMmZwY2NnbjdwIn0.vAUXdUR3_gZwu35mLimvCg';

const NYCDeals = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBorough, setSelectedBorough] = useState<string>("all");
  const [searchAddress, setSearchAddress] = useState("");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [isQRDialogOpen, setIsQRDialogOpen] = useState(false);
  
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  // Dynamically get boroughs from offers
  const getAvailableBoroughs = () => {
    const boroughSet = new Set<string>();
    offers.forEach(offer => {
      const borough = getBoroughFromZip(offer.location.address);
      if (borough && borough !== "NYC") {
        boroughSet.add(borough);
      }
    });
    return ["all", ...Array.from(boroughSet).sort()];
  };

  const boroughs = getAvailableBoroughs();

  const filteredOffers = selectedBorough === "all" 
    ? offers 
    : offers.filter(offer => getBoroughFromZip(offer.location.address) === selectedBorough);

  useEffect(() => {
    fetchNYCOffers();
  }, []);

  useEffect(() => {
    if (!mapContainer.current || loading) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-73.9857, 40.7484],
      zoom: 11,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    return () => {
      map.current?.remove();
    };
  }, [loading]);

  // Update markers when offers or filter changes
  useEffect(() => {
    if (!map.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    const bounds = new mapboxgl.LngLatBounds();
    let hasValidCoords = false;

    filteredOffers.forEach((offer) => {
      if (offer.location.latitude && offer.location.longitude) {
        hasValidCoords = true;
        const el = document.createElement('div');
        el.className = 'w-8 h-8 bg-primary rounded-full flex items-center justify-center cursor-pointer shadow-lg border-2 border-white hover:scale-110 transition-transform';
        el.style.backgroundColor = 'hsl(262.1 83.3% 57.8%)';
        el.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>';

        const popup = new mapboxgl.Popup({ offset: 25, closeButton: false }).setHTML(`
          <div class="p-2 min-w-[200px]">
            <p class="font-semibold text-sm">${offer.location.name}</p>
            <p class="text-xs text-gray-600 mt-1">${offer.call_to_action}</p>
            <p class="text-xs text-gray-500 mt-1">${offer.location.address}</p>
          </div>
        `);

        const marker = new mapboxgl.Marker(el)
          .setLngLat([offer.location.longitude, offer.location.latitude])
          .setPopup(popup)
          .addTo(map.current!);

        el.addEventListener('click', () => {
          setSelectedOffer(offer);
          map.current?.flyTo({
            center: [offer.location.longitude!, offer.location.latitude!],
            zoom: 14,
          });
        });

        markersRef.current.push(marker);
        bounds.extend([offer.location.longitude, offer.location.latitude]);
      }
    });

    // Add user location marker if exists
    if (userLocation) {
      const userEl = document.createElement('div');
      userEl.className = 'w-6 h-6 rounded-full border-2 border-white shadow-lg';
      userEl.style.backgroundColor = '#3b82f6';
      userEl.style.animation = 'pulse 2s infinite';
      
      new mapboxgl.Marker(userEl)
        .setLngLat([userLocation.lng, userLocation.lat])
        .addTo(map.current);
      
      bounds.extend([userLocation.lng, userLocation.lat]);
      hasValidCoords = true;
    }

    if (hasValidCoords && !bounds.isEmpty()) {
      map.current.fitBounds(bounds, { padding: 50, maxZoom: 14 });
    }
  }, [filteredOffers, userLocation]);

  const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${MAPBOX_TOKEN}&limit=1`
      );
      const data = await response.json();
      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;
        return { lat, lng };
      }
    } catch (error) {
      console.error("Geocoding error for address:", address, error);
    }
    return null;
  };

  const fetchNYCOffers = async () => {
    try {
      setLoading(true);
      // Fetch open offers from backend (public endpoint)
      const response = await get({ 
        end_point: 'offers/open',
        token: false
      });

      if (response.success && response.data && Array.isArray(response.data)) {
        // Filter for NYC addresses and process offers
        const nycOffers = await Promise.all(
          response.data
            .filter((offer: any) => {
              const location = offer.locations?.[0] || offer.locationIds?.[0];
              return location && isNYCAddress(location.address || '');
            })
            .map(async (offer: any) => {
              const location = offer.locations?.[0] || offer.locationIds?.[0];
              
              // Geocode if coordinates are missing
              let latitude = location?.latitude;
              let longitude = location?.longitude;
              
              if (!latitude || !longitude) {
                const coords = await geocodeAddress(location?.address || '');
                if (coords) {
                  latitude = coords.lat;
                  longitude = coords.lng;
                }
              }

              return {
                id: offer._id?.toString() || offer.id?.toString() || '',
                call_to_action: offer.callToAction || offer.call_to_action || '',
                created_at: offer.createdAt || offer.created_at || new Date().toISOString(),
                offer_image_url: offer.offerImage || offer.offer_image || offer.offerImageUrl || offer.offer_image_url || null,
                business_name: location?.name || null,
                redemption_code: offer.redemptionCode || offer.redemption_code || null,
                location: {
                  id: location?._id?.toString() || location?.id?.toString() || '',
                  name: location?.name || 'Store',
                  address: location?.address || '',
                  latitude,
                  longitude,
                },
                is_active: offer.isActive !== false && offer.is_active !== false,
                redemption_count: offer.redemptionCount || offer.redemption_count || 0,
              } as Offer;
            })
        );

        setOffers(nycOffers);
      } else {
        setOffers([]);
      }
    } catch (error) {
      console.error("Error fetching NYC offers:", error);
      setOffers([]);
      toast({
        title: "Error",
        description: "Failed to load offers. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const searchNearbyOffers = async () => {
    if (!searchAddress.trim()) {
      toast({
        title: "Enter an address",
        description: "Please enter a street address to search nearby offers",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchAddress)}.json?access_token=${MAPBOX_TOKEN}&limit=1&bbox=-74.26,40.49,-73.70,40.92`
      );
      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;
        setUserLocation({ lat, lng });

        const offersWithDistance = offers.map(offer => ({
          ...offer,
          distance: offer.location.latitude && offer.location.longitude
            ? calculateDistance(lat, lng, offer.location.latitude, offer.location.longitude)
            : 999
        })).sort((a, b) => (a.distance || 999) - (b.distance || 999));

        setOffers(offersWithDistance);
        setSelectedBorough("all");

        toast({
          title: "Location found",
          description: `Showing offers nearest to ${data.features[0].place_name}`,
        });

        // Zoom into the searched location
        map.current?.flyTo({
          center: [lng, lat],
          zoom: 15,
          duration: 1500,
        });

        // Scroll to map section
        mapContainer.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        toast({
          title: "Address not found",
          description: "Please try a different address",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      toast({
        title: "Search failed",
        description: "Unable to search for that address",
        variant: "destructive",
      });
    }
  };

  const clearSearch = () => {
    setSearchAddress("");
    setUserLocation(null);
    fetchNYCOffers();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading NYC deals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              onClick={() => navigate("/")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
            <Link to="/login">
              <Button variant="outline">Sign In</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-8 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">
              New York City Deals & Discounts
            </h1>
            <p className="text-lg text-muted-foreground">
              Discover exclusive offers from local NYC businesses across all five boroughs
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Store className="h-4 w-4" />
                <span>{offers.length} Active Offers</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4" />
                <span>Supporting Local Businesses</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Address Search */}
      <section className="py-4 border-b bg-card/30">
        <div className="container mx-auto px-4">
          <div className="max-w-xl mx-auto">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Enter street address to find nearby offers..."
                  value={searchAddress}
                  onChange={(e) => setSearchAddress(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchNearbyOffers()}
                  className="pl-10 pr-10"
                />
                {searchAddress && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <Button onClick={searchNearbyOffers} className="gap-2">
                <Navigation className="h-4 w-4" />
                Search
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="relative h-[500px] rounded-lg overflow-hidden shadow-lg border">
            <div ref={mapContainer} className="absolute inset-0" />
              
              {/* Selected Offer Card Overlay */}
              {selectedOffer && (
                <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-10">
                  <Card className="shadow-xl">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-base">{selectedOffer.business_name || selectedOffer.location.name}</CardTitle>
                        <button
                          onClick={() => setSelectedOffer(null)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-sm font-medium text-primary">{selectedOffer.call_to_action}</p>
                      <p className="text-xs text-muted-foreground">{selectedOffer.location.address}</p>
                      {selectedOffer.created_at && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{formatTimeAgo(selectedOffer.created_at)}</span>
                        </div>
                      )}
                      {selectedOffer.distance && (
                        <Badge variant="secondary" className="text-xs">
                          {selectedOffer.distance} miles away
                        </Badge>
                      )}
                      <Button 
                        size="sm" 
                        className="w-full mt-2" 
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsQRDialogOpen(true);
                        }}
                      >
                        <QrCode className="h-4 w-4 mr-2" />
                        View Offer
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}
          </div>
        </div>
      </section>

      {/* Borough Filter */}
      <section className="py-4 border-b bg-card/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-2">
            {boroughs.map((borough) => (
              <Button
                key={borough}
                variant={selectedBorough === borough ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedBorough(borough)}
              >
                {borough === "all" ? "All Boroughs" : borough}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Offers Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {filteredOffers.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Store className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No offers available</h3>
                <p className="text-muted-foreground">
                  {selectedBorough === "all" 
                    ? "Check back soon for new deals!" 
                    : `No offers currently available in ${selectedBorough}`}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredOffers.map((offer) => (
                <Card 
                  key={offer.id} 
                  className={`overflow-hidden hover:shadow-lg transition-all cursor-pointer ${
                    selectedOffer?.id === offer.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => {
                    setSelectedOffer(offer);
                    if (offer.location.latitude && offer.location.longitude && map.current) {
                      map.current.flyTo({
                        center: [offer.location.longitude, offer.location.latitude],
                        zoom: 14,
                      });
                    }
                  }}
                >
                  {/* Offer image or placeholder */}
                  <div className="relative h-32 bg-gradient-to-br from-primary/20 to-primary/5 overflow-hidden">
                    {offer.offer_image_url ? (
                      <img 
                        src={offer.offer_image_url} 
                        alt={offer.business_name || offer.location.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Store className="h-12 w-12 text-primary/30" />
                      </div>
                    )}
                    {offer.created_at && (
                      <div className="absolute top-2 right-2 bg-primary/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1">
                        <Clock className="w-3 h-3 text-primary-foreground" />
                        <span className="text-xs font-medium text-primary-foreground">
                          {formatTimeAgo(offer.created_at)}
                        </span>
                      </div>
                    )}
                  </div>
                  <CardHeader className="bg-primary/5 pb-2">
                    <CardTitle className="text-lg">{offer.call_to_action}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex items-start gap-2">
                      <Store className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">{offer.business_name || offer.location.name}</p>
                        <p className="text-sm text-muted-foreground">{offer.location.address}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {getBoroughFromZip(offer.location.address)} • {extractZipFromAddress(offer.location.address)}
                      </span>
                      {offer.distance && (
                        <Badge variant="outline" className="ml-auto text-xs">
                          {offer.distance} mi
                        </Badge>
                      )}
                    </div>

                    <div className="pt-2 border-t">
                      <div className="flex items-center justify-end">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOffer(offer);
                            setIsQRDialogOpen(true);
                          }}
                        >
                          <QrCode className="h-4 w-4 mr-2" />
                          View Offer
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* QR Code Dialog */}
      <Dialog open={isQRDialogOpen} onOpenChange={setIsQRDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Scan to Redeem</DialogTitle>
          </DialogHeader>
          {selectedOffer && (
            <div className="flex flex-col items-center gap-6 py-4">
              {selectedOffer.offer_image_url && (
                <div className="w-full h-32 rounded-lg overflow-hidden">
                  <img 
                    src={selectedOffer.offer_image_url} 
                    alt={selectedOffer.business_name || selectedOffer.location.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <QRCodeSVG 
                  value={`${window.location.origin}/carousel/${selectedOffer.location.id}`}
                  size={200}
                  level="H"
                  includeMargin
                />
              </div>
              <div className="text-center">
                <h3 className="font-bold text-lg mb-2">
                  {selectedOffer.business_name || selectedOffer.location.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-3">{selectedOffer.call_to_action}</p>
                {selectedOffer.location?.address && (
                  <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="w-3 h-3" />
                    <span>{selectedOffer.location.address}</span>
                  </div>
                )}
                {selectedOffer.created_at && (
                  <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mt-2">
                    <Clock className="w-3 h-3" />
                    <span>Posted {formatTimeAgo(selectedOffer.created_at)}</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground text-center max-w-sm">
                Scan this QR code with your phone to view and redeem this offer
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default NYCDeals;

