import axios from "axios";

export async function analyzeTx(payload) {
  const res = await axios.post("http://localhost:8000/analyze", payload);
  return res.data;
}
