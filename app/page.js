"use client";
import { useEffect, useState, useRef } from 'react';

export default function Home() {
  const [data, setData] = useState([]);
  const [lastUpdate, setLastUpdate] = useState("Connecting...");
  const isFirstLoad = useRef(true); 

  const [cmd, setCmd] = useState({
    status: 'idle', engine_status: 'offline', mode: 'Generate Random Strategies', strategy: '', sims: 1000, sort: 'Composite Score (Best Overall)', auto: true, available_strats: [],
    adv_enabled: false, sma_min: 10, sma_max: 200, tp_min: 0.5, tp_max: 5.0, sl_min: 0.5, sl_max: 3.0, logic_max: 2, ideal_tpd: 2.0, ideal_ev: 10.0, 
    min_wfe: 0.0, // <--- ADDED TO STATE
    use_genetic: false,
    progress: 0, total_sims: 1000,
    data_ticker: 'NONE', data_start: 'N/A', data_end: 'N/A', fetch_ticker: 'SPY', fetch_interval: '1m', fetch_start: '', fetch_end: '', fetch_rth: true, fetch_pct: 0,
    is_start: '', is_end: '', oos_start: '', oos_end: ''
  });

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const resData = await fetch('/api/upload');
        const jsonData = await resData.json();
        if (jsonData && jsonData.length > 0) setData(jsonData);
        
        const resCmd = await fetch('/api/command');
        const jsonCmd = await resCmd.json();
        
        if (jsonCmd) {
          setCmd(prev => {
            if (isFirstLoad.current) {
              isFirstLoad.current = false;
              return jsonCmd;
            }
            return {
              ...prev,
              engine_status: jsonCmd.engine_status,
              progress: jsonCmd.progress,
              total_sims: jsonCmd.total_sims,
              eta: jsonCmd.eta,
              sims_sec: jsonCmd.sims_sec,
              data_ticker: jsonCmd.data_ticker,
              data_start: jsonCmd.data_start,
              data_end: jsonCmd.data_end,
              status: jsonCmd.status,
              fetch_pct: jsonCmd.fetch_pct
            };
          });
        }
        setLastUpdate(new Date().toLocaleTimeString());
      } catch (err) { 
        setLastUpdate("Offline / Error");
      }
    };
    
    fetchAll();
    const interval = setInterval(fetchAll, 5000);
    return () => clearInterval(interval);
  }, []);

  const sendCommand = async (updates) => {
    const newState = { ...cmd, ...updates };
    setCmd(newState);
    await fetch('/api/command', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(newState) 
    });
  };

  const inputStyle = { padding: '10px', backgroundColor: '#0d1117', color: 'white', border: '1px solid #333', borderRadius: '4px' };

  return (
    <div style={{ backgroundColor: '#0d1117', color: '#d1d4dc', minHeight: '100vh', padding: '40px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: '1500px', margin: '0 auto' }}>
        
        {/* Header Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #2b2b36', paddingBottom: '20px', marginBottom: '20px', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ flex: '1 1 300px' }}>
            <h1 style={{ margin: '0 0 5px 0', fontSize: '28px', color: '#ffffff' }}>Hexnet Remote Command</h1>
            <p style={{ margin: 0, color: cmd.engine_status === 'running' || cmd.engine_status === 'fetching' ? '#26a69a' : cmd.engine_status === 'offline' ? '#ef5350' : '#ffb74d', fontWeight: 'bold' }}>
              ● Engine Status: {(cmd.engine_status || 'OFFLINE').toUpperCase()} 
              {cmd.engine_status === 'fetching' && (
                 <span style={{ color: '#29b6f6', marginLeft: '10px' }}>[{cmd.fetch_pct !== undefined ? cmd.fetch_pct : 0}%]</span>
              )}
              <span style={{ color: '#787b86', fontWeight: 'normal', marginLeft: '10px' }}>(Sync: {lastUpdate})</span>
            </p>
            
            {cmd.engine_status === 'running' && (
              <div style={{ marginTop: '20px', width: '100%', maxWidth: '550px', backgroundColor: '#1e1e24', padding: '16px', borderRadius: '8px', border: '1px solid #333' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px', fontWeight: 'bold' }}>
                  <span style={{ color: '#ffffff' }}>Optimization Progress</span>
                  <span style={{ color: '#26a69a' }}>{((cmd.progress / (cmd.total_sims || 1)) * 100).toFixed(1)}%</span>
                </div>
                <div style={{ width: '100%', backgroundColor: '#2b2b36', height: '8px', borderRadius: '4px', overflow: 'hidden', marginBottom: '14px' }}>
                  <div style={{ width: `${Math.min(100, (cmd.progress / (cmd.total_sims || 1)) * 100)}%`, backgroundColor: '#26a69a', height: '100%', transition: 'width 0.3s ease' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#a0a0a0', fontFamily: 'monospace' }}>
                  <span><span style={{ color: '#ffffff' }}>{cmd.progress?.toLocaleString()}</span> {" / "}{cmd.total_sims?.toLocaleString()} Sims</span>
                  <span style={{ color: '#444' }}>|</span>
                  <span style={{ color: '#ab47bc' }}>Speed: {cmd.sims_sec?.toLocaleString() || 0} / sec</span>
                  <span style={{ color: '#444' }}>|</span>
                  <span style={{ color: '#ffb74d' }}>ETA: {cmd.eta || '--:--:--'}</span>
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

        {/* Data & Feature Engineering Panel */}
        <div style={{ backgroundColor: '#161b22', padding: '20px', borderRadius: '8px', border: '1px solid #2b2b36', marginBottom: '20px', display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ margin: '0 0 10px 0', color: '#29b6f6' }}>Data Engine</h3>
            <p style={{ margin: 0, color: '#a0a0a0', fontSize: '14px' }}>
              Currently Loaded: <strong style={{ color: '#fff' }}>{cmd.data_ticker}</strong> | Window: <strong style={{ color: '#fff' }}>{cmd.data_start}</strong> to <strong style={{ color: '#fff' }}>{cmd.data_end}</strong>
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '12px', color: '#787b86', fontWeight: 'bold' }}>TICKER</label>
              <input type="text" value={cmd.fetch_ticker} onChange={(e) => sendCommand({ fetch_ticker: e.target.value.toUpperCase() })} style={{ width: '80px', ...inputStyle }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '12px', color: '#787b86', fontWeight: 'bold' }}>INTERVAL</label>
              <select value={cmd.fetch_interval} onChange={(e) => sendCommand({ fetch_interval: e.target.value })} style={inputStyle}>
                <option>1m</option><option>5m</option><option>15m</option><option>1h</option><option>1d</option>
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '12px', color: '#787b86', fontWeight: 'bold' }}>START DATE</label>
              <input type="date" value={cmd.fetch_start} onChange={(e) => sendCommand({ fetch_start: e.target.value })} style={inputStyle} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '12px', color: '#787b86', fontWeight: 'bold' }}>END DATE</label>
              <input type="date" value={cmd.fetch_end} onChange={(e) => sendCommand({ fetch_end: e.target.value })} style={inputStyle} />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontSize: '13px', cursor: 'pointer', padding: '10px' }}>
              <input type="checkbox" checked={cmd.fetch_rth} onChange={(e) => sendCommand({ fetch_rth: e.target.checked })} style={{ width: '16px', height: '16px' }} /> Hide Ext. Hours
            </label>
            <button onClick={() => sendCommand({ status: 'fetch_requested' })} disabled={cmd.status === 'fetch_requested' || cmd.engine_status === 'fetching' || cmd.engine_status === 'offline'} style={{ backgroundColor: '#29b6f6', color: '#000', border: 'none', padding: '10px 20px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', opacity: (cmd.status === 'fetch_requested' || cmd.engine_status === 'fetching' || cmd.engine_status === 'offline') ? 0.5 : 1 }}>
              {cmd.status === 'fetch_requested' || cmd.engine_status === 'fetching' ? 'FETCHING...' : 'REMOTE FETCH'}
            </button>
          </div>
        </div>

        {/* Command Panel */}
        <div style={{ backgroundColor: '#1e222d', padding: '20px', borderRadius: '8px', border: '1px solid #2b2b36', marginBottom: '30px' }}>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', flex: 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: '1 1 200px' }}>
                <label style={{ fontSize: '12px', color: '#787b86', fontWeight: 'bold' }}>MODE</label>
                <select value={cmd.mode} onChange={(e) => sendCommand({ mode: e.target.value })} style={inputStyle}>
                  <option>Generate Random Strategies</option><option>Optimize Existing Strategy</option>
                </select>
              </div>
              {cmd.mode === 'Optimize Existing Strategy' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: '1 1 200px' }}>
                  <label style={{ fontSize: '12px', color: '#787b86', fontWeight: 'bold' }}>BASE STRATEGY</label>
                  <select value={cmd.strategy} onChange={(e) => sendCommand({ strategy: e.target.value })} style={inputStyle}>
                    {(cmd.available_strats || []).map((s, i) => <option key={i} value={s}>{s}</option>)}
                  </select>
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', width: '120px' }}>
                <label style={{ fontSize: '12px', color: '#787b86', fontWeight: 'bold' }}>SIMULATIONS</label>
                <input type="number" value={cmd.sims} onChange={(e) => sendCommand({ sims: parseInt(e.target.value) })} style={inputStyle} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: '1 1 200px' }}>
                <label style={{ fontSize: '12px', color: '#787b86', fontWeight: 'bold' }}>SORT BY</label>
                <select value={cmd.sort} onChange={(e) => sendCommand({ sort: e.target.value })} style={inputStyle}>
                  <option>Composite Score (Best Overall)</option><option>Walk-Forward Efficiency (WFE)</option><option>Strategy Sharpe</option>
                  <option>Expected Value (EV)</option><option>Strategy Alpha</option><option>Net PnL</option>
                </select>
              </div>
            </div>
            
            {/* Walk-Forward Windows */}
            <div style={{ display: 'flex', gap: '15px', padding: '10px', backgroundColor: '#131722', borderRadius: '6px', border: '1px solid #333' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '12px', color: '#4CAF50', fontWeight: 'bold' }}>IN-SAMPLE WINDOW</label>
                <div style={{ display: 'flex', gap: '5px' }}>
                  <input type="date" value={cmd.is_start} onChange={(e) => sendCommand({ is_start: e.target.value })} style={inputStyle} title="Start Date" />
                  <input type="date" value={cmd.is_end} onChange={(e) => sendCommand({ is_end: e.target.value })} style={inputStyle} title="End Date" />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '12px', color: '#ab47bc', fontWeight: 'bold' }}>OOS WINDOW</label>
                <div style={{ display: 'flex', gap: '5px' }}>
                  <input type="date" value={cmd.oos_start} onChange={(e) => sendCommand({ oos_start: e.target.value })} style={inputStyle} title="Start Date" />
                  <input type="date" value={cmd.oos_end} onChange={(e) => sendCommand({ oos_end: e.target.value })} style={inputStyle} title="End Date" />
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '15px', borderTop: '1px solid #2b2b36', paddingTop: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ffb74d', fontWeight: 'bold', cursor: 'pointer' }}>
              <input type="checkbox" checked={cmd.adv_enabled} onChange={(e) => sendCommand({ adv_enabled: e.target.checked })} style={{ width: '18px', height: '18px' }} /> Adv. Ranges
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ab47bc', fontWeight: 'bold', cursor: 'pointer' }}>
              <input type="checkbox" checked={cmd.use_genetic} onChange={(e) => sendCommand({ use_genetic: e.target.checked })} style={{ width: '18px', height: '18px' }} /> 🧬 Genetic AI
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#26a69a', fontWeight: 'bold', cursor: 'pointer' }}>
              <input type="checkbox" checked={cmd.auto} onChange={(e) => sendCommand({ auto: e.target.checked })} style={{ width: '18px', height: '18px' }} /> Auto-Loop
            </label>
            <button onClick={() => sendCommand({ status: 'start_requested' })} disabled={cmd.engine_status === 'running' || cmd.status === 'start_requested' || cmd.engine_status === 'offline'} style={{ backgroundColor: '#26a69a', color: 'white', border: 'none', padding: '12px 30px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', opacity: (cmd.engine_status === 'running' || cmd.status === 'start_requested' || cmd.engine_status === 'offline') ? 0.5 : 1 }}>
              {cmd.status === 'start_requested' ? 'STARTING...' : 'START'}
            </button>
            <button onClick={() => sendCommand({ status: 'stop_requested' })} disabled={cmd.engine_status === 'idle' || cmd.engine_status === 'offline' || cmd.status === 'stop_requested'} style={{ backgroundColor: '#ef5350', color: 'white', border: 'none', padding: '12px 30px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', opacity: (cmd.engine_status === 'idle' || cmd.engine_status === 'offline' || cmd.status === 'stop_requested') ? 0.5 : 1 }}>
              {cmd.status === 'stop_requested' ? 'STOPPING...' : 'STOP'}
            </button>
          </div>

          {/* Advanced Settings Dropdown */}
          {cmd.adv_enabled && (
            <div style={{ borderTop: '1px solid #2b2b36', marginTop: '20px', paddingTop: '20px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '12px', color: '#787b86', fontWeight: 'bold' }}>SMA MIN / MAX</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input type="number" value={cmd.sma_min} onChange={(e) => sendCommand({ sma_min: parseInt(e.target.value) })} style={{ width: '80px', ...inputStyle }} />
                  <input type="number" value={cmd.sma_max} onChange={(e) => sendCommand({ sma_max: parseInt(e.target.value) })} style={{ width: '80px', ...inputStyle }} />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '12px', color: '#787b86', fontWeight: 'bold' }}>TP (xATR) MIN / MAX</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input type="number" step="0.1" value={cmd.tp_min} onChange={(e) => sendCommand({ tp_min: parseFloat(e.target.value) })} style={{ width: '80px', ...inputStyle }} />
                  <input type="number" step="0.1" value={cmd.tp_max} onChange={(e) => sendCommand({ tp_max: parseFloat(e.target.value) })} style={{ width: '80px', ...inputStyle }} />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '12px', color: '#787b86', fontWeight: 'bold' }}>SL (xATR) MIN / MAX</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input type="number" step="0.1" value={cmd.sl_min} onChange={(e) => sendCommand({ sl_min: parseFloat(e.target.value) })} style={{ width: '80px', ...inputStyle }} />
                  <input type="number" step="0.1" value={cmd.sl_max} onChange={(e) => sendCommand({ sl_max: parseFloat(e.target.value) })} style={{ width: '80px', ...inputStyle }} />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '12px', color: '#787b86', fontWeight: 'bold' }}>MAX LOGIC GATES</label>
                <input type="number" value={cmd.logic_max} onChange={(e) => sendCommand({ logic_max: parseInt(e.target.value) })} style={{ width: '100px', ...inputStyle }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '12px', color: '#787b86', fontWeight: 'bold' }}>IDEAL MAX TRADES/DAY</label>
                <input type="number" step="0.5" value={cmd.ideal_tpd} onChange={(e) => sendCommand({ ideal_tpd: parseFloat(e.target.value) })} style={{ width: '140px', ...inputStyle }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '12px', color: '#ab47bc', fontWeight: 'bold' }}>IDEAL EV ($)</label>
                <input type="number" step="1.0" value={cmd.ideal_ev} onChange={(e) => sendCommand({ ideal_ev: parseFloat(e.target.value) })} style={{ width: '100px', ...inputStyle }} />
              </div>
              {/* --- NEW: MIN WFE FILTER --- */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '12px', color: '#ab47bc', fontWeight: 'bold' }}>MIN WFE % FILTER</label>
                <input type="number" step="1.0" value={cmd.min_wfe} onChange={(e) => sendCommand({ min_wfe: parseFloat(e.target.value) })} style={{ width: '110px', ...inputStyle }} />
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
                  <th style={{ padding: '15px 20px', color: '#ab47bc' }}>WFE %</th> 
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
                    <td style={{ padding: '15px 20px', color: '#ab47bc', fontWeight: 'bold' }}>{row.WFE !== undefined ? `${row.WFE.toFixed(1)}%` : 'N/A'}</td> 
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
