import { Review } from '../types';
import { supabase } from '../lib/supabaseClient';

const USERNAME_KEY = 'megam_username';

class ReviewService {
  /**
   * Get all reviews from Supabase (sorted by newest first)
   */
  async getReviews(): Promise<Review[]> {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to load reviews from Supabase:', error);
        return [];
      }

      // Convert Supabase format to our Review type
      return (data || []).map(row => ({
        id: row.id,
        username: row.username,
        comment: row.comment,
        timestamp: new Date(row.created_at).getTime(),
        rating: row.rating || undefined,
        location: row.location || undefined,
      }));
    } catch (error) {
      console.error('Failed to load reviews:', error);
      return [];
    }
  }

  /**
   * Add a new review to Supabase
   */
  async addReview(username: string, comment: string, rating?: number, location?: string): Promise<Review> {
    const reviewData = {
      username: username.trim() || 'Anonymous',
      comment: comment.trim(),
      rating: rating || null,
      location: location || null,
    };

    try {
      const { data, error } = await supabase
        .from('reviews')
        .insert([reviewData])
        .select()
        .single();

      if (error) {
        console.error('Failed to save review to Supabase:', error);
        throw new Error('Failed to save review. Please try again.');
      }

      // Save username for future use
      if (username.trim()) {
        this.setStoredUsername(username.trim());
      }

      // Convert to our Review type
      return {
        id: data.id,
        username: data.username,
        comment: data.comment,
        timestamp: new Date(data.created_at).getTime(),
        rating: data.rating || undefined,
        location: data.location || undefined,
      };
    } catch (error) {
      console.error('Failed to save review:', error);
      throw new Error('Failed to save review. Please check your connection.');
    }
  }

  /**
   * Delete a review by ID from Supabase
   */
  async deleteReview(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Failed to delete review from Supabase:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to delete review:', error);
      return false;
    }
  }

  /**
   * Get stored username from localStorage
   */
  getStoredUsername(): string | null {
    return localStorage.getItem(USERNAME_KEY);
  }

  /**
   * Store username for future use in localStorage
   */
  setStoredUsername(username: string): void {
    localStorage.setItem(USERNAME_KEY, username);
  }

  /**
   * Get reviews count from Supabase
   */
  async getReviewsCount(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error('Failed to get reviews count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Failed to get reviews count:', error);
      return 0;
    }
  }

  /**
   * Get average rating from Supabase
   */
  async getAverageRating(): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('rating')
        .not('rating', 'is', null);

      if (error || !data || data.length === 0) {
        return 0;
      }

      const sum = data.reduce((acc, row) => acc + (row.rating || 0), 0);
      return sum / data.length;
    } catch (error) {
      console.error('Failed to get average rating:', error);
      return 0;
    }
  }

  /**
   * Subscribe to real-time review updates
   */
  subscribeToReviews(callback: (reviews: Review[]) => void) {
    const channel = supabase
      .channel('reviews-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reviews',
        },
        async () => {
          // Reload reviews when any change occurs
          const reviews = await this.getReviews();
          callback(reviews);
        }
      )
      .subscribe();

    return channel;
  }
}

export const reviewService = new ReviewService();
