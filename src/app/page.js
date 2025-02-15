"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import dynamic from "next/dynamic";
import {
  FiSend, FiPlus, FiTrash2, FiTerminal, FiBook,
  FiSettings, FiRadio, FiServer, FiHash, FiClock, FiFolder, FiEye
} from "react-icons/fi";

const ReactJson = dynamic(() => import("react-json-view"), {
  ssr: false,
  loading: () => <div className="text-gray-400">Loading...</div>,
});

export default function HoppscotchClone() {
  const [method, setMethod] = useState("GET");
  const [url, setUrl] = useState("https://jsonplaceholder.typicode.com/posts");
  const [activeTab, setActiveTab] = useState("Params");
  const [queryParams, setQueryParams] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [body, setBody] = useState("{}");
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [responseType, setResponseType] = useState("json");
  const [showHistory, setShowHistory] = useState(false); // 🟢 Toggle History

  useEffect(() => {
    const storedHistory = JSON.parse(localStorage.getItem("requestHistory")) || [];
    setHistory(storedHistory);
  }, []);

  // ✅ Save Request History
  const saveToHistory = (newRequest) => {
    const updatedHistory = [newRequest, ...history.slice(0, 9)];
    setHistory(updatedHistory);
    localStorage.setItem("requestHistory", JSON.stringify(updatedHistory));
  };

  // ✅ Send API Request
  const sendRequest = async () => {
    try {
      setLoading(true);
      const config = {
        method: method.toLowerCase(),
        url,
        params: Object.fromEntries(queryParams.map(p => [p.key, p.value])),
        headers: Object.fromEntries(headers.map(h => [h.key, h.value])),
        data: activeTab === "Body" ? JSON.parse(body) : undefined
      };

      const startTime = Date.now();
      const res = await axios(config);
      setResponse({
        data: res.data,
        status: res.status,
        headers: res.headers,
        time: Date.now() - startTime
      });

      // Auto-detect response type
      const contentType = res.headers["content-type"];
      if (contentType.includes("json")) setResponseType("json");
      else if (contentType.includes("xml")) setResponseType("xml");
      else setResponseType("html");

      saveToHistory({ method, url, headers, body, time: new Date().toLocaleString() });
    } catch (err) {
      setResponse({
        error: {
          message: err.message,
          data: err.response?.data || "No response",
          status: err.response?.status || "Unknown"
        }
      });
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="min-h-screen bg-[#0D0D0D] text-white flex">
        {/* Sidebar Navigation */}
        <div className="w-16 border-r border-gray-800 flex flex-col items-center py-4">
          <NavIcon icon={<FiServer />} />
          <NavIcon icon={<FiRadio />} />
          <NavIcon icon={<FiHash />} />
          <button onClick={() => setShowHistory(!showHistory)} className="p-3 mb-2 rounded hover:bg-gray-800 text-gray-400">
            <FiClock />
          </button>
          <NavIcon icon={<FiFolder />} />
          <div className="flex-1" />
          <NavIcon icon={<FiSettings />} />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Request Bar */}
          <div className="flex items-center gap-4 p-4 border-b border-gray-800">
            <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="bg-gray-900 px-3 py-2 rounded border border-gray-700 w-24"
            >
              {["GET", "POST", "PUT", "DELETE", "PATCH"].map((m) => (
                  <option key={m} value={m} className="bg-gray-900">{m}</option>
              ))}
            </select>

            <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter URL"
                className="flex-1 bg-gray-900 px-4 py-2 rounded border border-gray-700 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            />

            <button
                onClick={sendRequest}
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded flex items-center gap-2"
            >
              <FiSend /> {loading ? "Sending..." : "Send"}
            </button>
          </div>

          {/* Request History - Toggle ON/OFF */}
          {showHistory && (
              <div className="border-b border-gray-800 p-4">
                <h3 className="text-gray-300 text-sm">📌 Request History</h3>
                {history.length === 0 ? (
                    <p className="text-gray-500 text-sm">No history yet</p>
                ) : (
                    <ul className="text-gray-400">
                      {history.map((req, index) => (
                          <li key={index} className="flex justify-between items-center py-1">
                            <button
                                className="text-blue-400 hover:text-blue-300"
                                onClick={() => {
                                  setMethod(req.method);
                                  setUrl(req.url);
                                  setHeaders(req.headers);
                                  setBody(req.body);
                                }}
                            >
                              {req.method} - {req.url}
                            </button>
                            <span className="text-xs text-gray-500">{req.time}</span>
                          </li>
                      ))}
                    </ul>
                )}
              </div>
          )}

          {/* Response Viewer */}
          <div className="border-t border-gray-800 h-96 overflow-auto p-4">
            <h3 className="text-gray-300">📌 Response Viewer</h3>
            <div className="flex gap-2 mb-2">
              <button onClick={() => setResponseType("json")} className="text-sm text-gray-300 hover:text-white">
                JSON
              </button>
              <button onClick={() => setResponseType("xml")} className="text-sm text-gray-300 hover:text-white">
                XML
              </button>
              <button onClick={() => setResponseType("html")} className="text-sm text-gray-300 hover:text-white">
                HTML
              </button>
            </div>

            {response?.error ? (
                <div className="text-red-400">
                  <div className="text-xl mb-2">Error {response.error.status}</div>
                  <ReactJson src={response.error} theme="harmonic" />
                </div>
            ) : response?.data ? (
                responseType === "json" ? (
                    <ReactJson src={response.data} theme="harmonic" />
                ) : responseType === "xml" ? (
                    <pre className="bg-gray-900 p-4 rounded text-green-400">{response.data}</pre>
                ) : (
                    <div className="bg-gray-900 p-4 rounded text-gray-300" dangerouslySetInnerHTML={{ __html: response.data }} />
                )
            ) : (
                <p className="text-gray-500">No response yet</p>
            )}
          </div>
        </div>
      </div>
  );
}
