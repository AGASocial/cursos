import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Clock, Users, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';

interface CourseCardProps {
  id: string;
  title: string;
  instructor: string;
  thumbnail: string;
  duration: string;
  enrolledCount: number;
  price: number;
  isEnrolled?: boolean;
}

export const CourseCard: React.FC<CourseCardProps> = ({
  id,
  title,
  instructor,
  thumbnail,
  duration,
  enrolledCount,
  price,
  isEnrolled = false,
}) => {
  return (
    <div className="group overflow-hidden rounded-lg border bg-white shadow-sm transition-all hover:shadow-md">
      <Link to={isEnrolled ? `/courses/${id}/learn` : `/courses/${id}`}>
        <div className="aspect-video w-full overflow-hidden">
          <img
            src={thumbnail}
            alt={title}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        </div>
      </Link>
      <div className="p-4">
        <Link to={isEnrolled ? `/courses/${id}/learn` : `/courses/${id}`}>
          <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600">{title}</h3>
          <p className="mt-1 text-sm text-gray-500">por {instructor}</p>
        </Link>
        
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>{duration}</span> 
            </div>
            <div className="flex items-center space-x-1">
              <Users className="h-4 w-4" />
              <span>{enrolledCount} <FormattedMessage id="course.enrolled" /></span>
            </div>
          </div>
          {isEnrolled ? (
            <Link to={`/courses/${id}/learn`}>
              <Button className="flex items-center space-x-1">
                <Play className="h-4 w-4" />
                <span><FormattedMessage id="course.view" /></span>
              </Button>
            </Link>
          ) : (
            <span className="text-lg font-bold text-blue-600">${price}</span>
          )}
        </div>
      </div>
    </div>
  );
};