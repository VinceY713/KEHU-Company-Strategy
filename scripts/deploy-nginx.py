#!/usr/bin/env python3
"""PlayCARD 部署辅助：在 kehu.conf 中插入 /playcard location（幂等），nginx -t + reload。
服务器端执行（sudo）。代码已由 workflow 部署到 /var/www/playcard/。"""
import shutil, subprocess, sys

P = '/etc/nginx/conf.d/kehu.conf'

s = open(P).read()
if '/playcard/' in s:
    print('playcard location already present, skip insert')
else:
    block = (
        "\n"
        "    # ===== PlayCARD 客湖战略赌注台 (2026-08-03 部署) =====\n"
        "    location = /playcard { return 301 /playcard/; }\n"
        "    location ^~ /playcard/ {\n"
        "        root /var/www/;\n"
        "        index index.html;\n"
        "        try_files $uri $uri/ =404;\n"
        "    }"
    )
    tail = s.rstrip()
    assert tail.endswith('}'), 'unexpected config tail'
    s2 = tail[:-1].rstrip() + block + "\n}\n"
    shutil.copy(P, P + '.bak.playcard')
    open(P, 'w').write(s2)
    print('playcard location inserted (backup: %s.bak.playcard)' % P)

r = subprocess.run(['sudo', 'nginx', '-t'], capture_output=True, text=True)
print('nginx -t:', (r.stdout + r.stderr).strip().replace('\n', ' | '))
if r.returncode != 0:
    sys.exit(1)
subprocess.run(['sudo', 'systemctl', 'reload', 'nginx'], check=True)
print('nginx reloaded OK')
