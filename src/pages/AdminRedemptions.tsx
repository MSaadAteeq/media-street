import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search, TicketCheck, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { get } from "@/services/apis";

interface RedemptionDetail {
  id: string;
  redeemed_at: string;
  referring_retailer_name: string;
  referring_retailer_address: string;
  redeeming_retailer_name: string;
  redeeming_retailer_address: string;
  offer_id: string;
  offer_title: string;
  offer_description: string;
}

export default function AdminRedemptions() {
  const [loading, setLoading] = useState(true);
  const [redemptions, setRedemptions] = useState<RedemptionDetail[]>([]);
  const [filteredRedemptions, setFilteredRedemptions] = useState<RedemptionDetail[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = redemptions.filter(r => 
        r.referring_retailer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.redeeming_retailer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.offer_title.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredRedemptions(filtered);
    } else {
      setFilteredRedemptions(redemptions);
    }
  }, [searchTerm, redemptions]);

  const checkAdminAccess = async () => {
    try {
      // Check if user is authenticated and has admin role
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error("Please log in to access admin panel");
        navigate('/login');
        return;
      }

      // Get current user to check role
      const userResponse = await get({
        end_point: 'users/me',
        token: true
      });

      if (!userResponse.success || !userResponse.data) {
        toast.error("Error verifying access");
        navigate('/');
        return;
      }

      const user = userResponse.data;
      const userRole = user.role || user.roles?.[0] || 'retailer';

      if (userRole !== 'admin') {
        toast.error("Access denied: Admin privileges required");
        navigate('/');
        return;
      }

      await loadRedemptions();
    } catch (error: any) {
      console.error('Error checking admin access:', error);
      toast.error("Error verifying access");
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const loadRedemptions = async () => {
    try {
      // Load all redemptions (admin endpoint)
      const redemptionsResponse = await get({
        end_point: 'admin/redemptions',
        token: true
      });

      if (!redemptionsResponse.success || !redemptionsResponse.data) {
        toast.error("Failed to load redemption data");
        return;
      }

      const redemptionsData = Array.isArray(redemptionsResponse.data) 
        ? redemptionsResponse.data 
        : [];

      // Load offers to get offer details
      const offersResponse = await get({
        end_point: 'offers',
        token: true
      });
      const offersData = offersResponse.success && offersResponse.data 
        ? (Array.isArray(offersResponse.data) ? offersResponse.data : [])
        : [];
      
      // Load locations to get location details
      const locationsResponse = await get({
        end_point: 'locations',
        token: true
      });
      const locationsData = locationsResponse.success && locationsResponse.data 
        ? (Array.isArray(locationsResponse.data) ? locationsResponse.data : [])
        : [];

      const formattedRedemptions: RedemptionDetail[] = redemptionsData.map((redemption: any) => {
        const offerId = redemption.offer_id || redemption.offerId || '';
        const locationId = redemption.location_id || redemption.locationId || '';
        
        const offer = offersData.find((o: any) => {
          const oId = o._id?.toString() || o.id?.toString() || '';
          return oId === offerId;
        });
        
        const redeemingLocation = locationsData.find((l: any) => {
          const lId = l._id?.toString() || l.id?.toString() || '';
          return lId === locationId;
        });
        
        const offerLocationId = offer?.locationIds?.[0]?._id?.toString() || 
                               offer?.locationIds?.[0]?.toString() || 
                               offer?.location_id || 
                               offer?.locationId || '';
        
        const offerLocation = offerLocationId 
          ? locationsData.find((l: any) => {
              const lId = l._id?.toString() || l.id?.toString() || '';
              return lId === offerLocationId;
            })
          : null;
        
        return {
          id: redemption._id?.toString() || redemption.id?.toString() || '',
          redeemed_at: redemption.redeemed_at || redemption.redeemedAt || redemption.created_at || redemption.createdAt || new Date().toISOString(),
          referring_retailer_name: redemption.referring_store || redemption.referringStore || offerLocation?.name || 'Media Street',
          referring_retailer_address: offerLocation?.address || 'N/A',
          redeeming_retailer_name: redeemingLocation?.name || 'N/A',
          redeeming_retailer_address: redeemingLocation?.address || 'N/A',
          offer_id: offerId,
          offer_title: offer?.call_to_action || offer?.callToAction || 'N/A',
          offer_description: offer?.business_name || offer?.businessName || redeemingLocation?.name || 'N/A',
        };
      });

      setRedemptions(formattedRedemptions);
      setFilteredRedemptions(formattedRedemptions);
    } catch (error: any) {
      console.error('Error loading redemptions:', error);
      toast.error("An error occurred while loading data");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading redemption data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate('/admin')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Admin
            </Button>
            <h1 className="text-4xl font-bold">Redemption Details</h1>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TicketCheck className="h-5 w-5" />
                  All Redemptions
                </CardTitle>
                <CardDescription>
                  Complete history of all offer redemptions with retailer details
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search retailers or offers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Referring Retailer</TableHead>
                    <TableHead>Redeeming Retailer</TableHead>
                    <TableHead>Offer</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRedemptions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        {searchTerm ? 'No redemptions match your search' : 'No redemptions found'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRedemptions.map((redemption) => (
                      <TableRow key={redemption.id}>
                        <TableCell className="font-medium">
                          {formatDate(redemption.redeemed_at)}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{redemption.referring_retailer_name}</div>
                            <div className="text-sm text-muted-foreground">
                              {redemption.referring_retailer_address}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{redemption.redeeming_retailer_name}</div>
                            <div className="text-sm text-muted-foreground">
                              {redemption.redeeming_retailer_address}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{redemption.offer_title}</div>
                            <div className="text-sm text-muted-foreground line-clamp-2">
                              {redemption.offer_description}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {redemption.offer_id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(`/offers?id=${redemption.offer_id}`, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              Showing {filteredRedemptions.length} of {redemptions.length} total redemptions
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
