import { useEffect, useState, lazy, Suspense } from "react";
import { useParams, useNavigate } from "react-router-dom";
// Supabase removed - will use Node.js API
const LocationQRDisplay = lazy(() => import("@/components/LocationQRDisplay"));
const StorePlacementTips = lazy(() => import("@/components/StorePlacementTips"));
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, QrCode, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import AppLayout from "@/components/AppLayout";

interface Location {
  id: string;
  name: string;
  address: string;
}

const LocationQR = () => {
  const { locationId } = useParams<{ locationId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [location, setLocation] = useState<Location | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (locationId) {
      loadLocation();
    } else {
      loadAllLocations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationId]);

  const loadLocation = async () => {
    try {
      setLoading(true);
      const { get } = await import("@/services/apis");
      
      console.log('Loading location with ID:', locationId);
      
      // Try authenticated endpoint first (for users viewing their own locations)
      let response;
      try {
        response = await get({ 
          end_point: `locations/${locationId}`,
          token: true
        });
        console.log('Authenticated endpoint response:', response);
      } catch (authError: any) {
        console.error('Authenticated endpoint error:', authError);
        // If authenticated endpoint fails (401/403), try public endpoint as fallback
        if (authError?.response?.status === 401 || authError?.response?.status === 403 || authError?.response?.status === 404) {
          console.log('Trying public endpoint as fallback...');
          try {
            response = await get({ 
              end_point: `locations/public/${locationId}`,
              token: false
            });
            console.log('Public endpoint response:', response);
          } catch (publicError: any) {
            console.error('Public endpoint also failed:', publicError);
            throw publicError;
          }
        } else {
          throw authError;
        }
      }
      
      if (response && response.success && response.data) {
        const locationData = response.data;
        console.log('Location data received:', locationData);
        setLocation({
          id: locationData.id || locationData._id?.toString() || locationId,
          name: locationData.name || '',
          address: locationData.address || ''
        });
      } else {
        const errorMsg = response?.message || 'Location not found';
        console.error('Location not found in response:', response);
        throw new Error(errorMsg);
      }
    } catch (error: any) {
      console.error('Error loading location:', error);
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to load location. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      setLocation(null);
    } finally {
      setLoading(false);
    }
  };

  const loadAllLocations = async () => {
    try {
      setLoading(true);
      const { get } = await import("@/services/apis");
      
      const response = await get({ 
        end_point: 'locations',
        token: true
      });
      
      if (response && response.success && response.data) {
        const locationsData = Array.isArray(response.data) ? response.data : [];
        setLocations(locationsData.map((loc: any) => ({
          id: loc.id || loc._id?.toString() || '',
          name: loc.name || '',
          address: loc.address || ''
        })));
      } else {
        setLocations([]);
      }
    } catch (error: any) {
      console.error('Error loading locations:', error);
      toast({
        title: "Error",
        description: error?.response?.data?.message || error?.message || "Failed to load locations. Please try again.",
        variant: "destructive",
      });
      setLocations([]);
    } finally {
      setLoading(false);
    }
  };

  // Location selector view
  if (!locationId) {
    return (
      <AppLayout pageTitle="QR Code Stickers" pageIcon={<QrCode className="h-5 w-5 text-primary" />}>
        <div className="space-y-6">
          <p className="text-muted-foreground">Select a store location to download its unique Media Street QR code sticker and place the sticker in-store</p>
          
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-muted-foreground">Loading locations...</div>
            </div>
          ) : locations.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No store locations found. Add a location first.</p>
                <Button onClick={() => navigate('/locations')}>
                  Go to Store Locations
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {locations.map(loc => (
                <Card 
                  key={loc.id} 
                  className="cursor-pointer hover:border-primary transition-colors" 
                  onClick={() => navigate(`/locations/${loc.id}/qr`)}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <QrCode className="h-5 w-5 text-primary" />
                      {loc.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{loc.address}</p>
                    <Button variant="outline" className="mt-4 w-full">
                      View QR Code
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </AppLayout>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!location) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold text-foreground mb-2">Location Not Found</h2>
          <p className="text-muted-foreground mb-4">This location may have been deleted.</p>
          <Button onClick={() => navigate('/location-qr')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/5 to-primary/5 py-12 px-4">
      <div className="container mx-auto max-w-2xl">
        {/* Back Button */}
        <Button variant="ghost" onClick={() => navigate('/location-qr')} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            In-Store QR Code Display
          </h1>
          <p className="text-muted-foreground">
            {location.name} • {location.address}
          </p>
        </div>

        {/* Print & Display Instructions */}
        <div className="mb-6 bg-muted/50 rounded-lg p-4 border border-border">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">Print & Display:</span> Place this QR code at your checkout counter, entrance, or waiting area for maximum visibility.
          </p>
        </div>

        {/* QR Code Display Component */}
        <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="text-muted-foreground">Loading QR code...</div></div>}>
          <LocationQRDisplay 
            locationId={location.id} 
            locationName={location.name}
            locationAddress={location.address}
          />
        </Suspense>

        {/* Usage Instructions */}
        <Card className="mt-8 p-6 bg-card border-border">
          <h3 className="font-semibold text-foreground mb-3">How to Use</h3>
          <ol className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-3">
              <span className="font-bold text-primary">1.</span>
              <span>Download the QR code ad using the button above</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-primary">2.</span>
              <span>Print it in color on 8.5" x 11" paper or larger</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-primary">3.</span>
              <span>Place it in high-visibility areas: checkout counter, entrance, or waiting area</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-primary">4.</span>
              <span>Customers scan to instantly access your partner offers and nearby deals</span>
            </li>
          </ol>
        </Card>

        {/* Store Placement Tips */}
        <div className="mt-8">
          <Suspense fallback={<div className="flex items-center justify-center h-32"><div className="text-muted-foreground">Loading tips...</div></div>}>
            <StorePlacementTips displayType="qr" />
          </Suspense>
        </div>
      </div>
    </div>
  );
};

export default LocationQR;
