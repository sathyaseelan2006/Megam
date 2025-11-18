import React, { useState, useEffect } from 'react';
import { Review } from '../types';
import { reviewService } from '../services/reviewService';
import { format } from 'date-fns';

interface ReviewsPanelProps {
  onClose: () => void;
}

const ReviewsPanel: React.FC<ReviewsPanelProps> = ({ onClose }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [username, setUsername] = useState('');
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [averageRating, setAverageRating] = useState<number>(0);

  useEffect(() => {
    // Load reviews and stored username
    loadReviews();
    loadAverageRating();
    const storedUsername = reviewService.getStoredUsername();
    if (storedUsername) {
      setUsername(storedUsername);
    }

    // Subscribe to real-time updates
    const channel = reviewService.subscribeToReviews((updatedReviews) => {
      setReviews(updatedReviews);
      loadAverageRating();
    });

    // Cleanup subscription on unmount
    return () => {
      channel.unsubscribe();
    };
  }, []);

  const loadReviews = async () => {
    const loadedReviews = await reviewService.getReviews();
    setReviews(loadedReviews);
  };

  const loadAverageRating = async () => {
    const avgRating = await reviewService.getAverageRating();
    setAverageRating(avgRating);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!comment.trim()) {
      setError('Please enter a comment');
      return;
    }

    if (comment.trim().length < 10) {
      setError('Comment must be at least 10 characters');
      return;
    }

    setIsSubmitting(true);

    try {
      await reviewService.addReview(
        username || 'Anonymous',
        comment,
        rating || undefined
      );

      // Reset form
      setComment('');
      setRating(0);
      setSuccessMessage('Thank you for your feedback!');
      
      // Reload reviews
      await loadReviews();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };



  const renderStars = (currentRating: number, isInteractive: boolean = false) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!isInteractive}
            onClick={() => isInteractive && setRating(star)}
            onMouseEnter={() => isInteractive && setHoveredRating(star)}
            onMouseLeave={() => isInteractive && setHoveredRating(0)}
            className={`text-xl transition-all ${
              isInteractive ? 'cursor-pointer hover:scale-110' : 'cursor-default'
            }`}
          >
            {star <= (isInteractive ? (hoveredRating || rating) : currentRating) ? '⭐' : '☆'}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-[480px] bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl border-l border-cyan-500/30 shadow-2xl z-30 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-600/20 to-blue-600/20 border-b border-cyan-500/30 p-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <span className="text-3xl">💬</span>
            <div>
              <h2 className="text-2xl font-bold text-white">Reviews & Feedback</h2>
              <p className="text-sm text-gray-300">
                {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
                {averageRating > 0 && ` · ${averageRating.toFixed(1)} ⭐ average`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
            aria-label="Close reviews panel"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Submit Form */}
        <div className="bg-slate-800/50 rounded-xl p-5 border border-cyan-500/20">
          <h3 className="text-lg font-semibold text-white mb-4">Share Your Feedback</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                Your Name (optional)
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Anonymous"
                maxLength={50}
                className="w-full px-4 py-2 bg-slate-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Rating (optional)
              </label>
              {renderStars(rating, true)}
            </div>

            {/* Comment */}
            <div>
              <label htmlFor="comment" className="block text-sm font-medium text-gray-300 mb-2">
                Your Feedback *
              </label>
              <textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your thoughts about Megam..."
                rows={4}
                maxLength={500}
                required
                className="w-full px-4 py-2 bg-slate-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all resize-none"
              />
              <p className="text-xs text-gray-400 mt-1">
                {comment.length}/500 characters
              </p>
            </div>

            {/* Messages */}
            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
                {error}
              </div>
            )}
            {successMessage && (
              <div className="p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-green-200 text-sm">
                {successMessage}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-cyan-500/50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </form>
        </div>

        {/* Reviews List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <span>📝</span>
            Recent Feedback
          </h3>

          {reviews.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-4xl mb-3">💭</p>
              <p className="text-lg">No reviews yet</p>
              <p className="text-sm mt-2">Be the first to share your feedback!</p>
            </div>
          ) : (
            reviews.map((review) => (
              <div
                key={review.id}
                className="bg-slate-800/30 rounded-lg p-4 border border-gray-700/50 hover:border-cyan-500/30 transition-all"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-white">
                        {review.username}
                      </span>
                      {review.rating && review.rating > 0 && (
                        <div className="flex text-sm">
                          {renderStars(review.rating, false)}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">
                      {format(new Date(review.timestamp), 'MMM d, yyyy · h:mm a')}
                    </p>
                  </div>
                </div>

                {/* Comment */}
                <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                  {review.comment}
                </p>

                {/* Location (if any) */}
                {review.location && (
                  <p className="text-xs text-gray-500 mt-2">
                    📍 {review.location}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-slate-900/80 border-t border-gray-700 p-4 text-center">
        <p className="text-xs text-gray-400">
          Your feedback helps us improve Megam 🌍
        </p>
      </div>
    </div>
  );
};

export default ReviewsPanel;
