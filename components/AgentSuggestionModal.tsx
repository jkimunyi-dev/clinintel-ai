"use client";

import { useState } from "react";

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

interface AgentSuggestionModalProps {
  suggestion: AgentSuggestion;
  onAccept: () => void;
  onDecline: () => void;
  isOpen: boolean;
}

export default function AgentSuggestionModal({
  suggestion,
  onAccept,
  onDecline,
  isOpen,
}: AgentSuggestionModalProps) {
  const [isAccepting, setIsAccepting] = useState(false);

  if (!isOpen) return null;

  const confidencePercentage = Math.round(suggestion.confidence * 100);
  const confidenceColor =
    suggestion.confidence >= 0.7
      ? "text-green-600"
      : suggestion.confidence >= 0.5
      ? "text-yellow-600"
      : "text-orange-600";

  const handleAccept = () => {
    setIsAccepting(true);
    onAccept();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onDecline}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scale-in">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-t-2xl text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="text-5xl">{suggestion.icon}</div>
                <div>
                  <h2 className="text-2xl font-bold">Specialist Recommended</h2>
                  <p className="text-blue-100 text-sm">
                    AI has analyzed the symptoms and suggests a specialized agent
                  </p>
                </div>
              </div>
              <button
                onClick={onDecline}
                className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Agent Info */}
            <div className="bg-blue-50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {suggestion.agentName}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {suggestion.specialty}
                  </p>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${confidenceColor}`}>
                    {confidencePercentage}%
                  </div>
                  <div className="text-xs text-gray-500">
                    Confidence
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${confidencePercentage}%` }}
                />
              </div>
            </div>

            {/* Reasoning */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                📋 Why this specialist?
              </h4>
              <p className="text-gray-600 text-sm leading-relaxed">
                {suggestion.reason}
              </p>
            </div>

            {/* Detected Symptoms */}
            {suggestion.symptoms.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">
                  🩺 Detected Symptoms
                </h4>
                <div className="flex flex-wrap gap-2">
                  {suggestion.symptoms.map((symptom, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-red-50 text-red-700 text-xs rounded-full border border-red-200"
                    >
                      {symptom}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Keywords */}
            {suggestion.keywords.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">
                  🔑 Relevant Keywords
                </h4>
                <div className="flex flex-wrap gap-2">
                  {suggestion.keywords.slice(0, 8).map((keyword, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-purple-50 text-purple-700 text-xs rounded-full border border-purple-200"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Patient Conditions */}
            {suggestion.patientConditions && suggestion.patientConditions.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">
                  📊 Patient's Existing Conditions
                </h4>
                <div className="flex flex-wrap gap-2">
                  {suggestion.patientConditions.map((condition, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-amber-50 text-amber-700 text-xs rounded-full border border-amber-200"
                    >
                      {condition}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Info Notice */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="text-yellow-600 text-xl">ℹ️</div>
                <div className="flex-1">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> You can continue with the General Doctor or
                    switch to this specialist. The specialist has in-depth knowledge
                    about this specific condition and can provide more targeted guidance.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-gray-50 p-6 rounded-b-2xl flex space-x-3">
            <button
              onClick={onDecline}
              disabled={isAccepting}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100:bg-gray-800 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue with General Doctor
            </button>
            <button
              onClick={handleAccept}
              disabled={isAccepting}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 font-semibold transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2"
            >
              {isAccepting ? (
                <>
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
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Switching...</span>
                </>
              ) : (
                <>
                  <span>Switch to {suggestion.agentName}</span>
                  <span>→</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scale-in {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
    </>
  );
}
