// Supabase removed - will use Node.js API

interface Offer {
  id: string;
  location_id: string;
  [key: string]: any;
}

interface EngagementScore {
  offer_id: string;
  score: number;
}

/**
 * Fetches engagement scores for offers at a specific location
 * @param locationId - The location to check engagement for
 * @param displayType - 'carousel' (prioritizes scans) or 'qr' (prioritizes views)
 */
export const getOfferEngagementScores = async (
  locationId: string,
  displayType: 'carousel' | 'qr' = 'carousel'
): Promise<Map<string, number>> => {
  try {
    // Table doesn't exist yet, return empty map
    // Once migration is run, this will fetch actual engagement data
    return new Map();
  } catch (error) {
    console.error('Error in getOfferEngagementScores:', error);
    return new Map();
  }
};

/**
 * Sorts offers by engagement score, prioritizing offers from locations with higher engagement
 * @param offers - Array of offers to sort
 * @param locationId - Current location viewing the offers
 * @param displayType - 'carousel' or 'qr'
 */
export const prioritizeOffersByEngagement = async <T extends Offer>(
  offers: T[],
  locationId: string,
  displayType: 'carousel' | 'qr' = 'carousel'
): Promise<T[]> => {
  if (!offers || offers.length === 0) return offers;

  try {
    // Get engagement scores for this location
    const engagementScores = await getOfferEngagementScores(locationId, displayType);

    // Sort offers by engagement score (highest first), then by creation date
    const sortedOffers = [...offers].sort((a, b) => {
      const scoreA = engagementScores.get(a.id) || 0;
      const scoreB = engagementScores.get(b.id) || 0;

      // If scores are different, sort by score
      if (scoreA !== scoreB) {
        return scoreB - scoreA;
      }

      // If scores are equal, maintain original order or sort by date if available
      return 0;
    });

    return sortedOffers;
  } catch (error) {
    console.error('Error prioritizing offers:', error);
    return offers;
  }
};

/**
 * Records a view event for an offer
 * @param locationId - Location where the offer was viewed
 * @param offerId - Offer that was viewed
 */
export const trackOfferView = async (locationId: string, offerId: string): Promise<void> => {
  // Disabled until migration is run
  return;
};

/**
 * Records a scan event for an offer (when user interacts/redeems)
 * @param locationId - Location where the offer was scanned
 * @param offerId - Offer that was scanned
 */
export const trackOfferScan = async (locationId: string, offerId: string): Promise<void> => {
  // Disabled until migration is run
  return;
};
