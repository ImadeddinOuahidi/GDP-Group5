/**
 * Curated medication seed catalog.
 *
 * Data was curated from:
 * - RxNav/RxNorm API (U.S. National Library of Medicine)
 * - FDA openFDA NDC API
 * - ClinCalc Top 300 reference list (selection basis)
 *
 * Last reviewed: 2026-02-23
 */

const medicationCatalog = [
  // Analgesic
  {
    name: 'Acetaminophen',
    genericName: 'Acetaminophen',
    category: 'Analgesic',
    dosageForm: 'Tablet',
    commonStrengths: ['325mg', '500mg', '650mg'],
    description: 'Analgesic and antipyretic for mild-to-moderate pain and fever.',
    tags: ['pain', 'fever', 'analgesic', 'otc']
  },
  {
    name: 'Ibuprofen',
    genericName: 'Ibuprofen',
    category: 'Analgesic',
    dosageForm: 'Tablet',
    commonStrengths: ['200mg', '400mg', '600mg', '800mg'],
    description: 'Non-steroidal anti-inflammatory drug (NSAID) for pain and inflammation.',
    tags: ['pain', 'inflammation', 'nsaid', 'fever']
  },
  {
    name: 'Naproxen',
    genericName: 'Naproxen',
    category: 'Analgesic',
    dosageForm: 'Tablet',
    commonStrengths: ['220mg', '250mg', '375mg', '500mg'],
    description: 'NSAID used for inflammatory pain and musculoskeletal conditions.',
    tags: ['pain', 'nsaid', 'arthritis', 'inflammation']
  },
  {
    name: 'Aspirin',
    genericName: 'Acetylsalicylic Acid',
    category: 'Analgesic',
    dosageForm: 'Tablet',
    commonStrengths: ['81mg', '325mg', '500mg'],
    description: 'Salicylate used for pain, fever, and antiplatelet therapy.',
    tags: ['pain', 'antiplatelet', 'cardiovascular', 'fever']
  },
  {
    name: 'Diclofenac',
    genericName: 'Diclofenac Sodium',
    category: 'Analgesic',
    dosageForm: 'Tablet',
    commonStrengths: ['25mg', '50mg', '75mg', '100mg'],
    description: 'NSAID used for arthritis and acute musculoskeletal pain.',
    tags: ['pain', 'arthritis', 'nsaid', 'inflammation']
  },
  {
    name: 'Tramadol',
    genericName: 'Tramadol Hydrochloride',
    category: 'Analgesic',
    dosageForm: 'Tablet',
    commonStrengths: ['50mg', '100mg', '200mg', '300mg'],
    description: 'Centrally acting analgesic for moderate to moderately severe pain.',
    tags: ['pain', 'opioid', 'chronic pain']
  },

  // Antibiotic
  {
    name: 'Amoxicillin',
    genericName: 'Amoxicillin',
    category: 'Antibiotic',
    dosageForm: 'Capsule',
    commonStrengths: ['250mg', '500mg', '875mg'],
    description: 'Penicillin-class antibiotic for susceptible bacterial infections.',
    tags: ['antibiotic', 'bacterial', 'respiratory', 'uti']
  },
  {
    name: 'Amoxicillin/Clavulanate',
    genericName: 'Amoxicillin and Clavulanate Potassium',
    category: 'Antibiotic',
    dosageForm: 'Tablet',
    commonStrengths: ['500mg/125mg', '875mg/125mg'],
    description: 'Beta-lactam and beta-lactamase inhibitor combination antibiotic.',
    tags: ['antibiotic', 'beta-lactamase', 'bacterial', 'sinusitis']
  },
  {
    name: 'Azithromycin',
    genericName: 'Azithromycin',
    category: 'Antibiotic',
    dosageForm: 'Tablet',
    commonStrengths: ['250mg', '500mg', '600mg'],
    description: 'Macrolide antibiotic commonly used for respiratory and skin infections.',
    tags: ['antibiotic', 'macrolide', 'respiratory', 'skin']
  },
  {
    name: 'Cephalexin',
    genericName: 'Cephalexin',
    category: 'Antibiotic',
    dosageForm: 'Capsule',
    commonStrengths: ['250mg', '500mg', '750mg'],
    description: 'First-generation cephalosporin for skin and urinary infections.',
    tags: ['antibiotic', 'cephalosporin', 'uti', 'skin']
  },
  {
    name: 'Doxycycline',
    genericName: 'Doxycycline Hyclate',
    category: 'Antibiotic',
    dosageForm: 'Capsule',
    commonStrengths: ['50mg', '75mg', '100mg', '150mg'],
    description: 'Tetracycline antibiotic for broad bacterial coverage.',
    tags: ['antibiotic', 'tetracycline', 'acne', 'respiratory']
  },
  {
    name: 'Ciprofloxacin',
    genericName: 'Ciprofloxacin Hydrochloride',
    category: 'Antibiotic',
    dosageForm: 'Tablet',
    commonStrengths: ['250mg', '500mg', '750mg'],
    description: 'Fluoroquinolone antibiotic for selected bacterial infections.',
    tags: ['antibiotic', 'fluoroquinolone', 'uti', 'gastrointestinal']
  },
  {
    name: 'Trimethoprim/Sulfamethoxazole',
    genericName: 'Sulfamethoxazole and Trimethoprim',
    category: 'Antibiotic',
    dosageForm: 'Tablet',
    commonStrengths: ['400mg/80mg', '800mg/160mg'],
    description: 'Combination antibiotic for urinary and skin infections.',
    tags: ['antibiotic', 'combination', 'uti', 'skin']
  },
  {
    name: 'Clindamycin',
    genericName: 'Clindamycin Hydrochloride',
    category: 'Antibiotic',
    dosageForm: 'Capsule',
    commonStrengths: ['150mg', '300mg'],
    description: 'Lincosamide antibiotic for skin, soft tissue, and anaerobic infections.',
    tags: ['antibiotic', 'anaerobic', 'skin', 'dental']
  },

  // Antiviral
  {
    name: 'Acyclovir',
    genericName: 'Acyclovir',
    category: 'Antiviral',
    dosageForm: 'Tablet',
    commonStrengths: ['200mg', '400mg', '800mg'],
    description: 'Antiviral used for herpes simplex and varicella-zoster infections.',
    tags: ['antiviral', 'herpes', 'zoster', 'hsv']
  },
  {
    name: 'Valacyclovir',
    genericName: 'Valacyclovir Hydrochloride',
    category: 'Antiviral',
    dosageForm: 'Tablet',
    commonStrengths: ['500mg', '1g'],
    description: 'Antiviral prodrug for HSV suppression and herpes zoster.',
    tags: ['antiviral', 'herpes', 'zoster', 'hsv']
  },
  {
    name: 'Oseltamivir',
    genericName: 'Oseltamivir Phosphate',
    category: 'Antiviral',
    dosageForm: 'Capsule',
    commonStrengths: ['30mg', '45mg', '75mg'],
    description: 'Neuraminidase inhibitor for influenza treatment and prophylaxis.',
    tags: ['antiviral', 'influenza', 'flu']
  },
  {
    name: 'Nirmatrelvir/Ritonavir',
    genericName: 'Nirmatrelvir and Ritonavir',
    category: 'Antiviral',
    dosageForm: 'Tablet',
    commonStrengths: ['300mg/100mg'],
    description: 'Oral antiviral combination used for treatment of COVID-19 in high-risk patients.',
    tags: ['antiviral', 'covid-19', 'sars-cov-2']
  },

  // Antifungal
  {
    name: 'Fluconazole',
    genericName: 'Fluconazole',
    category: 'Antifungal',
    dosageForm: 'Tablet',
    commonStrengths: ['50mg', '100mg', '150mg', '200mg'],
    description: 'Systemic azole antifungal used for candidiasis and cryptococcal infections.',
    tags: ['antifungal', 'candida', 'azole']
  },
  {
    name: 'Terbinafine',
    genericName: 'Terbinafine Hydrochloride',
    category: 'Antifungal',
    dosageForm: 'Tablet',
    commonStrengths: ['250mg'],
    description: 'Allylamine antifungal used for dermatophyte infections.',
    tags: ['antifungal', 'onychomycosis', 'tinea']
  },
  {
    name: 'Clotrimazole',
    genericName: 'Clotrimazole',
    category: 'Antifungal',
    dosageForm: 'Cream/Ointment',
    commonStrengths: ['1%'],
    description: 'Topical antifungal for superficial skin and mucosal fungal infections.',
    tags: ['antifungal', 'topical', 'tinea']
  },

  // Antihistamine
  {
    name: 'Cetirizine',
    genericName: 'Cetirizine Hydrochloride',
    category: 'Antihistamine',
    dosageForm: 'Tablet',
    commonStrengths: ['5mg', '10mg'],
    description: 'Second-generation antihistamine for allergic rhinitis and urticaria.',
    tags: ['allergy', 'antihistamine', 'urticaria', 'rhinitis']
  },
  {
    name: 'Loratadine',
    genericName: 'Loratadine',
    category: 'Antihistamine',
    dosageForm: 'Tablet',
    commonStrengths: ['10mg'],
    description: 'Second-generation non-sedating antihistamine.',
    tags: ['allergy', 'antihistamine', 'rhinitis']
  },
  {
    name: 'Fexofenadine',
    genericName: 'Fexofenadine Hydrochloride',
    category: 'Antihistamine',
    dosageForm: 'Tablet',
    commonStrengths: ['60mg', '120mg', '180mg'],
    description: 'Second-generation antihistamine for allergic rhinitis and urticaria.',
    tags: ['allergy', 'antihistamine', 'hives']
  },
  {
    name: 'Diphenhydramine',
    genericName: 'Diphenhydramine Hydrochloride',
    category: 'Antihistamine',
    dosageForm: 'Capsule',
    commonStrengths: ['25mg', '50mg'],
    description: 'First-generation antihistamine with sedating properties.',
    tags: ['allergy', 'antihistamine', 'sleep', 'sedating']
  },

  // Cardiovascular
  {
    name: 'Lisinopril',
    genericName: 'Lisinopril',
    category: 'Cardiovascular',
    dosageForm: 'Tablet',
    commonStrengths: ['2.5mg', '5mg', '10mg', '20mg', '40mg'],
    description: 'ACE inhibitor for hypertension, heart failure, and post-MI care.',
    tags: ['hypertension', 'ace inhibitor', 'heart failure']
  },
  {
    name: 'Losartan',
    genericName: 'Losartan Potassium',
    category: 'Cardiovascular',
    dosageForm: 'Tablet',
    commonStrengths: ['25mg', '50mg', '100mg'],
    description: 'ARB used for blood pressure control and renal protection.',
    tags: ['hypertension', 'arb', 'renal protection']
  },
  {
    name: 'Amlodipine',
    genericName: 'Amlodipine Besylate',
    category: 'Cardiovascular',
    dosageForm: 'Tablet',
    commonStrengths: ['2.5mg', '5mg', '10mg'],
    description: 'Calcium channel blocker used for hypertension and angina.',
    tags: ['hypertension', 'angina', 'calcium channel blocker']
  },
  {
    name: 'Metoprolol Succinate',
    genericName: 'Metoprolol Succinate Extended-Release',
    category: 'Cardiovascular',
    dosageForm: 'Tablet',
    commonStrengths: ['25mg', '50mg', '100mg', '200mg'],
    description: 'Beta-blocker used for hypertension, angina, and chronic heart failure.',
    tags: ['beta blocker', 'hypertension', 'heart failure']
  },
  {
    name: 'Hydrochlorothiazide',
    genericName: 'Hydrochlorothiazide',
    category: 'Cardiovascular',
    dosageForm: 'Tablet',
    commonStrengths: ['12.5mg', '25mg', '50mg'],
    description: 'Thiazide diuretic for hypertension and edema.',
    tags: ['diuretic', 'hypertension', 'edema']
  },
  {
    name: 'Atorvastatin',
    genericName: 'Atorvastatin Calcium',
    category: 'Cardiovascular',
    dosageForm: 'Tablet',
    commonStrengths: ['10mg', '20mg', '40mg', '80mg'],
    description: 'HMG-CoA reductase inhibitor for lipid lowering and CV risk reduction.',
    tags: ['statin', 'cholesterol', 'cardiovascular']
  },
  {
    name: 'Rosuvastatin',
    genericName: 'Rosuvastatin Calcium',
    category: 'Cardiovascular',
    dosageForm: 'Tablet',
    commonStrengths: ['5mg', '10mg', '20mg', '40mg'],
    description: 'Potent statin for dyslipidemia and cardiovascular risk reduction.',
    tags: ['statin', 'cholesterol', 'hyperlipidemia']
  },
  {
    name: 'Clopidogrel',
    genericName: 'Clopidogrel Bisulfate',
    category: 'Cardiovascular',
    dosageForm: 'Tablet',
    commonStrengths: ['75mg', '300mg'],
    description: 'P2Y12 inhibitor antiplatelet agent.',
    tags: ['antiplatelet', 'stroke prevention', 'stent']
  },
  {
    name: 'Apixaban',
    genericName: 'Apixaban',
    category: 'Cardiovascular',
    dosageForm: 'Tablet',
    commonStrengths: ['2.5mg', '5mg'],
    description: 'Direct oral anticoagulant for AFib and VTE management.',
    tags: ['anticoagulant', 'afib', 'vte']
  },
  {
    name: 'Furosemide',
    genericName: 'Furosemide',
    category: 'Cardiovascular',
    dosageForm: 'Tablet',
    commonStrengths: ['20mg', '40mg', '80mg'],
    description: 'Loop diuretic for edema and heart failure-related fluid overload.',
    tags: ['diuretic', 'edema', 'heart failure']
  },

  // Diabetes
  {
    name: 'Metformin',
    genericName: 'Metformin Hydrochloride',
    category: 'Diabetes',
    dosageForm: 'Tablet',
    commonStrengths: ['500mg', '850mg', '1000mg'],
    description: 'First-line oral biguanide for type 2 diabetes management.',
    tags: ['diabetes', 'biguanide', 'glucose']
  },
  {
    name: 'Glipizide',
    genericName: 'Glipizide',
    category: 'Diabetes',
    dosageForm: 'Tablet',
    commonStrengths: ['2.5mg', '5mg', '10mg'],
    description: 'Sulfonylurea for improving glycemic control in type 2 diabetes.',
    tags: ['diabetes', 'sulfonylurea', 'glucose']
  },
  {
    name: 'Empagliflozin',
    genericName: 'Empagliflozin',
    category: 'Diabetes',
    dosageForm: 'Tablet',
    commonStrengths: ['10mg', '25mg'],
    description: 'SGLT2 inhibitor with glycemic and cardio-renal benefits.',
    tags: ['diabetes', 'sglt2', 'cardiorenal']
  },
  {
    name: 'Semaglutide',
    genericName: 'Semaglutide',
    category: 'Diabetes',
    dosageForm: 'Injection',
    commonStrengths: ['0.25mg/dose', '0.5mg/dose', '1mg/dose', '2mg/dose'],
    description: 'GLP-1 receptor agonist used for type 2 diabetes and weight management.',
    tags: ['diabetes', 'glp-1', 'weight management']
  },
  {
    name: 'Insulin Glargine',
    genericName: 'Insulin Glargine',
    category: 'Diabetes',
    dosageForm: 'Injection',
    commonStrengths: ['100units/mL', '300units/mL'],
    description: 'Long-acting basal insulin for diabetes management.',
    tags: ['diabetes', 'insulin', 'basal']
  },
  {
    name: 'Sitagliptin',
    genericName: 'Sitagliptin',
    category: 'Diabetes',
    dosageForm: 'Tablet',
    commonStrengths: ['25mg', '50mg', '100mg'],
    description: 'DPP-4 inhibitor for glycemic control in type 2 diabetes.',
    tags: ['diabetes', 'dpp-4', 'glucose']
  },

  // Respiratory
  {
    name: 'Albuterol',
    genericName: 'Albuterol Sulfate',
    category: 'Respiratory',
    dosageForm: 'Inhaler',
    commonStrengths: ['90mcg/actuation'],
    description: 'Short-acting beta agonist rescue bronchodilator.',
    tags: ['asthma', 'copd', 'rescue inhaler']
  },
  {
    name: 'Fluticasone Propionate',
    genericName: 'Fluticasone Propionate',
    category: 'Respiratory',
    dosageForm: 'Inhaler',
    commonStrengths: ['44mcg/actuation', '110mcg/actuation', '220mcg/actuation'],
    description: 'Inhaled corticosteroid for long-term asthma control.',
    tags: ['asthma', 'inhaled steroid', 'controller']
  },
  {
    name: 'Budesonide/Formoterol',
    genericName: 'Budesonide and Formoterol Fumarate',
    category: 'Respiratory',
    dosageForm: 'Inhaler',
    commonStrengths: ['80mcg/4.5mcg', '160mcg/4.5mcg'],
    description: 'ICS/LABA combination inhaler for asthma and COPD maintenance.',
    tags: ['asthma', 'copd', 'ics-laba']
  },
  {
    name: 'Montelukast',
    genericName: 'Montelukast Sodium',
    category: 'Respiratory',
    dosageForm: 'Tablet',
    commonStrengths: ['4mg', '5mg', '10mg'],
    description: 'Leukotriene receptor antagonist for asthma and allergic rhinitis.',
    tags: ['asthma', 'allergy', 'leukotriene']
  },
  {
    name: 'Tiotropium',
    genericName: 'Tiotropium Bromide',
    category: 'Respiratory',
    dosageForm: 'Inhaler',
    commonStrengths: ['1.25mcg/actuation', '2.5mcg/actuation'],
    description: 'Long-acting muscarinic antagonist bronchodilator.',
    tags: ['copd', 'asthma', 'lama']
  },
  {
    name: 'Ipratropium/Albuterol',
    genericName: 'Ipratropium Bromide and Albuterol Sulfate',
    category: 'Respiratory',
    dosageForm: 'Inhaler',
    commonStrengths: ['20mcg/100mcg per actuation'],
    description: 'Combination bronchodilator used in COPD management.',
    tags: ['copd', 'bronchodilator', 'combination inhaler']
  },

  // Gastrointestinal
  {
    name: 'Omeprazole',
    genericName: 'Omeprazole',
    category: 'Gastrointestinal',
    dosageForm: 'Capsule',
    commonStrengths: ['10mg', '20mg', '40mg'],
    description: 'Proton pump inhibitor for GERD and acid-related disorders.',
    tags: ['gerd', 'ppi', 'acid suppression']
  },
  {
    name: 'Pantoprazole',
    genericName: 'Pantoprazole Sodium',
    category: 'Gastrointestinal',
    dosageForm: 'Tablet',
    commonStrengths: ['20mg', '40mg'],
    description: 'Proton pump inhibitor for GERD and erosive esophagitis.',
    tags: ['gerd', 'ppi', 'acid suppression']
  },
  {
    name: 'Famotidine',
    genericName: 'Famotidine',
    category: 'Gastrointestinal',
    dosageForm: 'Tablet',
    commonStrengths: ['10mg', '20mg', '40mg'],
    description: 'H2 receptor antagonist for dyspepsia and reflux symptoms.',
    tags: ['gerd', 'h2 blocker', 'heartburn']
  },
  {
    name: 'Ondansetron',
    genericName: 'Ondansetron',
    category: 'Gastrointestinal',
    dosageForm: 'Tablet',
    commonStrengths: ['4mg', '8mg', '24mg'],
    description: '5-HT3 antagonist antiemetic for nausea and vomiting.',
    tags: ['antiemetic', 'nausea', 'vomiting']
  },
  {
    name: 'Docusate Sodium',
    genericName: 'Docusate Sodium',
    category: 'Gastrointestinal',
    dosageForm: 'Capsule',
    commonStrengths: ['50mg', '100mg', '250mg'],
    description: 'Stool softener for constipation relief.',
    tags: ['constipation', 'stool softener', 'bowel regimen']
  },
  {
    name: 'Loperamide',
    genericName: 'Loperamide Hydrochloride',
    category: 'Gastrointestinal',
    dosageForm: 'Capsule',
    commonStrengths: ['2mg'],
    description: 'Peripheral opioid receptor agonist used for acute diarrhea.',
    tags: ['diarrhea', 'antidiarrheal', 'gastrointestinal']
  },

  // Neurological
  {
    name: 'Gabapentin',
    genericName: 'Gabapentin',
    category: 'Neurological',
    dosageForm: 'Capsule',
    commonStrengths: ['100mg', '300mg', '400mg'],
    description: 'Neuropathic pain and anticonvulsant medication.',
    tags: ['neuropathy', 'seizure', 'pain']
  },
  {
    name: 'Pregabalin',
    genericName: 'Pregabalin',
    category: 'Neurological',
    dosageForm: 'Capsule',
    commonStrengths: ['25mg', '50mg', '75mg', '100mg', '150mg', '300mg'],
    description: 'Medication used for neuropathic pain, fibromyalgia, and seizures.',
    tags: ['neuropathy', 'fibromyalgia', 'seizure']
  },
  {
    name: 'Levetiracetam',
    genericName: 'Levetiracetam',
    category: 'Neurological',
    dosageForm: 'Tablet',
    commonStrengths: ['250mg', '500mg', '750mg', '1000mg'],
    description: 'Broad-spectrum anticonvulsant for seizure disorders.',
    tags: ['seizure', 'epilepsy', 'anticonvulsant']
  },
  {
    name: 'Sumatriptan',
    genericName: 'Sumatriptan Succinate',
    category: 'Neurological',
    dosageForm: 'Tablet',
    commonStrengths: ['25mg', '50mg', '100mg'],
    description: 'Triptan for acute migraine attacks.',
    tags: ['migraine', 'headache', 'triptan']
  },
  {
    name: 'Topiramate',
    genericName: 'Topiramate',
    category: 'Neurological',
    dosageForm: 'Tablet',
    commonStrengths: ['25mg', '50mg', '100mg', '200mg'],
    description: 'Anticonvulsant used in epilepsy and migraine prophylaxis.',
    tags: ['seizure', 'migraine prevention', 'neurology']
  },

  // Psychiatric
  {
    name: 'Sertraline',
    genericName: 'Sertraline Hydrochloride',
    category: 'Psychiatric',
    dosageForm: 'Tablet',
    commonStrengths: ['25mg', '50mg', '100mg'],
    description: 'SSRI antidepressant used for depression and anxiety disorders.',
    tags: ['ssri', 'depression', 'anxiety']
  },
  {
    name: 'Escitalopram',
    genericName: 'Escitalopram Oxalate',
    category: 'Psychiatric',
    dosageForm: 'Tablet',
    commonStrengths: ['5mg', '10mg', '20mg'],
    description: 'SSRI used for major depressive disorder and GAD.',
    tags: ['ssri', 'depression', 'anxiety']
  },
  {
    name: 'Fluoxetine',
    genericName: 'Fluoxetine Hydrochloride',
    category: 'Psychiatric',
    dosageForm: 'Capsule',
    commonStrengths: ['10mg', '20mg', '40mg'],
    description: 'SSRI used for depression, OCD, and panic disorder.',
    tags: ['ssri', 'depression', 'ocd', 'panic disorder']
  },
  {
    name: 'Bupropion XL',
    genericName: 'Bupropion Hydrochloride Extended-Release',
    category: 'Psychiatric',
    dosageForm: 'Tablet',
    commonStrengths: ['150mg', '300mg'],
    description: 'NDRI antidepressant also used for smoking cessation.',
    tags: ['depression', 'smoking cessation', 'ndri']
  },
  {
    name: 'Duloxetine',
    genericName: 'Duloxetine Hydrochloride',
    category: 'Psychiatric',
    dosageForm: 'Capsule',
    commonStrengths: ['20mg', '30mg', '40mg', '60mg'],
    description: 'SNRI used for depression, anxiety, and chronic pain syndromes.',
    tags: ['snri', 'depression', 'anxiety', 'neuropathic pain']
  },
  {
    name: 'Trazodone',
    genericName: 'Trazodone Hydrochloride',
    category: 'Psychiatric',
    dosageForm: 'Tablet',
    commonStrengths: ['50mg', '100mg', '150mg', '300mg'],
    description: 'Serotonin antagonist/reuptake inhibitor used for depression and insomnia.',
    tags: ['depression', 'sleep', 'psychiatry']
  },

  // Dermatological
  {
    name: 'Mupirocin',
    genericName: 'Mupirocin',
    category: 'Dermatological',
    dosageForm: 'Cream/Ointment',
    commonStrengths: ['2%'],
    description: 'Topical antibacterial for localized skin infections.',
    tags: ['topical', 'antibiotic', 'skin infection']
  },
  {
    name: 'Hydrocortisone',
    genericName: 'Hydrocortisone',
    category: 'Dermatological',
    dosageForm: 'Cream/Ointment',
    commonStrengths: ['0.5%', '1%', '2.5%'],
    description: 'Topical corticosteroid for inflammatory skin conditions.',
    tags: ['topical steroid', 'eczema', 'rash']
  },
  {
    name: 'Triamcinolone Acetonide',
    genericName: 'Triamcinolone Acetonide',
    category: 'Dermatological',
    dosageForm: 'Cream/Ointment',
    commonStrengths: ['0.025%', '0.1%', '0.5%'],
    description: 'Medium-to-high potency topical corticosteroid.',
    tags: ['topical steroid', 'dermatitis', 'eczema']
  },
  {
    name: 'Adapalene',
    genericName: 'Adapalene',
    category: 'Dermatological',
    dosageForm: 'Cream/Ointment',
    commonStrengths: ['0.1%', '0.3%'],
    description: 'Topical retinoid used in acne management.',
    tags: ['acne', 'retinoid', 'topical']
  },

  // Hormonal
  {
    name: 'Levothyroxine',
    genericName: 'Levothyroxine Sodium',
    category: 'Hormonal',
    dosageForm: 'Tablet',
    commonStrengths: ['25mcg', '50mcg', '75mcg', '100mcg', '125mcg', '150mcg', '175mcg', '200mcg'],
    description: 'Synthetic thyroid hormone replacement for hypothyroidism.',
    tags: ['thyroid', 'hypothyroidism', 'hormone replacement']
  },
  {
    name: 'Prednisone',
    genericName: 'Prednisone',
    category: 'Hormonal',
    dosageForm: 'Tablet',
    commonStrengths: ['1mg', '2.5mg', '5mg', '10mg', '20mg', '50mg'],
    description: 'Systemic corticosteroid for inflammatory and autoimmune conditions.',
    tags: ['steroid', 'inflammation', 'immunosuppression']
  },
  {
    name: 'Ethinyl Estradiol/Norethindrone',
    genericName: 'Ethinyl Estradiol and Norethindrone Acetate',
    category: 'Hormonal',
    dosageForm: 'Tablet',
    commonStrengths: ['1mg/20mcg', '1mg/10mcg', '1.5mg/30mcg'],
    description: 'Combined oral contraceptive for contraception and cycle regulation.',
    tags: ['contraception', 'estrogen', 'progestin']
  },
  {
    name: 'Medroxyprogesterone',
    genericName: 'Medroxyprogesterone Acetate',
    category: 'Hormonal',
    dosageForm: 'Injection',
    commonStrengths: ['150mg/mL'],
    description: 'Progestin injection used for contraception and gynecologic indications.',
    tags: ['contraception', 'progestin', 'hormonal']
  },

  // Supplement
  {
    name: 'Vitamin D3',
    genericName: 'Cholecalciferol',
    category: 'Supplement',
    dosageForm: 'Tablet',
    commonStrengths: ['400IU', '1000IU', '2000IU', '5000IU'],
    description: 'Vitamin D supplement for deficiency prevention and treatment.',
    tags: ['supplement', 'vitamin d', 'bone health']
  },
  {
    name: 'Vitamin B12',
    genericName: 'Cyanocobalamin',
    category: 'Supplement',
    dosageForm: 'Tablet',
    commonStrengths: ['500mcg', '1000mcg', '2500mcg'],
    description: 'Vitamin B12 supplement for deficiency states.',
    tags: ['supplement', 'vitamin b12', 'anemia']
  },
  {
    name: 'Ferrous Sulfate',
    genericName: 'Ferrous Sulfate',
    category: 'Supplement',
    dosageForm: 'Tablet',
    commonStrengths: ['325mg', '65mg elemental iron'],
    description: 'Oral iron supplement for treatment of iron deficiency anemia.',
    tags: ['supplement', 'iron', 'anemia']
  },
  {
    name: 'Folic Acid',
    genericName: 'Folic Acid',
    category: 'Supplement',
    dosageForm: 'Tablet',
    commonStrengths: ['400mcg', '800mcg', '1mg'],
    description: 'Folate supplementation for deficiency and prenatal support.',
    tags: ['supplement', 'folate', 'prenatal']
  }
];

module.exports = medicationCatalog;
