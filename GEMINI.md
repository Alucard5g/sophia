# SOPHIA V.2026 — CONFIGURACIÓN DEL MOTOR GEMINI 3.7 & MULTI-MODELO

## Directivas Maestras del Motor Gemini
1. **SDK Oficial**: Usar `@google/genai` con modelo `gemini-3.7-flash` o `gemini-3.1-pro` / `gemini-3.6-flash` según la tarea requerida.
2. **Grounding en Tiempo Real**: Sincronización continua con Google Search para verificación factual inmediata (Grounding First - Ley I).
3. **Generación Estructurada**: Respuestas en formato JSON riguroso con los campos obligatorios: `transcribedText`, `formatType`, `simulatedScenarios`, `antiHallucinationCheck`, `spokenSummary`, `finalResponse`, `learnedMemoryPoints`, `category`, `resources`.
4. **Protocolo 40 Años de Experiencia**: Calidad senior en todas las áreas requeridas, sin atajos, omisiones ni explicaciones superficiales.
5. **Separación de Voz y Texto**: `spokenSummary` enfocado en locución auditiva dulce y concisa; `finalResponse` enfocado en Markdown técnico y código ejecutable para el Sandbox.
6. **Persistencia & Memoria**: Indexación continua en Firebase Firestore e historial semántico.
