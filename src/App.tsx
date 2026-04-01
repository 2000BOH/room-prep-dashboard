import { useMemo, useRef } from 'react';
import { useRoomData } from './useRoomData';
import { StatusForm } from './components/StatusForm';
import { format, parseISO } from 'date-fns';
import { 
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, ReferenceLine, LabelList
} from 'recharts';
import { Hotel, Building2, Briefcase, Trash2, PlusCircle, MinusCircle, FileImage, FileDown, AlertTriangle } from 'lucide-react';
import { CATEGORIES } from './types';
import * as htmlToImage from 'html-to-image';
import { jsPDF } from 'jspdf';

// 스타일링 병합 유틸
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const { records, addRecord, deleteRecord } = useRoomData();

  // 날짜별 데이터 집계 로직
  const chartData = useMemo(() => {
    // 1. 모든 고유 날짜 추출
    const dates = [...new Set(records.map(r => r.date))].sort();
    
    // 2. 누적 잔여 객실을 보관할 변수
    let currentCumulative = 0;

    // 3. 날짜별 플러스/마이너스 집계 및 누적 계산
    return dates.map(date => {
      const dayRecords = records.filter(r => r.date === date);
      const plusTotal = dayRecords.filter(r => r.type === 'PLUS').reduce((sum, r) => sum + r.amount, 0);
      const minusTotal = dayRecords.filter(r => r.type === 'MINUS').reduce((sum, r) => sum + r.amount, 0);
      
      const dailyNet = plusTotal - minusTotal;
      currentCumulative += dailyNet;

      return {
        date,
        displayDate: format(parseISO(date), 'M/d'),
        plus: plusTotal,
        minus: minusTotal,
        net: dailyNet,
        cumulative: currentCumulative, // ✅ 추가: 누적 잔여 객실
      };
    });
  }, [records]);

  // 총 누적 집계
  const summary = useMemo(() => {
    const totalPlus = records.filter(r => r.type === 'PLUS').reduce((sum, r) => sum + r.amount, 0);
    const totalMinus = records.filter(r => r.type === 'MINUS').reduce((sum, r) => sum + r.amount, 0);
    return {
      plus: totalPlus,
      minus: totalMinus,
      net: totalPlus - totalMinus
    };
  }, [records]);

  // 카테고리별 요약 배열
  const categorySummary = useMemo(() => {
    const acc: Record<string, number> = {};
    records.forEach(r => {
      acc[r.category] = (acc[r.category] || 0) + r.amount;
    });
    return Object.entries(acc).sort((a,b) => b[1] - a[1]);
  }, [records]);

  // 내보내기용 영역 참조
  const exportRef = useRef<HTMLDivElement>(null);

  // 기록 내역에 누적 잔여 객실 계산 후 적용
  const recordsWithCumulative = useMemo(() => {
    // 1. 시간순 정렬 (과거 -> 현재)
    const sorted = [...records].sort((a, b) => a.createdAt - b.createdAt);
    let runningTotal = 0;
    
    // 2. 누적치 계산 (순차적으로)
    const mapped = sorted.map(record => {
      runningTotal += (record.type === 'PLUS' ? record.amount : -record.amount);
      return { ...record, currentRemaining: runningTotal };
    });

    // 3. 기록 내역 렌더링을 위해 시간순(과거->현재) 그대로 반환
    return mapped;
  }, [records]);

  const exportToImage = async () => {
    if (!exportRef.current) return;
    try {
      const dataUrl = await htmlToImage.toPng(exportRef.current, { 
        backgroundColor: '#f8fafc', 
        pixelRatio: 2,
        width: 1240
      });
      const link = document.createElement('a');
      link.download = `장기숙박_객실준비현황_${format(new Date(), 'yyyyMMdd')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error(e);
      alert('이미지 생성 중 오류가 발생했습니다: ' + (e instanceof Error ? e.message : String(e)));
    }
  };

  // PDF 내보내기 함수
  const exportToPDF = async () => {
    if (!exportRef.current) return;
    try {
      const dataUrl = await htmlToImage.toPng(exportRef.current, { 
        backgroundColor: '#f8fafc', 
        pixelRatio: 2,
        width: 1240
      });
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(dataUrl, 'PNG', 0, 10, pdfWidth, pdfHeight);
      pdf.save(`장기숙박_객실준비현황_${format(new Date(), 'yyyyMMdd')}.pdf`);
    } catch (e) {
      console.error(e);
      alert('PDF 생성 중 오류가 발생했습니다: ' + (e instanceof Error ? e.message : String(e)));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-20">
      
      {/* 🚀 Header 부분 */}
      <header className="bg-navy-900 bg-slate-900 text-white shadow-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg shadow-inner">
              <Briefcase size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">장기숙박 객실 현황</h1>
              <p className="text-slate-400 text-xs">운영 및 준비 대기 상태 통합 뷰</p>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <div className="text-sm font-medium text-slate-300">오늘 날짜</div>
            <div className="text-lg font-bold">{format(new Date(), 'yyyy년 M월 d일')}</div>
          </div>
        </div>
      </header>

      {/* 내보내기(다운로드) 버튼 영역 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 flex justify-end gap-3">
        <button 
          onClick={exportToImage}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 hover:text-blue-600 transition-colors shadow-sm font-medium"
        >
          <FileImage size={18} /> PNG 저장
        </button>
        <button 
          onClick={exportToPDF}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
        >
          <FileDown size={18} /> PDF 출력
        </button>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-all">
        
        {/* 현황 요약 카드 (Summary Cards) */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex items-center justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full translate-x-1/3 -translate-y-1/3" />
            <div className="relative z-10">
              <p className="text-sm font-semibold text-slate-500 mb-1">총 확보/발생 객실 🟢</p>
              <h3 className="text-4xl font-extrabold text-slate-800">{summary.plus}<span className="text-xl text-slate-400 font-medium ml-1">실</span></h3>
            </div>
            <div className="bg-emerald-100 p-4 rounded-2xl relative z-10">
              <Hotel className="text-emerald-600" size={28} />
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex items-center justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-full translate-x-1/3 -translate-y-1/3" />
            <div className="relative z-10">
              <p className="text-sm font-semibold text-slate-500 mb-1">총 감소/대여 객실 🔴</p>
              <h3 className="text-4xl font-extrabold text-slate-800">{summary.minus}<span className="text-xl text-slate-400 font-medium ml-1">실</span></h3>
            </div>
            <div className="bg-red-100 p-4 rounded-2xl relative z-10">
              <Building2 className="text-red-500" size={28} />
            </div>
          </div>

          <div className={cn(
            "rounded-3xl p-6 shadow-lg text-white flex items-center justify-between relative overflow-hidden transition-all duration-500",
            summary.net < 0 ? "bg-red-600 shadow-red-600/30 animate-pulse border-2 border-red-400" : "bg-blue-600 shadow-blue-600/20"
          )}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full translate-x-1/3 -translate-y-1/3" />
            <div className="relative z-10 w-full">
              <div className="flex items-center justify-between w-full mb-1">
                <p className={cn(
                  "text-sm font-medium",
                  summary.net < 0 ? "text-red-100" : "text-blue-100"
                )}>
                  현재 가용 잔여 객실 {summary.net < 0 ? '🚨' : '⭐'}
                </p>
                {summary.net < 0 && (
                  <div className="flex items-center gap-1.5 text-xs font-bold bg-white text-red-600 px-3 py-1 rounded-full animate-bounce shadow-sm">
                    <AlertTriangle size={14} /> 객실 추가 확보 시급!
                  </div>
                )}
              </div>
              <h3 className="text-5xl font-extrabold flex items-baseline gap-2">
                {summary.net}
                <span className={cn(
                  "text-2xl font-medium",
                  summary.net < 0 ? "text-red-200" : "text-blue-200"
                )}>실</span>
              </h3>
            </div>
          </div>

        </section>

        {/* 메인 콘텐츠 영역 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* 입력 폼 & 카테고리 요약 */}
          <div className="lg:col-span-1 space-y-8">
            <StatusForm onSubmit={addRecord} />
            
            {/* 항목별 누적 현황표 (미니 위젯) */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hidden md:block">
              <h3 className="font-bold text-slate-800 mb-4 border-b pb-2">항목별 누적 합계</h3>
              <div className="space-y-3">
                {categorySummary.length === 0 && <p className="text-sm text-slate-500">데이터가 없습니다.</p>}
                {categorySummary.map(([cat, amount]) => {
                  const isPlus = CATEGORIES.PLUS.includes(cat);
                  return (
                    <div key={cat} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-600">{cat}</span>
                      <span className={cn("text-sm font-bold", isPlus ? 'text-emerald-600' : 'text-red-500')}>
                        {isPlus ? '+' : '-'}{amount}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 오른쪽 차트 & 타임라인 뷰 */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* 차트 위젯 */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 h-[380px] flex flex-col">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                일자별 객실 준비/투입 트렌드
              </h3>
              <div className="flex-1 w-full" style={{ minHeight: '400px', marginTop: '10px' }}>
                {chartData.length === 0 ? (
                  <div className="absolute inset-0 flex items-center justify-center text-slate-400">데이터를 추가하면 차트가 표시됩니다.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 30, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="displayDate" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 13}} dy={10} />
                      <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 13}} domain={[0, 'auto']} />
                      <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fill: '#0284c7', fontSize: 13}} domain={['auto', 'auto']} />
                      
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        cursor={{fill: '#f1f5f9'}}
                      />
                      <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                      <ReferenceLine yAxisId="right" y={0} stroke="#ef4444" strokeDasharray="3 3" />
                      
                      {/* 누적 잔여 객실 선 그래프 + 라벨 */}
                      <Line yAxisId="right" type="monotone" name="누적 잔여 객실 수" dataKey="cumulative" stroke="#0284c7" strokeWidth={3} dot={{ r: 4 }}>
                        <LabelList 
                          dataKey="cumulative" 
                          content={(props: any) => {
                            const { x, y, value } = props;
                            const isPlus = value >= 0;
                            const prefix = isPlus ? '+' : '';
                            const color = isPlus ? '#0284c7' : '#ef4444'; 
                            return (
                              <g transform={`translate(${x}, ${y - 15})`}>
                                <text x={0} y={0} textAnchor="middle" fill={color} fontSize={15} fontWeight="900" style={{ textShadow: '2px 2px 0px #fff, -2px -2px 0px #fff, 2px -2px 0px #fff, -2px 2px 0px #fff' }}>
                                  잔여 {prefix}{value}
                                </text>
                              </g>
                            );
                          }} 
                        />
                      </Line>
                      
                      {/* 증가 요인 막대 + 라벨 */}
                      <Bar yAxisId="left" name="증가 요인 (+)" dataKey="plus" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40}>
                        <LabelList 
                          dataKey="plus" 
                          position="top" 
                          fill="#10b981" 
                          fontSize={13} 
                          fontWeight="bold" 
                          formatter={(val: any) => Number(val) > 0 ? `+${val}` : ''} 
                        />
                      </Bar>
                      
                      {/* 감소 요인 막대 + 라벨 */}
                      <Bar yAxisId="left" name="감소 요인 (-)" dataKey="minus" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40}>
                        <LabelList 
                          dataKey="minus" 
                          position="top" 
                          fill="#ef4444" 
                          fontSize={13} 
                          fontWeight="bold" 
                          formatter={(val: any) => Number(val) > 0 ? `-${val}` : ''} 
                        />
                      </Bar>
                      
                    </ComposedChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* 타임라인 히스토리 */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
              <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                최근 기록 내역
              </h3>
              
              <div className="space-y-4 pb-4">
                {recordsWithCumulative.length === 0 ? (
                  <p className="text-center text-slate-500 py-10">등록된 내역이 없습니다.</p>
                ) : (
                  recordsWithCumulative.map(record => {
                    const isPlus = record.type === 'PLUS';
                    return (
                      <div 
                        key={record.id} 
                        className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-blue-100 hover:shadow-md transition-all group bg-slate-50/50"
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-12 h-12 rounded-full flex items-center justify-center shadow-sm shrink-0",
                            isPlus ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-500"
                          )}>
                            {isPlus ? <PlusCircle size={22} /> : <MinusCircle size={22} />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-slate-800">{record.category}</span>
                              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                                {format(parseISO(record.date), 'M월 d일')}
                              </span>
                            </div>
                            {record.memo && (
                              <p className="text-sm text-slate-500 line-clamp-1">{record.memo}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right flex flex-col items-end">
                            <div className={cn(
                              "text-xl font-extrabold",
                              isPlus ? "text-emerald-500" : "text-red-500"
                            )}>
                              {isPlus ? '+' : '-'}{record.amount}
                            </div>
                            <div className="text-[13px] font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-md mt-0.5 border border-blue-100 whitespace-nowrap">
                              누적 잔여: {record.currentRemaining}실
                            </div>
                          </div>
                          
                          <button 
                            onClick={() => deleteRecord(record.id)}
                            className="p-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-transparent hover:border-red-100 hover:bg-red-50 rounded-lg shadow-sm"
                            title="삭제"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

            </div>

          </div>
        </div>
      </main>

      {/* 출력 전용 오프스크린 렌더러 (항상 DOM에 존재하여 차트 크기 등이 안정화됨) */}
      <div className="absolute top-0 left-[-9999px] opacity-0 pointer-events-none z-[-1]">
        <div ref={exportRef} className="w-[1240px] bg-slate-50 py-10 px-12">
          
          <div className="mb-8 text-center border-b pb-6 border-slate-200">
            <h2 className="text-4xl font-extrabold text-navy-900 tracking-tight">장기숙박 객실 현황 통합 보고서</h2>
            <p className="text-slate-500 mt-2 text-lg">출력 일자: {format(new Date(), 'yyyy년 M월 d일 HH:mm')}</p>
          </div>
          
          {/* 현황 요약 카드 (Summary Cards) - 가로 3열 */}
          <section className="grid grid-cols-3 gap-8 mb-10">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500 mb-1">총 확보/발생 객실 🟢</p>
                <h3 className="text-4xl font-extrabold text-slate-800">{summary.plus}<span className="text-xl text-slate-400 font-medium ml-1">실</span></h3>
              </div>
              <Hotel className="text-emerald-600 bg-emerald-100 p-2 rounded-xl" size={48} />
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500 mb-1">총 감소/대여 객실 🔴</p>
                <h3 className="text-4xl font-extrabold text-slate-800">{summary.minus}<span className="text-xl text-slate-400 font-medium ml-1">실</span></h3>
              </div>
              <Building2 className="text-red-500 bg-red-100 p-2 rounded-xl" size={48} />
            </div>

            <div className={cn(
              "rounded-3xl p-6 shadow-md flex items-center justify-between",
              summary.net < 0 ? "bg-red-600 text-white" : "bg-blue-600 text-white"
            )}>
              <div>
                <p className="text-sm font-medium mb-1 opacity-90">
                  현재 가용 잔여 객실 {summary.net < 0 ? '🚨' : '⭐'}
                </p>
                <h3 className="text-5xl font-extrabold flex items-baseline gap-2">
                  {summary.net}<span className="text-2xl font-medium opacity-80">실</span>
                </h3>
              </div>
            </div>
          </section>

          {/* 메인 리포트 (차트 + 내역) - 가로 2열 균등 분할 */}
          <div className="grid grid-cols-2 gap-8">
            
            {/* 좌측: 차트 */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col h-[500px]">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-xl">
                일자별 객실 준비/투입 트렌드
              </h3>
              <div className="flex-1 w-full" style={{ minHeight: '400px', marginTop: '15px' }}>
                {chartData.length > 0 && (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 30, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="displayDate" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 13}} dy={10} />
                      <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 13}} domain={[0, 'auto']} />
                      <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fill: '#0284c7', fontSize: 13}} domain={['auto', 'auto']} />
                      <ReferenceLine yAxisId="right" y={0} stroke="#ef4444" strokeDasharray="3 3" />
                      
                      <Line yAxisId="right" type="monotone" dataKey="cumulative" stroke="#0284c7" strokeWidth={3} dot={{ r: 4 }}>
                        <LabelList 
                          dataKey="cumulative" 
                          content={(props: any) => {
                            const { x, y, value } = props;
                            const isPlus = value >= 0;
                            const prefix = isPlus ? '+' : '';
                            const color = isPlus ? '#0284c7' : '#ef4444'; 
                            return (
                              <g transform={`translate(${x}, ${y - 15})`}>
                                <text x={0} y={0} textAnchor="middle" fill={color} fontSize={16} fontWeight="900" style={{ textShadow: '2px 2px 0px #fff, -2px -2px 0px #fff, 2px -2px 0px #fff, -2px 2px 0px #fff' }}>
                                  잔여 {prefix}{value}
                                </text>
                              </g>
                            );
                          }} 
                        />
                      </Line>
                      
                      <Bar yAxisId="left" dataKey="plus" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40}>
                        <LabelList dataKey="plus" position="top" fill="#10b981" fontSize={14} fontWeight="bold" formatter={(val: any) => Number(val) > 0 ? `+${val}` : ''} />
                      </Bar>
                      <Bar yAxisId="left" dataKey="minus" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40}>
                        <LabelList dataKey="minus" position="top" fill="#ef4444" fontSize={14} fontWeight="bold" formatter={(val: any) => Number(val) > 0 ? `-${val}` : ''} />
                      </Bar>
                    </ComposedChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* 우측: 요약 및 기록 */}
            <div className="space-y-6 flex flex-col justify-start">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                <h3 className="font-bold text-slate-800 mb-4 border-b pb-2 text-lg">새로운 증감 내역 등록 없이 자동 집계됨</h3>
                <div className="space-y-2">
                  {categorySummary.slice(0, 5).map(([cat, amount]) => {
                    const isPlus = CATEGORIES.PLUS.includes(cat);
                    return (
                      <div key={cat} className="flex items-center justify-between text-[15px]">
                        <span className="font-medium text-slate-700">{cat}</span>
                        <span className={cn("font-bold", isPlus ? 'text-emerald-600' : 'text-red-500')}>
                          {isPlus ? '+' : '-'}{amount}실
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex-1">
                <h3 className="font-bold text-slate-800 mb-4 text-lg">최근 증감 기록 상세 내역 (최대 10건)</h3>
                <div className="space-y-3">
                  {recordsWithCumulative.slice(0, 7).map(record => {
                    const isPlus = record.type === 'PLUS';
                    return (
                      <div key={record.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-semibold px-2 py-1 bg-slate-100 text-slate-500 rounded">{format(parseISO(record.date), 'M/d')}</span>
                          <div className="font-bold text-slate-800">{record.category}</div>
                        </div>
                        <div className="text-right">
                          <div className={cn("text-base font-bold", isPlus ? "text-emerald-600" : "text-red-500")}>
                            {isPlus ? '+' : '-'}{record.amount}
                          </div>
                          <div className="text-xs font-bold text-slate-400">잔여 {record.currentRemaining}실</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

    </div>
  );
}
