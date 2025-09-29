import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Index from '.';
import QuizCreate from './quizCreate';
import QuizById from './QuizById';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/quiz/create" element={<QuizCreate />} />
      <Route path="/quiz/:id" element={<QuizById />} />
    </Routes>
  );
}
