
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Sparkles, Loader2, BrainCircuit, Lightbulb, AlertCircle } from 'lucide-react';

interface AiAnalysisProps {
  stats: any;
}

const AiAnalysis: React.FC<AiAnalysisProps> = ({ stats }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const generateAnalysis = async () => {
    setIsLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Actúa como un analista de riesgo y psicólogo de trading senior. 
      Analiza los siguientes resultados de una academia de trading y genera una auditoría profesional:
      - Total de Operaciones: ${stats.total}
      - Winrate: ${stats.winrate.toFixed(1)}%
      - Ratio R/B Total: ${stats.totalR.toFixed(2)}
      - Expectativa: ${stats.expectancy.toFixed(3)} R
      - Racha Negativa (Drawdown): ${stats.maxDD.toFixed(2)} R
      - Consistencia (Días Positivos): ${stats.consistencyRatio.toFixed(0)}%

      La respuesta debe ser en español, formato Markdown sutil, con 3 puntos clave de rendimiento, 1 advertencia sobre sesgos psicológicos y 1 consejo táctico para el próximo mes. Sé directo, profesional y alentador.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      setAnalysis(response.text || "No se pudo generar el análisis en este momento.");
    } catch (error) {
      console.error("AI Analysis Error:", error);
      setAnalysis("Error al conectar con la inteligencia artificial. Verifica tu conexión.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-[2.5rem] p-8 text-white border border-white/10 shadow-2xl relative overflow-hidden group">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-blue-600/20 transition-all duration-1000"></div>
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2.5 rounded-2xl shadow-lg shadow-blue-600/20">
              <BrainCircuit size={24} className="text-white" />
            </div>
            <h3 className="text-2xl font-black tracking-tight">Auditoría Inteligente</h3>
          </div>
          <p className="text-slate-400 text-sm font-medium max-w-md">
            Deja que nuestra IA analice el comportamiento matemático de la academia para detectar oportunidades de mejora.
          </p>
        </div>

        {!analysis && !isLoading && (
          <button 
            onClick={generateAnalysis}
            className="bg-white text-slate-900 px-8 py-4 rounded-2xl font-black text-sm flex items-center gap-3 hover:bg-blue-50 transition-all shadow-xl shadow-white/5 active:scale-95"
          >
            <Sparkles size={18} className="text-blue-600" />
            Generar Informe IA
          </button>
        )}
      </div>

      {isLoading && (
        <div className="mt-12 flex flex-col items-center justify-center py-10 space-y-4 animate-pulse">
          <Loader2 size={40} className="text-blue-400 animate-spin" />
          <p className="text-blue-300 font-bold tracking-widest uppercase text-[10px]">Gemini procesando métricas...</p>
        </div>
      )}

      {analysis && !isLoading && (
        <div className="mt-10 grid grid-cols-1 md:grid-cols-1 gap-8 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-[2rem] prose prose-invert max-w-none">
            <div className="flex items-center gap-2 mb-6 text-blue-400">
              <Lightbulb size={20} />
              <span className="text-xs font-black uppercase tracking-[0.3em]">Insights del Analista IA</span>
            </div>
            <div className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap font-medium">
              {analysis}
            </div>
            
            <button 
              onClick={() => setAnalysis(null)}
              className="mt-8 text-xs font-bold text-slate-500 hover:text-white transition-colors uppercase tracking-widest"
            >
              Cerrar y actualizar datos
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AiAnalysis;
