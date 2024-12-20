import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { Home } from './pages/Home';
import { Courses } from './pages/Courses';
import { CourseDetails } from './pages/CourseDetails';
import { ViewCourse } from './pages/ViewCourse';
import { Register } from './pages/Register';
import { Login } from './pages/Login';
import { ForgotPassword } from './pages/ForgotPassword';
import { Admin } from './pages/Admin';
import { AdminCourseForm } from './pages/AdminCourseForm';
import { Checkout } from './pages/Checkout';
import { EditChapter } from './pages/EditChapter';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './i18n/LanguageContext';
import { CartProvider } from './contexts/CartContext';
import { PrivateRoute } from './components/auth/PrivateRoute';
import { PrivateAdminRoute } from './components/auth/PrivateAdminRoute';
import { Profile } from './pages/Profile';
import { Orders } from './pages/Orders';
import { CourseParticipants } from './pages/CourseParticipants';

export default function App() {
  return (
    <LanguageProvider>
      <Router>
        <AuthProvider>
          <CartProvider>
          <Routes>
            <Route
              path="/"
              element={
                <div className="min-h-screen bg-gray-50 flex flex-col">
                  <Navbar />
                  <div className="flex-grow">
                    <Home />
                  </div>
                  <Footer />
                </div>
              }
            />
            <Route
              path="/courses"
              element={
                <div className="min-h-screen bg-gray-50 flex flex-col">
                  <Navbar />
                  <div className="flex-grow">
                    <Courses />
                  </div>
                  <Footer />
                </div>
              }
            />
            <Route
              path="/courses/:courseSlug"
              element={
                <div className="min-h-screen bg-gray-50 flex flex-col">
                  <Navbar />
                  <div className="flex-grow">
                    <CourseDetails />
                  </div>
                  <Footer />
                </div>
              }
            />
            <Route
              path="/courses/:courseSlug/learn"
              element={
                <div className="min-h-screen bg-gray-50 flex flex-col">
                  <Navbar />
                  <div className="flex-grow">
                    <PrivateRoute>
                      <ViewCourse />
                    </PrivateRoute>
                  </div>
                  <Footer />
                </div>
              }
            />
            <Route path="/signup" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/orders" element={<Orders />} />
            <Route
              path="/admin"
              element={
                <div className="min-h-screen bg-gray-50 flex flex-col">
                  <Navbar />
                  <PrivateAdminRoute>
                    <Admin />
                  </PrivateAdminRoute>
                  <Footer />
                </div>
              }
            />
            <Route
              path="/admin/courses/new"
              element={
                <div className="min-h-screen bg-gray-50 flex flex-col">
                  <Navbar />
                  <PrivateAdminRoute>
                    <AdminCourseForm />
                  </PrivateAdminRoute>
                  <Footer />
                </div>
              }
            />
            <Route
              path="/admin/courses/:courseId/edit"
              element={
                <div className="min-h-screen bg-gray-50 flex flex-col">
                  <Navbar />
                  <PrivateAdminRoute>
                    <AdminCourseForm />
                  </PrivateAdminRoute>
                  <Footer />
                </div>
              }
            />
            <Route
              path="/admin/courses/:courseId/participants"
              element={
                <div className="min-h-screen bg-gray-50 flex flex-col">
                  <Navbar />
                  <PrivateAdminRoute>
                    <CourseParticipants />
                  </PrivateAdminRoute>
                  <Footer />
                </div>
              }
            />
            <Route
              path="/admin/courses/:courseId/chapters/:chapterId?"
              element={
                <div className="min-h-screen bg-gray-50 flex flex-col">
                  <Navbar />
                  <PrivateAdminRoute>
                    <EditChapter />
                  </PrivateAdminRoute>
                  <Footer />
                </div>
              }
            />
            <Route
              path="/checkout"
              element={
                <div className="min-h-screen bg-gray-50 flex flex-col">
                  <Navbar />
                  <div className="flex-grow">
                    <PrivateRoute>
                      <Checkout />
                    </PrivateRoute>
                  </div>
                  <Footer />
                </div>
              }
            />
            {/* Payment Routes */}
            <Route
                path="/payment/process"
                element={
                  <div className="min-h-screen bg-gray-50 flex flex-col">
                    <Navbar />
                    <div className="flex-grow">
                      <PrivateRoute>
                        <PaymentProcess />
                      </PrivateRoute>
                    </div>
                    <Footer />
                  </div>
                }
              />
              <Route
                path="/return"
                element={
                  <div className="min-h-screen bg-gray-50 flex flex-col">
                    <Navbar />
                    <div className="flex-grow">
                      <PrivateRoute>
                        <Return />
                      </PrivateRoute>
                    </div>
                    <Footer />
                  </div>
                }
              />
              <Route
                path="/payment/success/:courseId"
                element={
                  <div className="min-h-screen bg-gray-50 flex flex-col">
                    <Navbar />
                    <div className="flex-grow">
                      <PrivateRoute>
                        <PaymentSuccess />
                      </PrivateRoute>
                    </div>
                    <Footer />
                  </div>
                }
              />
              <Route
                path="/payment/failed/:courseId"
                element={
                  <div className="min-h-screen bg-gray-50 flex flex-col">
                    <Navbar />
                    <div className="flex-grow">
                      <PrivateRoute>
                        <PaymentFailed />
                      </PrivateRoute>
                    </div>
                    <Footer />
                  </div>
                }
              />
          </Routes>
        </CartProvider>
        </AuthProvider>
      </Router>
    </LanguageProvider>
  );
}