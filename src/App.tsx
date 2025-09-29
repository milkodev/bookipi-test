import React from 'react';
import { Routes, Route } from 'react-router-dom';
import QuizForm from './QuizForm';
import IndexPage from './IndexPage';
import QuizByIdPage from './QuizByIdPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<IndexPage />} />
      <Route path="/create-quiz" element={<QuizForm />} />
      <Route path="/quiz/:id" element={<QuizByIdPage />} />
    </Routes>
  );
}
