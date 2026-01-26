const PartnershipEmailPreview = () => {
  const recipientFirstName = "Marco";
  const senderStoreName = "Kris's Coffee Shop";
  const senderOfferTitle = "20% Off Any Drink";

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Partnership Request</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
      <div style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); padding: 40px 30px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">New Partnership Request 🤝</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 12px 0 0 0; font-size: 16px;">A local retailer wants to partner with you!</p>
      </div>
      
      <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
        <p style="font-size: 18px; margin-bottom: 20px;">Hi ${recipientFirstName},</p>
        
        <p style="font-size: 16px; margin-bottom: 20px; color: #374151;">
          Great news! <strong>${senderStoreName}</strong> wants to partner with you on Media Street.
        </p>

        <div style="background: linear-gradient(135deg, #f3e8ff 0%, #ede9fe 100%); border-radius: 12px; padding: 24px; margin: 24px 0; border-left: 4px solid #7c3aed;">
          <h2 style="color: #7c3aed; margin: 0 0 12px 0; font-size: 18px;">📋 Their Offer</h2>
          <p style="font-size: 20px; color: #1f2937; margin: 0; font-weight: 600;">${senderOfferTitle}</p>
          <p style="font-size: 14px; color: #6b7280; margin: 8px 0 0 0;">from ${senderStoreName}</p>
        </div>

        <div style="background: #fef3c7; border-radius: 12px; padding: 20px; margin: 24px 0; border-left: 4px solid #f59e0b;">
          <h3 style="color: #92400e; margin: 0 0 8px 0; font-size: 16px;">⏰ Action Required</h3>
          <p style="font-size: 14px; color: #78350f; margin: 0;">
            Review this request and respond to start cross-promoting each other's offers to your customers.
          </p>
        </div>

        <h3 style="color: #1f2937; font-size: 16px; margin: 28px 0 16px 0;">What happens when you accept:</h3>
        
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="vertical-align: top; padding: 8px 0;">
              <div style="background: #10b981; color: white; width: 28px; height: 28px; border-radius: 50%; display: inline-block; text-align: center; line-height: 28px; font-weight: 600; font-size: 14px;">✓</div>
            </td>
            <td style="vertical-align: top; padding: 8px 0 8px 12px;">
              <strong style="color: #1f2937;">Your offer appears at their location</strong>
              <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 14px;">Their customers will see your offer when they scan their in-store QR code.</p>
            </td>
          </tr>
          <tr>
            <td style="vertical-align: top; padding: 8px 0;">
              <div style="background: #10b981; color: white; width: 28px; height: 28px; border-radius: 50%; display: inline-block; text-align: center; line-height: 28px; font-weight: 600; font-size: 14px;">✓</div>
            </td>
            <td style="vertical-align: top; padding: 8px 0 8px 12px;">
              <strong style="color: #1f2937;">Their offer appears at your location</strong>
              <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 14px;">Your customers will discover their offer when they scan your in-store QR code.</p>
            </td>
          </tr>
          <tr>
            <td style="vertical-align: top; padding: 8px 0;">
              <div style="background: #10b981; color: white; width: 28px; height: 28px; border-radius: 50%; display: inline-block; text-align: center; line-height: 28px; font-weight: 600; font-size: 14px;">✓</div>
            </td>
            <td style="vertical-align: top; padding: 8px 0 8px 12px;">
              <strong style="color: #1f2937;">Grow your business together</strong>
              <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 14px;">Track progress in partner analytics including views, redemptions and ROI.</p>
            </td>
          </tr>
        </table>

        <div style="text-align: center; margin: 32px 0;">
          <a href="https://mediastreet.ai/requests" style="display: inline-flex; align-items: center; gap: 8px; background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px rgba(124, 58, 237, 0.4);"><img src="https://id-preview--7417b409-b50a-4042-a9e5-d06838a12331.lovable.app/media-street-logo.png" alt="" style="height: 24px; width: 24px; object-fit: contain;" />Review and Approve Partnership Request</a>
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
          <h2 className="text-lg font-semibold text-gray-700">📧 Email Preview: Partnership Request</h2>
          <p className="text-sm text-gray-500">Subject: 🤝 Kris's Coffee Shop wants to partner with you!</p>
        </div>
        <div 
          className="shadow-xl rounded-lg overflow-hidden"
          dangerouslySetInnerHTML={{ __html: emailHtml }} 
        />
      </div>
    </div>
  );
};

export default PartnershipEmailPreview;
