export interface PropDoc {
  name: string;
  type: string;
  required: boolean;
  defaultValue?: string;
  unionValues?: string[];
  description?: string;
  deprecated?: string;
}

export interface ExampleDoc {
  title?: string;
  code: string;
}

export type ComponentStatus = 'stable' | 'deprecated';

export interface ComponentDoc {
  name: string;
  file: string;
  line: number;
  description?: string;
  keywords: string[];
  status: ComponentStatus;
  deprecated?: string;
  props: PropDoc[];
  inheritsFrom: string[];
  cssClasses: string[];
  examples: ExampleDoc[];
}

export interface HookDoc {
  name: string;
  file: string;
  line: number;
  signature: string;
  description?: string;
}

export interface TokenDoc {
  name: string;
  group: string;
  value: string;
  scopes: Record<string, string>;
  description?: string;
}

export interface LibraryMeta {
  name: string;
  package: string;
  version: string;
  commit: string;
}

export interface LibraryIndex {
  schemaVersion: 2;
  library: LibraryMeta;
  components: ComponentDoc[];
  hooks: HookDoc[];
  tokens: TokenDoc[];
}

export interface SearchHit {
  component: ComponentDoc;
  score: number;
  matchedOn: string[];
}
