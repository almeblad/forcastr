// lib/holidays.ts
import { unstable_cache } from 'next/cache';

const DAGSMART_API_BASE = 'https://api.dagsmart.se';

export type HolidayType = 'Holiday' | 'Bridge';

export interface Holiday {
  date: string;
  name: string;
  type: HolidayType;
  isWorkFree: boolean;
}

// API Response Types
interface DagsmartHoliday {
  date: string;
  code: string;
  name: { sv: string; en: string };
}

interface DagsmartBridgeDay {
  date: string;
}

// Helper fetch function
async function fetchData<T>(endpoint: string, year: number): Promise<T[]> {
  const url = `${DAGSMART_API_BASE}${endpoint}`;
  try {
    const res = await fetch(url, { next: { revalidate: 86400 } });
    
    // Dagsmart API returns 404 status code even on success sometimes (or maybe it's misconfigured), 
    // but the body contains valid JSON data.
    // We should trust the data if we can parse it as an array.
    if (!res.ok && res.status !== 404) {
      console.error(`Failed to fetch from ${endpoint}: ${res.status} ${res.statusText}`);
      return []; 
    }
    
    // Even if status is 404, the API returns the list (as seen in curl tests)
    const data: any = await res.json();
    
    // Validate it's an array before using
    if (!Array.isArray(data)) {
        console.error(`Unexpected format from ${endpoint}:`, data);
        return [];
    }

    return data.filter((item: any) => item.date.startsWith(year.toString()));
  } catch (error) {
    console.error(`Error fetching from ${endpoint}:`, error);
    return [];
  }
}

// Main function to get both
export const getHolidaysAndBridgeDays = unstable_cache(
  async (year: number) => {
    try {
      // Parallel fetch
      const [holidaysData, bridgeDaysData] = await Promise.all([
        fetchData<DagsmartHoliday>('/holidays', year),
        fetchData<DagsmartBridgeDay>('/bridge-days', year)
      ]);

      const holidays: Holiday[] = holidaysData.map(h => ({
        date: h.date,
        name: h.name.sv,
        type: 'Holiday',
        isWorkFree: true // Usually true for holidays
      }));

      const bridges: Holiday[] = bridgeDaysData.map(b => ({
        date: b.date,
        name: 'Klämdag',
        type: 'Bridge',
        isWorkFree: false // Bridge days are usually work days unless taken off
      }));

      // Combine and sort by date
      const allDays = [...holidays, ...bridges].sort((a, b) => a.date.localeCompare(b.date));
      
      return allDays;
    } catch (error) {
      console.error('Error combining holiday data:', error);
      return [];
    }
  },
  ['holidays-combined-cache-v2'], // Cache key - changed to invalidate old cache
  { revalidate: 30, tags: ['holidays'] } // Lower revalidate time for debugging
);
