import { useState } from "react";

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [count, setCount] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage.content }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Request failed");
      }

      if (typeof data.count === "number") {
        setCount(data.count);
      }

      if (data.reply) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.reply },
        ]);
      }
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-2xl flex-col gap-4 rounded-xl bg-white p-6 shadow-sm dark:bg-zinc-900">
        <header className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Counter AI Agent
          </h1>
          <div className="text-sm text-zinc-600 dark:text-zinc-400">
            Current count:{" "}
            <span className="font-mono font-semibold">
              {count === null ? "(unknown)" : count}
            </span>
          </div>
        </header>

        <section className="flex h-80 flex-col gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50">
          <div className="flex-1 space-y-2 overflow-y-auto">
            {messages.length === 0 && (
              <p className="text-zinc-500">
                Ask me to increment, decrement, add, subtract, multiply, or divide
                the count. For example: &quot;Add 5 to the count&quot;.
              </p>
            )}
            {messages.map((m, idx) => (
              <div key={idx} className="flex flex-col">
                <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                  {m.role === "user" ? "You" : "Agent"}
                </span>
                <span>{m.content}</span>
              </div>
            ))}
          </div>
        </section>

        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <div className="flex gap-2">
            <input
              className="flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
              placeholder="Ask the agent to modify the count..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {loading ? "Thinking..." : "Send"}
            </button>
          </div>
          {error && (
            <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
          )}
        </form>
      </main>
    </div>
  );
}
