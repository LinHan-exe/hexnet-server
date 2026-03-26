import { NextResponse } from 'next/server';
import Papa from 'papaparse';

// Temporary server RAM cache
global.latestResults = global.latestResults || [];
global.rawCsvData = global.rawCsvData || "";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

    const csvText = await file.text();
    global.rawCsvData = csvText; // Save the exact CSV string for the download button
    
    // Parse it for the UI table
    const parsed = Papa.parse(csvText, { header: true, dynamicTyping: true });
    global.latestResults = parsed.data;

    return NextResponse.json({ success: true, count: parsed.data.length }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(request) {
  const url = new URL(request.url);
  
  // If the request asks for the download, send the raw CSV file
  if (url.searchParams.get('download') === 'true') {
    if (!global.rawCsvData) return new NextResponse("No data available", { status: 404 });
    
    return new NextResponse(global.rawCsvData, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="hexnet_strategies.csv"'
      }
    });
  }
  
  // Otherwise, just send the JSON for the UI table
  return NextResponse.json(global.latestResults);
}
