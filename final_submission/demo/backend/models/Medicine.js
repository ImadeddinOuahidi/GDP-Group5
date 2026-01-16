const mongoose = require("mongoose");

const medicineSchema = new mongoose.Schema(
  {
    // Basic medicine information
    name: {
      type: String,
      required: [true, "Medicine name is required"],
      trim: true,
      maxlength: [100, "Medicine name cannot exceed 100 characters"],
    },
    genericName: {
      type: String,
      required: [true, "Generic name is required"],
      trim: true,
      maxlength: [100, "Generic name cannot exceed 100 characters"],
    },
    brandName: {
      type: String,
      trim: true,
      maxlength: [100, "Brand name cannot exceed 100 characters"],
    },

    manufacturer: {
      name: {
        type: String,
        required: [true, "Manufacturer name is required"],
        trim: true,
      },
      country: {
        type: String,
        required: [true, "Manufacturer country is required"],
        trim: true,
      },
      licenseNumber: {
        type: String,
        required: [true, "Manufacturer license number is required"],
        trim: true,
      },
    },

    // Drug classification
    category: {
      type: String,
      required: [true, "Medicine category is required"],
      enum: [
        "Antibiotic",
        "Analgesic",
        "Antiviral",
        "Antifungal",
        "Antihistamine",
        "Cardiovascular",
        "Diabetes",
        "Respiratory",
        "Gastrointestinal",
        "Neurological",
        "Psychiatric",
        "Dermatological",
        "Hormonal",
        "Immunosuppressant",
        "Vaccine",
        "Vitamin",
        "Supplement",
        "Other",
      ],
    },
    therapeuticClass: {
      type: String,
      required: [true, "Therapeutic class is required"],
      trim: true,
    },
    drugClass: {
      type: String,
      required: [true, "Drug class is required"],
      trim: true,
    },

    // Dosage and administration
    dosageForm: {
      type: String,
      required: [true, "Dosage form is required"],
      enum: [
        "Tablet",
        "Capsule",
        "Syrup",
        "Injection",
        "Cream",
        "Ointment",
        "Drops",
        "Inhaler",
        "Patch",
        "Suppository",
        "Powder",
        "Gel",
      ],
    },
    strength: {
      value: {
        type: Number,
        required: [true, "Strength value is required"],
        min: [0.0000001, "Strength must be positive"],
      },
      unit: {
        type: String,
        required: [true, "Strength unit is required"],
        enum: ["mg", "g", "mcg", "ml", "L", "IU", "%"],
      },
    },
    route: {
      type: [String],
      required: [true, "Route of administration is required"],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: "At least one route of administration is required",
      },
      enum: [
        "Oral",
        "Intravenous",
        "Intramuscular",
        "Subcutaneous",
        "Topical",
        "Inhalation",
        "Rectal",
        "Vaginal",
        "Nasal",
        "Ophthalmic",
        "Otic",
      ],
    },

    // Prescription information
    prescriptionRequired: {
      type: Boolean,
      required: [true, "Prescription requirement must be specified"],
      default: true,
    },
    controlledSubstance: {
      isControlled: {
        type: Boolean,
        default: false,
      },
      schedule: {
        type: String,
        enum: ["I", "II", "III", "IV", "V"],
        required: function () {
          return this.controlledSubstance?.isControlled === true;
        },
      },
    },

    // Medical information
    indications: [
      {
        condition: { type: String, required: true, trim: true },
        description: String,
      },
    ],
    contraindications: [
      {
        condition: { type: String, required: true, trim: true },
        severity: {
          type: String,
          enum: ["Absolute", "Relative"],
          required: true,
        },
        description: String,
      },
    ],
    knownSideEffects: [
      {
        effect: { type: String, required: true, trim: true },
        severity: {
          type: String,
          enum: ["Mild", "Moderate", "Severe", "Life-threatening"],
          required: true,
        },
        frequency: {
          type: String,
          enum: ["Very common", "Common", "Uncommon", "Rare", "Very rare"],
          required: true,
        },
        description: String,
      },
    ],
    interactions: [
      {
        type: {
          type: String,
          enum: ["Drug-Drug", "Drug-Food", "Drug-Disease"],
          required: true,
        },
        interactsWith: { type: String, required: true, trim: true },
        severity: { type: String, enum: ["Minor", "Moderate", "Major"], required: true },
        description: String,
        management: String,
      },
    ],

    // Dosing information
    dosing: {
      adult: { standardDose: String, maxDose: String, frequency: String, duration: String },
      pediatric: {
        standardDose: String,
        maxDose: String,
        frequency: String,
        duration: String,
        ageRestriction: String,
      },
      elderly: { adjustedDose: String, specialConsiderations: String },
      renalAdjustment: String,
      hepaticAdjustment: String,
    },

    // Storage and expiry
    storage: {
      temperature: {
        min: { type: Number, default: null },
        max: { type: Number, default: null },
        unit: { type: String, enum: ["Celsius", "Fahrenheit"], default: "Celsius" },
      },
      humidity: String,
      lightProtection: { type: Boolean, default: false },
      specialInstructions: String,
    },
    shelfLife: {
      duration: { type: Number, min: [0, "Shelf life must be non-negative"], default: 0 },
      unit: { type: String, enum: ["days", "months", "years"], default: "months" },
    },

    // Regulatory and approval information
    approvalInfo: {
      fdaApproved: { type: Boolean, default: false },
      approvalDate: Date,
      ndc: { type: String, trim: true },
      approvalNumber: { type: String, trim: true },
    },

    // Pricing and availability
    pricing: {
      wholesalePrice: { type: Number, min: 0 },
      retailPrice: { type: Number, min: 0 },
      currency: { type: String, default: "USD" },
    },
    availability: {
      inStock: { type: Boolean, default: true },
      quantity: { type: Number, min: 0, default: 0 },
      minimumStock: { type: Number, min: 0, default: 10 },
      supplier: { name: String, contact: String },
    },

    // Additional information
    description: { type: String, maxlength: [1000, "Description cannot exceed 1000 characters"] },
    warnings: [{ type: String, trim: true }],
    precautions: [{ type: String, trim: true }],

    // System fields
    isActive: { type: Boolean, default: true },
    isDiscontinued: { type: Boolean, default: false },
    discontinuedDate: Date,
    discontinuedReason: String,

    // Audit fields
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true, // ✅ createdAt/updatedAt handled automatically
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/* ----------------------------- Normalization ----------------------------- */
// Normalize key strings for consistent search & uniqueness
medicineSchema.pre("save", function (next) {
  if (this.name) this.name = this.name.trim();
  if (this.genericName) this.genericName = this.genericName.trim();
  if (this.brandName) this.brandName = this.brandName.trim();

  // Optional normalization helpers (safe)
  this._nameLower = this.name ? this.name.toLowerCase() : undefined;
  this._genericNameLower = this.genericName ? this.genericName.toLowerCase() : undefined;
  this._brandNameLower = this.brandName ? this.brandName.toLowerCase() : undefined;

  // Validate storage temperature range if both are set
  const minT = this.storage?.temperature?.min;
  const maxT = this.storage?.temperature?.max;
  if (minT != null && maxT != null && minT > maxT) {
    return next(new Error("Storage temperature min cannot be greater than max"));
  }

  next();
});

// ✅ Optional: auto filter inactive/discontinued in find queries
medicineSchema.pre(/^find/, function (next) {
  // Only apply if caller didn't explicitly request otherwise
  if (!this.getQuery().hasOwnProperty("isActive")) {
    this.where({ isActive: true });
  }
  if (!this.getQuery().hasOwnProperty("isDiscontinued")) {
    this.where({ isDiscontinued: false });
  }
  next();
});

/* -------------------------------- Indexes -------------------------------- */
medicineSchema.index({ name: 1 });
medicineSchema.index({ genericName: 1 });
medicineSchema.index({ category: 1 });
medicineSchema.index({ "manufacturer.name": 1 });
medicineSchema.index({ prescriptionRequired: 1 });
medicineSchema.index({ isActive: 1 });

// ✅ Compound uniqueness to reduce duplicate entries
// (same generic + strength + form should not duplicate)
medicineSchema.index(
  { _genericNameLower: 1, "strength.value": 1, "strength.unit": 1, dosageForm: 1 },
  { unique: true, partialFilterExpression: { _genericNameLower: { $type: "string" } } }
);

// ✅ Text index for better search experience
medicineSchema.index({ name: "text", genericName: "text", brandName: "text", "manufacturer.name": "text" });

/* -------------------------------- Virtuals -------------------------------- */
medicineSchema.virtual("fullName").get(function () {
  return this.brandName ? `${this.name} (${this.brandName})` : this.name;
});

medicineSchema.virtual("strengthDisplay").get(function () {
  const v = this.strength?.value ?? "";
  const u = this.strength?.unit ?? "";
  return `${v}${u}`;
});

medicineSchema.virtual("isLowStock").get(function () {
  const qty = this.availability?.quantity ?? 0;
  const min = this.availability?.minimumStock ?? 0;
  return qty <= min;
});

medicineSchema.virtual("isExpired").get(function () {
  // Needs manufacturing/batch dates in future. Keep as placeholder.
  return false;
});

/* ------------------------------- Statics ------------------------------- */
medicineSchema.statics.findByCategory = function (category) {
  return this.find({ category });
};

medicineSchema.statics.findPrescriptionMedicines = function () {
  return this.find({ prescriptionRequired: true });
};

medicineSchema.statics.findOTCMedicines = function () {
  return this.find({ prescriptionRequired: false });
};

medicineSchema.statics.searchByName = async function (searchTerm) {
  const term = (searchTerm || "").trim();
  if (!term) return [];

  // Prefer text search when possible
  try {
    return await this.find(
      { $text: { $search: term } },
      { score: { $meta: "textScore" } }
    ).sort({ score: { $meta: "textScore" } });
  } catch {
    // Fallback to regex search
    const regex = new RegExp(term, "i");
    return this.find({
      $or: [{ name: regex }, { genericName: regex }, { brandName: regex }],
    });
  }
};

/* ------------------------------ Methods ------------------------------ */
medicineSchema.methods.hasSideEffect = function (sideEffect) {
  const term = (sideEffect || "").toLowerCase();
  return this.knownSideEffects?.some((e) => e.effect?.toLowerCase().includes(term)) || false;
};

medicineSchema.methods.getSideEffectsBySeverity = function (severity) {
  return (this.knownSideEffects || []).filter((e) => e.severity === severity);
};

module.exports = mongoose.model("Medicine", medicineSchema);
