
import { NextRequest, NextResponse } from 'next/server';
import { getHolidaysAndBridgeDays } from '@/lib/holidays';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const yearStr = searchParams.get('year') || new Date().getFullYear().toString();
  const year = parseInt(yearStr);

  if (isNaN(year)) {
    return NextResponse.json({ error: 'Invalid year' }, { status: 400 });
  }

  try {
    const data = await getHolidaysAndBridgeDays(year);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching holidays:', error);
    return NextResponse.json({ error: 'Failed to fetch holidays' }, { status: 500 });
  }
}
