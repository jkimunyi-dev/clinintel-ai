"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import AgentSuggestionModal from "@/components/AgentSuggestionModal";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
}

interface AgentSuggestion {
  agentId: string;
  agentName: string;
  specialty: string;
  confidence: number;
  reason: string;
  keywords: string[];
  symptoms: string[];
  patientConditions?: string[];
  icon: string;
}

interface Agent {
  id: string;
  name: string;
  specialty: string;
  description: string;
  icon: string;
  capabilities: string[];
}

interface Patient {
  id: string;
  name: string;
}

export default function ChatPage() {
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>("general-doctor");
  const [selectedPatient, setSelectedPatient] = useState<string>("");
  const [includePatientContext, setIncludePatientContext] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [agentSuggestion, setAgentSuggestion] = useState<AgentSuggestion | null>(null);
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);
  const [pendingUserMessage, setPendingUserMessage] = useState<Message | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchAgents();
    fetchPatients();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchAgents = async () => {
    try {
      const response = await fetch("/api/chat");
      if (response.ok) {
        const data = await response.json();
        setAgents(data.agents || []);
      }
    } catch (err) {
      console.error("Failed to fetch agents:", err);
    }
  };

  const fetchPatients = async () => {
    try {
      const response = await fetch("/api/patients");
      if (response.ok) {
        const data = await response.json();
        setPatients(data.patients || []);
      }
    } catch (err) {
      console.error("Failed to fetch patients:", err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputMessage.trim() && uploadedFiles.length === 0) || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputMessage.trim() || "[File(s) uploaded]",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = inputMessage.trim();
    setInputMessage("");
    setError("");

    // If using general-doctor, check for agent suggestions first
    if (selectedAgent === "general-doctor" && currentInput && selectedPatient) {
      setIsLoading(true);
      try {
        // Request agent suggestion from API
        const suggestionResponse = await fetch("/api/chat/suggest-agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: currentInput,
            patientId: selectedPatient,
          }),
        });

        if (suggestionResponse.ok) {
          const { suggestion } = await suggestionResponse.json();
          
          if (suggestion && suggestion.agentId !== "general-doctor") {
            // Show suggestion modal and pause sending
            setAgentSuggestion(suggestion);
            setShowSuggestionModal(true);
            setPendingUserMessage(userMessage);
            setIsLoading(false);
            return; // Wait for user to accept/decline
          }
        }
      } catch (err) {
        console.error("Failed to get agent suggestion:", err);
        // Continue with general doctor if suggestion fails
      }
      setIsLoading(false);
    }

    // Proceed with sending message
    await sendMessageToAgent(userMessage);
  };

  const sendMessageToAgent = async (userMessage: Message) => {
    setIsLoading(true);

    // Create abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      // Prepare form data if files are uploaded
      let requestBody: any = {
        messages: [{ role: "user", content: userMessage.content }],
        agentId: selectedAgent,
        patientId: includePatientContext ? selectedPatient : null,
        includePatientContext,
      };

      // If files are uploaded, read and include their content
      if (uploadedFiles.length > 0) {
        const filesData = await Promise.all(
          uploadedFiles.map(async (file) => {
            if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
              // Read CSV content
              const text = await file.text();
              return {
                name: file.name,
                type: 'csv',
                content: text,
              };
            } else if (file.type.startsWith('image/')) {
              // For images, we'll just include metadata for now
              // In a full implementation, you'd use vision API or OCR
              return {
                name: file.name,
                type: 'image',
                size: file.size,
                message: 'Image uploaded - visual analysis not yet implemented',
              };
            } else {
              // Other file types
              const text = await file.text();
              return {
                name: file.name,
                type: 'other',
                content: text.substring(0, 5000), // Limit content
              };
            }
          })
        );

        requestBody.files = filesData;
        
        // Add file info to user message
        const fileInfo = filesData.map(f => `📎 ${f.name}`).join(', ');
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === userMessage.id
              ? { ...msg, content: `${userMessage.content}\n\n${fileInfo}` }
              : msg
          )
        );
      }

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get response");
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let assistantMessage = "";
      const assistantMessageId = (Date.now() + 1).toString();

      // Add empty assistant message
      setMessages((prev) => [
        ...prev,
        {
          id: assistantMessageId,
          role: "assistant",
          content: "",
          timestamp: new Date(),
        },
      ]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);

            if (data === "[DONE]") {
              continue;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;

              if (content) {
                assistantMessage += content;
                // Update the assistant message in real-time
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, content: assistantMessage }
                      : msg
                  )
                );
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

      // Clear uploaded files after successful send
      setUploadedFiles([]);
    } catch (err: any) {
      if (err.name === "AbortError") {
        console.log("Request aborted");
      } else {
        console.error("Chat error:", err);
        setError(err.message || "Failed to get response from AI");
        // Remove the empty assistant message if there was an error
        setMessages((prev) => prev.slice(0, -1));
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleAcceptSuggestion = async () => {
    if (!agentSuggestion) return;

    // Switch to suggested agent
    setSelectedAgent(agentSuggestion.agentId);
    setShowSuggestionModal(false);

    // Add system message about the switch
    const systemMessage: Message = {
      id: Date.now().toString(),
      role: "system",
      content: `🔄 **Agent Switch**: You are now connected to **${agentSuggestion.agentName}** (${agentSuggestion.specialty}). This specialist can provide more targeted guidance for your case.`,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, systemMessage]);

    // Send the pending message to the new agent
    if (pendingUserMessage) {
      await sendMessageToAgent(pendingUserMessage);
      setPendingUserMessage(null);
    }

    setAgentSuggestion(null);
  };

  const handleDeclineSuggestion = async () => {
    setShowSuggestionModal(false);

    // Send the pending message with general doctor
    if (pendingUserMessage) {
      await sendMessageToAgent(pendingUserMessage);
      setPendingUserMessage(null);
    }

    setAgentSuggestion(null);
  };

  const handleClearChat = () => {
    setMessages([]);
    setError("");
    setUploadedFiles([]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setUploadedFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const selectedAgentData = agents.find((a) => a.id === selectedAgent);

  return (
    <div className="flex flex-col pb-8">
      {/* Agent Suggestion Modal */}
      {agentSuggestion && (
        <AgentSuggestionModal
          suggestion={agentSuggestion}
          onAccept={handleAcceptSuggestion}
          onDecline={handleDeclineSuggestion}
          isOpen={showSuggestionModal}
        />
      )}

      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              AI Doctor Assistant
            </h1>
            <p className="text-gray-600 mt-2">
              Chat with specialized medical AI agents for diagnosis and treatment guidance
            </p>
          </div>
          {messages.length > 0 && (
            <button
              onClick={handleClearChat}
              className="px-4 py-2 text-sm text-red-600 hover:bg-red-50:bg-red-900/20 rounded-lg transition-colors"
            >
              Clear Chat
            </button>
          )}
        </div>

        {/* Agent Selection */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Doctor Agent
            </label>
            <select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            >
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.icon} {agent.name} - {agent.specialty}
                </option>
              ))}
            </select>
            {selectedAgentData && (
              <p className="text-sm text-gray-600 mt-2">
                {selectedAgentData.description}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Patient Context (Optional)
            </label>
            <select
              value={selectedPatient}
              onChange={(e) => {
                setSelectedPatient(e.target.value);
                setIncludePatientContext(!!e.target.value);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            >
              <option value="">No patient selected</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.name}
                </option>
              ))}
            </select>
            <p className="text-sm text-gray-600 mt-2">
              Include patient data in the conversation context
            </p>
          </div>
        </div>

        {/* Agent Capabilities */}
        {selectedAgentData && (
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Capabilities:
            </p>
            <div className="flex flex-wrap gap-2">
              {selectedAgentData.capabilities.map((capability, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-blue-50 text-blue-700 text-xs rounded-full"
                >
                  {capability}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Chat Messages */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col min-h-[600px]">
        <div className="p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">
                {selectedAgentData?.icon || "👨‍⚕️"}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Start a conversation
              </h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Ask questions about diagnosis, treatment, or general medical advice.
                Your conversation is private and secure.
              </p>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto text-left">
                <button
                  onClick={() =>
                    setInputMessage(
                      "What are the early warning signs of diabetes?"
                    )
                  }
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50:bg-gray-700 transition-colors text-sm text-gray-700"
                >
                  💡 What are the early warning signs of diabetes?
                </button>
                <button
                  onClick={() =>
                    setInputMessage(
                      "How should I interpret HbA1c levels?"
                    )
                  }
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50:bg-gray-700 transition-colors text-sm text-gray-700"
                >
                  📊 How should I interpret HbA1c levels?
                </button>
                <button
                  onClick={() =>
                    setInputMessage(
                      "What lifestyle changes help manage diabetes?"
                    )
                  }
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50:bg-gray-700 transition-colors text-sm text-gray-700"
                >
                  🏃 What lifestyle changes help manage diabetes?
                </button>
                <button
                  onClick={() =>
                    setInputMessage(
                      "When should insulin therapy be considered?"
                    )
                  }
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50:bg-gray-700 transition-colors text-sm text-gray-700"
                >
                  💉 When should insulin therapy be considered?
                </button>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === "user"
                      ? "justify-end"
                      : message.role === "system"
                      ? "justify-center"
                      : "justify-start"
                  }`}
                >
                  {message.role === "system" ? (
                    // System message (agent switches, etc.)
                    <div className="max-w-3xl w-full">
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
                        <div className="prose prose-sm max-w-none">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {message.content}
                          </ReactMarkdown>
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                          {message.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ) : (
                    // User or assistant message
                    <div
                      className={`max-w-3xl rounded-lg p-4 ${
                        message.role === "user"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-900"
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="text-2xl flex-shrink-0">
                          {message.role === "user"
                            ? "👤"
                            : selectedAgentData?.icon || "👨‍⚕️"}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-semibold mb-1">
                            {message.role === "user"
                              ? "You"
                              : selectedAgentData?.name || "AI Doctor"}
                          </div>
                          <div className="prose prose-sm max-w-none">
                            {message.content ? (
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  // Custom components for better styling
                                  p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                                  ul: ({ node, ...props }) => <ul className="list-disc ml-4 mb-2" {...props} />,
                                  ol: ({ node, ...props }) => <ol className="list-decimal ml-4 mb-2" {...props} />,
                                  li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                                  code: ({ node, inline, ...props }: any) =>
                                    inline ? (
                                      <code className="bg-gray-100 px-1 py-0.5 rounded text-sm" {...props} />
                                    ) : (
                                      <code className="block bg-gray-100 p-2 rounded my-2 overflow-x-auto" {...props} />
                                    ),
                                  strong: ({ node, ...props }) => <strong className="font-semibold" {...props} />,
                                  em: ({ node, ...props }) => <em className="italic" {...props} />,
                                }}
                              >
                                {message.content}
                              </ReactMarkdown>
                            ) : (
                              <span className="animate-pulse">Thinking...</span>
                            )}
                          </div>
                          <div className="text-xs opacity-70 mt-2">
                            {message.timestamp.toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="px-6 py-3 bg-red-50 border-t border-red-200">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
          {/* File Upload Area */}
          {uploadedFiles.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {uploadedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-2 bg-blue-50 px-3 py-2 rounded-lg text-sm"
                >
                  <span className="text-blue-700">
                    📎 {file.name} ({(file.size / 1024).toFixed(1)}KB)
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex space-x-2">
            {/* File Upload Button */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".csv,.pdf,.png,.jpg,.jpeg,.txt"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200:bg-gray-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              title="Upload medical records (CSV, images, PDF)"
            >
              📎
            </button>

            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask a medical question or upload files..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || (!inputMessage.trim() && uploadedFiles.length === 0)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold transition-colors"
            >
              {isLoading ? (
                <span className="flex items-center space-x-2">
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span>Analyzing...</span>
                </span>
              ) : (
                "Send"
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            ⚠️ This is AI-assisted guidance. Always consult with a healthcare
            provider for medical decisions. Supported files: CSV, PDF, Images (PNG, JPG), Text
          </p>
        </form>
      </div>
    </div>
  );
}
