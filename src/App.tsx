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
import { Admin } from './pages/Admin';
import { AdminCourseForm } from './pages/AdminCourseForm';
import { Checkout } from './pages/Checkout';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { PrivateRoute } from './components/auth/PrivateRoute';

export default function App() {
  return (
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
                    <PrivateRoute>
                      <Courses />
                    </PrivateRoute>
                  </div>
                  <Footer />
                </div>
              }
            />
            <Route
              path="/courses/:courseId"
              element={
                <div className="min-h-screen bg-gray-50 flex flex-col">
                  <Navbar />
                  <div className="flex-grow">
                    <PrivateRoute>
                      <CourseDetails />
                    </PrivateRoute>
                  </div>
                  <Footer />
                </div>
              }
            />
            <Route
              path="/courses/:courseId/learn"
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
            <Route
              path="/admin"
              element={
                <div className="min-h-screen bg-gray-50 flex flex-col">
                  <Navbar />
                  <div className="flex-grow">
                    <Admin />
                  </div>
                  <Footer />
                </div>
              }
            />
            <Route
              path="/admin/courses/new"
              element={
                <div className="min-h-screen bg-gray-50 flex flex-col">
                  <Navbar />
                  <div className="flex-grow">
                    <AdminCourseForm />
                  </div>
                  <Footer />
                </div>
              }
            />
            <Route
              path="/admin/courses/:courseId/edit"
              element={
                <div className="min-h-screen bg-gray-50 flex flex-col">
                  <Navbar />
                  <div className="flex-grow">
                    <AdminCourseForm />
                  </div>
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
          </Routes>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}