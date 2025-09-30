import React, { useState } from 'react';
import { Link } from 'react-router-dom';
const API_TOKEN = import.meta.env.VITE_API_TOKEN || 'dev-token';
const PORT = import.meta.env.VITE_PORT || '4000';
const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost';

// Add a type for questions that supports codeSnippet
interface QuizQuestion {
  type: string;
  prompt: string;
  choices?: string[];
  correctAnswer?: string;
  codeSnippet?: string;
}

export default function QuizCreate() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [timeLimitSeconds, setTimeLimitSeconds] = useState<number | undefined>();
  const [isPublished, setIsPublished] = useState(true);
  // Remove initial empty question from state
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);

  // Countdown timer state for quiz creation success
  const [minSec, setMinSec] = useState<number>(30);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdQuizId, setCreatedQuizId] = useState<string | null>(null);

  const handleQuestionChange = (idx: number, field: string, value: any) => {
    setQuestions(qs =>
      qs.map((q, i) =>
        i === idx ? { ...q, [field]: value } : q
      )
    );
  };

  const handleChoiceChange = (qIdx: number, cIdx: number, value: string) => {
    setQuestions(qs =>
      qs.map((q, i) =>
        i === qIdx && q.choices
          ? { ...q, choices: q.choices.map((c: string, j: number) => (j === cIdx ? value : c)) }
          : q
      )
    );
  };

  const addChoice = (qIdx: number) => {
    setQuestions(qs =>
      qs.map((q, i) =>
        i === qIdx && q.choices ? { ...q, choices: [...q.choices, ''] } : q
      )
    );
  };

  const removeChoice = (qIdx: number, cIdx: number) => {
    setQuestions(qs =>
      qs.map((q, i) =>
        i === qIdx && q.choices ? { ...q, choices: q.choices.filter((_: string, j: number) => j !== cIdx) } : q
      )
    );
  };

  const addQuestion = () => {
    const promptText = window.prompt('Enter the question prompt:');
    if (!promptText) return;
    setQuestions(qs => [
      ...qs,
      { type: 'mcq', prompt: promptText, choices: [''], correctAnswer: '' }
    ]);
  };

  const removeQuestion = (idx: number) => {
    setQuestions(qs => qs.filter((_, i) => i !== idx));
  };

  // Helper to check if all questions are filled
  const isQuizValid = () => {
    if (!title.trim() || !description.trim() || questions.length === 0) return false;
    return questions.every(q => {
      if (!q.prompt.trim() || !q.type) return false;
      if (q.type === 'mcq') {
        if (!q.choices || q.choices.length < 2) return false;
        if (q.choices.some(choice => !choice.trim())) return false;
        // Check for duplicate choices
        const normalizedChoices = q.choices.map(c => c.trim().toLowerCase());
        const uniqueChoices = new Set(normalizedChoices);
        if (uniqueChoices.size !== q.choices.length) return false;
        if (!q.correctAnswer || !q.choices.includes(q.correctAnswer)) return false;
      } else {
        if (!q.correctAnswer || !q.correctAnswer.trim()) return false;
      }
      return true;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // For multiple choice, replace correctAnswer with the index of the correct choice
    const processedQuestions = questions.map(q => {
      if (q.type === 'mcq' && q.choices) {
        const correctIndex = q.choices.findIndex(choice => choice === q.correctAnswer);
        return {
          ...q,
          correctAnswer: correctIndex > -1 ? correctIndex : q.correctAnswer,
          options: q.choices
        };
      }
      return {
        ...q,
        options: q.choices,
        correctAnswer: q.correctAnswer,
      };
    });
    // Prepare quiz payload (ignore codeSnippet)
    const quizPayload = {
      title,
      description,
      timeLimitSeconds: timeLimitSeconds ?? 300,
      isPublished,
      questions: processedQuestions.map(({ codeSnippet, choices, ...rest }) => rest),
    };
    try {
      // Create quiz
      const res = await fetch(`${BASE_URL}:${PORT}/quizzes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_TOKEN}`
        },
        body: JSON.stringify({
          title: quizPayload.title,
          description: quizPayload.description,
          timeLimitSeconds: quizPayload.timeLimitSeconds,
          isPublished: quizPayload.isPublished,
        }),
      });
      if (!res.ok) throw new Error('Failed to create quiz');
      const quiz = await res.json();
      setCreatedQuizId(quiz.id);
      // Add questions
      for (const q of quizPayload.questions) {
        await fetch(`${BASE_URL}:${PORT}/quizzes/${quiz.id}/questions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_TOKEN}`
          },
          body: JSON.stringify(q),
        });
      }
      // Show success message and clear form
      setShowSuccess(true);
      setTitle('');
      setDescription('');
      setTimeLimitSeconds(undefined);
      setQuestions([]);
      return;
    } catch (err: any) {
      alert('Error: ' + err.message);
    }

  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-black rounded shadow mt-8">
      {showSuccess && (
        <div className="mb-4 p-4 bg-green-700 text-white rounded text-center font-semibold">
          Quiz created successfully!
          {createdQuizId && (
            <div className="mt-2 flex flex-col items-center gap-2">
              <div>
              <span className="font-semibold">Quiz ID:</span> <span className="text-yellow-200">{createdQuizId}</span>
              <button
                className="ml-2 px-2 py-1 !bg-orange-800 text-white rounded text-xs hover:!bg-yellow-700"
                onClick={() => {
                if (createdQuizId) {
                  navigator.clipboard.writeText(createdQuizId);
                }
                }}
                type="button"
              >
                Copy ID
              </button>
              </div>
              <Link to={`/quiz/${createdQuizId}`} className="underline !text-blue-800 hover:!text-blue-400">
              View your new quiz
              </Link>
            </div>
          )}
        </div>
      )}
      <Link to="/" className="text-blue-400 underline inline-block">&larr; Back to all quizzes</Link>
      <h1 className="text-2xl font-bold text-white mb-6">Create Quiz</h1>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block font-semibold text-white mb-1">Title</label>
          <input
            type="text"
            className="border rounded border-white bg-black text-white px-3 py-2 w-full disabled:cursor-not-allowed"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            disabled={showSuccess}
          />
        </div>
        <div className="mb-4">
          <label className="block font-semibold text-white mb-1">Description</label>
          <textarea
            className="border rounded border-white bg-black text-white px-3 py-2 w-full disabled:cursor-not-allowed"
            value={description}
            onChange={e => setDescription(e.target.value)}
            required
            disabled={showSuccess}
          />
        </div>
        <div className="mb-4">
          <label className="block font-semibold text-white mb-1">Time Limit (seconds, optional - 300 default)</label>
          <input
            type="number"
            min={minSec}
            className="border rounded border-white bg-black text-white px-3 py-2 w-full disabled:cursor-not-allowed"
            value={timeLimitSeconds ?? ''}
            onChange={e => setTimeLimitSeconds(e.target.value === '' ? undefined : Math.max(0, Number(e.target.value)))}
            placeholder={`Minimum ${minSec} seconds`}
            disabled={showSuccess}
          />
        </div>
        {/* <div className="mb-4">
          <label className="block font-semibold text-white mb-1">Publish Status</label>
          <select
            className="border rounded border-white bg-black text-white px-3 py-2 w-full disabled:cursor-not-allowed"
            value={isPublished ? 'published' : 'draft'}
            onChange={e => setIsPublished(e.target.value === 'published')}
            disabled={showSuccess}
          >
            <option value="published">Published</option>
            <option value="draft">Draft</option>            
          </select>
        </div> */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg text-white font-bold">Questions</h2>
            <button type="button" className="bg-gray-200 px-4 py-2 rounded text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50" onClick={addQuestion} disabled={showSuccess}>
              + Add Question
            </button>
          </div>
          {questions.length === 0 && (
            <div className="text-gray-400 italic">No questions yet. Click "Add Question" to begin.</div>
          )}
          {questions.map((q, idx) => (
            <div key={idx} className="mb-6 border border-white p-4 rounded bg-black">
              <div className="flex justify-between items-center mb-2">
                <span className="text-white font-semibold">
                  Question {idx + 1}: {q.prompt}
                </span>
                {questions.length > 1 && (
                  <button type="button" className="text-red-600" onClick={() => removeQuestion(idx)} disabled={showSuccess}>
                    Remove
                  </button>
                )}
              </div>
              {/* Only show the rest of the form if prompt is answered */}
              {q.prompt && (
                <>
                  <div className="mb-2">
                    <label className="block text-white mb-1">Type</label>
                    <select
                      className="border rounded border-white bg-black text-white px-2 py-1"
                      value={q.type}
                      onChange={e => handleQuestionChange(idx, 'type', e.target.value)}
                      disabled={showSuccess}
                    >
                      <option value="mcq">Multiple Choice</option>   
                      <option value="short">Short Answer</option>                                         
                    </select>
                  </div>
                  {q.type === 'mcq' && q.choices && (
                    <div className="mb-2">
                      <label className="block text-white mb-1">Choices (must have at least 2 unique choices)</label>
                      {q.choices.map((choice: string, cIdx: number) => (
                        <div key={cIdx} className="flex items-center mb-1 gap-2">
                          <input
                            type="text"
                            className="border rounded border-white bg-black text-white px-2 py-1 flex-1"
                            value={choice}
                            onChange={e => handleChoiceChange(idx, cIdx, e.target.value)}
                            required
                            disabled={showSuccess}
                          />
                          <button
                            type="button"
                            className="text-red-600"
                            onClick={() => removeChoice(idx, cIdx)}
                            disabled={q.choices!.length <= 2 || showSuccess}
                          >
                            -
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        className="text-blue-600 mt-1"
                        onClick={() => addChoice(idx)}
                        disabled={showSuccess}
                      >
                        Add choice
                      </button>
                    </div>
                  )}
                  <div className="mb-2">
                    <label className="block text-white mb-1">
                      Correct Answer{q.type === 'mcq' ? ' (must match one choice)' : ''}
                    </label>
                    <input
                      type="text"
                      className="border rounded border-white bg-black text-white px-2 py-1 w-full"
                      value={q.correctAnswer}
                      onChange={e => handleQuestionChange(idx, 'correctAnswer', e.target.value)}
                      required 
                      disabled={showSuccess}
                    />
                    {q.type === 'short' && (
                      <div className="text-xs text-gray-500 mt-1">
                        Short answer is case-insensitive string match.
                      </div>
                    )}
                  </div>
                  {q.type !== 'mcq' && (
                    <div className="mb-2">
                      <label className="block text-white mb-1">Code Snippet (optional)</label>
                      <textarea
                        className="border rounded border-white bg-black text-white px-2 py-1 w-full"
                        value={q.codeSnippet || ''}
                        onChange={e => handleQuestionChange(idx, 'codeSnippet', e.target.value)}
                        placeholder="Paste code here (optional)"
                        rows={2}
                        disabled={showSuccess}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
        <button
          type="submit"
          className="!bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-100 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!isQuizValid() || showSuccess}
        >
          Submit Quiz
        </button>
      </form>
    </div>
  );
};
