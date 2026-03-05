import { NextRequest, NextResponse } from 'next/server';
import { productService } from '@/lib/products';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const category = searchParams.get('category') || undefined;

  try {
    const subCategories = productService.getSubCategories(category);
    return NextResponse.json({ subCategories });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch subcategories' }, { status: 500 });
  }
}
