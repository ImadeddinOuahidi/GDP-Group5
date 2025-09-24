# SafeMed AI Model Strategy

Goal: Accurate, fast, privacy‑aware triage of reported medication side effects from text, voice, and photos, producing a severity score (e.g., Mild / Moderate / Severe / Emergency) plus rationale.

## 1. Target Outputs
1. Structured severity class (primary): {mild, moderate, severe, emergency}
2. Confidence / probability distribution
3. Red‑flag triggers (e.g., "anaphylaxis", "difficulty breathing", "chest pain", "swelling of tongue")
4. Optional explanatory spans (highlight key phrases)

## 2. Data Preprocessing Pipeline

**Text Preprocessing:**
- **Cleaning:** Remove PII (regex + spaCy NER), normalize whitespace, handle Unicode
- **Medical NLP:** Drug name normalization (RxNorm), symptom standardization (SNOMED CT)
- **Tokenization:** BioClinicalBERT tokenizer (max_length=512, truncation=True)
- **Augmentation:** Medical synonym replacement (15%), back-translation EN→ES→EN (10%)

**Audio Preprocessing:**
- **Format Standardization:** Convert to 16kHz mono WAV, max 30s duration
- **Quality Enhancement:** Noise reduction (spectral subtraction), VAD (webrtcvad threshold=0.6)
- **Segmentation:** Automatic silence trimming, speech segment detection
- **Privacy:** PII detection in transcripts (custom medical NER model)

**Image Preprocessing:**
- **Standardization:** Resize to 224×224, normalize RGB [0,1]
- **Privacy Protection:** EXIF stripping, background blurring (if no face/text detected)
- **Quality Checks:** Blur detection (Laplacian variance >100), exposure correction
- **Augmentation:** Random rotation (±15°), brightness/contrast adjustment (±20%)

## 3. Modal Pipelines (Overview)
Text: Raw text → Preprocessing → BioClinicalBERT encoder → Severity classifier + Red flag detector
Voice: Audio → VAD + noise reduction → Whisper ASR → Text pipeline
Image: Image → Privacy filter → CNN feature extractor → Symptom classifier → Severity mapping
Fusion: Multi-modal scores → Weighted aggregation → Rule-based escalation → Final triage

## 4. Recommended Baseline Stack
| Modality | Recommended Baseline | Model Size/Config | Hardware Requirements | Deployment Option |
|----------|----------------------|-------------------|----------------------|------------------|
| Text Severity | BioClinicalBERT-base (110M params) / PubMedBERT-base (110M params) | 768 hidden dims, 12 layers | 4GB RAM, CPU: 2 cores or GPU: 2GB VRAM | Server (GPU/CPU) |
| Text Expansion | Llama 3.1 8B (8.03B params) or Mistral 7B (7.24B params) | Context: 8k tokens, batch_size: 4-8 | 16GB RAM, GPU: 16GB VRAM (FP16) | Server (batched) |
| Speech→Text | Whisper Small (244M params), upgrade to Medium (769M) | Sample rate: 16kHz, chunk_length: 30s | 2GB RAM, GPU: 4GB VRAM (optional) | Edge/Server |
| Image Symptom | EfficientNet-B0 (5.3M params) or MobileNetV3-Large (5.4M params) | Input: 224×224×3, classes: 50+ symptoms | 1GB RAM, GPU: 2GB VRAM | On-device (INT8) |
| Cross-Modal Alignment | CLIP ViT-B/32 (151M params) or OpenCLIP ViT-B/16 | Image: 224×224, text: 77 tokens | 8GB RAM, GPU: 6GB VRAM | Server only |

## 5. Text Severity Classification

**Model Specifications:**
- **Primary:** BioClinicalBERT-base (transformers==4.36.0, torch>=2.0)
- **Config:** max_length=512, learning_rate=2e-5, batch_size=16, epochs=5-10
- **Quantization:** INT8 dynamic quantization for CPU deployment (2x speedup)

**Architecture Pattern:**
1. Clinical Encoder → [CLS] token (768-dim) → Dropout(0.1) → Linear(768→4) → Softmax
2. Auxiliary head: Multi-label classifier (768→5) for red flags: [breathing, cardiac, neurological, bleeding, allergic]
3. Post-processor: Priority escalation matrix (confidence_threshold=0.7, escalation_rules.yaml)

**Training Configuration:**
- **Optimizer:** AdamW (weight_decay=0.01, warmup_steps=500)
- **Loss:** CrossEntropyLoss + 0.3×BCELoss (red flags) + 0.1×FocalLoss (α=0.25, γ=2.0)
- **Data Augmentation:** Synonym replacement (15%), back-translation (10%), medical term perturbation
- **Validation:** Stratified 5-fold CV, early stopping (patience=3)

**Training Data Pipeline:**
- **Phase 1:** Synthetic data (GPT-4 prompts: 10k samples) + medical lexicon rules (5k samples)
- **Phase 2:** Active learning with clinical review (target: 2k high-confidence corrections)
- **Phase 3:** Hard negative mining (1k adversarial examples)

**Performance Targets:**
- **Latency:** ≤50ms per request (CPU batch=8), ≤20ms (GPU batch=32)
- **Accuracy:** Macro F1 ≥0.80, Severe/Emergency recall ≥0.92, precision ≥0.75
- **Memory:** ≤2GB RAM (INT8), ≤4GB RAM (FP16)

## 6. Speech (ASR)

**Model Configuration:**
- **Primary:** Whisper Small (openai/whisper-small, 244M params)
- **Alternatives:** Faster-Whisper (2-4x speedup), Distil-Whisper (3x smaller, 1.5x faster)
- **Audio Preprocessing:** 16kHz mono, VAD (webrtcvad), noise reduction (spectral subtraction)

**Pipeline Specifications:**
- **Input:** WAV/MP3 chunks (max 30s), automatic silence trimming
- **Domain Adaptation:** Medical vocabulary boost (+2.0 logit bias for 500+ drug names)
- **Post-processing:** Automatic punctuation (deepmultilingualpunctuation), spell correction
- **Confidence Gating:** ASR confidence <0.6 → user confirmation prompt

**Technical Requirements:**
- **Latency Target:** <1.5s for 30s audio (CPU: Intel i5+ or GPU: 2GB VRAM)
- **Memory:** 1GB RAM (Small), 3GB RAM (Medium)
- **Error Handling:** Network timeout (5s), audio corruption detection, graceful degradation

**Quality Assurance:**
- **WER Target:** <5% on medical terms, <3% on general speech
- **Monitoring:** Real-time confidence distribution, OOV (out-of-vocabulary) rate tracking

## 7. Image Analysis

**Model Architecture:**
- **Base Model:** EfficientNet-B0 (torchvision.models, ImageNet pretrained)
- **Fine-tuning:** Last 2 blocks unfrozen, custom classifier head (1280→256→50 classes)
- **Input Pipeline:** 224×224 RGB, normalization (ImageNet stats), augmentation (rotation ±15°, brightness ±20%)

**Symptom Categories (50 classes):**
- **Skin:** Rash (localized/widespread), swelling, bruising, discoloration, injection site reactions
- **Physical:** Nausea indicators, fatigue signs, tremor detection
- **Severity Indicators:** Size estimation (small/medium/large), urgency markers

**Training Specifications:**
- **Dataset Size:** Min 500 images/class, target 2k/class
- **Strategy:** Transfer learning (freeze backbone if <1k/class), progressive resizing
- **Validation:** 80/10/10 split, stratified sampling, cross-validation for rare classes

**Deployment Configuration:**
- **Quantization:** INT8 post-training quantization (ONNX Runtime)
- **Edge Deployment:** Core ML (iOS), TensorFlow Lite (Android)
- **Memory:** <500MB mobile, <1GB server
- **Latency:** <200ms inference time

**Future Enhancements:**
- **Zero-shot:** CLIP ViT-B/32 for symptom tagging (medical vocabulary filter: 200+ terms)
- **Segmentation:** U-Net Lite (2M params) for area measurement (rash coverage %)

## 8. Fusion & Severity Aggregation

**Score Components (normalized 0-1):**
- **TextSeverityProb:** BioClinicalBERT softmax output for severe/emergency classes
- **RedFlagBoost:** Weighted sum of red flag probabilities (weights: breathing=0.4, cardiac=0.3, allergic=0.2, bleeding=0.1)
- **ImageRisk:** EfficientNet severity classifier + area coverage heuristics
- **RuleEscalation:** YAML-configured keyword triggers (exact match + fuzzy match threshold=0.8)

**Fusion Algorithm (specific thresholds):**
```
1. BaseClass = argmax(TextClassifierProbs)
2. RedFlagEscalation = max(red_flag_probs) > 0.7 → +1 severity level
3. ImageEscalation = ImageRisk > 0.6 AND BaseClass < Severe → +1 level
4. EmergencyOverride = ANY(breathing_prob>0.8, cardiac_prob>0.75) → Emergency
5. ConfidenceScore = min(text_confidence, 1-uncertainty_estimate)
6. FinalSeverity = min(BaseClass + Escalations, Emergency)
```

**Rationale Generation:**
- **Text Evidence:** Top 3 attention spans (token-level), SHAP values >0.1
- **Image Evidence:** Grad-CAM heatmap regions (top 20% activation)
- **Rule Triggers:** Matched keywords/phrases with confidence scores
- **Output Format:** JSON with evidence hierarchy and contribution weights

## 9. Explainability & Interpretability

**Text Explanations:**
- **Method:** Integrated Gradients (Captum) + attention weights from final transformer layer
- **Output:** Top 5 contributing phrases, token-level importance scores (>0.1 threshold)
- **Medical Context:** Map highlighted terms to UMLS concepts, provide standardized definitions
- **Format:** `{"phrases": ["chest pain", "difficulty breathing"], "scores": [0.89, 0.76], "umls_ids": ["C0008031", "C0013404"]}`

**Image Explanations:**
- **Method:** Grad-CAM on final conv layer + LIME superpixel analysis
- **Output:** Heatmap overlay showing 20% most relevant regions, bounding boxes for key features
- **Clinical Mapping:** Detected regions mapped to anatomical terms (body parts, lesion types)
- **Confidence:** Per-region confidence scores, overall image interpretability score

**Model Uncertainty Quantification:**
- **Epistemic Uncertainty:** Monte Carlo Dropout (10 forward passes), confidence intervals
- **Aleatoric Uncertainty:** Learned variance estimation for each prediction
- **Calibration:** Temperature scaling post-training, reliability diagrams
- **Thresholds:** High uncertainty (>0.3) triggers human review, very high (>0.5) defers to clinician

**Audit Trail:**
- **Decision Log:** Complete reasoning chain with timestamps, model versions, input hashes
- **Structured Output:**
```json
{
  "decision_id": "uuid",
  "severity": "severe", 
  "confidence": 0.87,
  "evidence": {
    "text_spans": [{"text": "chest pain", "importance": 0.89, "span": [45,55]}],
    "image_regions": [{"bbox": [100,200,150,250], "confidence": 0.76}]
  },
  "model_versions": {"text": "v1.2.0", "image": "v1.0.1"},
  "processing_time_ms": 234
}
```

## 10. Privacy & Compliance

**Data De-identification:**
- **Text PII Removal:** Custom NER model (97%+ recall) for names, dates, locations, phone numbers
- **Medical ID Scrubbing:** Insurance numbers, medical record IDs, prescription numbers
- **Anonymization:** k-anonymity (k=5) for demographic data, differential privacy (ε=1.0) for aggregates
- **Storage:** SHA-256 hashed user IDs, no direct linking to personal identifiers

**Audio Privacy:**
- **On-device Processing:** Optional Whisper deployment (Core ML/TensorFlow Lite) for transcription
- **Secure Transmission:** End-to-end encryption (AES-256), transcript-only upload option
- **Voice Biometrics:** No voice prints stored, immediate deletion after transcription
- **Consent Management:** Granular permissions (storage duration: 30/90/365 days)

**Image Privacy:**
- **Automated Anonymization:** Face detection and blurring (MTCNN), OCR text redaction
- **Background Removal:** Semantic segmentation to isolate medical regions
- **Metadata Stripping:** Complete EXIF removal, geolocation scrubbing
- **Resolution Control:** Automatic downscaling to minimum clinical quality (512×512 max)

**Compliance Framework:**
- **HIPAA:** BAA agreements, audit logging, access controls, encryption at rest/transit
- **GDPR:** Right to erasure (automated), data portability, consent management
- **FDA 21 CFR Part 11:** Electronic signatures, audit trails, data integrity validation
- **Security Standards:** SOC 2 Type II, ISO 27001 alignment, penetration testing quarterly

## 11. Deployment & Ops

**Environment Specifications:**
- **Dev:** DistilBERT (66M params) + Whisper Tiny (39M) + MobileNetV3 (5.4M)
  - Hardware: 8GB RAM, CPU-only, Docker containers
- **Staging:** BioClinicalBERT (110M) + Whisper Small (244M) + EfficientNet-B0 (5.3M)
  - Hardware: 16GB RAM, Tesla T4 (16GB VRAM), Kubernetes pods
- **Production:** Full stack + LLM for explanations
  - Hardware: 32GB RAM, A100 (40GB VRAM), auto-scaling (2-10 instances)

**Performance Optimization:**
- **Serving:** ONNX Runtime (CPU), TensorRT (GPU), TorchScript (mobile)
- **Quantization:** Dynamic INT8 (BERT), Post-training PTQ (CNN), FP16 (LLM)
- **Caching:** Redis for model outputs (TTL: 5min), embedding cache (100k entries)
- **Load Balancing:** Round-robin with health checks, circuit breaker (failure_rate>10%)

**API Specifications:**
```
POST /api/v1/analyze
Content-Type: multipart/form-data
Body: {
  "text": "string (max 2048 chars)",
  "audio": "file (max 10MB, 30s)",
  "image": "file (max 5MB, <2048x2048)",
  "user_id": "hashed_string"
}
Response: {
  "severity": "mild|moderate|severe|emergency",
  "confidence": 0.0-1.0,
  "red_flags": ["breathing", "cardiac"],
  "rationale": {text_spans: [], image_regions: []},
  "processing_time_ms": integer
}
```

**Monitoring & Alerting:**
- **Latency:** P95 <500ms (alert >1s), P99 <1s
- **Throughput:** 100 req/s sustained, 500 req/s peak
- **Model Drift:** Weekly embedding distribution comparison (KL divergence >0.1)
- **Error Rates:** <1% server errors, <5% model uncertainty (confidence <0.5)
- **Health Checks:** Model warmup status, GPU memory usage, disk space

## 12. Roadmap Alignment

**Phase 2 (Design - Month 1-2):**
- Model architecture finalization: BioClinicalBERT + Whisper Small + EfficientNet-B0
- Data schema design: PostgreSQL tables, annotation guidelines, privacy controls
- API specification: OpenAPI 3.0 documentation, authentication flow, rate limiting

**Phase 3 (Development - Month 3-5):**
- MVP implementation: Text classifier (DistilBERT), speech pipeline (Faster-Whisper)
- Infrastructure setup: Docker containers, CI/CD pipeline, monitoring stack
- Integration testing: End-to-end API tests, load testing (100 req/s), security scans

**Phase 4 (Testing - Month 6-7):**
- Model validation: Clinical accuracy testing, bias audit (age/gender/ethnicity), adversarial robustness
- System testing: Stress testing (500 req/s peak), failover scenarios, data corruption recovery
- Regulatory preparation: Documentation for FDA pre-submission, clinical validation protocols

**Phase 5 (Deployment - Month 8-9):**
- Staged rollout: Internal testing → healthcare partner pilot → limited public release
- Performance monitoring: Real-time dashboards, alerting thresholds, model drift detection
- Clinical feedback integration: Correction interface, active learning pipeline, model retraining

## 13. Minimal MVP Stack (Immediate Actionable)

**Core Components:**
- **Text Classifier:** DistilBioClinicalBERT (66M params, HuggingFace: distilbert-base-uncased + BioBERT vocab)
  - Training: 2k synthetic samples + medical keyword rules
  - Deployment: CPU-only, ONNX Runtime, <200ms latency
- **Speech Pipeline:** Faster-Whisper base.en (74M params) → text classifier
  - Audio processing: 16kHz, 30s max, webrtcvad preprocessing
  - Fallback: Text input if ASR confidence <0.6
- **Image Placeholder:** Static risk assessment (returns 0.5 neutral score)
  - Future: Replace with EfficientNet-B0 when 10k+ labeled images available
- **Rule Engine:** YAML configuration (50+ emergency keywords, regex patterns)

**Infrastructure Setup:**
- **Backend:** FastAPI + uvicorn, Docker containerized
- **Database:** PostgreSQL for reports, Redis for caching
- **Storage:** S3-compatible for audio/image files (encrypted at rest)
- **Compute:** 2 CPU cores, 8GB RAM, 50GB storage

**API Endpoints:**
```
POST /analyze/text     - Text severity analysis
POST /analyze/audio    - Speech-to-text + analysis  
POST /analyze/image    - Image placeholder (v2)
GET /health           - Service health check
GET /models/status    - Model loading status
```

**Performance Targets:**
- **Availability:** 99.5% uptime
- **Latency:** <300ms text, <2s audio processing
- **Accuracy:** 75%+ on synthetic test set (baseline)

## 14. Error Handling & Fallback Mechanisms

**Input Validation & Sanitization:**
- **Text:** Length limits (max 2048 chars), encoding validation (UTF-8), malicious content filtering
- **Audio:** Format validation (WAV/MP3), duration limits (30s), file size limits (10MB)
- **Image:** Format validation (JPEG/PNG), resolution limits (2048×2048), file size limits (5MB)

**Model Failure Scenarios:**
- **Text Classifier Unavailable:** Fallback to rule-based keyword matching (emergency_keywords.yaml)
- **ASR Service Down:** Graceful degradation to text-only input with user notification
- **Image Analysis Offline:** Return neutral risk score (0.5) with placeholder explanation
- **LLM Explanation Timeout:** Template-based rationale generation from classifier outputs

**Performance Degradation:**
- **High Latency (>1s):** Switch to faster models (DistilBERT, Whisper Tiny)
- **Memory Pressure:** Reduce batch sizes, enable model swapping, queue management
- **GPU Unavailable:** CPU-only inference with INT8 quantization, extended timeout (5s)

**Data Quality Issues:**
- **Corrupted Audio:** Automatic noise detection, quality scoring, re-recording prompts
- **Poor Image Quality:** Blur detection, lighting assessment, capture guidance
- **Ambiguous Text:** Confidence thresholds, clarification prompts, uncertainty flags

**System Recovery:**
- **Circuit Breaker:** 10% error rate triggers 30s cooldown, exponential backoff
- **Health Checks:** Model warmup validation, dependency monitoring, automatic restarts
- **Graceful Shutdown:** Request completion (30s timeout), state preservation, clean resource release

## 15. Risk & Mitigation

**Technical Risks:**
- **Data Imbalance:** 
  - *Risk:* Severe cases <5% of training data
  - *Mitigation:* Focal loss (α=0.25, γ=2.0) + SMOTE oversampling + class weights [1,2,4,8]
- **Model Hallucination:**
  - *Risk:* LLM generates medically incorrect explanations
  - *Mitigation:* Explanation gating (classifier confidence >0.7), template-based fallbacks
- **Latency Spikes:**
  - *Risk:* >1s response time under load
  - *Mitigation:* Request queuing (max 100), model caching, graceful degradation to faster models

**Clinical Risks:**
- **Over-Escalation (False Positives):**
  - *Risk:* 30%+ unnecessary urgent referrals
  - *Mitigation:* Calibration with cost matrix (FP_cost=1, FN_cost=10), threshold tuning on validation set
- **Under-Escalation (False Negatives):**
  - *Risk:* Missing critical symptoms (anaphylaxis, cardiac events)
  - *Mitigation:* Aggressive red flag recall ≥95%, weekly manual audit of severe cases, keyword safety net

**Operational Risks:**
- **Model Drift:**
  - *Risk:* Performance degradation over time
  - *Mitigation:* Monthly embedding distribution monitoring, A/B testing for model updates
- **Privacy Breach:**
  - *Risk:* PHI exposure in logs/model outputs
  - *Mitigation:* De-identification pipeline (99%+ recall), encrypted storage, audit logging

## 16. Future Extensions

**Multilingual Support:**
- **Speech:** Whisper multilingual (1550M params), language detection, accent adaptation
- **Text:** XLM-RoBERTa-base (279M params) or LaBSE (471M params) for cross-lingual embeddings
- **Priority Languages:** Spanish, French, German, Mandarin (based on user demographics)

**Advanced Analytics:**
- **Continual Learning:** Weekly model updates with clinician feedback (active learning pipeline)
- **Federated Learning:** On-device fine-tuning for privacy-preserving personalization
- **Knowledge Graphs:** UMLS/SNOMED integration for symptom-drug interaction mapping
- **Pharmacovigilance:** Automated adverse event reporting to FDA FAERS database

**Enhanced User Experience:**
- **Conversational Interface:** Multi-turn dialogue for symptom clarification
- **Proactive Monitoring:** Wearable integration for continuous health tracking
- **Personalization:** Individual risk profiles, medication history context
- **Telemedicine Integration:** Direct clinician handoff for urgent cases

## 17. Executive Summary

**Technical Stack:** 
Start with BioClinicalBERT (110M params) for text severity classification, Whisper Small (244M params) for speech transcription, and EfficientNet-B0 (5.3M params) for image analysis once 10k+ labeled samples are available.

**MVP Deployment:**
DistilBioClinicalBERT + Faster-Whisper on 8GB RAM servers, achieving <300ms text analysis and <2s audio processing with 75%+ accuracy on synthetic validation data.

**Scaling Strategy:**
Multi-modal fusion via weighted late fusion with rule-based escalation, deploying on Kubernetes with auto-scaling (2-10 instances), targeting 99.5% uptime and <500ms P95 latency.

**Privacy-First Design:**
On-device speech processing option, comprehensive PII removal (97%+ recall), HIPAA/GDPR compliance with end-to-end encryption and automated anonymization.

**Clinical Safety:**
Aggressive red flag detection (95%+ recall for emergency symptoms), uncertainty quantification with human review triggers, and structured audit trails for clinical oversight.
