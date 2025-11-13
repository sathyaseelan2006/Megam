# 💬 Reviews System - Technical Documentation

## Overview

The Megam reviews system allows users to submit feedback, rate the application, and view reviews from other users globally. All reviews are stored in Supabase and sync in real-time across all connected clients.

## Architecture

```
User Browser
    ↓
ReviewsPanel Component (React)
    ↓
reviewService (Service Layer)
    ↓
Supabase Client
    ↓
Supabase PostgreSQL Database
    ↓
Real-time Subscriptions → All Connected Clients
```

## Files Structure

```
components/
  └── ReviewsPanel.tsx         # UI component for reviews
services/
  └── reviewService.ts         # Business logic and Supabase integration
lib/
  └── supabaseClient.ts        # Supabase client configuration
types.ts                       # TypeScript interfaces (Review type)
```

## Database Schema

```sql
Table: reviews
├── id (UUID, Primary Key)
├── username (TEXT, NOT NULL)
├── comment (TEXT, NOT NULL)
├── rating (INTEGER, 1-5, nullable)
├── location (TEXT, nullable)
└── created_at (TIMESTAMP WITH TIME ZONE)

Indexes:
└── reviews_created_at_idx (DESC)

Policies (RLS enabled):
├── Anyone can read reviews
├── Anyone can insert reviews
└── Anyone can delete reviews
```

## API Methods

### reviewService

```typescript
// Fetch all reviews (sorted by newest first)
await reviewService.getReviews(): Promise<Review[]>

// Add a new review
await reviewService.addReview(
  username: string,
  comment: string,
  rating?: number,
  location?: string
): Promise<Review>

// Delete a review by ID
await reviewService.deleteReview(id: string): Promise<boolean>

// Get total number of reviews
await reviewService.getReviewsCount(): Promise<number>

// Get average rating (0 if no ratings)
await reviewService.getAverageRating(): Promise<number>

// Subscribe to real-time updates
reviewService.subscribeToReviews(
  callback: (reviews: Review[]) => void
): RealtimeChannel

// LocalStorage (username persistence)
reviewService.getStoredUsername(): string | null
reviewService.setStoredUsername(username: string): void
```

## Review Type

```typescript
interface Review {
  id: string;              // UUID from database
  username: string;        // User's name or "Anonymous"
  comment: string;         // Review text (10-500 chars)
  timestamp: number;       // Unix timestamp (milliseconds)
  rating?: number;         // Optional 1-5 star rating
  location?: string;       // Optional location context
}
```

## Component State

```typescript
const [reviews, setReviews] = useState<Review[]>([]);
const [username, setUsername] = useState('');
const [comment, setComment] = useState('');
const [rating, setRating] = useState<number>(0);
const [averageRating, setAverageRating] = useState<number>(0);
const [isSubmitting, setIsSubmitting] = useState(false);
const [error, setError] = useState<string | null>(null);
const [successMessage, setSuccessMessage] = useState<string | null>(null);
```

## Real-time Updates

The system uses Supabase's real-time subscriptions to keep all clients in sync:

```typescript
// Subscribe on mount
useEffect(() => {
  const channel = reviewService.subscribeToReviews((updatedReviews) => {
    setReviews(updatedReviews);
    loadAverageRating();
  });

  return () => {
    channel.unsubscribe();  // Cleanup on unmount
  };
}, []);
```

When any user submits, updates, or deletes a review:
1. Change is saved to Supabase
2. Supabase broadcasts the change to all subscribed clients
3. All connected browsers automatically refresh their review list

## Validation Rules

**Username:**
- Optional (defaults to "Anonymous")
- Stored in localStorage for convenience
- Max 50 characters

**Comment:**
- Required
- Minimum 10 characters
- Maximum 500 characters
- Cannot be empty or whitespace-only

**Rating:**
- Optional
- Must be between 1-5 if provided
- Displayed as stars (⭐)

## Error Handling

```typescript
try {
  await reviewService.addReview(...);
} catch (err) {
  setError(err.message);
  // User sees error in UI
}
```

Common errors:
- Network issues → "Failed to save review. Please check your connection."
- Supabase down → "Failed to save review. Please try again."
- Invalid data → Validation messages

## Performance Considerations

1. **Pagination**: Currently loads all reviews. For >1000 reviews, implement pagination:
   ```typescript
   .range(0, 49)  // Load 50 at a time
   ```

2. **Caching**: Reviews are cached in component state. On mount:
   - Fetch from Supabase once
   - Subscribe to real-time updates
   - Updates are pushed, not polled

3. **Indexes**: Database has index on `created_at DESC` for fast sorting

## Security

**Current Setup:**
- Public read/write access (anyone can submit/delete)
- No authentication required
- Rate limiting handled by Supabase

**Production Recommendations:**
1. Add authentication (Supabase Auth)
2. Limit deletions to review owner only
3. Add server-side rate limiting
4. Add moderation queue for spam
5. Implement upvote/downvote instead of delete

Example RLS policy with auth:
```sql
CREATE POLICY "Users can delete own reviews"
  ON reviews FOR DELETE
  USING (auth.uid() = user_id);
```

## Testing

**Manual Testing:**
1. Open app in two browsers
2. Submit review in browser A
3. Verify it appears immediately in browser B
4. Delete review in browser B
5. Verify it disappears from browser A

**Automated Testing** (TODO):
```typescript
describe('ReviewService', () => {
  it('should add a review', async () => {
    const review = await reviewService.addReview('Test User', 'Great app!', 5);
    expect(review.username).toBe('Test User');
  });
});
```

## Future Enhancements

- [ ] User authentication (Supabase Auth)
- [ ] Review moderation queue
- [ ] Upvote/downvote system
- [ ] Reply to reviews (threaded comments)
- [ ] Image uploads
- [ ] Report inappropriate reviews
- [ ] Sort options (newest, highest rated, etc.)
- [ ] Filter by rating
- [ ] Search reviews
- [ ] Review analytics dashboard

## Environment Variables

Required in production:
```bash
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...
```

## Deployment Checklist

- [x] Supabase project created
- [x] Reviews table created with RLS
- [x] Environment variables set in Vercel
- [x] Dependencies installed (`@supabase/supabase-js`)
- [x] Real-time subscriptions tested
- [x] Error handling implemented
- [x] UI/UX matches app design

## Troubleshooting

**Problem**: Reviews not loading
**Solution**: Check browser console, verify Supabase URL/key

**Problem**: Real-time not working
**Solution**: Ensure Supabase project has real-time enabled (default: on)

**Problem**: Can't delete reviews
**Solution**: Check RLS policies in Supabase dashboard

**Problem**: Slow loading with many reviews
**Solution**: Implement pagination (see Performance section)

---

For setup instructions, see **SUPABASE_SETUP.md**
For deployment guide, see **VERCEL_DEPLOYMENT.md**
