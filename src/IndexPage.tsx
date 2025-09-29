import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

export type Quiz = {
  id: number;
  title: string;
  description: string;
};

export default function IndexPage() {
  const { data: quizzes, isPending, error } = useQuery<Quiz[]>({
    queryKey: ['quizzes'],
    queryFn: async () => {
      const res = await fetch('http://localhost:4000/quizzes', {
        headers: { 'Authorization': 'Bearer dev-token' }
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return res.json();
    }
  });

  return (
    <div className="min-h-screen w-full bg-gray-900 text-white flex flex-col">
      <header className="bg-black shadow py-6 px-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-5">
          <div className="flex flex-col items-start gap-5">
            <h1 className="text-3xl font-bold">All Quizzes</h1>
            <p className="text-red-500">Click on title to pick quiz</p>
          </div>
          <Link
            to="/create-quiz"
            className="bg-blue-600 !text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            Create Quiz
          </Link>
        </div>
      </header>
      <main className="flex items-center justify-center">
        <div className="w-full max-w-4xl p-8 bg-black rounded shadow mt-8">
          <div className="overflow-x-auto">
            {isPending && <div className="text-gray-500">Loading quizzes...</div>}
            {error && <div className="text-red-600">Failed to fetch quizzes: {(error as Error).message}</div>}
            {quizzes && quizzes.length > 0 ? (
              <table className="min-w-full bg-black border border-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2 border-b text-left">Title</th>
                    <th className="px-4 py-2 border-b text-left">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {quizzes.map((quiz) => (
                    <tr key={quiz.id} className="hover:bg-gray-800 hover:text-red-400">
                      <td className="px-4 py-2 border-b font-semibold">
                        <a href={`/quiz/${quiz.id}`}>{quiz.title || 'No Title'}</a>
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
