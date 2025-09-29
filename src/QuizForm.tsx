import React, { useState } from 'react';

export default function QuizForm() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState([
    { type: 'multiple', prompt: '', choices: [''], correctAnswer: '' }
  ]);

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
        i === qIdx
          ? { ...q, choices: q.choices.map((c: string, j: number) => (j === cIdx ? value : c)) }
          : q
      )
    );
  };

  const addChoice = (qIdx: number) => {
    setQuestions(qs =>
      qs.map((q, i) =>
        i === qIdx ? { ...q, choices: [...q.choices, ''] } : q
      )
    );
  };

  const removeChoice = (qIdx: number, cIdx: number) => {
    setQuestions(qs =>
      qs.map((q, i) =>
        i === qIdx ? { ...q, choices: q.choices.filter((_: string, j: number) => j !== cIdx) } : q
      )
    );
  };

  const addQuestion = () => {
    const promptText = window.prompt('Enter the question prompt:');
    if (!promptText) return;
    setQuestions(qs => [
      ...qs,
      { type: 'multiple', prompt: promptText, choices: [''], correctAnswer: '' }
    ]);
  };

  const removeQuestion = (idx: number) => {
    setQuestions(qs => qs.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const quiz = { title, description, questions };
    alert(JSON.stringify(quiz, null, 2));
    // TODO: send to backend
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-black rounded shadow mt-8">
      <h1 className="text-2xl font-bold mb-2">Create Quiz</h1>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block font-semibold mb-1">Title</label>
          <input
            type="text"
            className="border rounded px-3 py-2 w-full"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
          />
        </div>
        <div className="mb-4">
          <label className="block font-semibold mb-1">Description</label>
          <textarea
            className="border rounded px-3 py-2 w-full"
            value={description}
            onChange={e => setDescription(e.target.value)}
            required
          />
        </div>
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold">Questions</h2>
            <button type="button" className="bg-gray-200 px-4 py-2 rounded text-sm font-semibold" onClick={addQuestion}>
              + Add Question
            </button>
          </div>
          {questions.map((q, idx) => (
            <div key={idx} className="mb-6 border p-4 rounded bg-black">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold">Question {idx + 1}</span>
                {questions.length > 1 && (
                  <button type="button" className="text-red-600" onClick={() => removeQuestion(idx)}>
                    Remove
                  </button>
                )}
              </div>
              <div className="mb-2">
                <label className="block mb-1">Type</label>
                <select
                  className="border rounded px-2 py-1"
                  value={q.type}
                  onChange={e => handleQuestionChange(idx, 'type', e.target.value)}
                >
                  <option value="multiple">Multiple Choice</option>
                  <option value="short">Short Answer</option>
                </select>
              </div>
              <div className="mb-2">
                <label className="block mb-1">Prompt</label>
                <input
                  type="text"
                  className="border rounded px-2 py-1 w-full"
                  value={q.prompt}
                  onChange={e => handleQuestionChange(idx, 'prompt', e.target.value)}
                  required
                />
              </div>
              <div className="mb-2">
                <label className="block mb-1">Code Snippet (optional)</label>
                <textarea
                  className="border rounded px-2 py-1 w-full"
                  value={q.codeSnippet || ''}
                  onChange={e => handleQuestionChange(idx, 'codeSnippet', e.target.value)}
                  placeholder="Paste code here (optional)"
                  rows={2}
                />
              </div>
              {q.type === 'multiple' && (
                <div className="mb-2">
                  <label className="block mb-1">Choices</label>
                  {q.choices.map((choice: string, cIdx: number) => (
                    <div key={cIdx} className="flex items-center mb-1 gap-2">
                      <input
                        type="text"
                        className="border rounded px-2 py-1 flex-1"
                        value={choice}
                        onChange={e => handleChoiceChange(idx, cIdx, e.target.value)}
                        required
                      />
                      <button type="button" className="text-red-600" onClick={() => removeChoice(idx, cIdx)} disabled={q.choices.length <= 1}>
                        Remove
                      </button>
                    </div>
                  ))}
                  <button type="button" className="text-blue-600 mt-1" onClick={() => addChoice(idx)}>
                    Add Choice
                  </button>
                </div>
              )}
              <div className="mb-2">
                <label className="block mb-1">Correct Answer{q.type === 'multiple' ? ' (must match one choice)' : ''}</label>
                <input
                  type="text"
                  className="border rounded px-2 py-1 w-full"
                  value={q.correctAnswer}
                  onChange={e => handleQuestionChange(idx, 'correctAnswer', e.target.value)}
                  required
                />
                {q.type === 'short' && (
                  <div className="text-xs text-gray-500 mt-1">Short answer is case-insensitive string match.</div>
                )}
              </div>
            </div>
          ))}
          <button type="button" className="bg-gray-200 px-4 py-2 rounded" onClick={addQuestion}>
            Add Question
          </button>
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 font-semibold"
        >
          Submit Quiz
        </button>
      </form>
    </div>);

};
