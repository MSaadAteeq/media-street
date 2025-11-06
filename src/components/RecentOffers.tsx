import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MapPin, Sparkles, QrCode } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { QRCodeSVG } from "qrcode.react";
import coffeeCampaign from "@/assets/pos-campaign-coffee.jpg";
import flowersCampaign from "@/assets/pos-campaign-flowers.jpg";
import salonCampaign from "@/assets/pos-campaign-salon.jpg";
import subsCampaign from "@/assets/pos-campaign-subs.jpg";
interface Offer {
  id: string;
  call_to_action: string;
  created_at: string;
  location_id: string;
  offer_image_url: string | null;
  brand_logo_url: string | null;
}
interface Location {
  id: string;
  name: string;
  address: string;
}
// Sample campaigns data
const sampleCampaigns = [
  {
    id: "1",
    call_to_action: "Get 20% off your morning coffee! Show this offer at checkout.",
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    location_id: "1",
    offer_image_url: coffeeCampaign,
    brand_logo_url: null,
    locations: {
      id: "1",
      name: "Brew & Bean Coffee",
      address: "123 Main St, Portland, OR 97201"
    }
  },
  {
    id: "2",
    call_to_action: "Fresh flowers for any occasion - Buy 2 bouquets, get 1 free!",
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    location_id: "2",
    offer_image_url: flowersCampaign,
    brand_logo_url: null,
    locations: {
      id: "2",
      name: "Bloom & Petal Florist",
      address: "456 Park Ave, Seattle, WA 98101"
    }
  },
  {
    id: "3",
    call_to_action: "New client special: $15 off your first haircut & style!",
    created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    location_id: "3",
    offer_image_url: salonCampaign,
    brand_logo_url: null,
    locations: {
      id: "3",
      name: "Luxe Hair Studio",
      address: "789 Broadway, San Francisco, CA 94102"
    }
  },
  {
    id: "4",
    call_to_action: "Lunch combo deal: Any sub + chips + drink for just $10!",
    created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    location_id: "4",
    offer_image_url: subsCampaign,
    brand_logo_url: null,
    locations: {
      id: "4",
      name: "Sub Station Deli",
      address: "321 Oak St, Austin, TX 78701"
    }
  }
];

const RecentOffers = () => {
  const [offers, setOffers] = useState<any[]>(sampleCampaigns);
  const [searchLocation, setSearchLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<any | null>(null);
  const [isQRDialogOpen, setIsQRDialogOpen] = useState(false);
  useEffect(() => {
    // Try to fetch from database, fallback to sample data
    fetchRecentOffers();
  }, []);
  const fetchRecentOffers = async (location?: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("offers")
        .select(`
          id,
          call_to_action,
          created_at,
          location_id,
          offer_image_url,
          brand_logo_url,
          locations (
            id,
            name,
            address
          )
        `)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) {
        console.error("Error fetching offers:", error);
        // Use sample data as fallback
        let filteredData = sampleCampaigns;
        if (location) {
          filteredData = sampleCampaigns.filter((offer: any) => {
            const searchLower = location.toLowerCase();
            return offer.locations.name?.toLowerCase().includes(searchLower) || 
                   offer.locations.address?.toLowerCase().includes(searchLower);
          });
        }
        setOffers(filteredData);
        return;
      }

      let filteredData = data || [];
      if (location && filteredData.length > 0) {
        filteredData = filteredData.filter((offer: any) => {
          const locationData = offer.locations;
          if (!locationData) return false;
          const searchLower = location.toLowerCase();
          return locationData.name?.toLowerCase().includes(searchLower) || 
                 locationData.address?.toLowerCase().includes(searchLower);
        });
      }
      
      // Use sample data if no real data
      setOffers(filteredData.length > 0 ? filteredData : sampleCampaigns);
    } catch (error) {
      console.error("Error fetching offers:", error);
      setOffers(sampleCampaigns);
    } finally {
      setLoading(false);
    }
  };
  const handleLocationSearch = () => {
    fetchRecentOffers(searchLocation);
  };
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };
  
  const handleOfferClick = (offer: any) => {
    setSelectedOffer(offer);
    setIsQRDialogOpen(true);
  };

  const getRedemptionUrl = (offerId: string) => {
    return `${window.location.origin}/redeem?offer=${offerId}`;
  };

  return <section id="search-offers" className="py-20 bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-4">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Live Offers</span>
          </div>
          <h2 className="text-4xl font-bold mb-4">Get a Great Deal to Try Something New</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Discover new local businesses and get the latest deals on Media Street</p>
        </div>

        <div className="max-w-md mx-auto mb-12">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input placeholder="Search by address..." value={searchLocation} onChange={e => setSearchLocation(e.target.value)} onKeyPress={e => e.key === "Enter" && handleLocationSearch()} className="pl-10" />
            </div>
            <Button onClick={handleLocationSearch}>Search</Button>
          </div>
        </div>

        {loading ? <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div> : offers.length > 0 ? <Carousel opts={{
        align: "start",
        loop: true
      }} className="w-full max-w-5xl mx-auto">
            <CarouselContent>
              {offers.map((offer: any) => (
                <CarouselItem key={offer.id} className="md:basis-1/2 lg:basis-1/3">
                  <Card 
                    className="h-full overflow-hidden group hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                    onClick={() => handleOfferClick(offer)}
                  >
                    <div className="relative h-48 overflow-hidden">
                      {offer.offer_image_url && (
                        <img 
                          src={offer.offer_image_url} 
                          alt={offer.locations?.name || "Offer"}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                      <div className="absolute top-3 right-3 bg-primary/90 backdrop-blur-sm px-3 py-1 rounded-full">
                        <span className="text-xs font-medium text-primary-foreground">
                          {formatTimeAgo(offer.created_at)}
                        </span>
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="bg-white/90 backdrop-blur-sm p-4 rounded-full">
                          <QrCode className="w-8 h-8 text-primary" />
                        </div>
                      </div>
                    </div>
                    <CardContent className="p-5 -mt-12 relative z-10">
                      <h3 className="font-bold text-xl mb-2 text-white drop-shadow-lg">
                        {offer.locations?.name || "Business"}
                      </h3>
                      <p className="text-sm text-white/90 line-clamp-2 mb-3 drop-shadow">
                        {offer.call_to_action}
                      </p>
                      {offer.locations?.address && (
                        <div className="flex items-center gap-1 text-xs text-white/80">
                          <MapPin className="w-3 h-3" />
                          <span className="line-clamp-1">{offer.locations.address}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel> : <div className="text-center py-12">
            <p className="text-muted-foreground">No offers found for this location</p>
          </div>}
      </div>

      <Dialog open={isQRDialogOpen} onOpenChange={setIsQRDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Scan to Redeem</DialogTitle>
          </DialogHeader>
          {selectedOffer && (
            <div className="flex flex-col items-center gap-6 py-4">
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <QRCodeSVG 
                  value={getRedemptionUrl(selectedOffer.id)}
                  size={256}
                  level="H"
                  includeMargin
                />
              </div>
              <div className="text-center">
                <h3 className="font-bold text-lg mb-2">{selectedOffer.locations?.name}</h3>
                <p className="text-sm text-muted-foreground mb-3">{selectedOffer.call_to_action}</p>
                {selectedOffer.locations?.address && (
                  <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="w-3 h-3" />
                    <span>{selectedOffer.locations.address}</span>
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
    </section>;
};
export default RecentOffers;