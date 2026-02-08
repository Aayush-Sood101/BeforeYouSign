import { analyzeTx } from "./api.js";

document.getElementById("analyze").onclick = async () => {
  const wallet = document.getElementById("wallet").value;
  const contract = document.getElementById("contract").value;
  const tx = document.getElementById("tx").value;

  const result = await analyzeTx({
    wallet,
    contract,
    tx_type: tx
  });

  document.getElementById("result").textContent =
    JSON.stringify(result, null, 2);
};
