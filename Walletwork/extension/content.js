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

        if (result.risk === 'SAFE') {
            // Auto-proceed for SAFE transactions
            window.postMessage({ type: 'WALLETWORK_DECISION', reqId, decision: 'PROCEED' }, '*');
        } else {
            // Show UI Warning for CAUTION and DANGEROUS
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

        let txType = 'transfer';
        if (tx.data && tx.data.startsWith('0x095ea7b3')) {
            txType = 'approve';
        } else if (tx.data && tx.data.length > 10) {
            txType = 'swap'; // Basic heuristic for smart contract interaction
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
        // Fail closed: return DANGEROUS if backend unreachable (security-first approach)
        return { risk: 'DANGEROUS', risk_score: 99, score: 99, reasons: ['Backend unreachable - cannot verify safety', err.toString()] };
    }
}

function showWarningModal(result, reqId) {
    // Determine risk level color and icon
    const isDangerous = result.risk === 'DANGEROUS';
    const isCaution = result.risk === 'CAUTION';
    
    const riskColor = isDangerous ? '#ef4444' : isCaution ? '#f59e0b' : '#10b981';
    const riskIcon = isDangerous ? '🔴' : isCaution ? '⚠️' : '✅';
    const riskTitle = isDangerous ? 'DANGEROUS Transaction' : isCaution ? 'CAUTION Required' : 'Safe Transaction';
    
    // Create Modal HTML with semantic color-coding
    const modal = document.createElement('div');
    modal.className = 'walletwork-overlay';
    modal.innerHTML = `
        <div class="walletwork-modal" style="border-color: ${riskColor};">
            <div class="walletwork-header" style="background: ${riskColor}20; border-bottom-color: ${riskColor};">
                <h2>${riskIcon} ${riskTitle}</h2>
            </div>
            <div class="walletwork-body">
                <div class="score-box" style="border-color: ${riskColor};">
                    <span class="score" style="color: ${riskColor};">${result.risk_score || result.score || 0}/100</span>
                    <span class="label" style="background: ${riskColor}; color: white;">${result.risk}</span>
                </div>
                <ul>
                    ${(result.reasons || []).map(r => `<li style="border-left-color: ${riskColor};">${r}</li>`).join('')}
                </ul>
                ${result.graph_signals?.connected_to_scam_cluster ?
            '<div class="scam-alert">🚨 Connected to Known Scam Cluster!</div>' : ''}
                ${result.forecast_signals?.drain_probability > 0.5 ?
            `<div class="forecast-alert">🔮 Drain Probability: ${Math.round(result.forecast_signals.drain_probability * 100)}%</div>` : ''}
            </div>
            <div class="walletwork-footer">
                <button id="ww-reject" class="btn-reject">REJECT TRANSACTION</button>
                ${!isDangerous ? '<button id="ww-proceed" class="btn-proceed">I Understand the Risk, Proceed</button>' : ''}
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Event Listeners
    document.getElementById('ww-reject').onclick = () => {
        window.postMessage({ type: 'WALLETWORK_DECISION', reqId, decision: 'REJECT', reason: 'User rejected transaction' }, '*');
        document.body.removeChild(modal);
    };

    const proceedBtn = document.getElementById('ww-proceed');
    if (proceedBtn) {
        proceedBtn.onclick = () => {
            window.postMessage({ type: 'WALLETWORK_DECISION', reqId, decision: 'PROCEED' }, '*');
            document.body.removeChild(modal);
        };
    }
}
