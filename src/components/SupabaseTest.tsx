import React, { useEffect, useState } from 'react';
import { createClient } from '../utils/supabase/client';

export default function SupabaseTest() {
  const [todos, setTodos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchTodos() {
      const { data, error } = await supabase.from('todos').select();
      if (error) {
        console.error('Error fetching todos:', error);
      } else {
        setTodos(data || []);
      }
      setLoading(false);
    }

    fetchTodos();
  }, []);

  if (loading) return <div>Loading todos...</div>;

  return (
    <div className="p-4 bg-slate-900/50 rounded-2xl border border-white/5">
      <h2 className="text-xl font-bold text-white mb-4">Supabase Todos</h2>
      <ul className="space-y-2">
        {todos.map((todo) => (
          <li key={todo.id} className="text-slate-300">
            {todo.name}
          </li>
        ))}
        {todos.length === 0 && <li className="text-slate-500 italic">No todos found.</li>}
      </ul>
    </div>
  );
}
