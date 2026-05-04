export interface StarterSmokeCheck {
  name: string;
  passed: boolean;
}

export interface StarterSmokeResult {
  checks: StarterSmokeCheck[];
  passed: boolean;
}
