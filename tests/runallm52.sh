#!/bin/bash
# Pełny zestaw testów asor-mobile-52 (m52, lokalnie, port 8781; e2e jako telefon 412×915 przez m-env.js). Użycie: bash /workspace/runallm52.sh [node|e2e|all]
R=/workspace/asor-mobile-52;MODE=${1:-all};cd $R
pgrep -f "http.server 8781" >/dev/null || (cd $R && nohup python3 -m http.server 8781 >/dev/null 2>&1 &)
pgrep -f "http.server 8751" >/dev/null || (cd /workspace/asor-podglad-51 && nohup python3 -m http.server 8751 >/dev/null 2>&1 &)
sleep 1;FAILS=0
if [ $MODE != e2e ]; then
for f in tests/*.test.js tests/port/*.cjs; do node $f >/tmp/mn_$(basename $f).log 2>&1; c=$?; [ $c -ne 0 ] && FAILS=$((FAILS+1)); echo "NODE $(basename $f) exit=$c :: $(tail -n1 /tmp/mn_$(basename $f).log|cut -c1-70)"; done; fi
if [ $MODE != node ]; then
cp tests/*.js /tmp/ppm/ && cp -r tests/data /tmp/ppm/ && cd /tmp/ppm && unset BASE
run(){ for t in "$@"; do timeout 700 node -r ./m-env.js $t.js > /tmp/mres_$t.log 2>&1; c=$?; echo "E2E $t exit=$c :: $(tail -n1 /tmp/mres_$t.log | cut -c1-70)"; done; }
(run e2e-puppeteer e2e-etap3-puppeteer e2e-pw-puppeteer e2e-crcl-puppeteer e2e-pe-wydruk-puppeteer e2e-clin-wydruk-puppeteer > /tmp/mg1.log) & (run e2e-fix-puppeteer e2e-zp2-puppeteer e2e-etap4-puppeteer e2e-report-used-puppeteer e2e-ozw-wydruk-puppeteer e2e-wydruk21-puppeteer e2e-wydruk22-puppeteer e2e-wydruk23-puppeteer e2e-fix24-puppeteer e2e-fix25-puppeteer e2e-fix26-puppeteer e2e-fix27-puppeteer e2e-fix28-puppeteer > /tmp/mg2.log) & (run e2e-hipona-puppeteer e2e-etap2-puppeteer e2e-ai-puppeteer e2e-rodo-plec-puppeteer e2e-audyt-puppeteer m-audyt-puppeteer e2e-m52-puppeteer > /tmp/mg3.log) & wait
for w in 360 430; do W=$w timeout 700 node m-audyt-puppeteer.js > /tmp/mres_maud$w.log 2>&1; c=$?; echo "E2E m-audyt-puppeteer W=$w exit=$c :: $(tail -n1 /tmp/mres_maud$w.log | cut -c1-70)" >> /tmp/mg3.log; done
cat /tmp/mg1.log /tmp/mg2.log /tmp/mg3.log; FAILS=$((FAILS+$(cat /tmp/mg1.log /tmp/mg2.log /tmp/mg3.log | grep -vc "exit=0")))
B51=http://localhost:8751/ timeout 600 node e2e-smoke-puppeteer.js > /tmp/msmoke.log 2>&1; c=$?; [ $c -ne 0 ] && FAILS=$((FAILS+1)); echo "SMOKE exit=$c $(tail -n1 /tmp/smoke.log)"; fi
echo "FAILS=$FAILS"
