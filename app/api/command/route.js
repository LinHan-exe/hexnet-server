import { NextResponse } from 'next/server';

// Global state to hold your remote commands
global.commandState = global.commandState || {
  status: 'idle', // 'idle', 'start_requested', 'running', 'stop_requested', 'stopped'
  mode: 'Generate Random Strategies',
  strategy: '',
  sims: 1000,
  sort: 'Composite Score (Best Overall)',
  auto: true,
  available_strats: [] // Python will upload the list of names here so your phone knows what to show
};

export async function GET() {
  return NextResponse.json(global.commandState);
}

export async function POST(request) {
  try {
    const data = await request.json();
    // Merge the incoming commands into the global state
    global.commandState = { ...global.commandState, ...data };
    return NextResponse.json({ success: true, state: global.commandState });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
