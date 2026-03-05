import { NextRequest, NextResponse } from 'next/server';
import { productService } from '@/lib/products';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const filters = {
    category: searchParams.get('category') || undefined,
    subCategory: searchParams.get('subCategory') || undefined,
    search: searchParams.get('search') || undefined,
    limit: searchParams.get('limit') ? Math.min(Math.max(parseInt(searchParams.get('limit')!), 1), 100) : 20,
    offset: searchParams.get('offset') ? Math.max(parseInt(searchParams.get('offset')!), 0) : 0,
  };

  try {
    const products = productService.getAll(filters);
    const total = productService.getTotalCount({
      category: filters.category,
      subCategory: filters.subCategory,
      search: filters.search,
    });
    return NextResponse.json({ products, total, limit: filters.limit, offset: filters.offset });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}
