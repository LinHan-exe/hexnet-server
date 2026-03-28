"use client";
import { useEffect, useState } from 'react';

export default function Home() {
  const [data, setData] = useState([]);
  const [lastUpdate, setLastUpdate] = useState("Connecting...");
  const [cmd, setCmd] = useState({
    status: 'idle', engine_status: 'offline', mode: 'Generate Random Strategies', strategy: '', sims: 1000, sort: 'Composite Score (Best Overall)', auto: true, available_strats: [],
    adv_enabled: false, sma_min: 10, sma_max: 200, tp_min: 0.5, tp_max: 5.0, sl_min: 0.5, sl_max: 3.0, logic_max: 2, ideal_tpd: 2.0, ideal_ev: 10.0, use_genetic: false,
    progress: 0, total_sims: 1000
  });

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const resData = await fetch('/api/upload');
        const jsonData = await resData.json();
        if (jsonData && jsonData.length > 0) setData(jsonData);
        
        const resCmd = await fetch('/api/command');
        const jsonCmd = await resCmd.json();
        if (jsonCmd) setCmd(jsonCmd);

        setLastUpdate(new Date().toLocaleTimeString());
      } catch (err) { 
        console.error(err);
        setLastUpdate("Offline / Error");
      }
    };
    fetchAll();
    const interval = setInterval(fetchAll, 10000);
    return () => clearInterval(interval);
  }, []);

  const sendCommand = async (updates) => {
    const newState = { ...cmd, ...updates };
    setCmd(newState);
    await fetch('/api/command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
  };

  return (
    <div style={{ backgroundColor: '#0d1117', color: '#d1d4dc', minHeight: '100vh', padding: '40px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: '1500px', margin: '0 auto' }}>
        
        {/* Header Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #2b2b36', paddingBottom: '20px', marginBottom: '20px', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ flex: '1 1 300px' }}>
            <h1 style={{ margin: '0 0 5px 0', fontSize: '28px', color: '#ffffff' }}>Hexnet Remote Command</h1>
            <p style={{ margin: 0, color: cmd.engine_status === 'running' ? '#26a69a' : cmd.engine_status === 'offline' ? '#ef5350' : '#ffb74d', fontWeight: 'bold' }}>
              ● Engine Status: {(cmd.engine_status || 'OFFLINE').toUpperCase()} 
              <span style={{ color: '#787b86', fontWeight: 'normal', marginLeft: '10px' }}>(Sync: {lastUpdate})</span>
            </p>
            {cmd.engine_status === 'running' && (
              <div style={{ marginTop: '15px', maxWidth: '400px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#787b86', marginBottom: '4px' }}>
                  <span>Optimization Progress</span>
                  <span>{cmd.progress} / {cmd.total_sims}</span>
                </div>
                <div style={{ width: '100%', backgroundColor: '#2b2b36', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(100, (cmd.progress / (cmd.total_sims || 1)) * 100)}%`, backgroundColor: '#26a69a', height: '100%', transition: 'width 0.5s' }} />
                </div>
              </div>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: '15px' }}>
            <button onClick={() => sendCommand({ status: 'sync_requested' })} disabled={cmd.status === 'sync_requested' || cmd.engine_status === 'offline'} style={{ backgroundColor: '#3b2a22', color: '#ffb74d', border: '1px solid #ffb74d', padding: '10px 20px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', opacity: (cmd.status === 'sync_requested' || cmd.engine_status === 'offline') ? 0.5 : 1 }}>
              {cmd.status === 'sync_requested' ? 'Syncing...' : '↻ Force Desktop Sync'}
            </button>
            <a href="/api/upload?download=true" download="hexnet_strategies.csv" style={{ backgroundColor: '#2962ff', color: 'white', padding: '10px 20px', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold' }}>↓ Download CSV</a>
          </div>
        </div>

        {/* Command Panel */}
        <div style={{ backgroundColor: '#1e222d', padding: '20px', borderRadius: '8px', border: '1px solid #2b2b36', marginBottom: '30px' }}>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: cmd.adv_enabled ? '20px' : '0' }}>
            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', flex: 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: '1 1 220px' }}>
                <label style={{ fontSize: '12px', color: '#787b86', fontWeight: 'bold' }}>MODE</label>
                <select value={cmd.mode} onChange={(e) => sendCommand({ mode: e.target.value })} style={{ padding: '10px', backgroundColor: '#0d1117', color: 'white', border: '1px solid #333', borderRadius: '4px' }}>
                  <option>Generate Random Strategies</option><option>Optimize Existing Strategy</option>
                </select>
              </div>
              {cmd.mode === 'Optimize Existing Strategy' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: '1 1 220px' }}>
                  <label style={{ fontSize: '12px', color: '#787b86', fontWeight: 'bold' }}>BASE STRATEGY</label>
                  <select value={cmd.strategy} onChange={(e) => sendCommand({ strategy: e.target.value })} style={{ padding: '10px', backgroundColor: '#0d1117', color: 'white', border: '1px solid #333', borderRadius: '4px' }}>
                    {(cmd.available_strats || []).map((s, i) => <option key={i} value={s}>{s}</option>)}
                  </select>
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', width: '120px' }}>
                <label style={{ fontSize: '12px', color: '#787b86', fontWeight: 'bold' }}>SIMULATIONS</label>
                <input type="number" value={cmd.sims} onChange={(e) => sendCommand({ sims: parseInt(e.target.value) })} style={{ padding: '10px', backgroundColor: '#0d1117', color: 'white', border: '1px solid #333', borderRadius: '4px' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: '1 1 220px' }}>
                <label style={{ fontSize: '12px', color: '#787b86', fontWeight: 'bold' }}>SORT BY</label>
                <select value={cmd.sort} onChange={(e) => sendCommand({ sort: e.target.value })} style={{ padding: '10px', backgroundColor: '#0d1117', color: 'white', border: '1px solid #333', borderRadius: '4px' }}>
                  <option>Composite Score (Best Overall)</option><option>Strategy Sharpe</option>
                  <option>Expected Value (EV)</option><option>Strategy Alpha</option><option>Net PnL</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ffb74d', fontWeight: 'bold', cursor: 'pointer', padding: '10px' }}>
                <input type="checkbox" checked={cmd.adv_enabled} onChange={(e) => sendCommand({ adv_enabled: e.target.checked })} style={{ width: '18px', height: '18px' }} /> Adv. Ranges
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ab47bc', fontWeight: 'bold', cursor: 'pointer', padding: '10px' }}>
                <input type="checkbox" checked={cmd.use_genetic} onChange={(e) => sendCommand({ use_genetic: e.target.checked })} style={{ width: '18px', height: '18px' }} /> 🧬 Genetic AI
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#26a69a', fontWeight: 'bold', cursor: 'pointer', padding: '10px' }}>
                <input type="checkbox" checked={cmd.auto} onChange={(e) => sendCommand({ auto: e.target.checked })} style={{ width: '18px', height: '18px' }} /> Auto-Loop
              </label>
              <button onClick={() => sendCommand({ status: 'start_requested' })} disabled={cmd.engine_status === 'running' || cmd.status === 'start_requested' || cmd.engine_status === 'offline'} style={{ backgroundColor: '#26a69a', color: 'white', border: 'none', padding: '12px 30px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', opacity: (cmd.engine_status === 'running' || cmd.status === 'start_requested' || cmd.engine_status === 'offline') ? 0.5 : 1 }}>
                {cmd.status === 'start_requested' ? 'STARTING...' : 'START'}
              </button>
              <button onClick={() => sendCommand({ status: 'stop_requested' })} disabled={cmd.engine_status === 'idle' || cmd.engine_status === 'offline' || cmd.status === 'stop_requested'} style={{ backgroundColor: '#ef5350', color: 'white', border: 'none', padding: '12px 30px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', opacity: (cmd.engine_status === 'idle' || cmd.engine_status === 'offline' || cmd.status === 'stop_requested') ? 0.5 : 1 }}>
                {cmd.status === 'stop_requested' ? 'STOPPING...' : 'STOP'}
              </button>
            </div>
          </div>

          {/* Advanced Settings Dropdown */}
          {cmd.adv_enabled && (
            <div style={{ borderTop: '1px solid #2b2b36', paddingTop: '20px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '12px', color: '#787b86', fontWeight: 'bold' }}>SMA MIN / MAX</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input type="number" value={cmd.sma_min} onChange={(e) => sendCommand({ sma_min: parseInt(e.target.value) })} style={{ width: '80px', padding: '8px', backgroundColor: '#0d1117', color: 'white', border: '1px solid #333', borderRadius: '4px' }} />
                  <input type="number" value={cmd.sma_max} onChange={(e) => sendCommand({ sma_max: parseInt(e.target.value) })} style={{ width: '80px', padding: '8px', backgroundColor: '#0d1117', color: 'white', border: '1px solid #333', borderRadius: '4px' }} />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '12px', color: '#787b86', fontWeight: 'bold' }}>TP (xATR) MIN / MAX</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input type="number" step="0.1" value={cmd.tp_min} onChange={(e) => sendCommand({ tp_min: parseFloat(e.target.value) })} style={{ width: '80px', padding: '8px', backgroundColor: '#0d1117', color: 'white', border: '1px solid #333', borderRadius: '4px' }} />
                  <input type="number" step="0.1" value={cmd.tp_max} onChange={(e) => sendCommand({ tp_max: parseFloat(e.target.value) })} style={{ width: '80px', padding: '8px', backgroundColor: '#0d1117', color: 'white', border: '1px solid #333', borderRadius: '4px' }} />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '12px', color: '#787b86', fontWeight: 'bold' }}>SL (xATR) MIN / MAX</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input type="number" step="0.1" value={cmd.sl_min} onChange={(e) => sendCommand({ sl_min: parseFloat(e.target.value) })} style={{ width: '80px', padding: '8px', backgroundColor: '#0d1117', color: 'white', border: '1px solid #333', borderRadius: '4px' }} />
                  <input type="number" step="0.1" value={cmd.sl_max} onChange={(e) => sendCommand({ sl_max: parseFloat(e.target.value) })} style={{ width: '80px', padding: '8px', backgroundColor: '#0d1117', color: 'white', border: '1px solid #333', borderRadius: '4px' }} />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '12px', color: '#787b86', fontWeight: 'bold' }}>MAX LOGIC GATES</label>
                <input type="number" value={cmd.logic_max} onChange={(e) => sendCommand({ logic_max: parseInt(e.target.value) })} style={{ width: '100px', padding: '8px', backgroundColor: '#0d1117', color: 'white', border: '1px solid #333', borderRadius: '4px' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '12px', color: '#787b86', fontWeight: 'bold' }}>IDEAL MAX TRADES/DAY</label>
                <input type="number" step="0.5" value={cmd.ideal_tpd} onChange={(e) => sendCommand({ ideal_tpd: parseFloat(e.target.value) })} style={{ width: '140px', padding: '8px', backgroundColor: '#0d1117', color: 'white', border: '1px solid #333', borderRadius: '4px' }} />
              </div>
              {/* NEW: IDEAL EV INPUT */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '12px', color: '#ab47bc', fontWeight: 'bold' }}>IDEAL EV ($)</label>
                <input type="number" step="1.0" value={cmd.ideal_ev} onChange={(e) => sendCommand({ ideal_ev: parseFloat(e.target.value) })} style={{ width: '100px', padding: '8px', backgroundColor: '#0d1117', color: 'white', border: '1px solid #333', borderRadius: '4px' }} />
              </div>
            </div>
          )}
        </div>

        {/* Data Table */}
        {data.length === 0 ? ( 
          <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#131722', borderRadius: '8px', border: '1px solid #2b2b36' }}> 
            <h3 style={{ color: '#787b86' }}>Waiting for Python Engine...</h3> 
          </div> 
        ) : ( 
          <div style={{ overflowX: 'auto', backgroundColor: '#131722', borderRadius: '8px', border: '1px solid #2b2b36' }}> 
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}> 
              <thead> 
                <tr style={{ backgroundColor: '#1e222d', borderBottom: '1px solid #2b2b36', fontSize: '14px', textTransform: 'uppercase' }}> 
                  <th style={{ padding: '15px 20px', color: '#787b86' }}>Rank</th> 
                  <th style={{ padding: '15px 20px', color: '#787b86' }}>SQN Sharpe</th> 
                  <th style={{ padding: '15px 20px', color: '#787b86' }}>Win Rate</th> 
                  <th style={{ padding: '15px 20px', color: '#787b86' }}>Trades</th> 
                  <th style={{ padding: '15px 20px', color: '#787b86' }}>Net PnL</th> 
                  <th style={{ padding: '15px 20px', color: '#787b86' }}>Exp. Value</th> 
                  <th style={{ padding: '15px 20px', color: '#ffb74d' }}>Alpha</th> 
                  <th style={{ padding: '15px 20px', color: '#787b86' }}>SMA Length</th> 
                </tr> 
              </thead> 
              <tbody> 
                {data.slice(0, 10).map((row, i) => ( 
                  <tr key={i} style={{ borderBottom: '1px solid #2b2b36', transition: 'background-color 0.2s', ':hover': { backgroundColor: '#1e222d' } }}> 
                    <td style={{ padding: '15px 20px', fontWeight: 'bold', color: '#ffffff' }}>#{i + 1}</td> 
                    <td style={{ padding: '15px 20px', fontWeight: 'bold', color: row.Sharpe >= 1.0 ? '#26a69a' : '#ef5350' }}>{row.Sharpe?.toFixed(2)}</td> 
                    <td style={{ padding: '15px 20px' }}>{row.WinRate?.toFixed(1)}%</td> 
                    <td style={{ padding: '15px 20px' }}>{row.Trades}</td> 
                    <td style={{ padding: '15px 20px', color: row.PnL >= 0 ? '#26a69a' : '#ef5350' }}>{row.PnL?.toFixed(2)}</td> 
                    <td style={{ padding: '15px 20px', fontWeight: 'bold', color: '#ab47bc' }}>{row.EV?.toFixed(2)}</td> 
                    <td style={{ padding: '15px 20px', color: row.Alpha >= 0 ? '#ffb74d' : '#ef5350', fontWeight: 'bold' }}>{row.Alpha?.toFixed(2)}</td> 
                    <td style={{ padding: '15px 20px', color: '#2962ff', fontWeight: 'bold' }}>{row.SMA || row.s1_SMA || "N/A"}</td> 
                  </tr> 
                ))} 
              </tbody> 
            </table> 
          </div> 
        )}
      </div>
    </div>
  );
}
