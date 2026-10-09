function Dashboard() {
  return (
    <div style={{ padding: "30px" }}>
      <h1>📚 ReadSync Dashboard</h1>

      <div
        style={{
          display: "flex",
          gap: "20px",
          marginTop: "20px",
        }}
      >
        <div
          style={{
            padding: "20px",
            border: "1px solid #444",
            borderRadius: "10px",
          }}
        >
          <h2>Total Books</h2>
          <p>0</p>
        </div>

        <div
          style={{
            padding: "20px",
            border: "1px solid #444",
            borderRadius: "10px",
          }}
        >
          <h2>Currently Reading</h2>
          <p>0</p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;