export interface LocaleFile {
  path: string;
  module?: string;
  language: string;
  country?: string;
}

export interface Value {
  filePath: string;
  value: string;
}

export interface Country {
  name: string;
  keys: Record<string, Value>;
}

export interface Language {
  name: string;
  commonKeys: Record<string, Value>;
  countries: Country[] 
}

export interface Module {
  name: string;
  languages: Language[];
}
