# SafeMed AI Model Strategy

Goal: Accurate, fast, privacy‑aware triage of reported medication side effects from text, voice, and photos, producing a severity score (e.g., Mild / Moderate / Severe / Emergency) plus rationale.

## 1. Target Outputs
1. Structured severity class (primary): {mild, moderate, severe, emergency}
2. Confidence / probability distribution
3. Red‑flag triggers (e.g., "anaphylaxis", "difficulty breathing", "chest pain", "swelling of tongue")
4. Optional explanatory spans (highlight key phrases)

## 2. Modal Pipelines (Overview)
Text: (Raw text) → Preprocess → Clinical NLP classifier (fine‑tuned) → Severity + red flags
Voice: Audio → ASR (speech‑to‑text) → Same text pipeline → Severity
Image: Image → Lightweight CNN / ViT → Symptom label(s) → Map to severity contribution
Fusion: Late fusion (weighted) + rule override (hard red‑flag terms escalate)

## 3. Recommended Baseline Stack
| Modality | Recommended Baseline | Rationale | Deployment Option |
|----------|----------------------|-----------|------------------|
| Text Severity | Fine‑tuned BioClinicalBERT / PubMedBERT for classification | Strong biomedical embeddings; smaller than full LLMs | On server (GPU/CPU) |
| Text Expansion / Few‑shot Reasoning | Lightweight 7–8B LLM (e.g., Llama 3.1 8B or Mistral 7B) with instruction tuning for rationale | Adds explainability & fallback reasoning | Server (can batch) |
| Speech→Text | Whisper Small (en) initially; upgrade to Medium or Distil-Whisper for speed | High accuracy in medical-ish vocabulary; open source | Edge (if feasible) or server |
| Image Symptom | EfficientNet-B0 or MobileNetV3 (if latency critical); ViT-B/16 if accuracy prioritized | Balance accuracy vs mobile latency | Potential on-device (quantized) |
| Cross-Modal Alignment (future) | CLIP / OpenCLIP (for zero-shot symptom detection) | Helps with sparse image labels | Server only |

## 4. Text Severity Classification
Model Options:
- BioClinicalBERT / PubMedBERT (HuggingFace) – High biomedical term coverage.
- RoBERTa-base (fallback) – Strong general language baseline.
- DistilBERT variant – For mobile / serverless low-latency cases.
- LLM Layer (optional) – Llama 3.1 8B or Mistral 7B used AFTER classifier for explanation generation only (not for core triage, to save cost).

Architecture Pattern:
1. Clinical Encoder → [CLS] → Linear layer → Softmax (4 severity classes)
2. Auxiliary head: Multi-label red‑flag detection (e.g., breathing_issue, chest_pain, swelling, bleeding, neurological_symptom)
3. Post-processor: If any high-priority red flag + high confidence, escalate severity to at least Severe (or Emergency depending on mapping table)

Training Data Strategy:
- Phase 1: Weak labeling using medical keyword rules + synthetic augmentation (LLM prompts to produce mild/moderate/severe variants)
- Phase 2: Human clinician review to correct top uncertain samples (active learning)
- Phase 3: Hard negative mining (cases that look severe lexically but context indicates mild)

Evaluation Metrics:
- Macro F1 (class imbalance awareness)
- Weighted F1
- Confusion matrix with clinical cost weighting (false negative severe > others)
- Red‑flag recall @ high precision threshold
- Latency P95

Target Baselines (adjust once real data arrives):
- Macro F1 ≥ 0.80 after Phase 2
- Severe/Emergency recall ≥ 0.92 with precision ≥ 0.75
- Inference latency (text classifier) ≤ 50 ms (server CPU batch size 8)

## 5. Speech (ASR)
Primary Choice: Whisper Small (English). Distil-Whisper or Faster-Whisper for latency.
Pipeline Enhancements:
- Domain vocabulary bias (logit bias for drug names)
- Automatic punctuation for better downstream NLP
- Confidence threshold; low ASR confidence triggers user prompt for confirmation
Latency Goal: < 1.5s for ≤30s clip on modest GPU or optimized CPU.

## 6. Image Analysis
Use cases: Visible rashes, swelling, injection site reactions.
Initial Approach:
1. Pretrained EfficientNet-B0 fine‑tuned on small curated set (symptom categories). If dataset < 1k images/class, freeze most layers.
2. Output multi-label symptom presence + coarse severity hint (e.g., large area rash vs localized).
3. Map symptoms to severity contributions via rules table.

Future Enhancements:
- Use CLIP zero-shot to propose symptom tags, filtered by medical vocabulary list.
- Add segmentation (lightweight U-Net) for measuring area coverage (for rashes/swelling size heuristics).

## 7. Fusion & Severity Aggregation
Score Components (each 0–1): TextSeverityProb(severe), RedFlagBoost, ImageRisk, RuleEscalation.
Final Severity Algorithm (example):
1. BaseClass = argmax(TextClassifierProbs)
2. If any critical red flag with prob > 0.7 → escalate at least one level.
3. If ImageRisk > 0.6 and BaseClass < Severe → promote one level.
4. Compute final confidence = harmonic_mean(top contributing signals)
5. Generate rationale: top tokens (attention / gradient SHAP) + red flag triggers + image tag summary.

## 8. Explainability
- Text: SHAP or Captum integrated gradients to highlight phrases.
- Image: Grad-CAM for localized region.
- Log structured JSON: {severity, probs, escalations: [rules], evidence: {text_spans, image_regions}}.

## 9. Privacy & Compliance
- De-identification pass (regex + NER) before storing raw text; only store hashed user ID linking.
- Optional on-device Whisper for voice to avoid transmitting raw audio (send transcript only).
- Image minimization: downscale + blur background before upload; strip EXIF.

## 10. Deployment & Ops
Environment Tiers:
- Dev: Smaller distilled models for rapid iteration.
- Prod: Full BioClinicalBERT (quantized INT8) + Whisper Small + EfficientNet-B0.
- Future: Auto model selection based on load (adaptive gating).

Performance Tools:
- ONNX Runtime / TorchScript for serving.
- Quantization (dynamic for BERT; PTQ for CNN).
- Batch inference for burst traffic; single-request low-latency path for urgent cases.

Monitoring KPIs:
- Distribution shift detection (embedding centroid drift)
- Severe class prevalence vs expected baseline
- Red flag escalation rate
- ASR word error rate on sampled consented clips

## 11. Roadmap Alignment
Phase 2 (Design): Finalize model choices + data schema for annotations.
Phase 3 (Development): Implement baseline pipelines + skeleton inference service.
Phase 4 (Testing): Bias & fairness audit (age, gender if provided & consented), robustness tests (typos, accents, low light images).
Phase 5 (Deployment): Canary release with shadow predictions before user-facing triage.

## 12. Minimal MVP Stack (Immediate Actionable)
- Text: DistilBioClinicalBERT (or DistilBERT + medical vocab adapter) fine‑tuned on synthetic + small curated set.
- Speech: Faster-Whisper base.en → transcript → text model.
- Image: (Deferred) Placeholder returns neutral contribution until dataset ready.
- Rule Engine: YAML file of red‑flag regex patterns + severity escalation map.

## 13. Future Extensions
- Multilingual expansion: Use Whisper multilingual + XLM-R or LaBSE for text alignment.
- Continual learning loop with clinician feedback UI.
- Federated on-device fine-tuning for privacy.
- Knowledge graph linking symptoms ↔ drug side effects (pharmacovigilance signals).

## 14. Risk & Mitigation
- Data Imbalance: Use class-weighted loss + focal loss variant.
- Hallucinated Explanations (LLM): Gate LLM rationale with classifier-provided evidence; if mismatch, fallback to terse rule-based explanation.
- Over-Escalation: Calibrate thresholds with cost-sensitive tuning (maximize utility function).
- Under-Escalation: Maintain aggressive red‑flag recall; periodic manual audit of severe false negatives.

## 15. Summary (Executive)
Start with compact biomedical transformer for severity + open-source Whisper for transcription; add lightweight CNN for images once labeled data exists; fuse via rule-augmented late fusion; iterate with active learning and strict privacy safeguards.
