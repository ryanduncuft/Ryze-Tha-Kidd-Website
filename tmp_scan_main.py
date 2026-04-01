from pathlib import Path
import re
path = Path('js/main.js')
text = path.read_text(encoding='utf-8')
for idx, line in enumerate(text.splitlines(), 1):
    if re.search(r'\b(let|const|var)\s+[a-zA-Z_$][a-zA-Z0-9_$]*\s*=\s*[^;]+,\s*[a-zA-Z_$]', line):
        print(f'{idx}: {line}')
    elif re.search(r'\breturn\s+[^;]+,\s*[^;]+', line):
        print(f'{idx}: {line}')
    elif re.search(r'\b(if|for|while|do|switch)\b.*\)\s*\{?\s*[^\n]*&&', line):
        print(f'{idx}: {line}')
    elif re.search(r'\)\s*&&\s*', line):
        print(f'{idx}: {line}')
    elif re.search(r'[^\n]+;\s*[^\n]+;\s*', line):
        print(f'{idx}: {line}')
    elif re.search(r'\b\w+\s*\?\s*[^:]+\s*:\s*[^\n]+', line) and not re.search(r'\?\s*function|\?\s*\(', line):
        print(f'{idx}: {line}')
