import { Button } from "@/components/ui/button";
import { ArrowRight, QrCode, Heart, LogIn, Megaphone } from "lucide-react";
import heroImage from "@/assets/hero-clover-checkout.jpg";
import Logo from "@/components/Logo";
import RequestInviteForm from "@/components/RequestInviteForm";
import { Link } from "react-router-dom";
const Hero = () => {
  return <section className="min-h-screen gradient-subtle flex flex-col">
    {/* Navigation Header */}
    <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
      <div className="flex flex-nowrap justify-between items-center gap-2 sm:gap-4">
        <Logo size="xl" showText={true} showGloss={true} />
        <div className="flex items-center gap-2 sm:gap-3">
          <Link to="/login">
            <Button variant="outline" size="sm" className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4">
              <LogIn className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Retailer Login</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
    <div className="flex-1 flex items-center">
      <div className="container mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20">
        <div className="max-w-6xl mx-auto space-y-8 sm:space-y-10 md:space-y-12">
          {/* Centered Text Content */}
          <div className="text-center space-y-6 sm:space-y-8 animate-fade-in">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-normal text-gray-900 dark:text-foreground px-2">
              <span className="relative inline-block bg-gradient-to-r from-blue-600 to-purple-700 bg-clip-text text-transparent font-extrabold pb-2">Partner with other nearby retailers to get <span className="font-black">new customers</span>.</span>
            </h1>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-2">
              <RequestInviteForm>
                <Button variant="hero" size="xl" className="group animate-pulse-glow">
                  Build Your Offer
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </RequestInviteForm>
              <a href="https://youtube.com/@media-street-ads" target="_blank" rel="noopener noreferrer">
                <Button variant="cta-outline" size="xl">
                  View Demo
                </Button>
              </a>
            </div>
          </div>

          {/* Image Below */}
          <div className="relative animate-scale-in">
            <div className="relative rounded-2xl overflow-hidden shadow-strong">
              <img src={heroImage} alt="Customer checking out at a Clover Station Duo POS terminal in a modern retail shop" className="w-full h-auto" />
              <div className="absolute inset-0 gradient-hero opacity-40"></div>
            </div>

            {/* Floating Stats Cards */}
            <div className="absolute -top-2 sm:-top-4 -right-2 sm:-right-4 bg-card p-2 sm:p-3 md:p-4 rounded-lg shadow-medium border animate-slide-up">
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-accent-green">5,847</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Referrals Made</div>
            </div>

            <div className="absolute -bottom-2 sm:-bottom-4 -left-2 sm:-left-4 bg-card p-2 sm:p-3 md:p-4 rounded-lg shadow-medium border animate-slide-up">
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-primary">126</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Participating Stores</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>;
};
export default Hero;