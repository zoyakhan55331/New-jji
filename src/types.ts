/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type FizaMood = "sassy" | "playful" | "teasing" | "annoyed" | "thoughtful" | "loving" | "cheerful";

export type SessionState = "disconnected" | "connecting" | "listening" | "speaking" | "error";

export interface VoiceOption {
  id: string;
  name: string;
  description: string;
  gender: "female" | "male";
}

export interface OpenedWebsite {
  url: string;
  label?: string;
  openedAt: string;
}

export interface ToolCallPayload {
  name: string;
  args: any;
  id: string;
}
