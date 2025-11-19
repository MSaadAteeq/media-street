# Backend Endpoints Implementation Guide

This document lists all the backend endpoints that need to be implemented for the frontend to work correctly.

## Required Endpoints

### 1. Partnership-Eligible Offers Endpoint (PUBLIC - HIGH PRIORITY)

**Endpoint:** `GET /api/v1/offers/partnership-eligible`

**Description:** Returns all offers from all users that are available for partnership (not open offers, active, and available for partnership).

**Authentication:** None (Public endpoint)

**Response Format:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "offer_id",
      "callToAction": "20% off on all items",
      "call_to_action": "20% off on all items",
      "isOpenOffer": false,
      "is_open_offer": false,
      "isActive": true,
      "is_active": true,
      "availableForPartnership": true,
      "available_for_partnership": true,
      "locationIds": [
        {
          "_id": "location_id",
          "name": "Store Name",
          "address": "123 Main St",
          "latitude": 40.7128,
          "longitude": -74.0060
        }
      ],
      "userId": {
        "_id": "user_id",
        "fullName": "John Doe",
        "email": "john@example.com"
      },
      "createdAt": "2024-01-01T00:00:00.000Z",
      "expiresAt": "2024-12-31T23:59:59.000Z"
    }
  ]
}
```

**Implementation Example (Node.js/Express):**

```javascript
// backend/src/routes/offer.routes.js
import express from 'express';
import { getPartnershipEligibleOffers } from '../controllers/offer.controller.js';

const router = express.Router();

// Public route - no authentication required
router.get('/partnership-eligible', getPartnershipEligibleOffers);

export default router;
```

```javascript
// backend/src/controllers/offer.controller.js
import { Offer } from '../models/index.js';

export const getPartnershipEligibleOffers = async (req, res, next) => {
  try {
    const offers = await Offer.find({ 
      isOpenOffer: false,           // Not open offers
      isActive: true,                // Active offers only
      availableForPartnership: true, // Available for partnership
      expiresAt: { $gt: new Date() } // Not expired
    })
    .populate('locationIds', 'name address latitude longitude retailChannel')
    .populate('userId', 'fullName email')
    .sort({ createdAt: -1 });
    
    // Format offers data consistently for frontend
    const formattedOffers = offers.map(offer => {
      // Safely handle populated user data
      let userData = null;
      if (offer.userId && typeof offer.userId === 'object' && offer.userId._id) {
        userData = {
          id: offer.userId._id,
          fullName: offer.userId.fullName || '',
          email: offer.userId.email || ''
        };
      }

      // Safely handle locationIds - could be array of objects or ObjectIds
      const locations = Array.isArray(offer.locationIds) 
        ? offer.locationIds.map(loc => {
            if (loc && typeof loc === 'object' && loc._id) {
              // It's a populated location object
              return {
                id: loc._id,
                _id: loc._id,
                name: loc.name || '',
                address: loc.address || '',
                latitude: loc.latitude || null,
                longitude: loc.longitude || null,
                retailChannel: loc.retailChannel || ''
              };
            }
            return loc; // Return as is if it's just an ObjectId
          })
        : [];

      return {
        id: offer._id,
        _id: offer._id,
        callToAction: offer.callToAction || '',
        call_to_action: offer.callToAction || '',
        isOpenOffer: offer.isOpenOffer || false,
        is_open_offer: offer.isOpenOffer || false,
        locationIds: offer.locationIds || [],
        locations: locations,
        expirationDuration: offer.expirationDuration || '',
        redemptionCode: offer.redemptionCode || null,
        isActive: offer.isActive !== undefined ? offer.isActive : true,
        is_active: offer.isActive !== undefined ? offer.isActive : true,
        availableForPartnership: offer.availableForPartnership !== undefined ? offer.availableForPartnership : true,
        available_for_partnership: offer.availableForPartnership !== undefined ? offer.availableForPartnership : true,
        userId: offer.userId?._id || offer.userId || null,
        user: userData,
        expiresAt: offer.expiresAt || null,
        createdAt: offer.createdAt || null,
        created_at: offer.createdAt || null
      };
    });
    
    res.json({
      success: true,
      data: formattedOffers || []
    });
  } catch (error) {
    next(error);
  }
};
```

**Important Notes:**
- This endpoint MUST be public (no authentication required) so that all users can see partnership-eligible offers from other retailers
- Make sure to populate `locationIds` and `userId` so frontend has all necessary data
- Filter out expired offers
- Return both camelCase and snake_case versions of fields for frontend compatibility

---

### 2. Partner Requests Endpoints

#### 2.1. Get Partner Requests
**Endpoint:** `GET /api/v1/partners/requests`
**Authentication:** Required
**Description:** Returns all partner requests (incoming and outgoing) for the current user

#### 2.2. Send Partner Request
**Endpoint:** `POST /api/v1/partners/requests`
**Authentication:** Required
**Body:**
```json
{
  "recipient_id": "user_id",
  "location_id": "location_id",
  "promo_code": "optional_promo_code"
}
```

#### 2.3. Approve Partner Request
**Endpoint:** `PATCH /api/v1/partners/approve/:requestId`
**Authentication:** Required
**Body:**
```json
{
  "promo_code": "optional_promo_code"
}
```

#### 2.4. Reject Partner Request
**Endpoint:** `PATCH /api/v1/partners/reject/:requestId`
**Authentication:** Required

#### 2.5. Cancel Partnership
**Endpoint:** `PATCH /api/v1/partners/cancel/:requestId`
**Authentication:** Required

#### 2.6. Subscribe to Open Offer
**Endpoint:** `POST /api/v1/partners/subscribe-open-offer`
**Authentication:** Required
**Body:**
```json
{
  "offer_id": "offer_id"
}
```

---

### 3. Current User Endpoint

**Endpoint:** `GET /api/v1/users/me`
**Authentication:** Required
**Description:** Returns current authenticated user's information

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "user_id",
    "id": "user_id",
    "email": "user@example.com",
    "fullName": "John Doe",
    "role": "retailer"
  }
}
```

---

## Testing

After implementing these endpoints, test them using:

1. **Partnership-Eligible Offers:**
   ```bash
   curl http://localhost:3000/api/v1/offers/partnership-eligible
   ```

2. **Partner Requests (with auth token):**
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/v1/partners/requests
   ```

---

## Priority Order

1. **HIGH PRIORITY:** `/offers/partnership-eligible` - Required for partner search map to work
2. **MEDIUM PRIORITY:** Partner request endpoints - Required for partnership functionality
3. **LOW PRIORITY:** Other endpoints - Already implemented or can be added later

---

## Notes

- All endpoints should return consistent response format: `{ success: boolean, data: any, message?: string }`
- Use proper error handling and return appropriate HTTP status codes
- Make sure to populate related data (locations, users) for frontend consumption
- Support both camelCase and snake_case field names for backward compatibility

