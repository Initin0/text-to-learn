import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import App from './App.jsx';
import { AppAuthProvider } from './context/AuthContext.jsx';
import { CoursesProvider } from './context/CoursesContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Home from './pages/Home.jsx';
import CoursePage from './pages/CoursePage.jsx';
import LessonPage, { LessonByIdPage } from './pages/LessonPage.jsx';
import AuthRedirect from './pages/AuthRedirect.jsx';
import NotFound from './pages/NotFound.jsx';

const guard = (el) => <ProtectedRoute>{el}</ProtectedRoute>;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AppAuthProvider>
        <CoursesProvider>
          <Routes>
            <Route path="/login" element={<AuthRedirect />} />
            <Route path="/signup" element={<AuthRedirect signup />} />
            <Route path="/" element={<App />}>
              <Route index element={<Home />} />
              <Route path="course/:id" element={guard(<CoursePage />)} />
              <Route path="courses/:courseId/module/:moduleIndex/lesson/:lessonIndex" element={guard(<LessonPage />)} />
              <Route path="lesson/:id" element={guard(<LessonByIdPage />)} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </CoursesProvider>
      </AppAuthProvider>
    </BrowserRouter>
  </StrictMode>
);
