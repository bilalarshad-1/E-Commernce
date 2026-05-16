// components/common/Rating.jsx
import React from 'react';
import { FiStar } from 'react-icons/fi';

const Rating = ({ rating, totalReviews, size = 'sm', showCount = true }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
    xl: 'h-6 w-6',
  };

  const starClass = sizeClasses[size] || sizeClasses.md;

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5">
        {[...Array(fullStars)].map((_, i) => (
          <FiStar
            key={`full-${i}`}
            className={`${starClass} fill-yellow-400 text-yellow-400`}
          />
        ))}
        {hasHalfStar && (
          <div className="relative">
            <FiStar className={`${starClass} text-gray-300`} />
            <div className="absolute inset-0 overflow-hidden w-1/2">
              <FiStar className={`${starClass} fill-yellow-400 text-yellow-400`} />
            </div>
          </div>
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <FiStar
            key={`empty-${i}`}
            className={`${starClass} text-gray-300`}
          />
        ))}
      </div>
      {showCount && totalReviews !== undefined && (
        <span className="text-sm text-gray-500">({totalReviews})</span>
      )}
    </div>
  );
};

export default Rating;