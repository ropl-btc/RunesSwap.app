import type { Rune } from "@/types/satsTerminal";
import {
  type QuoteResponse,
  type GetPSBTParams,
  type ConfirmPSBTParams,
} from "satsterminal-sdk";
import { handleApiResponse } from "./utils";

export const fetchRunesFromApi = async (query: string): Promise<Rune[]> => {
  if (!query) return [];

  const response = await fetch(
    `/api/sats-terminal/search?query=${encodeURIComponent(query)}`,
  );
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error("Failed to parse search results");
  }

  if (!response.ok) {
    throw new Error(
      data?.error?.message ||
        data?.error ||
        `Search failed: ${response.statusText}`,
    );
  }

  return handleApiResponse<Rune[]>(data, true);
};

export const fetchQuoteFromApi = async (
  params: Record<string, unknown>,
): Promise<QuoteResponse> => {
  const response = await fetch("/api/sats-terminal/quote", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error("Failed to parse quote response");
  }
  if (!response.ok) {
    throw new Error(
      data?.error?.message ||
        data?.error ||
        `Failed to fetch quote: ${response.statusText}`,
    );
  }
  return handleApiResponse<QuoteResponse>(data, false);
};

export const getPsbtFromApi = async (
  params: GetPSBTParams,
): Promise<Record<string, unknown>> => {
  const response = await fetch("/api/sats-terminal/psbt/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error("Failed to parse PSBT response");
  }
  if (!response.ok) {
    throw new Error(
      data?.error?.message ||
        data?.error ||
        `Failed to create PSBT: ${response.statusText}`,
    );
  }
  return handleApiResponse<Record<string, unknown>>(data, false);
};

export const confirmPsbtViaApi = async (
  params: ConfirmPSBTParams,
): Promise<Record<string, unknown>> => {
  const response = await fetch("/api/sats-terminal/psbt/confirm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error("Failed to parse confirmation response");
  }
  if (!response.ok) {
    throw new Error(
      data?.error?.message ||
        data?.error ||
        `Failed to confirm PSBT: ${response.statusText}`,
    );
  }
  return handleApiResponse<Record<string, unknown>>(data, false);
};
