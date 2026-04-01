import { useState } from 'react';
import { type FactorType, CATEGORIES } from '../types';
import { format } from 'date-fns';
import { PlusCircle, MinusCircle, Calendar } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// tailwind-merge helper function
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface StatusFormProps {
  onSubmit: (data: {
    date: string;
    type: FactorType;
    category: string;
    amount: number;
    memo?: string;
  }) => void;
}

export function StatusForm({ onSubmit }: StatusFormProps) {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [type, setType] = useState<FactorType>('PLUS');
  const [category, setCategory] = useState(CATEGORIES.PLUS[0]);
  const [amount, setAmount] = useState<string>('1');
  const [memo, setMemo] = useState('');

  // Handle Type Change
  const handleTypeChange = (newType: FactorType) => {
    setType(newType);
    setCategory(CATEGORIES[newType][0]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      alert('올바른 전환 객실 수량을 입력해 주세요.');
      return;
    }

    onSubmit({
      date,
      type,
      category,
      amount: Number(amount),
      memo: memo.trim() || undefined,
    });

    setAmount('1');
    setMemo('');
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 w-full max-w-md mx-auto relative overflow-hidden">
      {/* Decorative top border active indicator */}
      <div 
        className={cn(
          "absolute top-0 left-0 w-full h-1.5 transition-colors duration-300",
          type === 'PLUS' ? 'bg-emerald-500' : 'bg-red-500'
        )} 
      />
      
      <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        새로운 증감 내역 등록
      </h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* Type Toggle (Plus / Minus) */}
        <div className="flex gap-3 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
          <button
            type="button"
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium transition-all",
              type === 'PLUS' 
                ? "bg-white text-emerald-600 shadow-sm border border-emerald-100" 
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
            )}
            onClick={() => handleTypeChange('PLUS')}
          >
            <PlusCircle size={18} /> 증가 요인
          </button>
          <button
            type="button"
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium transition-all",
              type === 'MINUS' 
                ? "bg-white text-red-600 shadow-sm border border-red-100" 
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
            )}
            onClick={() => handleTypeChange('MINUS')}
          >
            <MinusCircle size={18} /> 감소 요인
          </button>
        </div>

        {/* Date Input */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1.5">날짜</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Category Dropdown */}
          <div className="col-span-1">
            <label className="block text-sm font-medium text-slate-600 mb-1.5">항목</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            >
              {CATEGORIES[type].map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Amount Input */}
          <div className="col-span-1">
            <label className="block text-sm font-medium text-slate-600 mb-1.5">객실 수 (현황)</label>
            <div className="relative">
              <input
                type="number"
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-right pr-12 font-semibold text-slate-800"
                required
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                객실
              </span>
            </div>
          </div>
        </div>

        {/* Memo Input */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1.5">비고 / 기타 요인 사유 (선택)</label>
          <input
            type="text"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="상세 내용을 입력하세요..."
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className={cn(
            "w-full py-3.5 rounded-xl font-bold text-white shadow-md transition-transform active:scale-95 flex items-center justify-center gap-2",
            type === 'PLUS' ? "bg-emerald-500 hover:bg-emerald-600" : "bg-red-500 hover:bg-red-600"
          )}
        >
          {type === 'PLUS' ? '준비 객실 추가 등록' : '객실 감차 등록'}
        </button>
      </form>
    </div>
  );
}
