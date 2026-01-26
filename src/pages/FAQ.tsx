import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail } from "lucide-react";
import { Link } from "react-router-dom";
const FAQ = () => {
  const faqs = [{
    id: "what-is-mediastreet",
    question: "What is Media Street?",
    answer: "Media Street is a retail cross-promotion network that helps local businesses grow together. We connect nearby retailers so they can promote each other's offers to their customers—driving new foot traffic without competing for the same customers."
  }, {
    id: "how-it-works",
    question: "How does the partnership system work?",
    answer: "When you partner with another local business, your promotional offers appear on their post-purchase screens (and vice versa). Customers see relevant offers from complementary businesses, scan QR codes to get directions and special deals, and you both gain new customers. Media Street tracks all impressions and redemptions so you can see exactly which partnerships are driving results."
  }, {
    id: "pricing-model",
    question: "How much does Media Street cost?",
    answer: "Open Offer costs $25/month per store, charged at the beginning of each month for each enrolled store location. Earn $1 in promo credits for each referral you generate for other Open Offer retailers. Individual Partnerships cost $10/partnership, charged after 30 days if not cancelled, to the retailer generating the fewest redemptions (if tied, the retailer generating fewest views for their partner pays the fee)."
  }, {
    id: "what-is-open-offer",
    question: "What is Open Offer?",
    answer: "Open Offer is our automated offer distribution program. For $25/month per store location, your offers are automatically distributed to nearby retailers in non-competing categories. It's perfect if you want hands-off promotion without manually managing individual partnerships. You can enable or disable Open Offer per store location from your dashboard."
  }, {
    id: "getting-started",
    question: "How do I get started?",
    answer: "Request an invite through our platform. We'll help you set up your account, add your store locations, create your first promotional offer, and connect you with compatible partner businesses in your area. Setup takes less than 5 minutes, and your first partnership is free."
  }, {
    id: "partner-matching",
    question: "How do you match businesses for partnerships?",
    answer: "We focus on complementary businesses that share similar customer bases but aren't direct competitors. You can browse nearby businesses by retail channel and send partnership requests, or receive requests from businesses interested in partnering with you. The decision to partner is always yours."
  }, {
    id: "qr-placement",
    question: "Where do promotional offers appear?",
    answer: "Partner offers appear on post-purchase screens through your point-of-sale system. You can also download QR code stickers from your dashboard to place in high-visibility areas of your store—like near the register, entrance, or waiting areas—to drive additional engagement."
  }, {
    id: "tracking-results",
    question: "How do I track partnership performance?",
    answer: "Your dashboard shows four key metrics: Inbound Impressions (how often your offers are shown), Inbound Redemptions (when customers redeem your offers), Outbound Impressions (views you generate for partners), and Outbound Redemptions (conversions you drive for partners). This helps you see exactly which partnerships are most valuable."
  }, {
    id: "insights",
    question: "What are Retail Marketing Insights?",
    answer: "The Insights page shows you what's working best across the Media Street network—top-performing offers, trending call-to-action phrases, and successful promotion strategies. Use these insights to optimize your own offers and improve your results."
  }, {
    id: "campaign-limits",
    question: "How many partnerships can I have?",
    answer: "You can have up to 5 active partnerships per store location. This allows you to test different partners and find the most effective combinations while keeping management simple."
  }, {
    id: "billing",
    question: "How does billing work?",
    answer: "Open Offer is charged at the beginning of each month at $25 per enrolled store location. You earn $1 in promo credits for each referral you generate for other Open Offer retailers which are applied as discounts to future charges. Partnership billing is $10/partnership, charged after 30 days, to the retailer receiving the most redemption from the partnership (if tied, the retailer receiving more views pays the fee). Both Open Offer and partnerships can be cancelled at any time."
  }, {
    id: "cancellation",
    question: "Can I cancel anytime?",
    answer: "Yes, there are no long-term contracts. You can cancel individual partnerships or unsubscribe from Open Offer at any time from your Settings page. Cancellations take effect at the end of your current billing period."
  }, {
    id: "business-types",
    question: "What types of businesses work best?",
    answer: "Media Street works great for retail stores, restaurants, cafes, salons, fitness centers, and any service business with a physical location. The key is having complementary (not competing) neighbors—like a coffee shop partnering with a bookstore, or a salon partnering with a boutique."
  }, {
    id: "support",
    question: "What kind of support do you provide?",
    answer: "We provide onboarding assistance to get you set up, plus ongoing support for any platform questions. Reach us anytime at hi@mediastreet.ai."
  }, {
    id: "minimum-commitment",
    question: "Is there a minimum time commitment?",
    answer: "No minimum commitment. Your first partnership is free, so you can test the platform risk-free. After that, pay only for active partnerships on a month-to-month basis. Cancel anytime."
  }, {
    id: "who-behind",
    question: "Who's behind Media Street?",
    answer: null,
    jsxAnswer: <>
      <a href="https://www.linkedin.com/in/krismathis" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">Kris Mathis</a>, previously founder of SponsorPitch.com which helps events find sponsors, started Media Street to help his favorite NYC retailers win new customers. Show some love by giving the team a follow on the{" "}
      <a href="https://www.linkedin.com/company/media-street-ai" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">Media Street LinkedIn</a>{" "}
      page. Even better, send us feedback and we'll get you some swag!
    </>
  }, {
    id: "vision",
    question: "What's the vision for Media Street?",
    answer: null,
    jsxAnswer: <>
      We believe online retail, while efficient, has made us all a little lonely. We believe in the power of human connections and retail's important role in helping us not only discover new products and services, but feel a little more human. You know, the coffee shop that knows your order before you order. The dry cleaner that knows your number. The salon that asks about your kids by name. We're here to help consumers discover a little more of that. And we won't stop til we reach our goal of <span className="font-semibold text-primary">$1 billion in customer referrals</span> (and even then we probably won't). Our North Star is helping the real world small businesses that believe in our vision and want to grow together with other retailers like them.
    </>
  }];
  return <div className="min-h-screen bg-background">
    {/* Header */}
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </header>

    {/* Main Content */}
    <main className="py-16">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Page Header */}
        <div className="text-center mb-16 space-y-4">
          <Badge variant="secondary" className="px-4 py-2 text-sm font-medium">
            Frequently Asked Questions
          </Badge>
          <h1 className="text-3xl md:text-5xl font-bold text-foreground">
            Everything You Need to Know About
            <span className="gradient-hero bg-clip-text text-transparent"> Media Street</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">Find answers to common questions about our little retail partnership platform, our goals, pricing, and how to get started.</p>
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-4">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map(faq => <AccordionItem key={faq.id} value={faq.id} className="border border-border rounded-lg px-6 bg-card/50">
              <AccordionTrigger className="text-left hover:no-underline py-6">
                <span className="text-lg font-semibold text-foreground pr-4">
                  {faq.question}
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-6 pt-2">
                <p className="text-muted-foreground leading-relaxed">
                  {faq.jsxAnswer || faq.answer}
                </p>
              </AccordionContent>
            </AccordionItem>)}
          </Accordion>
        </div>

        {/* Contact CTA */}
        <div className="mt-16 text-center space-y-6">
          <h2 className="text-2xl font-bold text-foreground">
            Still have questions?
          </h2>
          <p className="text-muted-foreground">
            Our team is here to help you understand how Media Street can grow your business.
          </p>
          <Button variant="default" size="lg" className="gap-2" asChild>
            <a href="mailto:hi@mediastreet.ai">
              <Mail className="h-4 w-4" />
              Contact Support
            </a>
          </Button>
        </div>
      </div>
    </main>
  </div>;
};
export default FAQ;