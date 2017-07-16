interface MD_Line {
  label: string;
  value: string;
}

interface CountResult {
  blank: number;
  code: number;
  comment: number;
  filename?: string;
  isbinaryfile?: boolean;
}
