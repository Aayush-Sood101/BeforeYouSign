export default function Reasons({ reasons }) {
  return (
    <div style={{ marginTop: 20 }}>
      <h3>Why?</h3>
      <ul>
        {reasons.map((r, i) => (
          <li key={i}>{r}</li>
        ))}
      </ul>
    </div>
  );
}
