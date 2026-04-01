import { useState, useEffect } from 'react';
import type { RoomRecord } from './types';
import { nanoid } from 'nanoid';

const STORAGE_KEY = 'room-prep-dashboard-v1';

export function useRoomData() {
  const [records, setRecords] = useState<RoomRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }, [records]);

  const addRecord = (record: Omit<RoomRecord, 'id' | 'createdAt'>) => {
    const newRecord: RoomRecord = {
      ...record,
      id: nanoid(),
      createdAt: Date.now(),
    };
    setRecords((prev) => [...prev, newRecord]);
  };

  const deleteRecord = (id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
  };

  return { records, addRecord, deleteRecord };
}
