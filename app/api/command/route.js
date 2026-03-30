export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

// --- FIX 1: Initialize last_seen to Date.now() instead of 0 ---
// This prevents new server nodes from thinking Python died in 1970!
global.commandState = global.commandState || {
  status: 'idle', engine_status: 'syncing...', last_seen: Date.now(),
  mode: 'Generate Random Strategies', strategy: '', sims: 1000, 
  sort: 'Composite Score (Best Overall)', auto: true, available_strats: [],
  adv_enabled: false, sma_min: 10, sma_max: 200, tp_min: 0.5, tp_max: 5.0, sl_min: 0.5, sl_max: 3.0, logic_max: 2, 
  ideal_tpd: 2.0, ideal_ev: 10.0, use_genetic: false,
  progress: 0, total_sims: 1000, eta: '--:--:--', sims_sec: 0,
  data_ticker: 'NONE', data_start: 'N/A', data_end: 'N/A',
  fetch_ticker: 'SPY', fetch_interval: '1m', fetch_start: '', fetch_end: '', fetch_rth: true, fetch_pct: 0,
  is_start: '', is_end: '', oos_start: '', oos_end: ''
};

export async function GET() {
  const now = Date.now();
  
  // --- FIX 2: Only trigger OFFLINE if 30 seconds pass without a ping ---
  if (now - global.commandState.last_seen > 30000) {
      global.commandState.engine_status = 'offline';
      if (['sync_requested', 'stop_requested', 'fetch_requested'].includes(global.commandState.status)) {
          global.commandState.status = 'idle';
      }
  }
  return NextResponse.json(global.commandState);
}

export async function POST(req) {
  try {
      const body = await req.json();
      global.commandState = { ...global.commandState, ...body };
      if (body.engine_status) global.commandState.last_seen = Date.now();
      return NextResponse.json({ success: true });
  } catch (error) {
      return NextResponse.json({ success: false, error: "Invalid JSON payload" }, { status: 400 });
  }
}
