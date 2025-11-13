/**
 * Intelligent Agent Routing Service
 * Analyzes user messages and patient context to suggest appropriate specialist agents
 */

import { prisma } from '@/lib/db';

export interface AgentSuggestion {
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

/**
 * Analyze user message and patient context to suggest appropriate specialist agent
 * This function detects symptoms, ailments, and medical keywords to recommend the best agent
 */
export async function suggestAgent(
  message: string,
  patientId?: string
): Promise<AgentSuggestion | null> {
  const messageLower = message.toLowerCase();
  
  // Define agent detection patterns with symptoms and icons
  const agentPatterns = {
    'diabetic-doctor': {
      name: 'Diabetes Specialist',
      specialty: 'Endocrinology - Diabetes',
      icon: '🩺',
      keywords: [
        'diabetes', 'diabetic', 'blood sugar', 'glucose', 'insulin',
        'hba1c', 'hyperglycemia', 'hypoglycemia', 'metformin',
        'sugar level', 'diabetic neuropathy', 'diabetic retinopathy',
        'type 1 diabetes', 'type 2 diabetes', 'prediabetes',
      ],
      symptoms: [
        'frequent urination', 'excessive thirst', 'unexplained weight loss',
        'fatigue', 'blurred vision', 'slow healing wounds', 'tingling feet',
        'numbness in hands', 'increased hunger',
      ],
      requiredCount: 1,
      weight: 2,
    },
    'cardiology-specialist': {
      name: 'Cardiology Specialist',
      specialty: 'Cardiovascular Medicine',
      icon: '❤️',
      keywords: [
        'heart', 'cardiac', 'cardiovascular', 'blood pressure', 'hypertension',
        'chest pain', 'palpitations', 'arrhythmia', 'cholesterol',
        'heart attack', 'stroke', 'coronary', 'ecg', 'ekg', 'angina',
      ],
      symptoms: [
        'chest pain', 'shortness of breath', 'irregular heartbeat',
        'swollen ankles', 'dizziness', 'rapid heartbeat', 'fainting',
        'heart palpitations', 'chest pressure',
      ],
      requiredCount: 1,
      weight: 2,
    },
    'nephrology-specialist': {
      name: 'Kidney Specialist',
      specialty: 'Nephrology',
      icon: '🫘',
      keywords: [
        'kidney', 'renal', 'nephrology', 'dialysis', 'creatinine',
        'egfr', 'proteinuria', 'kidney disease', 'ckd', 'nephropathy',
        'kidney failure', 'kidney stones', 'uremia',
      ],
      symptoms: [
        'reduced urination', 'blood in urine', 'foamy urine',
        'swelling in legs', 'fatigue', 'nausea', 'confusion',
        'back pain', 'flank pain',
      ],
      requiredCount: 1,
      weight: 2,
    },
    'endocrinology-specialist': {
      name: 'Endocrinology Specialist',
      specialty: 'Endocrinology & Metabolism',
      icon: '⚕️',
      keywords: [
        'thyroid', 'hormone', 'endocrine', 'pituitary', 'adrenal',
        'metabolic', 'osteoporosis', 'menopause', 'testosterone',
        'growth hormone', 'cortisol', 'hashimoto', 'graves',
      ],
      symptoms: [
        'weight changes', 'mood swings', 'heat intolerance',
        'cold intolerance', 'hair loss', 'irregular periods',
        'bone pain', 'muscle weakness',
      ],
      requiredCount: 1,
      weight: 2,
    },
  };

  // Score each agent based on keywords and symptoms
  const scores: Record<string, { score: number; matchedKeywords: string[]; matchedSymptoms: string[] }> = {};

  for (const [agentId, pattern] of Object.entries(agentPatterns)) {
    const matchedKeywords: string[] = [];
    const matchedSymptoms: string[] = [];
    
    // Check for keyword matches
    for (const keyword of pattern.keywords) {
      if (messageLower.includes(keyword)) {
        matchedKeywords.push(keyword);
      }
    }

    // Check for symptom matches
    for (const symptom of pattern.symptoms) {
      if (messageLower.includes(symptom)) {
        matchedSymptoms.push(symptom);
      }
    }

    const totalMatches = matchedKeywords.length + matchedSymptoms.length;

    if (totalMatches >= pattern.requiredCount) {
      scores[agentId] = {
        score: (matchedKeywords.length * pattern.weight) + (matchedSymptoms.length * 1.5), // Symptoms weighted higher
        matchedKeywords,
        matchedSymptoms,
      };
    }
  }

  // If patient context is available, boost score based on diagnoses
  let patientConditions: string[] = [];

  if (patientId) {
    try {
      const diagnoses = await prisma.diagnosis.findMany({
        where: {
          MedicalRecord: {
            patientId,
          },
        },
        select: {
          description: true,
        },
      });

      patientConditions = diagnoses.map(d => d.description);
      const diagnosisText = patientConditions.join(' ').toLowerCase();

      // Boost diabetic-doctor if patient has diabetes
      if (diagnosisText.includes('diabetes')) {
        scores['diabetic-doctor'] = scores['diabetic-doctor'] || { score: 0, matchedKeywords: [], matchedSymptoms: [] };
        scores['diabetic-doctor'].score += 5;
        scores['diabetic-doctor'].matchedKeywords.push('existing diabetes diagnosis');
      }

      // Boost cardiology if patient has cardiovascular conditions
      if (/heart|cardiac|hypertension|cardiovascular/i.test(diagnosisText)) {
        scores['cardiology-specialist'] = scores['cardiology-specialist'] || { score: 0, matchedKeywords: [], matchedSymptoms: [] };
        scores['cardiology-specialist'].score += 5;
        scores['cardiology-specialist'].matchedKeywords.push('existing cardiovascular condition');
      }

      // Boost nephrology if patient has kidney disease
      if (/kidney|renal|nephro/i.test(diagnosisText)) {
        scores['nephrology-specialist'] = scores['nephrology-specialist'] || { score: 0, matchedKeywords: [], matchedSymptoms: [] };
        scores['nephrology-specialist'].score += 5;
        scores['nephrology-specialist'].matchedKeywords.push('existing kidney condition');
      }

      // Boost endocrinology if patient has endocrine conditions
      if (/thyroid|hormone|endocrine/i.test(diagnosisText)) {
        scores['endocrinology-specialist'] = scores['endocrinology-specialist'] || { score: 0, matchedKeywords: [], matchedSymptoms: [] };
        scores['endocrinology-specialist'].score += 5;
        scores['endocrinology-specialist'].matchedKeywords.push('existing endocrine condition');
      }
    } catch (error) {
      console.error('Error fetching patient diagnoses for agent suggestion:', error);
    }
  }

  // Find highest scoring agent
  let bestAgent: { id: string; score: number; keywords: string[]; symptoms: string[] } | null = null;
  
  for (const [agentId, data] of Object.entries(scores)) {
    if (!bestAgent || data.score > bestAgent.score) {
      bestAgent = {
        id: agentId,
        score: data.score,
        keywords: data.matchedKeywords,
        symptoms: data.matchedSymptoms,
      };
    }
  }

  // Only suggest if confidence is high enough
  if (bestAgent && bestAgent.score >= 2) {
    const pattern = agentPatterns[bestAgent.id as keyof typeof agentPatterns];
    const confidence = Math.min(bestAgent.score / 10, 0.95); // Cap at 95%

    // Build detailed reasoning
    let reason = '';
    if (bestAgent.symptoms.length > 0) {
      reason += `Detected symptoms: ${bestAgent.symptoms.slice(0, 3).join(', ')}. `;
    }
    if (bestAgent.keywords.length > 0) {
      reason += `Relevant keywords: ${bestAgent.keywords.slice(0, 3).join(', ')}. `;
    }
    if (patientConditions.length > 0) {
      reason += `Patient has existing conditions that align with this specialty.`;
    }

    return {
      agentId: bestAgent.id,
      agentName: pattern.name,
      specialty: pattern.specialty,
      confidence,
      reason: reason.trim(),
      keywords: bestAgent.keywords,
      symptoms: bestAgent.symptoms,
      patientConditions,
      icon: pattern.icon,
    };
  }

  return null;
}

/**
 * Log agent suggestion for analytics
 */
export async function logAgentSuggestion(
  chatSessionId: string,
  fromAgent: string,
  suggestion: AgentSuggestion,
  wasAccepted: boolean
): Promise<void> {
  try {
    // TODO: Implement agent suggestion logging when model is added to schema
    // For now, just log to console
    console.log('Agent suggestion:', {
      chatSessionId,
      fromAgent,
      toAgent: suggestion.agentId,
      reason: suggestion.reason,
      wasAccepted,
    });
  } catch (error) {
    console.error('Failed to log agent suggestion:', error);
  }
}

/**
 * Get doctor's fine-tuned knowledge for an agent
 */
export async function getAgentKnowledge(
  doctorId: string,
  agentType: string
): Promise<string[]> {
  try {
    const knowledge = await prisma.agentKnowledge.findMany({
      where: {
        doctorId,
        agentType,
      },
      orderBy: {
        priority: 'desc',
      },
    });

    return knowledge.map(k => k.knowledge);
  } catch (error) {
    console.error('Failed to fetch agent knowledge:', error);
    return [];
  }
}
