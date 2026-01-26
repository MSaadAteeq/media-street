const EmailPreview = () => {
  const firstName = "Marco";
  const storeName = "Marco's Flowers";

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to Media Street</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
      <div style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); padding: 40px 30px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">Welcome to Media Street! 🎉</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 12px 0 0 0; font-size: 16px;">Your real world referral network awaits</p>
      </div>
      
      <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
        <p style="font-size: 18px; margin-bottom: 20px;">Hi ${firstName},</p>
        
        <p style="font-size: 16px; margin-bottom: 20px; color: #374151;">
          Welcome aboard! We're thrilled to have <strong>${storeName}</strong> join the Media Street network of local retailers helping each other grow.
        </p>

        <div style="background: linear-gradient(135deg, #f3e8ff 0%, #ede9fe 100%); border-radius: 12px; padding: 24px; margin: 24px 0; border-left: 4px solid #7c3aed;">
          <h2 style="color: #7c3aed; margin: 0 0 16px 0; font-size: 18px;">🎁 Your $50 Welcome Bonus</h2>
          <p style="font-size: 15px; color: #4b5563; margin: 0;">
            You've received <strong style="color: #7c3aed;">$50 in promo credits</strong> to get started! These credits are applied automatically as discounts to future charges.
          </p>
        </div>

        <h3 style="color: #1f2937; font-size: 16px; margin: 28px 0 16px 0;">Here's how to get the most out of Media Street:</h3>
        
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="vertical-align: top; padding: 8px 0;">
              <div style="background: #7c3aed; color: white; width: 28px; height: 28px; border-radius: 50%; display: inline-block; text-align: center; line-height: 28px; font-weight: 600; font-size: 14px;">1</div>
            </td>
            <td style="vertical-align: top; padding: 8px 0 8px 12px;">
              <strong style="color: #1f2937;">Create Your Offer</strong>
              <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 14px;">Design a compelling and catchy offer that entices new customers to give you a try.</p>
            </td>
          </tr>
          <tr>
            <td style="vertical-align: top; padding: 8px 0;">
              <div style="background: #7c3aed; color: white; width: 28px; height: 28px; border-radius: 50%; display: inline-block; text-align: center; line-height: 28px; font-weight: 600; font-size: 14px;">2</div>
            </td>
            <td style="vertical-align: top; padding: 8px 0 8px 12px;">
              <strong style="color: #1f2937;">Turn On Open Offer</strong>
              <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 14px;">Let AI do the work of putting your offer in nearby non-competing retailers.</p>
            </td>
          </tr>
          <tr>
            <td style="vertical-align: top; padding: 8px 0;">
              <div style="background: #7c3aed; color: white; width: 28px; height: 28px; border-radius: 50%; display: inline-block; text-align: center; line-height: 28px; font-weight: 600; font-size: 14px;">3</div>
            </td>
            <td style="vertical-align: top; padding: 8px 0 8px 12px;">
              <strong style="color: #1f2937;">Display Your QR Code</strong>
              <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 14px;">Place your QR sticker in your store to show partner offers and earn credits.</p>
            </td>
          </tr>
          <tr>
            <td style="vertical-align: top; padding: 8px 0;">
              <div style="background: #7c3aed; color: white; width: 28px; height: 28px; border-radius: 50%; display: inline-block; text-align: center; line-height: 28px; font-weight: 600; font-size: 14px;">4</div>
            </td>
            <td style="vertical-align: top; padding: 8px 0 8px 12px;">
              <strong style="color: #1f2937;">Explore Partnerships</strong>
              <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 14px;">Connect with other local businesses for quick and easy cross-promotions.</p>
            </td>
          </tr>
        </table>

        <div style="text-align: center; margin: 32px 0;">
          <a href="https://mediastreet.ai/dashboard" style="display: inline-flex; align-items: center; gap: 8px; background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px rgba(124, 58, 237, 0.4);"><img src="https://id-preview--7417b409-b50a-4042-a9e5-d06838a12331.lovable.app/media-street-logo.png" alt="" style="height: 24px; width: 24px; object-fit: contain;" />Go to Your Dashboard</a>
        </div>

        <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 24px 0; text-align: center;">
          <p style="font-size: 14px; color: #6b7280; margin: 0 0 8px 0;">Need a QR sticker for your store?</p>
          <a href="https://mediastreet.ai/locations" style="color: #7c3aed; font-weight: 600; text-decoration: none;">Request your free glossy sticker →</a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        
        <p style="font-size: 14px; color: #6b7280; text-align: center; margin-bottom: 16px;">
          Questions? We're here to help!<br>
          Reply to this email or reach us at <a href="mailto:hi@mediastreet.ai" style="color: #7c3aed;">hi@mediastreet.ai</a>
        </p>
        
        <p style="font-size: 12px; color: #9ca3af; text-align: center;">
          <a href="https://mediastreet.ai/settings?tab=notifications" style="color: #7c3aed;">Manage email preferences</a>
        </p>
      </div>
    </body>
    </html>
  `;

  return (
    <div className="min-h-screen bg-gray-200 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-4 mb-4">
          <h2 className="text-lg font-semibold text-gray-700">📧 Email Preview: Welcome to Media Street</h2>
          <p className="text-sm text-gray-500">Subject: Welcome to Media Street! 🎉 Your $50 bonus is ready</p>
        </div>
        <div 
          className="shadow-xl rounded-lg overflow-hidden"
          dangerouslySetInnerHTML={{ __html: emailHtml }} 
        />
      </div>
    </div>
  );
};

export default EmailPreview;
