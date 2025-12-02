import { getCurrentUserId } from '@/lib/auth/session';
import { ProjectionService } from '@/lib/services/projection.service';
import { isValid, parse } from 'date-fns';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const monthParam = searchParams.get('month');

    let targetDate = new Date();
    if (monthParam) {
      const parsedDate = parse(monthParam, 'yyyy-MM', new Date());
      if (isValid(parsedDate)) {
        targetDate = parsedDate;
      } else {
        return NextResponse.json({ message: 'Invalid month format. Use YYYY-MM.' }, { status: 400 });
      }
    }

    const projectionService = new ProjectionService();
    const projection = await projectionService.getMonthlyProjection(userId, targetDate);

    return NextResponse.json(projection);
  } catch (error: any) {
    console.error('GET /api/financials/projection error:', error);
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
