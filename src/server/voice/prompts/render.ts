// Loading and placeholder substitution for the .md prompts.
//
// The templates carry {{NAME}} where a value is spliced in — {{BRAND}} for the
// organisation, {{MARKER}} for the web-action token, {{SHARED_RULES}} for an
// included partial. A placeholder with no value passed is left alone, so
// {{BRAND}} survives until the caller substitutes it.

// The .md files end with a newline, as text files should; the prompts they
// replaced did not. Strip exactly one so the string sent to the model is
// unchanged.
export function md(raw: string): string {
  return raw.endsWith('\n') ? raw.slice(0, -1) : raw
}

export function render(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (whole, key: string) =>
    key in vars ? vars[key] : whole,
  )
}
