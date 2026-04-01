export type FactorType = 'PLUS' | 'MINUS';

export interface RoomRecord {
  id: string;
  date: string; // YYYY-MM-DD
  type: FactorType;
  category: string; // 호텔객실 전환, 퇴실, 하자보수, 인스파이어, 샤프테크닉스, 기타
  amount: number;
  memo?: string;
  createdAt: number;
}

export const CATEGORIES: Record<FactorType, string[]> = {
  PLUS: ['호텔객실 전환', '공실', '보수객실', '퇴실', '하자보수 완료', '기타 (+룸)'],
  MINUS: ['인스파이어', '샤프테크닉스', '고장/하자 발생', '기타 (-룸)'],
};
