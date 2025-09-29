import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';


export default function QuizByIdPage() {
  const { id } = useParams<{ id: string }>();
  const [questionIdx, setQuestionIdx] = useState(0);
  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState<{ [qIdx: number]: string }>({});

  const { data: quiz, isPending, error } = useQuery({
    queryKey: ['quiz', id],
    queryFn: async () => {
      const res = await fetch(`http://localhost:4000/quizzes/${id}`, {
        headers: { 'Authorization': 'Bearer dev-token' }
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return res.json();
    },
    enabled: !!id,
  });

  if (isPending) return <div className="text-gray-500">Loading quiz...</div>;
  if (error) return <div className="text-red-600">Failed to fetch quiz: {(error as Error).message}</div>;
  if (!quiz) return <div className="text-red-600">Quiz not found.</div>;

  const questions = quiz.questions || [];
  const current = questions[questionIdx];

  return (
    <div className="max-w-2xl mx-auto p-6 bg-black rounded shadow mt-8 text-white">
      <Link to="/" className="text-blue-400 underline mb-4 inline-block">&larr; Back to all quizzes</Link>
      <h1 className="text-2xl font-bold mb-2">{quiz.title}</h1>
      <p className="mb-4 text-gray-300">{quiz.description}</p>
      {questions.length > 0 && current && (
        <div className="mb-6">
          <div className="mb-2 font-semibold">Question {questionIdx + 1} of {questions.length}</div>
          <div className="mb-2">{current.prompt}</div>
          {current.codeSnippet && (
            <pre className="bg-gray-800 text-xs p-2 rounded mb-2 overflow-x-auto">{current.codeSnippet}</pre>
          )}
          {current.type === 'mcq' && current.options && Array.isArray(current.options) && (
            <div className="mb-2">
              {current.options.map((choice: string, idx: number) => (
                <label key={idx} className="flex items-center gap-2 mb-1">
                  <input
                    type="radio"
                    name={`q${questionIdx}`}
                    value={choice}
                    className="form-radio text-blue-600"
                    checked={answers[questionIdx] === choice}
                    onChange={() => setAnswers(a => ({ ...a, [questionIdx]: choice }))}
                    disabled={questionIdx !== 0 && !started}
                  />
                  <span>{choice}</span>
                </label>
              ))}
            </div>
          )}
          {(current.type === 'short' || current.type === 'code') && (
            <div className="mb-2">
              <input
                type="text"
                className="border rounded px-2 py-1 w-full text-white"
                placeholder="Type your answer"
                name={`q${questionIdx}`}
                value={answers[questionIdx] || ''}
                onChange={e => setAnswers(a => ({ ...a, [questionIdx]: e.target.value }))}
                disabled={questionIdx !== 0 && !started}
              />
              <div className="text-xs text-gray-400 mt-1">Short answer (case-insensitive)</div>
            </div>
          )}
        </div>
      )}
      <div className="flex gap-2">
        <button
          className="px-4 py-2 bg-gray-700 rounded text-white disabled:opacity-50"
          onClick={() => setQuestionIdx(i => i - 1)}
          disabled={questionIdx === 0}
        >
          Previous
        </button>
        <button
          className="px-4 py-2 bg-gray-700 rounded text-white disabled:opacity-50"
          onClick={() => {
            if (questionIdx === 0 && !started) {
              setStarted(true);
            } else if (questionIdx === questions.length - 1) {
              // Submit logic here
              alert('Submitted! Answers: ' + JSON.stringify(answers, null, 2));
              // TODO: send answers to backend, calculate score, etc.
            } else {
              setQuestionIdx(i => i + 1);
            }
          }}
          disabled={questionIdx === questions.length - 1 && started && questions.length > 0}
        >
          {questionIdx === 0 && !started
            ? 'Start'
            : questionIdx === questions.length - 1
              ? 'Submit'
              : 'Next'}
        </button>
  {/* For debugging: show answers */}
  {/* <pre className="text-xs text-gray-400 mt-4">{JSON.stringify(answers, null, 2)}</pre> */}
      </div>
    </div>
  );
}
