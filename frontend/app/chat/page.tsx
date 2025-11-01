"use client";
import { useState } from "react";

export default function ChatPage() {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");

  const sendMessage = () => {
    if (!input.trim()) return;
    setMessages([...messages, { role: "user", content: input }]);
    setTimeout(() => {
      setMessages((prev) => [...prev, { role: "ai", content: "Mock AI response ✅" }]);
    }, 600);
    setInput("");
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-50 p-6">
      <h1 className="text-2xl font-bold mb-4">DevPilot Chat</h1>

      <div className="w-full max-w-2xl border rounded p-4 bg-white h-[70vh] overflow-y-auto">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`mb-2 ${m.role === "user" ? "text-right" : "text-left"}`}
          >
            <span
              className={`inline-block px-3 py-2 rounded-lg ${
                m.role === "user" ? "bg-blue-600 text-white" : "bg-gray-200"
              }`}
            >
              {m.content}
            </span>
          </div>
        ))}
      </div>

      <div className="flex w-full max-w-2xl mt-4">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your code..."
          className="flex-grow border rounded-l p-2"
        />
        <button
          onClick={sendMessage}
          className="bg-blue-600 text-white px-4 rounded-r hover:bg-blue-700"
        >
          Send
        </button>
      </div>
    </div>
  );
}
