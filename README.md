# Markup

| Target Language | Written In |
| --------------- | ---------- |
| `HTML`          | `TS`       |

## Styles

- Escape:
  `/\\(?<escape>.)/`
- Code:
  `/<-(?<language>\w+)>\{(?<text>[\s\S]*?)\}/`
- Header:
  `/^!(?<level>[1-6])\{(?<text>[^\n]*?)\}$/m`
- Command:
  `/\/(?<cmd>(?:upp|low)er|cap)(?<arguments>(?:::.+?)+?);/`
- Bold:
  `/\*(?!\s)(?<text>[^*\n]+?)(?<!\s)\*/`
- Italic:
  `/\/(?!\s)(?<text>[^\/\n]+?)(?<!\s)\//`
- Underline:
  `/_(?!\s)(?<text>[^_\n]+?)(?<!\s)_/`

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
