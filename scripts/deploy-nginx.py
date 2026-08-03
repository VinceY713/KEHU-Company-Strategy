#!/usr/bin/env python3
"""PlayCARD 部署辅助：在 kehu.conf 中幂等插入 /playcard 与 /api/translate location，nginx -t + reload。
服务器端执行（sudo）。代码已由 workflow 部署到 /var/www/playcard/。"""
import shutil, subprocess, sys

P = '/etc/nginx/conf.d/kehu.conf'
s = open(P).read()

blocks = []
if '/playcard/' not in s:
    blocks.append(
        "\n"
        "    # ===== PlayCARD 客湖战略赌注台 (2026-08-03 部署) =====\n"
        "    location = /playcard { return 301 /playcard/; }\n"
        "    location ^~ /playcard/ {\n"
        "        root /var/www/;\n"
        "        index index.html;\n"
        "        try_files $uri $uri/ =404;\n"
        "    }"
    )
if '/api/translate' not in s:
    blocks.append(
        "\n"
        "    # ===== PlayCARD /api/translate 代理 (DeepSeek, key 在 /etc/nginx/ai_key.conf) =====\n"
        "    location = /api/translate {\n"
        "        proxy_pass https://api.deepseek.com/chat/completions;\n"
        "        proxy_set_header Host api.deepseek.com;\n"
        "        proxy_set_header Content-Type application/json;\n"
        "        include /etc/nginx/ai_key.conf;\n"
        "        proxy_ssl_server_name on;\n"
        "        proxy_ssl_name api.deepseek.com;\n"
        "        resolver 119.29.29.29 223.5.5.5 valid=300s ipv6=off;\n"
        "        resolver_timeout 5s;\n"
        "        proxy_connect_timeout 15s;\n"
        "        proxy_read_timeout 120s;\n"
        "        proxy_send_timeout 120s;\n"
        "    }"
    )

if blocks:
    tail = s.rstrip()
    assert tail.endswith('}'), 'unexpected config tail'
    s2 = tail[:-1].rstrip() + ''.join(blocks) + "\n}\n"
    shutil.copy(P, P + '.bak.playcard')
    open(P, 'w').write(s2)
    print('inserted %d block(s), backup: %s.bak.playcard' % (len(blocks), P))
else:
    print('all blocks already present, skip insert')

r = subprocess.run(['sudo', 'nginx', '-t'], stdout=subprocess.PIPE, stderr=subprocess.PIPE, universal_newlines=True)
print('nginx -t:', (r.stdout + r.stderr).strip().replace('\n', ' | '))
if r.returncode != 0:
    sys.exit(1)
subprocess.run(['sudo', 'systemctl', 'reload', 'nginx'], check=True)
print('nginx reloaded OK')
