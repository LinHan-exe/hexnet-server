export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

global.commandState = global.commandState || {
  status: 'idle', 
  engine_status: 'offline', // Default to offline on cold boot
  last_seen: 0,             // NEW: The exact timestamp of the last ping
  mode: 'Generate Random Strategies', strategy: '', sims: 1000, 
  sort: 'Composite Score (Best Overall)', auto: true, available_strats: []
};

export async function GET() {
  const now = Date.now();
  
  // THE DEAD MAN'S SWITCH: If Python hasn't pinged in 25 seconds, it's dead.
  if (now - global.commandState.last_seen > 25000) {
      global.commandState.engine_status = 'offline';
      
      // Un-stick the buttons if they were frozen waiting for a dead computer
      if (global.commandState.status === 'sync_requested' || global.commandState.status === 'stop_requested') {
          global.commandState.status = 'idle';
      }
  }
  
  return NextResponse.json(global.commandState);
}

export async function POST(req) {
  const body = await req.json();
  global.commandState = { ...global.commandState, ...body };

  // If Python is checking in with its engine status, update the stopwatch!
  if (body.engine_status) {
      global.commandState.last_seen = Date.now();
  }

  return NextResponse.json({ success: true });
}
