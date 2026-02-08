(function () {
    // Intercept window.ethereum
    const originalRequest = window.ethereum ? window.ethereum.request : null;

    if (!originalRequest) {
        console.log("Walletwork Firewall: MetaMask not detected (yet).");
        return;
    }

    window.ethereum.request = async function (args) {
        if (args.method === 'eth_sendTransaction') {
            const params = args.params[0];
            console.log("Walletwork Firewall: Intercepting transaction...", params);

            // Send request to content.js (via window event) to analyze
            const riskCheck = new Promise((resolve, reject) => {
                const reqId = Math.random().toString(36).substring(7);

                const handler = (event) => {
                    if (event.data.type === 'WALLETWORK_DECISION' && event.data.reqId === reqId) {
                        window.removeEventListener('message', handler);
                        if (event.data.decision === 'PROCEED') {
                            resolve(true);
                        } else {
                            reject(new Error("Transaction rejected by Walletwork Firewall: " + event.data.reason));
                        }
                    }
                };
                window.addEventListener('message', handler);

                // Dispatch event to content.js
                window.postMessage({
                    type: 'WALLETWORK_ANALYZE',
                    payload: params,
                    reqId: reqId
                }, '*');
            });

            try {
                await riskCheck;
                console.log("Walletwork Firewall: Transaction Approved. Proceeding to MetaMask.");
                return originalRequest.call(window.ethereum, args);
            } catch (err) {
                console.error(err);
                throw err;
            }
        }

        // Pass through other requests (eth_accounts, etc.)
        return originalRequest.call(window.ethereum, args);
    };

    console.log("Walletwork Firewall: Interceptor active.");
})();
