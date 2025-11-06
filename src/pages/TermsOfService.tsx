import Footer from "@/components/Footer";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto prose prose-slate dark:prose-invert">
          <h1 className="text-4xl font-bold mb-8">Terms of Use</h1>
          
          <p>Welcome to our website <a href="http://offerave.com">http://offerave.com</a> (the "Website" or "Site") and our mobile application Offer Ave (the "App") owned and operated by Media Street, Inc., a Delaware corporation, hereafter referred to in these Terms of Use as "Media Street", "us", "our" or "we". Unless otherwise specified, all references to our services (the "Service") include the content, services and products available through the Offer Ave Website and App, as well as any software that Media Street provides to you that allows you to access the Services though the Website and App. The term "user", "you" or "your" refers to the user of our Website or App and our Service, including visitors that do not register for an account. The following Terms of Use are a legally binding contract between you and Media Street regarding your use of the Website, the App and our Services.</p>

          <p>Please read the following Terms of Use ("Terms" or "Agreement") carefully before accessing or using any of the Services. When you visit or use our Website or App, access or use our Services, or purchase something through our Services, you, and if you are acting on behalf of a third party, such third party, agree to be bound by these Terms of Use and our Privacy Policy. If you do not agree to be bound by all of these Terms, you may not access or use our Service. Media Street may change this Agreement at any time by posting an updated Terms of Use on this Website. If any amendment to these Terms is unacceptable to you, you shall cease using the Website or App, otherwise you will be constructively deemed to have accepted the changes.</p>

          <p>In addition, certain areas of the Service may be subject to additional Terms and Conditions that we have made available for your review. By using such areas, or any part thereof, you are expressly indicating that you have read and agree to be bound by the additional Terms and Conditions applicable to such areas. In the event that any of the additional Terms and Conditions governing such area conflict with these Terms, the additional Terms and Condition will control.</p>

          <p><strong>PLEASE READ THE BINDING ARBITRATION CLAUSE AND CLASS ACTION WAIVER PROVISIONS IN THE DISPUTE RESOLUTION SECTION OF THESE TERMS. IT AFFECTS HOW DISPUTES ARE RESOLVED. BY ENTERING INTO THIS AGREEMENT, YOU EXPRESSLY ACKNOWLEDGE THAT YOU UNDERSTAND THIS AGREEMENT, INCLUDING THE DISPUTE RESOLUTION, ARBITRATION PROVISIONS AND CLASS ACTION WAIVER AND ACCEPT ALL OF THE TERMS. YOU MAY NOT USE OR ACCESS OUR PLATFORM IF YOU DO NOT AGREE TO BE BOUND BY THE TERMS AND CONDITIONS OF THIS AGREEMENT.</strong></p>

          <h2>1. Eligibility for Our Service</h2>
          <p><strong>a.</strong> By using our Services, you represent and warrant that you have attained the age of majority where you reside (18 years of age in most jurisdictions) and are otherwise capable of entering into binding contracts including this Agreement.</p>
          <p><strong>b.</strong> We reserve the right to request documented proof of your compliance with these terms of eligibility.</p>
          <p><strong>c.</strong> If you are using our Services on behalf of a company or other organization, you represent and warrant that you have received authority to act on behalf of that entity and to bind that entity to this Agreement.</p>

          <h2>2. Our Service</h2>
          <p><strong>a.</strong> Media Street is a platform that lets a brand advertiser ("Advertiser") place ads on a physical retailer's ("Retailer") point-of-sale system ("POS") in exchange for payment per impressions, clicks, referrals or otherwise. The Advertiser can create the advertisement using the AI tools made available by Media Street, set a budget and then make it available to either certain retail niches, or to all Media Street Retailers. Retailers can select the advertisements they wish to host on their POS system. Payments are made by the Advertiser to the Retailer using Stripe. Media Street collects a technology fee for providing its Services.</p>
          <p><strong>b.</strong> The software, content, Services and products available in, or through our Website and App are for your personal use only. You may not sell or resell any of content, Services, software or products we provide to you or which you otherwise receive from us.</p>
          <p><strong>c.</strong> Any modifications and new features added to the Service are also subject to this Agreement.</p>
          <p><strong>d.</strong> Media Street reserves the right to modify or discontinue the Service or any feature or functionality thereof at any time without notice to you. All rights, title and interest in and to the Service and its components (including without limitation all intellectual property rights to content created using our Service) will remain with and belong exclusively to Media Street.</p>

          <h2>3. Accounts and Registration</h2>
          <p><strong>a.</strong> To access features of the Service users will be required to register for an account. When you register for an account, you will be required to provide us with some information about yourself including, but not limited to, your name, date of birth, e-mail address, business name, business title and physical address.</p>
          <p><strong>b.</strong> If you provide Your Information to us then you agree to provide true, current, complete and accurate information, and not to misrepresent your identity. You also agree to keep Your Information current and to update Your Information if any of Your Information changes.</p>
          <p><strong>c.</strong> Our collection, use and disclosure of Your Information is governed by this Agreement and our Privacy Policy which you may access <a href="/privacy-policy">here</a>.</p>

          <h2>4. Account Management</h2>
          <p><strong>a.</strong> If you have been issued an account by Media Street in connection with your use of the Services, you are responsible for safeguarding your password and any other credentials used to access that account, even if you authorize other parties to access your account. You, and not Media Street, are responsible for any activity occurring in your account, whether or not you authorized that activity. If you become aware of any unauthorized access to your account, you should notify Media Street immediately.</p>
          <p><strong>b.</strong> As a function of providing our Services Media Street may send text messages to your mobile phone or notices to the email address registered with your account. You must keep your email address, mobile phone number and, where applicable, your contact details associated with your account current and accurate. Text message costs may apply and are the user's responsibility, not that of Media Street.</p>
          <p><strong>c.</strong> We reserve the right to modify, suspend or terminate the Service, any user account or your access to the Service for any reason, without notice, at any time, and without liability to you.</p>
          <p><strong>d.</strong> You can cancel your account at anytime. Upon termination or cancellation, all licenses and other rights granted to you in these Terms will immediately cease.</p>
          <p><strong>e.</strong> We reserve the right to refuse to issue an account to anyone or permit access to the Service to anyone for any reason at any time.</p>

          <h2>5. Your License, Access and Use of our Services</h2>
          <p><strong>a.</strong> Subject to your continued compliance with this Agreement, Media Street grants you, a limited, non-exclusive, revocable, non-sub-licensable, worldwide, license to access and use the Offer Ave Website, App and Services solely for your personal use. Any other use is expressly prohibited. This license is revocable at any time without notice and with or without cause.</p>

          {/* ... continuing with more content sections ... */}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TermsOfService;