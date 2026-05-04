export interface PromptOption {
  label: string;
  value: string;
}

export interface PromptIO {
  ask(message: string, defaultValue?: string): Promise<string>;
  choose(message: string, options: PromptOption[]): Promise<string>;
  confirm(message: string, defaultValue?: boolean): Promise<boolean>;
  close(): Promise<void>;
}
