import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import Benefits from "@/components/Benefits";
import POSAdvertising from "@/components/QRPlacement";
import OfferBuilderDemo from "@/components/OfferBuilderDemo";
import Pricing from "@/components/Pricing";
import CTA from "@/components/CTA";
import ReferralOffer from "@/components/ReferralOffer";
import FreeTrialCallout from "@/components/FreeTrialCallout";
import EventSponsorshipCallout from "@/components/EventSponsorshipCallout";
import RecentOffers from "@/components/RecentOffers";
import Footer from "@/components/Footer";
import CalendlyWidget from "@/components/CalendlyWidget";
import CookieConsent from "@/components/CookieConsent";
import PartnershipAccountability from "@/components/PartnershipAccountability";
import InsightsPreview from "@/components/InsightPreview";

const Index = () => {
  const navigate = useNavigate();

  // Redirect logged-in users to dashboard (session persists across tab close, browser restart, computer shutdown)
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const role = localStorage.getItem("userRole")?.toLowerCase() || "retailer";
      navigate(role === "admin" ? "/admin" : "/dashboard", { replace: true });
    }
  }, [navigate]);

  // Don't flash landing page if user is logged in - show nothing until redirect
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (token) {
    return null;
  }

  return (
    <main className="min-h-screen">
      <Hero />
      <FreeTrialCallout />
      <OfferBuilderDemo />
      <HowItWorks />
      <RecentOffers />
      <PartnershipAccountability />
      <Benefits />
      <POSAdvertising />
      <EventSponsorshipCallout />
      <Pricing />
      <CTA />
      <ReferralOffer />
      <InsightsPreview />
      <Footer />
      <CalendlyWidget />
      <CookieConsent />
    </main>
  );
};

export default Index;
