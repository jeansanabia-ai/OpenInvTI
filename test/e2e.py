#!/usr/bin/env python3
"""Testes 1-3 do OpenInvTI sem dependencias externas. Roda com python ou python3."""
import os, re, sys

root = os.getcwd()
pass_ = 0
fail = 0
fails = []

def test(name, ok, detail=''):
    global pass_, fail
    if ok:
        pass_ += 1
        print('  OK ' + name)
    else:
        fail += 1
        fails.append(name + (': ' + detail if detail else ''))
        print('  X ' + name + (('\n      ' + detail) if detail else ''))

def read(p):
    with open(os.path.join(root, p), 'r', encoding='utf-8', errors='replace') as f:
        return f.read()

# === 1. SINTAXE ===
print('\n=== 1. SINTAXE BASICA DOS ARQUIVOS ===')

def balanced(src, opener, closer):
    """Conta delimitadores ignorando strings, regex e comentarios."""
    # remove block comments
    src = re.sub(r'/\*[\s\S]*?\*/', '', src)
    # remove line comments
    src = re.sub(r'//[^\n]*', '', src)
    # remove strings simples e duplas
    src = re.sub(r"'(?:[^'\\\n]|\\.)*'", "''", src)
    src = re.sub(r'"(?:[^"\\\n]|\\.)*"', '""', src)
    # remove template literals (aproximacao - nao pega ${} aninhado mas funciona pra app.js)
    src = re.sub(r'`(?:[^`\\]|\\.)*`', '``', src)
    # remove regex literais /.../
    src = re.sub(r'/(?:[^/\\\n]|\\.)+/[gimsuy]*', '//', src)
    return src.count(opener) - src.count(closer)

for f in ['app.js', 'sw.js']:
    try:
        c = read(f)
        if len(c) < 100:
            test(f + ' não vazio', False, 'arquivo muito pequeno')
            continue
        # Chaves balanceadas
        d_curly = balanced(c, '{', '}')
        d_paren = balanced(c, '(', ')')
        d_brack = balanced(c, '[', ']')
        bal = (d_curly == 0 and d_paren == 0 and d_brack == 0)
        test(f + ' chaves balanceadas', bal, 
             f'desbalanco curly={d_curly} paren={d_paren} brack={d_brack}' if not bal else '')
        # Termina apropriadamente
        last = c.rstrip()[-10:]
        ends_ok = last.endswith('});') or last.endswith('}') or last.endswith(');')
        test(f + ' termina sem truncamento', ends_ok,
             f'final suspeito: {repr(last)}' if not ends_ok else '')
    except Exception as e:
        test(f, False, str(e))

# === 2. HTML ===
print('\n=== 2. INTEGRIDADE DO HTML ===')
try:
    h = read('index.html')
    test('HTML tem <script src="app.js">',     '<script src="app.js">' in h)
    test('HTML tem #cameraModal',              'id="cameraModal"' in h)
    test('HTML tem #toast',                    'id="toast"' in h)
    test('HTML tem #cfgQuickFar',              'id="cfgQuickFar"' in h)
    test('HTML fecha </body> e </html>',       '</body>' in h and '</html>' in h)
    test('HTML tem CDN tesseract',             'tesseract' in h)
    test('HTML tem CDN exceljs',               'exceljs' in h)
except Exception as e:
    test('HTML', False, str(e))

# === 3. VERSÕES ===
print('\n=== 3. CONSISTENCIA DE VERSAO ===')
try:
    a = read('app.js'); s = read('sw.js'); h = read('index.html')
    m_a = re.search(r"APP_VERSION\s*=\s*'([^']+)'", a)
    m_s = re.search(r"openinvti-v([\d.]+)-prod", s)
    m_h = re.search(r"v(\d+\.\d+\.\d+)</div>", h)
    va = m_a.group(1) if m_a else None
    vs = m_s.group(1) if m_s else None
    vh = m_h.group(1) if m_h else None
    print('  app.js:', va, '| sw.js:', vs, '| index.html:', vh)
    test('Versoes batem entre app.js e sw.js', va == vs)
    test('Versoes batem entre app.js e index.html', va == vh)
except Exception as e:
    test('versoes', False, str(e))

# Resumo
print('\n=== RESUMO ===')
print('  OK:', pass_)
print('  X :', fail)
if fail > 0:
    print('\nFALHAS:')
    for f in fails: print('  - ' + f)
    sys.exit(1)
print('\nTUDO OK - seguro pra deploy.\n')
sys.exit(0)
