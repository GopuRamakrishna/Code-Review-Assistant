import re

from typing import List

MAX_CHARS=1500 # max characters per chunk ~512


def chunk_code(code:str)->List[str]:
    if not code.strip():
        return []
    if len(code)<=MAX_CHARS:
        return [code]
    # split by lines and create chunks
    chunks=[]
    pattern = r'(?=(?:function\s+\w+|const\s+\w+\s*=\s*(?:async\s*)?\(|async\s+function|\bclass\s+\w+|def\s+\w+))'
    parts = [p.strip() for p in re.split(pattern, code) if p.strip()]
    
    for part in parts:
        if len(part)<=MAX_CHARS:
            chunks.append(part)
        else:
            lines,current,cur_len=part.split('\n'),[],0
            for line in lines:
                if cur_len+len(line) > MAX_CHARS and current:
                    chunks.append('\n'.join(current))
                    current=current[-5:] 
                    cur_len=sum(len(l) for l in current)
                current.append(line)
                cur_len+=len(line)
            if current:
                chunks.append('\n'.join(current))
    return chunks or [code[:MAX_CHARS]]
