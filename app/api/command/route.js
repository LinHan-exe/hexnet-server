export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

// Initialize the global state cache if it doesn't exist
global.commandState = global.commandState || {
  status: 'idle', 
  engine_status: 'offline', 
  last_seen: 0,
  mode: 'Generate Random Strategies', 
  strategy: '', 
  sims: 1000, 
  sort: 'Composite Score (Best Overall)', 
  auto: true, 
  available_strats: [],
  adv_enabled: false, sma_min: 10, sma_max: 200, tp_min: 0.5, tp_max: 5.0, sl_min: 0.5, sl_max: 3.0, logic_max: 2, 
  ideal_tpd: 2.0, 
  ideal_ev: 10.0, 
  use_genetic: false,
  progress: 0, 
  total_sims: 1000, 
  eta: '--:--:--', 
  sims_sec: 0
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
  try {
      const body = await req.json();
      
      // The spread operator beautifully overwrites only the keys Python sends
      global.commandState = { ...global.commandState, ...body };

      // If Python is checking in, update the stopwatch!
      if (body.engine_status) {
          global.commandState.last_seen = Date.now();
      }

      return NextResponse.json({ success: true });
      
  } catch (error) {
      // Prevents Vercel from crashing if a corrupted payload arrives
      return NextResponse.json({ success: false, error: "Invalid JSON payload" }, { status: 400 });
  }
}
