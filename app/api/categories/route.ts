import { NextResponse } from 'next/server';
import { productService } from '@/lib/products';

export async function GET() {
  try {
    const categories = productService.getCategories();
    return NextResponse.json({ categories });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}
