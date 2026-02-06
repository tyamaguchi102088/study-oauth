import { useState, useEffect } from "react";

function App() {
  const [todos, setTodos] = useState([]);
  const API_URL = "http://localhost:3001";

  const fetchTodos = () => {
    fetch(`${API_URL}/todos`)
      .then((res) => res.json())
      .then((data) => setTodos(data))
      .catch((err) => console.error("Error fetching todos:", err));
  };

  useEffect(() => {
    fetchTodos();
    // デモ用に10秒ごとにポーリングして、スクリプトによる追加をリアルタイム反映させる
    const interval = setInterval(fetchTodos, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>Todo Dashboard</h1>
      <p>この画面はバッチ処理(M2M)の結果を表示しています。</p>
      <ul>
        {todos.map((todo) => (
          <li key={todo.id} style={{ marginBottom: "8px" }}>
            <strong>#{todo.id}</strong> {todo.title}
            <span
              style={{ fontSize: "0.8em", color: "#666", marginLeft: "10px" }}
            >
              ({new Date(todo.created_at).toLocaleString()})
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
