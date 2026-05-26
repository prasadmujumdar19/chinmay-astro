#!/usr/bin/env python3
"""
Wraps `return { ... };` statements in n8n Code-node jsCode bodies as
`return [{ json: { ... } }];`. Skips already-wrapped returns
(`return [...`) and non-object-literal returns (`return null;`,
`return foo();`, `return varName;`).

Reads jsCode from stdin, writes transformed jsCode to stdout.
"""
import re
import sys


def find_matching_brace(code: str, start: int) -> int:
    """Given index of '{', return index one-past the matching '}'.
    Handles nested braces, strings (single/double/backtick),
    line comments, and block comments.
    """
    assert code[start] == '{', f"expected {{ at {start}"
    depth = 1
    i = start + 1
    n = len(code)
    while i < n and depth > 0:
        c = code[i]
        # String literals
        if c in ('"', "'", '`'):
            quote = c
            i += 1
            while i < n and code[i] != quote:
                if code[i] == '\\':
                    i += 2
                    continue
                if quote == '`' and code[i] == '$' and i + 1 < n and code[i + 1] == '{':
                    # template literal expression; find matching }
                    i = find_matching_brace(code, i + 1)
                    continue
                i += 1
            i += 1  # past closing quote
            continue
        # Line comment
        if c == '/' and i + 1 < n and code[i + 1] == '/':
            while i < n and code[i] != '\n':
                i += 1
            continue
        # Block comment
        if c == '/' and i + 1 < n and code[i + 1] == '*':
            i += 2
            while i + 1 < n and not (code[i] == '*' and code[i + 1] == '/'):
                i += 1
            i += 2
            continue
        if c == '{':
            depth += 1
        elif c == '}':
            depth -= 1
            if depth == 0:
                return i + 1
        i += 1
    raise ValueError(f"unbalanced braces from index {start}")


def wrap_returns(code: str) -> str:
    """Find every `return\\s+\\{...\\};` and wrap as `return [{ json: {...} }];`."""
    out = []
    i = 0
    n = len(code)
    pattern = re.compile(r'\breturn\s+\{')
    while i < n:
        m = pattern.search(code, i)
        if not m:
            out.append(code[i:])
            break
        # Emit prefix up to (but not including) `return`
        out.append(code[i:m.start()])
        # Find the matching brace
        brace_start = m.end() - 1  # position of '{'
        try:
            brace_end = find_matching_brace(code, brace_start)
        except ValueError:
            # Malformed — give up and emit rest verbatim
            out.append(code[m.start():])
            break
        # Optional trailing semicolon (with optional whitespace)
        j = brace_end
        while j < n and code[j] in ' \t':
            j += 1
        had_semi = j < n and code[j] == ';'
        obj_content = code[brace_start:brace_end]
        out.append('return [{ json: ')
        out.append(obj_content)
        out.append(' }]')
        if had_semi:
            out.append(';')
            i = j + 1
        else:
            i = brace_end
    return ''.join(out)


if __name__ == '__main__':
    sys.stdout.write(wrap_returns(sys.stdin.read()))
