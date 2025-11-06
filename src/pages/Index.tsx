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

const Index = () => {
  return (
    <main className="min-h-screen">
      <Hero />
      <FreeTrialCallout />
      <RecentOffers />
      <HowItWorks />
      <OfferBuilderDemo />
      <Benefits />
      <POSAdvertising />
      <EventSponsorshipCallout />
      <Pricing />
      <CTA />
      <ReferralOffer />
      <Footer />
      <CalendlyWidget />
      <CookieConsent />
    </main>
  );
};

export default Index;
