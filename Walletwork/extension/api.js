export async function analyzeTx(payload) {
  const res = await fetch("http://localhost:8000/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return res.json();
}
