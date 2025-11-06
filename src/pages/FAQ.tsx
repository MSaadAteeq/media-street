import { Badge } from "@/components/ui/badge";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail } from "lucide-react";
import { Link } from "react-router-dom";

const FAQ = () => {
  const faqs = [
    {
      id: "what-is-mediastreet",
      question: "What is Media Street?",
      answer: "Media Street is a retail referral network that connects local businesses through cross-promotional QR codes. We help businesses partner with each other to drive foot traffic and increase customer acquisition through strategic partnerships.",
    },
    {
      id: "how-it-works",
      question: "How does the partnership system work?",
      answer: "Media Street is the easiest way to build out partnerships with other local businesses. Partnered businesses share each other's promotion on the post-purchase page of their point-of-sale. When customers scan qr codes, they go to the partner's website, get directions to their location and even get special offers from the partner business. Media Street tracks impressions, scans and redemptions so you can see which partnerships are working to drive customer wins. This creates a win-win situation where local businesses can grow together!",
    },
    {
      id: "pricing-model",
      question: "How much does Media Street cost?",
      answer: "Media Street charges a flat $10 per month for each active partnership. Your first partnership is completely free, and there are no setup fees or long-term contracts. You only pay for partnerships that are actively driving results.",
    },
    {
      id: "getting-started",
      question: "How do I get started?",
      answer: "Simply request an invite through our platform. We'll help you set up your account, create your first promotional offer, and connect you with compatible partner businesses in your area. The entire setup process takes less than 5 minutes and your first partnership's on us.",
    },
    {
      id: "partner-matching",
      question: "How do you match businesses for partnerships?",
      answer: "Our AI-powered system analyzes your business type, location, customer demographics, and preferences to suggest ideal partner businesses. We focus on complementary businesses that share similar customer bases, but aren't direct competitors. Ultimately, the decision to partner is completely up to you as you'll send and respond to partner requests from other businesses unless you've engaged our programmatic service to place optimized partnerships for you.",
    },
    {
      id: "qr-placement",
      question: "Where should I place partner QR codes?",
      answer: "You don't have to. That's the beauty of it. Our platform runs completely over point-of-sale showing post-purchase partner promos when two businesses are partnered.",
    },
    {
      id: "tracking-results",
      question: "How do I track partnership performance?",
      answer: "Our real-time analytics dashboard shows you scan rates, customer conversions, foot traffic generated, and partnership ROI. You can monitor performance daily and make data-driven decisions about your partnerships.",
    },
    {
      id: "campaign-limits",
      question: "How many partnerships can I have?",
      answer: "You can run up to 5 active campaigns simultaneously. This allows you to test different partnerships and find the most effective combinations for your business while keeping management simple.",
    },
    {
      id: "cancellation",
      question: "Can I cancel anytime?",
      answer: "Yes, there are no long-term contracts. You can cancel active partnerships at any time, but please keep in mind the canceling party will not receive a refund.",
    },
    {
      id: "partnership-duration",
      question: "How long do partnerships run for?",
      answer: "All partnerships on Media Street run for one month from inception. Once completed, you can evaluate results and request the partnership again if it's working for you.",
    },
    {
      id: "business-types",
      question: "What types of businesses work best?",
      answer: "Media Street works great for retail stores, restaurants, cafes, salons, fitness centers, and service businesses with physical locations. Any business that benefits from foot traffic and has complementary (not competing) neighbors can succeed.",
    },
    {
      id: "support",
      question: "What kind of support do you provide?",
      answer: "We provide onboarding assistance and regular support for any platform-related questions.",
    },
    {
      id: "minimum-commitment",
      question: "Is there a minimum time commitment?",
      answer: "No minimum commitment required. Since your first partnership is free, you can test the system risk-free. After that, you pay monthly for active partnerships and can adjust or cancel at any time based on your results.",
    }
  ];

  return (
    <div className="min-h-screen bg-background">
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
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Find answers to common questions about our retail partnership platform, pricing, and how to get started.
            </p>
          </div>

          {/* FAQ Accordion */}
          <div className="space-y-4">
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq) => (
                <AccordionItem
                  key={faq.id}
                  value={faq.id}
                  className="border border-border rounded-lg px-6 bg-card/50"
                >
                  <AccordionTrigger className="text-left hover:no-underline py-6">
                    <span className="text-lg font-semibold text-foreground pr-4">
                      {faq.question}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-6 pt-2">
                    <p className="text-muted-foreground leading-relaxed">
                      {faq.answer}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              ))}
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
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="default" size="lg" className="gap-2" asChild>
                <a href="mailto:hi@mediastreet.ai">
                  <Mail className="h-4 w-4" />
                  Contact Support
                </a>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/">
                  Request Invite
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default FAQ;