# Markup

| Target Language | Written In |
| --------------- | ---------- |
| `HTML`          | `TS`       |

## Styles

- Escape:
  `/\\(?<escape>[*\/_])/`
- Code:
  `/<-(?<language>\w+)>\{(?<text>[\s\S]*?)\}/`
- Header:
  `/^!(?<level>[1-6])\{(?<text>[^\n]*?)\}$/m`
- Command:
  `/\/(?<cmd>(?:upp|low)er|cap)(?<arguments>(?:::[^\n]+?)+?);/`
- Bold:
  `/\*(?!\s)(?<text>\w[^\n]*?)(?<!\s)\*/`
- Italic:
  `/\/(?!\s)(?<text>\w[^\n]*?)(?<!\s)\//`
- Underline:
  `/_(?!\s)(?<text>\w[^\n]*?)(?<!\s)_/`

### Order

1. Escape -> Placeholder
2. Code
3. Header
4. Command
5.  - Bold
    - Italic
    - Underline
6. Placeholder -> Escaped

## System

AST, meaning;

- [x] nesting
- [ ] overlaping
