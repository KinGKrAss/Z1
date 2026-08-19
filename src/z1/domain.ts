export type UUID = string;
export type Currency = "EUR" | "USD" | "GBP" | "CHF" | "CNY" | "JPY";

export type AssetValidationStatus =
  | "VALID_ASSET_DOCUMENT"
  | "UNVERIFIED"
  | "INVALID_ASSET_DOCUMENT"
  | "EXTRACTION_FAILED";

export interface Property {
  id: UUID;
  title: string;
  city?: string;
  postalCode?: string;
  countryCode: string;
  latitude?: number;
  longitude?: number;
  propertyType?: string;
  yearBuilt?: number;
  purchasePrice?: number;
  currency: Currency;
  source?: string;
  sourceUpdatedAt?: string;
}

export interface Unit {
  id: UUID;
  propertyId: UUID;
  unitRef?: string;
  areaM2?: number;
  rooms?: number;
  askingPrice?: number;
  rentMonthly?: number;
  operatingCostMonthly?: number;
  status: "vacant" | "occupied" | "reserved" | "unknown";
}

export interface FinancialTransaction {
  id: UUID;
  accountId: UUID;
  occurredAt: string;
  amount: number;
  currency: Currency;
  category?: string;
  description?: string;
  source?: string;
  externalRef?: string;
}

export interface DocumentRecord {
  id: UUID;
  filename: string;
  mimeType: string;
  storageKey: string;
  sha256?: string;
  documentType?: string;
  source?: string;
  createdAt: string;
}

export interface AssetEvidenceRecord {
  documentId: UUID;
  filename: string;
  extractionStatus: "SUCCESS" | "EXTRACTION_FAILED";
  assetId?: string;
  assetType?: string;
  quantity?: string;
  unit?: string;
  source?: string;
  sourceVerified: boolean;
  assetEvidence: boolean;
  validationStatus: AssetValidationStatus;
  reasons: string[];
}

export interface AuditEvent {
  id: UUID;
  actorUserId?: UUID;
  action: string;
  entityType?: string;
  entityId?: UUID;
  metadata: Record<string, unknown>;
  createdAt: string;
}
