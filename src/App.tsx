import { Provider } from "react-redux"
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "./store";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PublicRoute } from "@/components/PublicRoute";
import { RoleProtectedRoute } from "@/components/RoleProtectedRoute";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import FAQ from "./pages/FAQ";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import Locations from "./pages/Locations";
import PartnerRequests from "./pages/PartnerRequests";
import Admin from "./pages/Admin";
import OfferCreate from "./pages/OfferCreate";
import Offers from "./pages/Offers";
import OfferX from "./pages/OfferX";
import OfferAI from "./pages/OfferAI";
import InStoreDisplay from "./pages/InStoreDisplay";
import PasswordReset from "./pages/PasswordReset";
import Redeem from "./pages/Redeem";
import RedeemConfirm from "./pages/RedeemConfirm";
import Carousel from "./pages/Carousel";
import LocationQR from "./pages/LocationQR";
import Insights from "./pages/Insights";
import NYCDeals from "./pages/NYCDeals";
import AdvertiserSignup from "./pages/AdvertiserSignup";
import AdvertiserDashboard from "./pages/AdvertiserDashboard";
import AdvertiserCampaignCreate from "./pages/AdvertiserCampaignCreate";

const queryClient = new QueryClient();

const App = () => (
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
              <Route path="/advertiser/signup" element={<AdvertiserSignup />} />
              <Route path="/reset-password" element={<PasswordReset />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/nyc-deals" element={<NYCDeals />} />
              <Route path="/redeem/:offerCode/:locationId?" element={<Redeem />} />
              <Route path="/redeem/:offerCode/confirm" element={<RedeemConfirm />} />
              <Route path="/location-qr" element={<ProtectedRoute><LocationQR /></ProtectedRoute>} />
              <Route path="/location-qr/:locationId" element={<ProtectedRoute><LocationQR /></ProtectedRoute>} />
              <Route path="/locations/:locationId/qr" element={<LocationQR />} />
              <Route path="/carousel/:locationId" element={<Carousel />} />
              
              {/* Protected Routes - Require Authentication */}
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/locations" element={<ProtectedRoute><Locations /></ProtectedRoute>} />
              <Route path="/offers" element={<ProtectedRoute><Offers /></ProtectedRoute>} />
              <Route path="/offers/create" element={<ProtectedRoute><OfferCreate /></ProtectedRoute>} />
              <Route path="/openoffer" element={<ProtectedRoute><OfferAI /></ProtectedRoute>} />
              <Route path="/offerx" element={<ProtectedRoute><OfferX /></ProtectedRoute>} />
              <Route path="/display" element={<ProtectedRoute><InStoreDisplay /></ProtectedRoute>} />
              <Route path="/requests" element={<ProtectedRoute><PartnerRequests /></ProtectedRoute>} />
              <Route path="/insights" element={<ProtectedRoute><Insights /></ProtectedRoute>} />
              <Route path="/advertiser/dashboard" element={<ProtectedRoute><AdvertiserDashboard /></ProtectedRoute>} />
              <Route path="/advertiser/campaign/create" element={<ProtectedRoute><AdvertiserCampaignCreate /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/settings/profile" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/settings/messages" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/settings/billing" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/settings/security" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/settings/notifications" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/settings/content" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              
              {/* Admin Routes - Require Admin Role */}
              <Route path="/admin" element={<RoleProtectedRoute allowedRoles={["admin"]}><Admin /></RoleProtectedRoute>} />
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </PersistGate>
  </Provider>
);

export default App;
