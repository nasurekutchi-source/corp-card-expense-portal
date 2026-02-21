// =============================================================================
// Card Management Integration Service Layer
// =============================================================================
// Abstraction layer that can be swapped between demo mode (in-memory store)
// and a real card management system API (e.g., M2P, Marqeta, bank API).
// In demo mode, wraps the in-memory store operations.
// =============================================================================

import {
  getCard,
  updateCard,
  addCard,
  type Card,
  type SpendLimits,
} from "./store";

// =============================================================================
// Types
// =============================================================================

export interface CardActionResult {
  success: boolean;
  message: string;
  card?: Card;
  error?: string;
}

export interface CardControls {
  channels: {
    pos: boolean;
    ecommerce: boolean;
    contactless: boolean;
    mobileWallet: boolean;
    atm: boolean;
  };
  geographic: {
    international: boolean;
    domesticOnly: boolean;
  };
  mccRestrictions: string[];
}

export interface CardIssueRequest {
  employeeId: string;
  type: "PHYSICAL" | "VIRTUAL" | "SINGLE_USE";
  network?: "VISA" | "MASTERCARD" | "RUPAY";
  spendLimits?: SpendLimits;
  controls?: CardControls;
}

export interface CardIssueResult {
  success: boolean;
  message: string;
  card?: Card;
  error?: string;
}

// =============================================================================
// CardManagementService Interface
// =============================================================================

export interface CardManagementService {
  freezeCard(cardId: string): Promise<CardActionResult>;
  unfreezeCard(cardId: string): Promise<CardActionResult>;
  updateLimits(cardId: string, limits: SpendLimits): Promise<CardActionResult>;
  updateControls(cardId: string, controls: CardControls): Promise<CardActionResult>;
  issueCard(request: CardIssueRequest): Promise<CardIssueResult>;
  cancelCard(cardId: string, reason: string): Promise<CardActionResult>;
  getCardDetails(cardId: string): Promise<CardActionResult>;
}

// =============================================================================
// Default card controls (used when controls are not stored on card)
// =============================================================================

const DEFAULT_CONTROLS: CardControls = {
  channels: {
    pos: true,
    ecommerce: true,
    contactless: true,
    mobileWallet: false,
    atm: true,
  },
  geographic: {
    international: false,
    domesticOnly: true,
  },
  mccRestrictions: ["Gambling", "Crypto", "Liquor Stores", "ATM Cash Advance"],
};

// In-memory controls store (keyed by cardId) for demo mode
// Real implementation would persist this on the card management system
const cardControlsStore = new Map<string, CardControls>();

export function getCardControls(cardId: string): CardControls {
  const stored = cardControlsStore.get(cardId);
  if (stored) return stored;
  // Return a deep copy of defaults to prevent accidental mutation
  return JSON.parse(JSON.stringify(DEFAULT_CONTROLS));
}

// =============================================================================
// DemoCardManagementService
// =============================================================================
// Wraps the in-memory store with a simulated async API.
// Adds a small delay to simulate network latency in demo mode.
// =============================================================================

class DemoCardManagementService implements CardManagementService {
  private async simulateLatency(): Promise<void> {
    // Simulate 200-500ms network latency
    const delay = Math.floor(Math.random() * 300) + 200;
    return new Promise((resolve) => setTimeout(resolve, delay));
  }

  async getCardDetails(cardId: string): Promise<CardActionResult> {
    await this.simulateLatency();

    const card = getCard(cardId);
    if (!card) {
      return { success: false, message: "Card not found", error: "CARD_NOT_FOUND" };
    }

    return { success: true, message: "Card details retrieved", card };
  }

  async freezeCard(cardId: string): Promise<CardActionResult> {
    await this.simulateLatency();

    const card = getCard(cardId);
    if (!card) {
      return { success: false, message: "Card not found", error: "CARD_NOT_FOUND" };
    }

    if (card.status === "FROZEN") {
      return { success: false, message: "Card is already frozen", error: "ALREADY_FROZEN" };
    }

    if (card.status === "CANCELLED" || card.status === "EXPIRED") {
      return {
        success: false,
        message: `Cannot freeze a ${card.status.toLowerCase()} card`,
        error: "INVALID_STATUS",
      };
    }

    const updated = updateCard(cardId, { status: "FROZEN" });
    if (!updated) {
      return { success: false, message: "Failed to freeze card", error: "UPDATE_FAILED" };
    }

    return { success: true, message: "Card frozen successfully", card: updated };
  }

  async unfreezeCard(cardId: string): Promise<CardActionResult> {
    await this.simulateLatency();

    const card = getCard(cardId);
    if (!card) {
      return { success: false, message: "Card not found", error: "CARD_NOT_FOUND" };
    }

    if (card.status !== "FROZEN") {
      return {
        success: false,
        message: "Card is not frozen",
        error: "NOT_FROZEN",
      };
    }

    const updated = updateCard(cardId, { status: "ACTIVE" });
    if (!updated) {
      return { success: false, message: "Failed to unfreeze card", error: "UPDATE_FAILED" };
    }

    return { success: true, message: "Card unfrozen successfully", card: updated };
  }

  async updateLimits(cardId: string, limits: SpendLimits): Promise<CardActionResult> {
    await this.simulateLatency();

    const card = getCard(cardId);
    if (!card) {
      return { success: false, message: "Card not found", error: "CARD_NOT_FOUND" };
    }

    // Validate limits
    if (limits.perTransaction < 0 || limits.daily < 0 || limits.monthly < 0) {
      return { success: false, message: "Limits cannot be negative", error: "INVALID_LIMITS" };
    }

    if (limits.perTransaction > limits.daily) {
      return {
        success: false,
        message: "Per-transaction limit cannot exceed daily limit",
        error: "INVALID_LIMITS",
      };
    }

    if (limits.daily > limits.monthly) {
      return {
        success: false,
        message: "Daily limit cannot exceed monthly limit",
        error: "INVALID_LIMITS",
      };
    }

    const updated = updateCard(cardId, { spendLimits: limits });
    if (!updated) {
      return { success: false, message: "Failed to update limits", error: "UPDATE_FAILED" };
    }

    return { success: true, message: "Spend limits updated successfully", card: updated };
  }

  async updateControls(cardId: string, controls: CardControls): Promise<CardActionResult> {
    await this.simulateLatency();

    const card = getCard(cardId);
    if (!card) {
      return { success: false, message: "Card not found", error: "CARD_NOT_FOUND" };
    }

    // Store controls in the in-memory controls store
    cardControlsStore.set(cardId, controls);

    return { success: true, message: "Card controls updated successfully", card };
  }

  async issueCard(request: CardIssueRequest): Promise<CardIssueResult> {
    await this.simulateLatency();

    if (!request.employeeId) {
      return { success: false, message: "Employee ID is required", error: "MISSING_EMPLOYEE_ID" };
    }

    const card = addCard({
      employeeId: request.employeeId,
      type: request.type,
      network: request.network || "VISA",
      spendLimits: request.spendLimits || { perTransaction: 50000, daily: 100000, monthly: 500000 },
      status: "ACTIVE",
    });

    // Store controls if provided
    if (request.controls) {
      cardControlsStore.set(card.id, request.controls);
    }

    return { success: true, message: "Card issued successfully", card };
  }

  async cancelCard(cardId: string, reason: string): Promise<CardActionResult> {
    await this.simulateLatency();

    const card = getCard(cardId);
    if (!card) {
      return { success: false, message: "Card not found", error: "CARD_NOT_FOUND" };
    }

    if (card.status === "CANCELLED") {
      return { success: false, message: "Card is already cancelled", error: "ALREADY_CANCELLED" };
    }

    // In demo mode, we update status. A real implementation would
    // call the card network to permanently cancel.
    const updated = updateCard(cardId, { status: "CANCELLED" });
    if (!updated) {
      return { success: false, message: "Failed to cancel card", error: "UPDATE_FAILED" };
    }

    // Clean up controls
    cardControlsStore.delete(cardId);

    return {
      success: true,
      message: `Card cancelled. Reason: ${reason}`,
      card: updated,
    };
  }
}

// =============================================================================
// Service Factory
// =============================================================================
// Returns the active card management service implementation.
// Currently always returns DemoCardManagementService.
// When a real card management API is integrated, add an environment
// variable check here to return the real implementation.
// =============================================================================

let serviceInstance: CardManagementService | null = null;

export function getCardService(): CardManagementService {
  if (!serviceInstance) {
    // TODO: Check env for real card management API config
    // if (process.env.CARD_MGMT_API_URL) {
    //   serviceInstance = new RealCardManagementService(process.env.CARD_MGMT_API_URL);
    // } else {
    serviceInstance = new DemoCardManagementService();
    // }
  }
  return serviceInstance;
}

// Export for testing
export { DemoCardManagementService };
