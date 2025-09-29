import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

export default function QuizById() {
  const { id } = useParams<{ id: string }>();
  const [questionIdx, setQuestionIdx] = useState(0);
  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState<{ [qIdx: number]: number | string }>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [submitResult, setSubmitResult] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [antiCheatSummary, setAntiCheatSummary] = useState<{ tabSwitches: number; pastes: number } | null>(null);

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

  useEffect(() => {
    if (started && quiz?.timeLimitSeconds && timeLeft === null) {
      setTimeLeft(quiz.timeLimitSeconds);
    }
    if (started && attemptId === null && quiz?.id) {
      fetch('http://localhost:4000/attempts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer dev-token',
        },
        body: JSON.stringify({ quizId: quiz.id }),
      })
        .then(res => res.json())
        .then(data => {
          setAttemptId(data.id);
        });
    }
  }, [started, quiz?.timeLimitSeconds, quiz?.id]);

  useEffect(() => {
    if (submitResult) {
      setTimeLeft(null);
      return;
    }
    if (timeLeft === null || !started) return;
    if (timeLeft <= 0) return;
    const timer = window.setTimeout(() => setTimeLeft(t => (t !== null ? t - 1 : t)), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, started, submitResult]);

  useEffect(() => {
    if (!started || attemptId === null) return;
    const q = quiz?.questions?.[questionIdx];
    if (!q) return;
    if (answers[questionIdx] === undefined) return;
    if (typeof attemptId !== 'number' || isNaN(attemptId)) return;
    fetch(`http://localhost:4000/attempts/${attemptId}/answer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer dev-token',
      },
      body: JSON.stringify({ questionId: q.id, value: answers[questionIdx] }),
    });
  }, [answers[questionIdx]]);

  useEffect(() => {
    if (submitResult) {
      setQuestionIdx(0);
      setStarted(false);
      setAnswers({});
      setTimeLeft(null);
      setAttemptId(null);
    }
  }, [submitResult]);

  // Track focus/blur and paste events for anti-cheat
  useEffect(() => {
    if (!started || submitResult || !attemptId) return;
    function handleBlur() {
      setAntiCheatSummary(prev => {
        const tabSwitches = (prev?.tabSwitches || 0) + 1;
        return { ...prev, tabSwitches, pastes: prev?.pastes || 0 };
      });
      fetch(`http://localhost:4000/attempts/${attemptId}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer dev-token',
        },
        body: JSON.stringify({ event: 'blur' }),
      });
    }
    function handlePaste() {
      setAntiCheatSummary(prev => {
        const pastes = (prev?.pastes || 0) + 1;
        return { ...prev, tabSwitches: prev?.tabSwitches || 0, pastes };
      });
    }
    window.addEventListener('blur', handleBlur);
    const inputs = document.querySelectorAll('input[name^="q"]');
    inputs.forEach(input => {
      input.addEventListener('paste', handlePaste);
    });
    return () => {
      window.removeEventListener('blur', handleBlur);
      inputs.forEach(input => {
        input.removeEventListener('paste', handlePaste);
      });
    };
  }, [started, submitResult, attemptId, questionIdx]);

  function formatTime(secs: number | null) {
    if (secs === null) return '--:--';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  if (isPending) return <div className="text-gray-500">Loading quiz...</div>;
  if (error) return <div className="text-red-600">Failed to fetch quiz: {(error as Error).message}</div>;
  if (!quiz) return <div className="text-red-600">Quiz not found.</div>;

  const questions = quiz.questions || [];
  const current = questions[questionIdx];

  return (
    <div className="max-w-2xl mx-auto p-6 bg-black rounded shadow mt-8 text-white">
      <div className="flex items-center mb-2">
        <Link to="/" className="text-blue-400 underline inline-block">&larr; Back to all quizzes</Link>
      </div>
      {quiz.timeLimitSeconds && started && !submitResult && (
        <div className="text-center text-lg font-mono text-yellow-400">
          Time left: {formatTime(timeLeft)}
        </div>
      )}   
      {!started && !submitResult && (
        <div className="text-green-400">Click "Start" to begin the quiz</div>
      )}
      <h1 className="text-2xl font-bold mb-4">{quiz.title || 'Untitled Quiz'}</h1>
      <p className="mb-6 text-gray-400">{quiz.description || ''}</p>
      {submitResult && (
        <div className="mb-4 p-4 bg-gray-800 rounded text-green-400">
          <div className="text-xl font-bold mb-2">Quiz submitted!</div>
          <div className="mb-2">Score: <span className="font-mono">{submitResult.score} / {questions.length}</span></div>
          <div className="mb-2 font-semibold text-white">Per-question results:</div>
          <ol className="mb-2 list-decimal list-inside">
            {questions.map((q: any) => {
              const detail = submitResult.details?.find((d: any) => d.questionId === q.id);
              return (
                <li key={q.id} className="mb-1">
                  {detail ? (
                    detail.correct ? (
                      <span className="text-green-400 font-semibold">Correct</span>
                    ) : (
                      <span className="text-red-400 font-semibold">Incorrect</span>
                    )
                  ) : (
                    <span className="text-gray-400">No answer</span>
                  )}
                </li>
              );
            })}
          </ol>
          {antiCheatSummary && (
            <div className="bg-gray-900 text-xs text-white p-2 rounded my-2">
              <div className="font-bold text-red-500 mb-1">Anti-cheat summary:</div>
              <div>Tab switches: {antiCheatSummary.tabSwitches}</div>
              <div>Paste events: {antiCheatSummary.pastes}</div>
            </div>
          )}
          {timeLeft === 0 ? (
            <div className="text-red-400">You may have run out of time or submitted late.</div>
          ) : (
            submitResult.score === 0 && submitResult.details?.some((d: any) => d.correct === false) && (
              <div className="text-yellow-400">All answers are wrong</div>
            )
          )}
          <button
            className="my-2 px-4 py-2 !bg-red-700 rounded text-white"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      )}
      {questions.length > 0 && current && !submitResult && (
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
                    value={idx}
                    className="form-radio text-blue-600 disabled:cursor-not-allowed"
                    checked={answers[questionIdx] === idx}
                    onChange={() => setAnswers(a => ({ ...a, [questionIdx]: idx }))}
                    disabled={!started}
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
                disabled={!started}
              />
              <div className="text-xs text-gray-400 mt-1">Short answer (case-insensitive)</div>
            </div>
          )}
        </div>
      )}
      <div className="flex gap-2">
        {!submitResult && 
          <button
            className="px-4 py-2 bg-gray-700 rounded text-black disabled:opacity-50"
            onClick={() => setQuestionIdx(i => i - 1)}
            disabled={questionIdx === 0}
          >
            Previous
          </button>
        }
        {(questionIdx < questions.length - 1 || (questionIdx === 0 && !started)) && !submitResult && (
          <button
            id="next-btn"
            className="px-4 py-2 !bg-blue-600 text-white disabled:opacity-50"
            onClick={() => {
              if (questionIdx === 0 && !started) {
                setStarted(true);
                if (quiz.timeLimitSeconds) setTimeLeft(quiz.timeLimitSeconds);
              } else {
                setQuestionIdx(i => i + 1);
              }
            }}
            disabled={!started && questionIdx !== 0}
          >
            {questionIdx === 0 && !started ? 'Start' : 'Next'}
          </button>
        )}
        {questionIdx === questions.length - 1 && started && questions.length > 0 && !submitResult && (
          <button
            id="submit-btn"
            className="px-4 py-2 bg-blue-700 rounded text-blue-500 disabled:opacity-50"
            disabled={submitting || attemptId === null}
            onClick={async () => {
              if (!attemptId) return;
              setSubmitting(true);
              try {
                const res = await fetch(`http://localhost:4000/attempts/${attemptId}/submit`, {
                  method: 'POST',
                  headers: { 'Authorization': 'Bearer dev-token' },
                });
                const data = await res.json();
                setSubmitResult(data);
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {submitting ? 'Submitting...' : 'Submit'}
          </button>
        )}
      </div>
    </div>
  );
}
