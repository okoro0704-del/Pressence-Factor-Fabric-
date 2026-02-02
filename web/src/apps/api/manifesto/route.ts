import { NextResponse } from 'next/server';
import manifestoData from '@/data/manifesto.json';

export const revalidate = 3600;

export async function GET() {
  return NextResponse.json(manifestoData);
}
