import { Construction } from 'lucide-react';

export default function PlaceholderPage({ title }) {
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-center p-8 bg-white border border-slate-200 rounded-2xl shadow-sm">
      <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
        <Construction size={40} className="text-indigo-500" />
      </div>
      <h1 className="text-2xl font-bold text-slate-800 mb-2">{title}</h1>
      <p className="text-slate-500 max-w-md">
        This module is currently under development and will be available in a future update. Check back soon!
      </p>
    </div>
  );
}
