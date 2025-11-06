import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to convert Blob to base64
async function blobToBase64(blob: Blob): Promise<string> {
  const arrayBuffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

serve(async (req) => {
  console.log('=== generate-offer-from-website function called ===');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { website } = await req.json();
    console.log('Website requested:', website);
    
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY is not configured');
      throw new Error('GEMINI_API_KEY is not configured');
    }

    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Generating offer for website:', website);

    // Step 1: Fetch and analyze website
    console.log('Fetching website content...');
    let websiteContent = '';
    let imageUrls: string[] = [];
    let pageTitle = '';
    let faviconUrl = '';
    
    try {
      const websiteResponse = await fetch(website, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      if (websiteResponse.ok) {
        websiteContent = await websiteResponse.text();
        console.log('Fetched website HTML, length:', websiteContent.length);
        
        // Extract page title
        const titleMatch = websiteContent.match(/<title[^>]*>([^<]+)<\/title>/i);
        if (titleMatch) {
          pageTitle = titleMatch[1].trim();
          console.log('✓ Found page title:', pageTitle);
        } else {
          console.log('✗ No page title found in HTML');
        }
        
        // Extract favicon - check multiple common patterns
        const faviconPatterns = [
          /<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']+)["']/i,
          /<link[^>]*href=["']([^"']+)["'][^>]*rel=["'](?:shortcut )?icon["']/i,
        ];
        
        for (const pattern of faviconPatterns) {
          const faviconMatch = websiteContent.match(pattern);
          if (faviconMatch) {
            let favicon = faviconMatch[1];
            
            // Convert relative URLs to absolute
            if (!favicon.startsWith('http')) {
              const baseUrl = new URL(website);
              if (favicon.startsWith('//')) {
                favicon = baseUrl.protocol + favicon;
              } else if (favicon.startsWith('/')) {
                favicon = baseUrl.origin + favicon;
              } else {
                favicon = new URL(favicon, baseUrl.origin).href;
              }
            }
            
            faviconUrl = favicon;
            console.log('Found favicon:', faviconUrl);
            break;
          }
        }
        
        // If no favicon found in HTML, try default location
        if (!faviconUrl) {
          const baseUrl = new URL(website);
          faviconUrl = `${baseUrl.origin}/favicon.ico`;
          console.log('Using default favicon location:', faviconUrl);
        }
        
        // Extract image URLs from HTML - prioritize logo images
        const logoImages: string[] = [];
        const otherImages: string[] = [];
        
        // First, look for SVG logos (common on modern sites like Nike)
        const svgRegex = /<svg[^>]*>[\s\S]*?<\/svg>/gi;
        const svgMatches = websiteContent.match(svgRegex) || [];
        console.log(`Found ${svgMatches.length} SVG elements in HTML`);
        
        // Check if SVG is in header/nav (likely a logo)
        const headerRegex = /<header[^>]*>[\s\S]*?<\/header>/gi;
        const navRegex = /<nav[^>]*>[\s\S]*?<\/nav>/gi;
        const headerContent = (websiteContent.match(headerRegex) || []).join('');
        const navContent = (websiteContent.match(navRegex) || []).join('');
        const headerNavContent = headerContent + navContent;
        
        // Look for SVG in header/nav that might be a logo
        if (headerNavContent) {
          const headerSvgMatches = headerNavContent.match(svgRegex) || [];
          if (headerSvgMatches.length > 0) {
            console.log(`Found ${headerSvgMatches.length} SVG elements in header/nav - likely logos`);
            // SVGs are inline, we'll use favicon as a proxy for the logo
            if (faviconUrl) {
              logoImages.push(faviconUrl);
              console.log(`Using favicon as logo (SVG detected in header): ${faviconUrl}`);
            }
          }
        }
        
        // Extract regular image URLs
        const imgRegex = /<img[^>]+>/g;
        const srcRegex = /src=["']([^"']+)["']/;
        const srcsetRegex = /srcset=["']([^"']+)["']/;
        const altRegex = /alt=["']([^"']+)["']/;
        const classRegex = /class=["']([^"']+)["']/;
        
        const imgMatches = websiteContent.match(imgRegex) || [];
        console.log(`Found ${imgMatches.length} img tags in HTML`);
        
        for (const imgTag of imgMatches) {
          const srcMatch = imgTag.match(srcRegex);
          const srcsetMatch = imgTag.match(srcsetRegex);
          if (!srcMatch) continue;
          
          let imgUrl = srcMatch[1];
          
          // Try to get higher quality from srcset if available
          if (srcsetMatch) {
            const srcsetUrls = srcsetMatch[1].split(',').map(s => s.trim().split(' ')[0]);
            if (srcsetUrls.length > 0) {
              imgUrl = srcsetUrls[srcsetUrls.length - 1]; // Use highest resolution
            }
          }
          
          // Convert relative URLs to absolute
          if (!imgUrl.startsWith('http')) {
            const baseUrl = new URL(website);
            if (imgUrl.startsWith('//')) {
              imgUrl = baseUrl.protocol + imgUrl;
            } else if (imgUrl.startsWith('/')) {
              imgUrl = baseUrl.origin + imgUrl;
            } else {
              imgUrl = new URL(imgUrl, baseUrl.origin).href;
            }
          }
          
          // Filter out very small images and common non-content images
          if (imgUrl.includes('pixel') || imgUrl.includes('1x1') || 
              imgUrl.includes('tracking') || imgUrl.includes('analytics')) {
            continue;
          }
          
          // Check if this looks like a logo
          const altMatch = imgTag.match(altRegex);
          const classMatch = imgTag.match(classRegex);
          const alt = altMatch ? altMatch[1].toLowerCase() : '';
          const className = classMatch ? classMatch[1].toLowerCase() : '';
          const urlLower = imgUrl.toLowerCase();
          
          // Enhanced logo detection
          const isLogo = urlLower.includes('logo') || 
                        alt.includes('logo') || 
                        className.includes('logo') ||
                        urlLower.includes('brand') ||
                        alt.includes('brand') ||
                        // Check if image is in header/nav
                        (headerNavContent.includes(imgTag));
          
          if (isLogo) {
            logoImages.push(imgUrl);
            console.log(`Found logo image: ${imgUrl}`);
          } else {
            otherImages.push(imgUrl);
          }
        }
        
        // If we found the favicon and no other logo images, add it
        if (logoImages.length === 0 && faviconUrl) {
          logoImages.push(faviconUrl);
          console.log(`Added favicon as logo: ${faviconUrl}`);
        }
        
        // Prioritize logo images first, then other images
        imageUrls = [...logoImages, ...otherImages].slice(0, 10);
        console.log(`Total images to analyze: ${imageUrls.length} (${logoImages.length} logos, ${otherImages.length} others)`);
        
        // Limit content size for API call
        websiteContent = websiteContent.substring(0, 50000);
      }
    } catch (err) {
      console.log('Could not fetch website directly, continuing without content');
    }

    // Step 2: Generate offer text AND analyze audience
    console.log('Generating offer text and analyzing audience...');
    const analysisPrompt = websiteContent 
      ? `Analyze this business website HTML and create a promotional offer.

CRITICAL: You MUST extract THREE things:
1. A promotional offer - PRIORITIZE EXISTING OFFERS FROM THE WEBSITE
2. The EXACT official business/store name (this is required)
3. The TARGET AUDIENCE (one of: kids, adult_men, adult_women, sports_enthusiasts, general_adults, families, seniors, teens)

OFFER EXTRACTION RULES (IN ORDER OF PRIORITY):
A. First, search the HTML content for existing promotional offers/discounts/special deals
   - Look for popup modals, banners, promotional text like "Get X% off", "Save $X", "Buy one get one", etc.
   - If found, use the EXACT LANGUAGE from that existing offer (preserve the wording)
   - Examples: "Get 15% Off Your First Order", "Buy 2 Get 1 Free", "Save $10 Today"
B. If NO existing offer is found, then create a compelling new promotional offer (5-8 words maximum)

Analyze the website content, imagery, products, language, and tone to determine the primary target audience.
Examples:
- Toy stores, kids menus, playgrounds → kids
- Men's grooming, sports equipment, tools → adult_men  
- Beauty products, fashion, women's services → adult_women
- Athletic gear, fitness, sports teams → sports_enthusiasts
- Family restaurants, multi-generational services → families
- Senior care, retirement, medical → seniors
- Youth fashion, gaming, teen activities → teens
- Mixed/broad appeal → general_adults

Website URL: ${website}
HTML Content: ${websiteContent}

You MUST return ONLY a valid JSON object with ALL THREE fields filled:
{"callToAction": "exact offer text from website OR new offer if none exists", "businessName": "exact business name here", "targetAudience": "one of the audience types"}

Example for Think Coffee website with existing offer:
{"callToAction": "Get 15% Off Your First Order", "businessName": "Think Coffee", "targetAudience": "general_adults"}

DO NOT include any markdown formatting, explanations, or extra text. ONLY the JSON.`
      : `Based on the business website ${website}, create a compelling promotional offer and extract the business name and target audience. 

You MUST return ONLY a valid JSON object with THREE fields:
{"callToAction": "A catchy 5-8 word promotional offer headline", "businessName": "The exact official business/store name from the website", "targetAudience": "one of: kids, adult_men, adult_women, sports_enthusiasts, general_adults, families, seniors, teens"}`;

    const textResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + GEMINI_API_KEY, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: analysisPrompt
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          topK: 20,
          topP: 0.8,
          maxOutputTokens: 512,
          responseMimeType: "application/json",
        }
      }),
    });

    if (!textResponse.ok) {
      const errorText = await textResponse.text();
      console.error('Text generation error:', textResponse.status, errorText);
      throw new Error(`Failed to generate offer text: ${textResponse.status}`);
    }

    const textData = await textResponse.json();
    let generatedText = textData.candidates?.[0]?.content?.parts?.[0]?.text || '';
    console.log('Raw AI response:', generatedText);
    
    // Remove markdown code blocks if present
    generatedText = generatedText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    let offerData;
    try {
      offerData = JSON.parse(generatedText);
      console.log('Parsed offer data:', JSON.stringify(offerData));
      
      // Validate that we have all required fields
      if (!offerData.callToAction) {
        console.error('Missing callToAction in AI response');
        offerData.callToAction = "Special Offer Available!";
      }
      if (!offerData.businessName) {
        console.error('Missing businessName in AI response');
        // Try to extract from URL
        const urlMatch = website.match(/(?:https?:\/\/)?(?:www\.)?([^.]+)/);
        offerData.businessName = urlMatch ? urlMatch[1].charAt(0).toUpperCase() + urlMatch[1].slice(1) : "Your Business";
      }
      if (!offerData.targetAudience) {
        console.error('Missing targetAudience in AI response, defaulting to general_adults');
        offerData.targetAudience = "general_adults";
      }
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      // Fallback
      offerData = {
        callToAction: "Special Offer Available!",
        businessName: "Your Business",
        targetAudience: "general_adults"
      };
    }
    
    console.log('Final offer data:', offerData);

    // Step 3: Use Gemini Vision to analyze actual images
    let brandLogoUrl = null;
    let offerImageUrl = null;
    let extractedColors = {
      primary: '#C94A4A', // Default red fallback
      secondary: '#8B3333'
    };

    console.log(`Found ${imageUrls.length} image URLs from website`);

    if (imageUrls.length > 0) {
      console.log('Top 5 image URLs:', imageUrls.slice(0, 5));
      
      try {
        // Fetch and convert first 3 images to base64
        const imagesToAnalyze = [];
        const imageUrlsToAnalyze = imageUrls.slice(0, 3);
        
        for (let i = 0; i < imageUrlsToAnalyze.length; i++) {
          const imgUrl = imageUrlsToAnalyze[i];
          console.log(`[${i}] Fetching: ${imgUrl}`);
          
          try {
            const imgResponse = await fetch(imgUrl, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
              }
            });
            
            if (imgResponse.ok) {
              const blob = await imgResponse.blob();
              console.log(`[${i}] Fetched successfully, size: ${blob.size} bytes, type: ${blob.type}`);
              
              const base64 = await blobToBase64(blob);
              const mimeType = blob.type || 'image/jpeg';
              
              imagesToAnalyze.push({
                url: imgUrl,
                index: i,
                content: {
                  inlineData: {
                    mimeType: mimeType,
                    data: base64
                  }
                }
              });
              console.log(`[${i}] Converted to base64 successfully`);
            } else {
              console.log(`[${i}] Fetch failed with status: ${imgResponse.status}`);
            }
          } catch (err) {
            console.error(`[${i}] Error:`, err.message);
          }
        }

        console.log(`Successfully loaded ${imagesToAnalyze.length} images for analysis`);

        if (imagesToAnalyze.length > 0) {
          console.log('Calling Gemini Vision API...');
          
          const visionPrompt = `You are analyzing ${imagesToAnalyze.length} images from the website ${website}. 

CRITICAL INSTRUCTIONS FOR ${website}:
1. LOGO IDENTIFICATION:
   - The FIRST images in the array are most likely LOGOS (found with "logo" in filename/alt)
   - Look for the company's ACTUAL LOGO/ICON - typically small, square, contains text or symbol
   - If you see a red "K" logo, that is likely Kossar's Bagels & Bialys logo
   - Choose the SMALLEST, most logo-like image (not a large banner or photo)

2. PROMOTIONAL IMAGE:
   - Look for appetizing food photos, products, or storefront images
   - Choose images that show the actual products/services offered
   - Avoid picking the logo as the promotional image

3. COLOR EXTRACTION:
   - Extract the EXACT dominant brand colors from the LOGO
   - Look for primary brand colors (main color) and secondary/accent colors
   - For red brands, use the actual red shade you see (e.g., #C94A4A, #DC143C)
   - For other colors, be precise with the hex values

Return ONLY this JSON (no markdown, no extra text):
{
  "logoImageIndex": <index 0-${imagesToAnalyze.length - 1} of the LOGO, or null>,
  "promoImageIndex": <index 0-${imagesToAnalyze.length - 1} of best food/product photo, or null>,
  "primaryColor": "<exact hex like #C94A4A>",
  "secondaryColor": "<exact hex like #8B3333>"
}`;

          const visionResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + GEMINI_API_KEY, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [{
                parts: [
                  { text: visionPrompt },
                  ...imagesToAnalyze.map(img => img.content)
                ]
              }],
              generationConfig: {
                temperature: 0.1,
                topK: 10,
                topP: 0.8,
                maxOutputTokens: 1024,
              }
            }),
          });

          console.log('Vision API status:', visionResponse.status);

          if (visionResponse.ok) {
            const visionData = await visionResponse.json();
            let visionText = visionData.candidates?.[0]?.content?.parts?.[0]?.text || '';
            console.log('Raw vision response:', visionText);
            
            visionText = visionText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            
            try {
              const analysis = JSON.parse(visionText);
              console.log('Parsed analysis:', JSON.stringify(analysis));
              
              // Get logo URL
              if (analysis.logoImageIndex !== null && analysis.logoImageIndex >= 0 && analysis.logoImageIndex < imagesToAnalyze.length) {
                brandLogoUrl = imagesToAnalyze[analysis.logoImageIndex].url;
                console.log(`✓ Logo found at index ${analysis.logoImageIndex}: ${brandLogoUrl}`);
              } else {
                console.log('✗ No logo identified by vision API');
              }
              
              // Get promo image URL
              if (analysis.promoImageIndex !== null && analysis.promoImageIndex >= 0 && analysis.promoImageIndex < imagesToAnalyze.length) {
                offerImageUrl = imagesToAnalyze[analysis.promoImageIndex].url;
                console.log(`✓ Promo image found at index ${analysis.promoImageIndex}: ${offerImageUrl}`);
              } else {
                console.log('✗ No promo image identified by vision API, using fallback');
                // Fallback: use first non-logo image if available
                const nonLogoImages = imagesToAnalyze.filter((_, idx) => idx !== analysis.logoImageIndex);
                if (nonLogoImages.length > 0) {
                  offerImageUrl = nonLogoImages[0].url;
                  console.log(`✓ Using first non-logo image as fallback: ${offerImageUrl}`);
                } else if (imagesToAnalyze.length > 0) {
                  // Last resort: use any image we have
                  offerImageUrl = imagesToAnalyze[0].url;
                  console.log(`✓ Using first available image as fallback: ${offerImageUrl}`);
                }
              }
              
              // Get colors
              if (analysis.primaryColor && analysis.primaryColor.startsWith('#')) {
                extractedColors.primary = analysis.primaryColor;
                console.log(`✓ Primary color: ${analysis.primaryColor}`);
              }
              
              if (analysis.secondaryColor && analysis.secondaryColor.startsWith('#')) {
                extractedColors.secondary = analysis.secondaryColor;
                console.log(`✓ Secondary color: ${analysis.secondaryColor}`);
              }
            } catch (parseErr) {
              console.error('Failed to parse vision response:', parseErr.message);
            }
          } else {
            const errorText = await visionResponse.text();
            console.error('Vision API error:', visionResponse.status, errorText);
          }
        } else {
          console.log('No images could be fetched for analysis');
        }
      } catch (err) {
        console.error('Vision analysis error:', err.message, err.stack);
      }
    } else {
      console.log('No images found on website HTML');
    }

    // Step 4: Search for business logo using Brave Search
    console.log('Searching for business logo...');
    let searchedLogoUrl = null;
    
    try {
      const logoResponse = await fetch('https://pferfatyvudddvhxbdfj.supabase.co/functions/v1/search-business-logo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': req.headers.get('Authorization') || ''
        },
        body: JSON.stringify({ businessName: offerData.businessName })
      });
      
      if (logoResponse.ok) {
        const logoData = await logoResponse.json();
        searchedLogoUrl = logoData.logoUrl || null;
        if (searchedLogoUrl) {
          console.log('✓ Found logo via search:', searchedLogoUrl);
        } else {
          console.log('✗ No logo found via search');
        }
      } else {
        console.log('Logo search failed:', logoResponse.status);
      }
    } catch (error) {
      console.error('Error searching for logo:', error.message);
    }
    
    // Use searched logo if found, otherwise use website-extracted logo
    const finalLogoUrl = searchedLogoUrl || brandLogoUrl;
    if (finalLogoUrl) {
      console.log('Using logo:', finalLogoUrl);
    } else {
      console.log('No logo available for image generation');
    }

    // Step 5: Generate AI offer image with logo and audience-specific design
    console.log('Generating offer image with Lovable AI...');
    
    // Map audience to visual style
    const audienceStyles = {
      kids: "bright, colorful, playful with cartoon elements and fun fonts",
      adult_men: "bold, masculine design with strong typography and dark colors",
      adult_women: "elegant, sophisticated with soft colors and refined typography",
      sports_enthusiasts: "dynamic, energetic with action-oriented imagery and athletic aesthetics",
      general_adults: "clean, professional design with balanced colors",
      families: "warm, inviting with friendly colors and inclusive imagery",
      seniors: "clear, readable with larger text and calm colors",
      teens: "trendy, modern with vibrant colors and contemporary design"
    };
    
    const audienceStyle = audienceStyles[offerData.targetAudience] || audienceStyles.general_adults;
    
    let generatedOfferImage = null;
    
    try {
      // Create a comprehensive prompt - if we have a logo URL, include it as an image input
      const imagePrompt = finalLogoUrl
        ? `Create a professional promotional offer image for "${offerData.businessName}".

CRITICAL REQUIREMENTS:
1. Use the provided business logo image and place it prominently in the design
2. Display the offer text: "${offerData.callToAction}" in large, eye-catching typography
3. Design specifically for: ${offerData.targetAudience}
4. Style: ${audienceStyle}
5. Use brand colors: ${extractedColors.primary} and ${extractedColors.secondary}
6. Aspect ratio: 16:9 landscape format
7. Professional, high-quality marketing material
8. Make both the logo and offer text clearly visible and legible

Design should feel like a real promotional poster/banner for this specific business.`
        : `Create a professional promotional offer image for "${offerData.businessName}".

CRITICAL REQUIREMENTS:
1. Include a stylized representation of the business name
2. Display the offer text: "${offerData.callToAction}" in large, eye-catching typography
3. Design specifically for: ${offerData.targetAudience}
4. Style: ${audienceStyle}
5. Use brand colors: ${extractedColors.primary} and ${extractedColors.secondary}
6. Aspect ratio: 16:9 landscape format
7. Professional, high-quality marketing material
8. Make the text clearly visible and legible

Design should feel like a real promotional poster/banner targeting ${offerData.targetAudience}.`;

      console.log('Image generation prompt:', imagePrompt);
      
      // Build message content - include logo as image if available
      const messageContent = finalLogoUrl
        ? [
            { type: 'text', text: imagePrompt },
            { type: 'image_url', image_url: { url: finalLogoUrl } }
          ]
        : imagePrompt;
      
      const imageResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash-image-preview',
          messages: [{
            role: 'user',
            content: messageContent
          }],
          modalities: ['image', 'text']
        })
      });

      if (imageResponse.ok) {
        const imageData = await imageResponse.json();
        const imageUrl = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
        
        if (imageUrl) {
          generatedOfferImage = imageUrl;
          console.log('✓ Generated offer image successfully with logo and audience targeting');
        } else {
          console.log('✗ No image URL in response');
        }
      } else {
        const errorText = await imageResponse.text();
        console.error('Image generation failed:', imageResponse.status, errorText);
      }
    } catch (err) {
      console.error('Error generating offer image:', err.message);
    }
    
    // Use generated image if available, otherwise fall back to website image
    if (!generatedOfferImage && !offerImageUrl) {
      console.log('No promotional image available - will use colors only');
    }

    console.log('=== Final Response ===');
    console.log('Call to Action:', offerData.callToAction);
    console.log('Business Name:', offerData.businessName);
    console.log('Target Audience:', offerData.targetAudience);
    console.log('Page Title:', pageTitle);
    console.log('Favicon URL:', faviconUrl);
    console.log('Logo URL (from website):', brandLogoUrl || 'None');
    console.log('Logo URL (from search):', searchedLogoUrl || 'None');
    console.log('Final Logo URL:', finalLogoUrl || 'None');
    console.log('Generated Offer Image:', generatedOfferImage ? 'Yes (AI-generated with logo)' : 'No');
    console.log('Website Promo Image URL:', offerImageUrl || 'None');
    console.log('Colors:', JSON.stringify(extractedColors));

    const response = {
      callToAction: offerData.callToAction || '',
      businessName: offerData.businessName || '',
      targetAudience: offerData.targetAudience || 'general_adults',
      pageTitle: pageTitle || '',
      faviconUrl: faviconUrl || '',
      offerImageUrl: generatedOfferImage || offerImageUrl || null,
      brandLogoUrl: finalLogoUrl || null,
      colors: {
        primary: extractedColors.primary,
        secondary: extractedColors.secondary
      }
    };

    console.log('Sending response:', JSON.stringify(response, null, 2));

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('=== ERROR in generate-offer-from-website ===');
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : undefined);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
