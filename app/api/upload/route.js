import { NextResponse } from 'next/server';
import Papa from 'papaparse';

// Temporary server memory cache
global.latestResults = global.latestResults || [];

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

    const csvText = await file.text();
    
    // Convert CSV to JSON
    const parsed = Papa.parse(csvText, { header: true, dynamicTyping: true });
    global.latestResults = parsed.data;

    return NextResponse.json({ success: true, count: parsed.data.length }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json(global.latestResults);
}