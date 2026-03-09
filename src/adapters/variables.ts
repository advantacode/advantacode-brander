export type VariableOptions = {
  prefix: string;
};

export function normalizeVariablePrefix(prefix: string | undefined) {
  if (!prefix) {
    return "";
  }

  return prefix.trim().replace(/^-+/, "").replace(/-+$/, "");
}

export function getVariableName(tokenName: string, options: VariableOptions) {
  const normalizedTokenName = tokenName.replace(".", "-");

  return options.prefix
    ? `--${options.prefix}-${normalizedTokenName}`
    : `--${normalizedTokenName}`;
}

export function getVariableReference(tokenName: string, options: VariableOptions) {
  return `var(${getVariableName(tokenName, options)})`;
}

export function getSassVariableName(tokenName: string, options: VariableOptions) {
  const normalizedTokenName = tokenName.replace(".", "-");

  return options.prefix
    ? `$${options.prefix}-${normalizedTokenName}`
    : `$${normalizedTokenName}`;
}
