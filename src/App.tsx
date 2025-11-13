import { Provider } from "react-redux"
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "./store";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/advertiser/signup" element={<AdvertiserSignup />} />
              <Route path="/advertiser/dashboard" element={<AdvertiserDashboard />} />
              <Route path="/advertiser/campaign/create" element={<AdvertiserCampaignCreate />} />
              <Route path="/reset-password" element={<PasswordReset />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/locations" element={<Locations />} />
              <Route path="/offers" element={<Offers />} />
              <Route path="/offers/create" element={<OfferCreate />} />
              <Route path="/openoffer" element={<OfferAI />} />
              <Route path="/offerx" element={<OfferX />} />
              <Route path="/display" element={<InStoreDisplay />} />
              <Route path="/requests" element={<PartnerRequests />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/settings/profile" element={<Settings />} />
              <Route path="/settings/messages" element={<Settings />} />
              <Route path="/settings/billing" element={<Settings />} />
              <Route path="/settings/security" element={<Settings />} />
              <Route path="/settings/notifications" element={<Settings />} />
              <Route path="/settings/content" element={<Settings />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/redeem/:offerCode" element={<Redeem />} />
              <Route path="/redeem/:offerCode/confirm" element={<RedeemConfirm />} />
              <Route path="/locations/:locationId/qr" element={<LocationQR />} />
              <Route path="/carousel/:locationId" element={<Carousel />} />
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
