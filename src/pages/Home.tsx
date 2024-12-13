import React from 'react';
import { GraduationCap, BookOpen, Users, Star, ChevronRight } from 'lucide-react';
import { FormattedMessage } from 'react-intl';
import { Button } from '../components/ui/Button';
import { useNavigate } from "react-router-dom";

export const Home = () => {
  const navigate = useNavigate();
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="relative isolate overflow-hidden bg-gradient-to-b from-indigo-100/20">
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
          <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" style={{clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)'}}></div>
        </div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="py-24 sm:py-32">
            <div className="text-center">
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
                <FormattedMessage id="home.hero.title" />
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-600">
                <FormattedMessage id="home.hero.subtitle" />
              </p>
              <div className="mt-10 flex items-center justify-center gap-x-6">
                <Button size="lg" onClick={() => navigate("/courses")} className="rounded-full">
                  <FormattedMessage id="home.hero.cta" /> <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            <div className="text-center">
              <div className="text-4xl font-bold text-indigo-600">1000+</div>
              <div className="mt-2 text-gray-600"><FormattedMessage id="home.stats.students" /></div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-indigo-600">100+</div>
              <div className="mt-2 text-gray-600"><FormattedMessage id="home.stats.instructors" /></div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-indigo-600">500+</div>
              <div className="mt-2 text-gray-600"><FormattedMessage id="home.stats.courses" /></div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-gray-50 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              <FormattedMessage id="home.features.title" />
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              <FormattedMessage id="home.features.subtitle" />
            </p>
          </div>
          <div className="grid grid-cols-1 gap-12 sm:grid-cols-3">
            <div className="relative p-8 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="pt-4">
                <h3 className="mt-6 text-lg font-semibold text-gray-900">
                  <FormattedMessage id="home.features.experts.title" />
                </h3>
                <p className="mt-2 text-gray-600">
                  <FormattedMessage id="home.features.experts.description" />
                </p>
              </div>
            </div>
            <div className="relative p-8 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="pt-4">
                <h3 className="mt-6 text-lg font-semibold text-gray-900">
                  <FormattedMessage id="home.features.content.title" />
                </h3>
                <p className="mt-2 text-gray-600">
                  <FormattedMessage id="home.features.content.description" />
                </p>
              </div>
            </div>
            <div className="relative p-8 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600">
                  <Users className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="pt-4">
                <h3 className="mt-6 text-lg font-semibold text-gray-900">
                  <FormattedMessage id="home.features.community.title" />
                </h3>
                <p className="mt-2 text-gray-600">
                  <FormattedMessage id="home.features.community.description" />
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              <FormattedMessage id="home.testimonials.title" />
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              <FormattedMessage id="home.testimonials.subtitle" />
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-50 p-6 rounded-2xl">
                <div className="flex gap-1 text-yellow-400 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="h-5 w-5 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4">"The courses here have been instrumental in advancing my career. The instructors are knowledgeable and supportive."</p>
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-indigo-600"></div>
                  <div>
                    <div className="font-semibold text-gray-900">Student Name</div>
                    <div className="text-sm text-gray-600">Web Development</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-indigo-600">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-16">
            <div className="max-w-xl">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                <FormattedMessage id="home.cta.title" />
              </h2>
              <p className="mt-4 text-lg text-indigo-100">
                <FormattedMessage id="home.cta.subtitle" />
              </p>
            </div>
            <div className="flex items-center justify-center lg:justify-end">
              <Button 
                size="lg" 
                onClick={() => navigate("/register")}
                className="rounded-full bg-white text-indigo-600 hover:bg-indigo-50"
              >
                <FormattedMessage id="home.cta.button" /> <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};