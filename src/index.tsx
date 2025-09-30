import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
const API_TOKEN = import.meta.env.VITE_API_TOKEN || 'dev-token';
const PORT = import.meta.env.VITE_PORT || '4000';
const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost';

export type Quiz = {
  id: number;
  title: string;
  description: string;
};

export default function IndexPage() {
  const { data: quizzes, isPending, error } = useQuery<Quiz[]>({
    queryKey: ['quizzes'],
    queryFn: async () => {
      const res = await fetch(`${BASE_URL}:${PORT}/quizzes`, {
        headers: {
          Authorization: `Bearer ${API_TOKEN}`,
        },
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const allQuizzes = await res.json();
      return allQuizzes.filter((quiz: any) => quiz.isPublished === true);
    }
  });
  console.log(import.meta.env);
  return (
    <div className="min-h-screen w-full bg-gray-900 text-white flex flex-col">
      <header className="bg-black shadow py-6 px-8">
        <div className="max-w-4xl mx-auto flex flex-col items-center gap-5">          
          <h1 className="text-3xl font-bold">All Quizzes</h1>
          <p className="text-green-400">Enter Quiz ID in input then click Go or Click on ID to select a quiz</p>
        </div> 
      </header>
      <main className="flex items-center justify-center">
        <div className="w-full max-w-4xl p-8 bg-black rounded shadow mt-8">
          <div className="flex flex-row items-center justify-between mb-6">
              <form
                className="flex gap-2"
                onSubmit={e => {
                  e.preventDefault();
                  const form = e.target as HTMLFormElement;
                  const input = form.elements.namedItem('quizId') as HTMLInputElement;
                  const id = input.value.trim();
                  if (id) {
                    window.location.href = `/quiz/${id}`;
                  }
                }}
              >
                <input
                  type="number"
                  name="quizId"
                  placeholder="Enter Quiz ID"
                  className="px-3 py-2 rounded border border-gray-700 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min={1}
                  required
                />
                <button
                  type="submit"
                  className="!bg-green-600 text-white !px-4 !py-2 rounded hover:bg-green-700 transition"
                >
                  Go
                </button>
              </form>
              <Link to="/quiz/create" className="bg-blue-600 !text-white px-4 py-2 rounded hover:bg-blue-700 transition">
                Create Quiz
              </Link>
          </div>
          <div className="overflow-x-auto">
            
            {isPending && <div className="text-gray-500">Loading quizzes...</div>}
            {error && <div className="text-red-600">Failed to fetch quizzes: {(error as Error).message}</div>}
            {quizzes && quizzes.length > 0 ? (
                <table className="min-w-full bg-black border border-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 border-b">ID</th>
                      <th className="px-4 py-2 border-b">Title</th>
                      <th className="px-4 py-2 border-b">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quizzes.map((quiz) => (
                      <tr key={quiz.id} className="hover:bg-gray-800">
                        <td className="px-4 py-2 border-b"><a href={`/quiz/${quiz.id}`}>{quiz.id}</a></td>
                        <td className="px-4 py-2 border-b font-semibold">
                          {quiz.title || 'No Title'}
                        </td>
                        <td className="px-4 py-2 border-b">{quiz.description || ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            ) : !isPending && <div className="text-red-600">No quizzes found.</div>}
          </div>
        </div>
      </main>
    </div>
  );
}
