"use client";
import { useEffect, useState, useRef } from 'react';

export default function Home() {
  const [data, setData] = useState([]);
  const [lastUpdate, setLastUpdate] = useState("Connecting...");
  
  const isFirstLoad = useRef(true); 
  const previousStatus = useRef('offline');

  // NEW: Tab State
  const [activeTab, setActiveTab] = useState('generator');

  const [cmd, setCmd] = useState({
    status: 'idle', engine_status: 'offline', mode: 'Generate Random Strategies', strategy: '', sims: 1000, sort: 'Composite Score (Best Overall)', auto: true, auto_max: 10, available_strats: [],
    active_strats: [], // <-- NEW
    adv_enabled: false, sma_min: 10, sma_max: 200, tp_min: 0.5, tp_max: 5.0, sl_min: 0.5, sl_max: 5.0, logic_max: 2, ideal_tpd: 3.0, ideal_ev: 10.0, 
    min_wfe: 50.0, min_wr: 40.0, min_pnl: 0.0, min_sharpe: 1.0,
    use_genetic: false, progress: 0, total_sims: 1000, eta: '--:--:--', sims_sec: 0,
    trade_progress: { current: 0, total: 0 }, // <-- NEW
    data_ticker: 'NONE', data_start: 'N/A', data_end: 'N/A', fetch_ticker: 'SPY', fetch_interval: '1m', fetch_start: '', fetch_end: '', fetch_rth: true, fetch_pct: 0,
    is_start: '', is_end: '', oos_list: [{ start: '', end: '' }],
    hv_start: '', hv_end: '', hv_oos_list: [{ start: '', end: '' }],
    lv_start: '', lv_end: '', lv_oos_list: [{ start: '', end: '' }],
    stage_text: ''
  });

  useEffect(() => {
    let timeoutId;

    // 1. Decoupled Data Fetcher (Only runs when absolutely necessary)
    const fetchTableData = async () => {
      try {
        const resData = await fetch('/api/upload');
        const jsonData = await resData.json();
        if (jsonData && jsonData.length > 0) setData(jsonData);
      } catch (err) {
        console.error("Data fetch error:", err);
      }
    };

    // Fetch the heavy data table once on initial load
    fetchTableData();

    // 2. Adaptive Status Poller
    const pollCommandState = async () => {
      try {
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
              engine_status: jsonCmd.engine_status, progress: jsonCmd.progress, total_sims: jsonCmd.total_sims, 
              eta: jsonCmd.eta, sims_sec: jsonCmd.sims_sec, data_ticker: jsonCmd.data_ticker, 
              data_start: jsonCmd.data_start, data_end: jsonCmd.data_end, status: jsonCmd.status, 
              fetch_pct: jsonCmd.fetch_pct, stage_text: jsonCmd.stage_text, auto_max: jsonCmd.auto_max,
              trade_progress: jsonCmd.trade_progress || prev.trade_progress // <-- Sync new trade progress
            };
          });

          // Smart Data Reloading
          const justFinished = previousStatus.current === 'running' && jsonCmd.engine_status === 'idle';
          const justSynced = previousStatus.current === 'sync_requested' && jsonCmd.status === 'idle';
          
          if (justFinished || justSynced) {
            fetchTableData();
          }
          
          // Track status for the next loop
          previousStatus.current = jsonCmd.engine_status === 'running' ? 'running' : jsonCmd.status;
        }
        setLastUpdate(new Date().toLocaleTimeString());

        // Adaptive Polling Speed
        const isBusy = jsonCmd?.engine_status === 'running' || jsonCmd?.engine_status === 'fetching';
        const nextPingDelay = isBusy ? 2000 : 15000; // 2s if active, 15s if asleep
        
        timeoutId = setTimeout(pollCommandState, nextPingDelay);

      } catch (err) { 
        setLastUpdate("Offline / Error");
        timeoutId = setTimeout(pollCommandState, 15000); // Back off to 15s if server errors
      }
    };
    
    // Kick off the infinite adaptive loop
    pollCommandState();
    
    return () => clearTimeout(timeoutId);
  }, []);

  const sendCommand = async (updates) => {
    const newState = { ...cmd, ...updates };
    setCmd(newState);
    await fetch('/api/command', { 
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newState) 
    });
  };

  // --- NEW: Tab specific logic functions ---
  const handleToggleStrategy = (stratName) => {
    let newActive = [...(cmd.active_strats || [])];
    if (newActive.includes(stratName)) {
      newActive = newActive.filter(s => s !== stratName);
    } else {
      newActive.push(stratName);
    }
    sendCommand({ active_strats: newActive });
  };

  const startBacktest = () => {
    sendCommand({ status: 'backtest_requested', mode: 'Backtest Specific Strategies' });
  };

  const tabStyle = (tabName) => ({
    padding: '12px 24px', cursor: 'pointer', fontWeight: 'bold',
    backgroundColor: activeTab === tabName ? '#2962ff' : '#1e222d',
    color: 'white', border: '1px solid #2b2b36', borderRadius: '6px 6px 0 0',
    marginRight: '5px', transition: '0.2s', marginBottom: '-1px'
  });

  const inputStyle = { padding: '8px', backgroundColor: '#0d1117', color: 'white', border: '1px solid #333', borderRadius: '4px', fontSize: '13px' };

  return (
    <div style={{ backgroundColor: '#0d1117', color: '#d1d4dc', minHeight: '100vh', padding: '40px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: '1500px', margin: '0 auto' }}>
        
        {/* Header Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #2b2b36', paddingBottom: '20px', marginBottom: '20px', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ flex: '1 1 300px' }}>
            <h1 style={{ margin: '0 0 5px 0', fontSize: '28px', color: '#ffffff' }}>Hexnet Remote Command</h1>
            <p style={{ margin: 0, color: cmd.engine_status === 'running' || cmd.engine_status === 'fetching' ? '#26a69a' : cmd.engine_status === 'offline' ? '#ef5350' : '#ffb74d', fontWeight: 'bold' }}>
              ● Engine Status: {(cmd.engine_status || 'OFFLINE').toUpperCase()} 
              {cmd.engine_status === 'fetching' && <span style={{ color: '#29b6f6', marginLeft: '10px' }}>[{cmd.fetch_pct !== undefined ? cmd.fetch_pct : 0}%]</span>}
              <span style={{ color: '#787b86', fontWeight: 'normal', marginLeft: '10px' }}>(Sync: {lastUpdate})</span>
            </p>
            
            {cmd.engine_status === 'running' && (
              <div style={{ marginTop: '20px', width: '100%', maxWidth: '550px', backgroundColor: '#1e1e24', padding: '16px', borderRadius: '8px', border: '1px solid #333' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px', fontWeight: 'bold' }}>
                  <span style={{ color: '#ffffff' }}>{cmd.stage_text ? cmd.stage_text : 'Optimization Progress'}</span>
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
            
            {/* NEW: Dedicated Trade Simulation Progress Bar */}
            {cmd.stage_text?.includes("Simulating Trades") && cmd.trade_progress?.total > 0 && (
              <div style={{ marginTop: '15px', width: '100%', maxWidth: '550px', backgroundColor: '#1e1e24', padding: '16px', borderRadius: '8px', border: '1px solid #2962ff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px', fontWeight: 'bold' }}>
                  <span style={{ color: '#ffffff' }}>Trade Engine Sync</span>
                  <span style={{ color: '#2962ff' }}>{((cmd.trade_progress.current / cmd.trade_progress.total) * 100).toFixed(1)}%</span>
                </div>
                <div style={{ width: '100%', backgroundColor: '#2b2b36', height: '8px', borderRadius: '4px', overflow: 'hidden', marginBottom: '8px' }}>
                  <div style={{ width: `${(cmd.trade_progress.current / cmd.trade_progress.total) * 100}%`, backgroundColor: '#2962ff', height: '100%', transition: 'width 0.2s linear' }} />
                </div>
                <div style={{ fontSize: '12px', color: '#a0a0a0' }}>{cmd.trade_progress.current.toLocaleString()} / {cmd.trade_progress.total.toLocaleString()} Bars Processed</div>
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

        {/* TABS NAVIGATION */}
        <div style={{ display: 'flex', borderBottom: '1px solid #2b2b36', marginBottom: '20px' }}>
          <div style={tabStyle('generator')} onClick={() => setActiveTab('generator')}>Strategy Generator</div>
          <div style={tabStyle('backtester')} onClick={() => setActiveTab('backtester')}>Live Backtester</div>
        </div>

        {/* TAB CONTENT: LIVE BACKTESTER */}
        {activeTab === 'backtester' && (
          <div style={{ backgroundColor: '#1e222d', padding: '30px', borderRadius: '0 8px 8px 8px', border: '1px solid #2b2b36' }}>
            <h2 style={{ margin: '0 0 10px 0', color: '#ffffff' }}>Live Strategy Backtester</h2>
            <p style={{ color: '#a0a0a0', marginBottom: '25px' }}>Select strategies loaded on the Hexnet Desktop to route them through the multi-threaded simulation engine remotely.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '30px', maxHeight: '500px', overflowY: 'auto', padding: '15px', backgroundColor: '#131722', border: '1px solid #2b2b36', borderRadius: '6px' }}>
              {cmd.available_strats && cmd.available_strats.length > 0 ? (
                cmd.available_strats.map((strat, i) => (
                  <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '10px', backgroundColor: (cmd.active_strats || []).includes(strat) ? '#2962ff33' : 'transparent', borderRadius: '4px', border: (cmd.active_strats || []).includes(strat) ? '1px solid #2962ff' : '1px solid transparent' }}>
                    <input 
                      type="checkbox" 
                      checked={(cmd.active_strats || []).includes(strat)}
                      onChange={() => handleToggleStrategy(strat)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '15px', fontWeight: 'bold', color: (cmd.active_strats || []).includes(strat) ? '#ffffff' : '#c9d1d9' }}>{strat}</span>
                  </label>
                ))
              ) : (
                <div style={{ color: '#8b949e', padding: '20px', textAlign: 'center' }}>No strategies currently synced from Hexnet.</div>
              )}
            </div>
            
            <button 
              onClick={startBacktest}
              disabled={!cmd.active_strats || cmd.active_strats.length === 0 || cmd.engine_status === 'running'}
              style={{ 
                padding: '14px 24px', fontSize: '16px',
                backgroundColor: (!cmd.active_strats || cmd.active_strats.length === 0 || cmd.engine_status === 'running') ? '#21262d' : '#4CAF50', 
                color: (!cmd.active_strats || cmd.active_strats.length === 0 || cmd.engine_status === 'running') ? '#8b949e' : 'white', 
                border: 'none', borderRadius: '6px', cursor: (!cmd.active_strats || cmd.active_strats.length === 0 || cmd.engine_status === 'running') ? 'not-allowed' : 'pointer', fontWeight: 'bold', width: '100%' 
              }}
            >
              {cmd.engine_status === 'running' ? 'Engine is busy...' : 'Run Backtest on Selected Strategies'}
            </button>
          </div>
        )}

        {/* TAB CONTENT: STRATEGY GENERATOR (Original UI block) */}
        {activeTab === 'generator' && (
          <>
            {/* Data & Feature Engineering Panel */}
            <div style={{ backgroundColor: '#161b22', padding: '15px', borderRadius: '0 8px 8px 8px', border: '1px solid #2b2b36', marginBottom: '15px', display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ margin: '0 0 10px 0', color: '#29b6f6', fontSize: '16px' }}>Data Engine</h3>
                <p style={{ margin: 0, color: '#a0a0a0', fontSize: '13px' }}>
                  Currently Loaded: <strong style={{ color: '#fff' }}>{cmd.data_ticker}</strong> | Window: <strong style={{ color: '#fff' }}>{cmd.data_start}</strong> to <strong style={{ color: '#fff' }}>{cmd.data_end}</strong>
                </p>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ fontSize: '11px', color: '#787b86', fontWeight: 'bold' }}>TICKER</label>
                  <input type="text" value={cmd.fetch_ticker} onChange={(e) => sendCommand({ fetch_ticker: e.target.value.toUpperCase() })} style={{ width: '80px', ...inputStyle }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ fontSize: '11px', color: '#787b86', fontWeight: 'bold' }}>INTERVAL</label>
                  <select value={cmd.fetch_interval} onChange={(e) => sendCommand({ fetch_interval: e.target.value })} style={inputStyle}>
                    <option>1m</option><option>5m</option><option>15m</option><option>1h</option><option>1d</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ fontSize: '11px', color: '#787b86', fontWeight: 'bold' }}>START DATE</label>
                  <input type="date" value={cmd.fetch_start} onChange={(e) => sendCommand({ fetch_start: e.target.value })} style={inputStyle} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ fontSize: '11px', color: '#787b86', fontWeight: 'bold' }}>END DATE</label>
                  <input type="date" value={cmd.fetch_end} onChange={(e) => sendCommand({ fetch_end: e.target.value })} style={inputStyle} />
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontSize: '12px', cursor: 'pointer', padding: '10px' }}>
                  <input type="checkbox" checked={cmd.fetch_rth} onChange={(e) => sendCommand({ fetch_rth: e.target.checked })} style={{ width: '16px', height: '16px' }} /> Hide Ext. Hours
                </label>
                <button onClick={() => sendCommand({ status: 'fetch_requested' })} disabled={cmd.status === 'fetch_requested' || cmd.engine_status === 'fetching' || cmd.engine_status === 'offline'} style={{ backgroundColor: '#29b6f6', color: '#000', border: 'none', padding: '8px 15px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', opacity: (cmd.status === 'fetch_requested' || cmd.engine_status === 'fetching' || cmd.engine_status === 'offline') ? 0.5 : 1 }}>
                  {cmd.status === 'fetch_requested' || cmd.engine_status === 'fetching' ? 'FETCHING...' : 'REMOTE FETCH'}
                </button>
              </div>
            </div>

            {/* Command Panel */}
            <div style={{ backgroundColor: '#1e222d', padding: '20px', borderRadius: '8px', border: '1px solid #2b2b36', marginBottom: '30px' }}>
              
              {/* ROW 1: Controls, Toggles, Buttons */}
              <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center', borderBottom: '1px solid #2b2b36', paddingBottom: '20px', marginBottom: '20px' }}>
                <select value={cmd.mode} onChange={(e) => sendCommand({ mode: e.target.value })} style={{...inputStyle, width: '220px'}}>
                  <option>Generate Random Strategies</option>
                  <option>Optimize Existing Strategy</option>
                  <option>Generate Advanced Optimal Strategy</option>
                </select>
                
                {cmd.mode === 'Optimize Existing Strategy' && (
                  <select value={cmd.strategy} onChange={(e) => sendCommand({ strategy: e.target.value })} style={{...inputStyle, width: '160px'}}>
                    {(cmd.available_strats || []).map((s, i) => <option key={i} value={s}>{s}</option>)}
                  </select>
                )}
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ fontSize: '12px', color: '#787b86', fontWeight: 'bold' }}>SIMS:</span>
                  <input type="number" value={cmd.sims} onChange={(e) => sendCommand({ sims: parseInt(e.target.value) })} style={{...inputStyle, width: '90px'}} />
                </div>
                
                <select value={cmd.sort} onChange={(e) => sendCommand({ sort: e.target.value })} style={{...inputStyle, width: '200px'}}>
                  <option>Composite Score (Best Overall)</option>
                  <option>Walk-Forward Efficiency (WFE)</option>
                  <option>Strategy Sharpe</option>
                  <option>Expected Value (EV)</option>
                  <option>Strategy Alpha</option>
                  <option>Net PnL</option>
                </select>

                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginLeft: 'auto' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ffb74d', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>
                    <input type="checkbox" checked={cmd.adv_enabled} onChange={(e) => sendCommand({ adv_enabled: e.target.checked })} style={{ width: '16px', height: '16px' }} /> Adv. Filters
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ab47bc', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>
                    <input type="checkbox" checked={cmd.use_genetic} onChange={(e) => sendCommand({ use_genetic: e.target.checked })} style={{ width: '16px', height: '16px' }} /> 🧬 Genetic
                  </label>

                  {/* AUTOLOOP CONTROLS */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#26a69a', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>
                      <input type="checkbox" checked={cmd.auto} onChange={(e) => sendCommand({ auto: e.target.checked })} style={{ width: '16px', height: '16px' }} /> Auto-Loop
                    </label>
                    {cmd.auto && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '5px', backgroundColor: '#131722', padding: '2px 6px', borderRadius: '4px', border: '1px solid #333' }}>
                        <span style={{ fontSize: '11px', color: '#787b86' }}>MAX:</span>
                        <input type="number" min="1" max="999" value={cmd.auto_max || 10} onChange={(e) => sendCommand({ auto_max: parseInt(e.target.value) || 1 })} style={{ width: '50px', backgroundColor: 'transparent', color: 'white', border: 'none', outline: 'none', fontSize: '13px' }} title="Max Auto-Loops" />
                      </div>
                    )}
                  </div>
                  
                  <button onClick={() => sendCommand({ status: 'start_requested' })} disabled={cmd.engine_status === 'running' || cmd.status === 'start_requested' || cmd.engine_status === 'offline'} style={{ backgroundColor: '#26a69a', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', opacity: (cmd.engine_status === 'running' || cmd.status === 'start_requested' || cmd.engine_status === 'offline') ? 0.5 : 1 }}>
                    {cmd.status === 'start_requested' ? 'STARTING...' : 'START'}
                  </button>
                  <button onClick={() => sendCommand({ status: 'stop_requested' })} disabled={cmd.engine_status === 'idle' || cmd.engine_status === 'offline' || cmd.status === 'stop_requested'} style={{ backgroundColor: '#ef5350', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', opacity: (cmd.engine_status === 'idle' || cmd.engine_status === 'offline' || cmd.status === 'stop_requested') ? 0.5 : 1 }}>
                    {cmd.status === 'stop_requested' ? 'STOPPING...' : 'STOP'}
                  </button>
                </div>
              </div>

              {/* ROW 2: Time Windows & Adv Filters */}
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                
                {/* Time Windows Container */}
                {cmd.mode === 'Generate Advanced Optimal Strategy' ? (
                  <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', flex: 1 }}>
                    {/* High Vol Panel */}
                    <div style={{ border: '1px solid #ef5350', padding: '10px', borderRadius: '6px', backgroundColor: '#131722', flex: 1, minWidth: '300px' }}>
                      <label style={{ fontSize: '12px', color: '#ef5350', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>HIGH-VOL IS WINDOW</label>
                      <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
                        <input type="date" value={cmd.hv_start} onChange={(e) => sendCommand({ hv_start: e.target.value })} style={{...inputStyle, flex: 1}} title="Start Date" />
                        <input type="date" value={cmd.hv_end} onChange={(e) => sendCommand({ hv_end: e.target.value })} style={{...inputStyle, flex: 1}} title="End Date" />
                      </div>
                      <label style={{ fontSize: '12px', color: '#ef5350', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>HIGH-VOL OOS WINDOWS</label>
                      {(cmd.hv_oos_list || [{start: '', end: ''}]).map((oos, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '5px', marginBottom: '5px' }}>
                          <input type="date" value={oos.start} onChange={(e) => { const l = [...cmd.hv_oos_list]; l[idx].start = e.target.value; sendCommand({ hv_oos_list: l }); }} style={{...inputStyle, flex: 1}} />
                          <input type="date" value={oos.end} onChange={(e) => { const l = [...cmd.hv_oos_list]; l[idx].end = e.target.value; sendCommand({ hv_oos_list: l }); }} style={{...inputStyle, flex: 1}} />
                          {idx > 0 && <button onClick={() => sendCommand({ hv_oos_list: cmd.hv_oos_list.filter((_, i) => i !== idx) })} style={{ backgroundColor: '#ef5350', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '0 10px', fontWeight: 'bold' }}>X</button>}
                        </div>
                      ))}
                      <button onClick={() => sendCommand({ hv_oos_list: [...(cmd.hv_oos_list || []), {start: '', end: ''}] })} style={{ backgroundColor: '#ef5350', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '5px', fontSize: '11px', fontWeight: 'bold', width: '100%' }}>+ Add Window</button>
                    </div>
                    {/* Low Vol Panel */}
                    <div style={{ border: '1px solid #26a69a', padding: '10px', borderRadius: '6px', backgroundColor: '#131722', flex: 1, minWidth: '300px' }}>
                      <label style={{ fontSize: '12px', color: '#26a69a', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>LOW-VOL IS WINDOW</label>
                      <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
                        <input type="date" value={cmd.lv_start} onChange={(e) => sendCommand({ lv_start: e.target.value })} style={{...inputStyle, flex: 1}} title="Start Date" />
                        <input type="date" value={cmd.lv_end} onChange={(e) => sendCommand({ lv_end: e.target.value })} style={{...inputStyle, flex: 1}} title="End Date" />
                      </div>
                      <label style={{ fontSize: '12px', color: '#26a69a', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>LOW-VOL OOS WINDOWS</label>
                      {(cmd.lv_oos_list || [{start: '', end: ''}]).map((oos, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '5px', marginBottom: '5px' }}>
                          <input type="date" value={oos.start} onChange={(e) => { const l = [...cmd.lv_oos_list]; l[idx].start = e.target.value; sendCommand({ lv_oos_list: l }); }} style={{...inputStyle, flex: 1}} />
                          <input type="date" value={oos.end} onChange={(e) => { const l = [...cmd.lv_oos_list]; l[idx].end = e.target.value; sendCommand({ lv_oos_list: l }); }} style={{...inputStyle, flex: 1}} />
                          {idx > 0 && <button onClick={() => sendCommand({ lv_oos_list: cmd.lv_oos_list.filter((_, i) => i !== idx) })} style={{ backgroundColor: '#ef5350', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '0 10px', fontWeight: 'bold' }}>X</button>}
                        </div>
                      ))}
                      <button onClick={() => sendCommand({ lv_oos_list: [...(cmd.lv_oos_list || []), {start: '', end: ''}] })} style={{ backgroundColor: '#26a69a', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '5px', fontSize: '11px', fontWeight: 'bold', width: '100%' }}>+ Add Window</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '15px', padding: '15px', backgroundColor: '#131722', borderRadius: '6px', border: '1px solid #333' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <label style={{ fontSize: '12px', color: '#4CAF50', fontWeight: 'bold' }}>IN-SAMPLE WINDOW</label>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <input type="date" value={cmd.is_start} onChange={(e) => sendCommand({ is_start: e.target.value })} style={inputStyle} title="Start Date" />
                        <input type="date" value={cmd.is_end} onChange={(e) => sendCommand({ is_end: e.target.value })} style={inputStyle} title="End Date" />
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <label style={{ fontSize: '12px', color: '#ab47bc', fontWeight: 'bold' }}>OOS WINDOWS</label>
                      {(cmd.oos_list || [{start: '', end: ''}]).map((oos, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '5px', marginBottom: '5px' }}>
                          <input type="date" value={oos.start} onChange={(e) => { const newList = [...cmd.oos_list]; newList[idx].start = e.target.value; sendCommand({ oos_list: newList }); }} style={inputStyle} title="Start Date" />
                          <input type="date" value={oos.end} onChange={(e) => { const newList = [...cmd.oos_list]; newList[idx].end = e.target.value; sendCommand({ oos_list: newList }); }} style={inputStyle} title="End Date" />
                          {idx > 0 && <button onClick={() => sendCommand({ oos_list: cmd.oos_list.filter((_, i) => i !== idx) })} style={{ backgroundColor: '#ef5350', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '0 10px', fontWeight: 'bold' }}>X</button>}
                        </div>
                      ))}
                      <button onClick={() => sendCommand({ oos_list: [...(cmd.oos_list || []), {start: '', end: ''}] })} style={{ backgroundColor: '#ab47bc', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '5px', fontSize: '12px', fontWeight: 'bold' }}>+ Add Window</button>
                    </div>
                  </div>
                )}

                {/* Advanced Settings Container */}
                {cmd.adv_enabled && (
                  <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', padding: '15px', backgroundColor: '#131722', borderRadius: '6px', border: '1px solid #ffb74d', flex: 1, minWidth: '400px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <label style={{ fontSize: '11px', color: '#787b86', fontWeight: 'bold' }}>SMA MIN/MAX</label>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <input type="number" value={cmd.sma_min} onChange={(e) => sendCommand({ sma_min: parseInt(e.target.value) })} style={{ width: '60px', ...inputStyle }} />
                        <input type="number" value={cmd.sma_max} onChange={(e) => sendCommand({ sma_max: parseInt(e.target.value) })} style={{ width: '60px', ...inputStyle }} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <label style={{ fontSize: '11px', color: '#787b86', fontWeight: 'bold' }}>TP MIN/MAX</label>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <input type="number" step="0.1" value={cmd.tp_min} onChange={(e) => sendCommand({ tp_min: parseFloat(e.target.value) })} style={{ width: '60px', ...inputStyle }} />
                        <input type="number" step="0.1" value={cmd.tp_max} onChange={(e) => sendCommand({ tp_max: parseFloat(e.target.value) })} style={{ width: '60px', ...inputStyle }} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <label style={{ fontSize: '11px', color: '#787b86', fontWeight: 'bold' }}>SL MIN/MAX</label>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <input type="number" step="0.1" value={cmd.sl_min} onChange={(e) => sendCommand({ sl_min: parseFloat(e.target.value) })} style={{ width: '60px', ...inputStyle }} />
                        <input type="number" step="0.1" value={cmd.sl_max} onChange={(e) => sendCommand({ sl_max: parseFloat(e.target.value) })} style={{ width: '60px', ...inputStyle }} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <label style={{ fontSize: '11px', color: '#787b86', fontWeight: 'bold' }}>MAX GATES</label>
                      <input type="number" value={cmd.logic_max} onChange={(e) => sendCommand({ logic_max: parseInt(e.target.value) })} style={{ width: '75px', ...inputStyle }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <label style={{ fontSize: '11px', color: '#ab47bc', fontWeight: 'bold' }}>IDEAL TPD</label>
                      <input type="number" step="0.5" value={cmd.ideal_tpd} onChange={(e) => sendCommand({ ideal_tpd: parseFloat(e.target.value) })} style={{ width: '75px', ...inputStyle }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <label style={{ fontSize: '11px', color: '#ab47bc', fontWeight: 'bold' }}>IDEAL EV ($)</label>
                      <input type="number" step="1.0" value={cmd.ideal_ev} onChange={(e) => sendCommand({ ideal_ev: parseFloat(e.target.value) })} style={{ width: '75px', ...inputStyle }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <label style={{ fontSize: '11px', color: '#ffb74d', fontWeight: 'bold' }}>MIN WFE %</label>
                      <input type="number" step="1.0" value={cmd.min_wfe} onChange={(e) => sendCommand({ min_wfe: parseFloat(e.target.value) })} style={{ width: '80px', ...inputStyle }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <label style={{ fontSize: '11px', color: '#ffb74d', fontWeight: 'bold' }}>MIN WR %</label>
                      <input type="number" step="1.0" value={cmd.min_wr} onChange={(e) => sendCommand({ min_wr: parseFloat(e.target.value) })} style={{ width: '80px', ...inputStyle }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <label style={{ fontSize: '11px', color: '#ffb74d', fontWeight: 'bold' }}>MIN NET PNL</label>
                      <input type="number" step="1.0" value={cmd.min_pnl} onChange={(e) => sendCommand({ min_pnl: parseFloat(e.target.value) })} style={{ width: '80px', ...inputStyle }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <label style={{ fontSize: '11px', color: '#ffb74d', fontWeight: 'bold' }}>MIN SHARPE</label>
                      <input type="number" step="0.1" value={cmd.min_sharpe} onChange={(e) => sendCommand({ min_sharpe: parseFloat(e.target.value) })} style={{ width: '80px', ...inputStyle }} />
                    </div>
                  </div>
                )}
              </div>
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
          </>
        )}

      </div>
    </div>
  );
}
