// Because current Manifest V3 'world: MAIN' executes inject.js in the main context,
// we can also put logic here. But usually content scripts run in ISOLATED world.
// However, the manifest setup "world": "MAIN" for content_scripts might be experimental or partial in some browsers.
// Standard approach: content.js (ISOLATED) injects a script tag for inject.js (MAIN).

// Let's use the standard injection method to be safe and robust.
function injectScript(file) {
    var th = document.getElementsByTagName('body')[0];
    var s = document.createElement('script');
    s.setAttribute('type', 'text/javascript');
    s.setAttribute('src', chrome.runtime.getURL(file));
    th.appendChild(s);
}

// Inject the interceptor immediately
injectScript('inject.js');

// Listen for messages from the injected script (MAIN world)
window.addEventListener('message', async (event) => {
    if (event.data.type === 'WALLETWORK_ANALYZE') {
        const { payload, reqId } = event.data;
        const result = await analyzeTransaction(payload);

        if (result.risk === 'SAFE' || result.risk === 'LOW') {
            // Auto-proceed
            window.postMessage({ type: 'WALLETWORK_DECISION', reqId, decision: 'PROCEED' }, '*');
        } else {
            // Show UI Warning
            showWarningModal(result, reqId);
        }
    }
});

async function analyzeTransaction(tx) {
    try {
        // Map Eth tx params to API params
        // tx.to -> contract (or recipient)
        // tx.from -> wallet
        // tx.data -> we can check if it looks like approve (0x095ea7b3)

        let txType = 'send';
        if (tx.data && tx.data.startsWith('0x095ea7b3')) {
            txType = 'approve';
        } else if (tx.data && tx.data.length > 10) {
            txType = 'swap'; // Basic heuristic
        }

        const response = await fetch('http://localhost:8000/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                wallet: tx.from,
                contract: tx.to,
                tx_type: txType
            })
        });
        return await response.json();
    } catch (err) {
        console.error("Analysis Error:", err);
        // Fail open or closed? Let's return error so it shows in logs but maybe let user decide?
        // returning High Risk just to be safe if backend down
        return { risk: 'HIGH_RISK', score: 99, reasons: ['Backend unreachable', err.toString()] };
    }
}

function showWarningModal(result, reqId) {
    // Create Modal HTML
    const modal = document.createElement('div');
    modal.className = 'walletwork-overlay';
    modal.innerHTML = `
        <div class="walletwork-modal">
            <div class="walletwork-header">
                <h2>⚠️ High Risk Detected</h2>
            </div>
            <div class="walletwork-body">
                <div class="score-box">
                    <span class="score">${result.score}/100</span>
                    <span class="label">${result.risk}</span>
                </div>
                <ul>
                    ${result.reasons.map(r => `<li>${r}</li>`).join('')}
                </ul>
                ${result.graph_signals?.connected_to_scam_cluster ?
            '<div class="scam-alert">🚨 Connected to Scam Cluster!</div>' : ''}
                ${result.forecast_signals?.drain_probability > 0.5 ?
            `<div class="forecast-alert">🔮 Drain Probability: ${Math.round(result.forecast_signals.drain_probability * 100)}%</div>` : ''}
            </div>
            <div class="walletwork-footer">
                <button id="ww-reject" class="btn-reject">REJECT TRANSACTION</button>
                <button id="ww-proceed" class="btn-proceed">I understand the risk, Proceed</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Event Listeners
    document.getElementById('ww-reject').onclick = () => {
        window.postMessage({ type: 'WALLETWORK_DECISION', reqId, decision: 'REJECT', reason: 'User rejected warning' }, '*');
        document.body.removeChild(modal);
    };

    document.getElementById('ww-proceed').onclick = () => {
        window.postMessage({ type: 'WALLETWORK_DECISION', reqId, decision: 'PROCEED' }, '*');
        document.body.removeChild(modal);
    };
}
