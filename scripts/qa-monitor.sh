#!/bin/bash
# QA Monitor for LYS Kvizai
# Checks: build, functionality, UI compliance, dead code
# Run: bash scripts/qa-monitor.sh

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'
ISSUES=0

echo "═══════════════════════════════════════"
echo "  LYS Kvizai — QA Monitor"
echo "═══════════════════════════════════════"
echo ""

# 1. Build check
echo "▶ [1/6] Build check..."
if npm run build --silent 2>&1 | grep -q "Compiled successfully"; then
  echo -e "  ${GREEN}✓ Build passes${NC}"
else
  echo -e "  ${RED}✗ BUILD FAILED${NC}"
  npm run build 2>&1 | tail -20
  ISSUES=$((ISSUES + 1))
fi
echo ""

# 2. TypeScript check
echo "▶ [2/6] TypeScript check..."
TS_ERRORS=$(npx tsc --noEmit 2>&1 | grep "error TS" | wc -l | tr -d ' ')
if [ "$TS_ERRORS" -eq "0" ]; then
  echo -e "  ${GREEN}✓ No TypeScript errors${NC}"
else
  echo -e "  ${RED}✗ $TS_ERRORS TypeScript error(s)${NC}"
  npx tsc --noEmit 2>&1 | grep "error TS" | head -10
  ISSUES=$((ISSUES + TS_ERRORS))
fi
echo ""

# 3. Old theme check (should be zero)
echo "▶ [3/6] Theme compliance..."
OLD_THEME=$(grep -r "#0f0e0a\|text-amber-50\b\|bg-amber-500\b\|text-amber-950" src/ 2>/dev/null | wc -l | tr -d ' ')
if [ "$OLD_THEME" -eq "0" ]; then
  echo -e "  ${GREEN}✓ No old amber theme references${NC}"
else
  echo -e "  ${RED}✗ $OLD_THEME old theme references found${NC}"
  grep -rn "#0f0e0a\|text-amber-50\b\|bg-amber-500\b\|text-amber-950" src/ 2>/dev/null | head -10
  ISSUES=$((ISSUES + OLD_THEME))
fi
echo ""

# 4. UI minimalism check
echo "▶ [4/6] UI minimalism audit..."
EMOJI_DECORATIONS=$(grep -rn "className.*text-.*xl.*>🔥\|className.*text-.*xl.*>🥞\|className.*text-.*xl.*>🎪\|className.*text-.*xl.*>🥶\|className.*text-.*xl.*>🌸" src/ 2>/dev/null | wc -l | tr -d ' ')
if [ "$EMOJI_DECORATIONS" -eq "0" ]; then
  echo -e "  ${GREEN}✓ No decorative emoji rows${NC}"
else
  echo -e "  ${YELLOW}⚠ $EMOJI_DECORATIONS decorative emoji element(s) — consider removing${NC}"
  ISSUES=$((ISSUES + EMOJI_DECORATIONS))
fi

VERBOSE_TEXT=$(grep -rn "Pasirink kvizą ir tikrink\|Žaisk, mokykis, laimėk\|Sukurk naują per redaktorių" src/ 2>/dev/null | wc -l | tr -d ' ')
if [ "$VERBOSE_TEXT" -eq "0" ]; then
  echo -e "  ${GREEN}✓ No overly verbose UI text${NC}"
else
  echo -e "  ${YELLOW}⚠ $VERBOSE_TEXT verbose text string(s) — simplify${NC}"
fi

MUTED_COLORS=$(grep -rn "opacity-\(2[0-9]\|1[0-9]\|[0-9]\)\b" src/components/ 2>/dev/null | grep -v "node_modules" | wc -l | tr -d ' ')
echo -e "  ${GREEN}ℹ${NC} $MUTED_COLORS low-opacity elements found (review if important content is too faint)"
echo ""

# 5. Animation coverage
echo "▶ [5/6] Animation coverage..."
PAGES_WITHOUT_ANIM=$(grep -rL "animate-\|stagger-\|transition-" src/app/*/page.tsx src/app/page.tsx 2>/dev/null | wc -l | tr -d ' ')
if [ "$PAGES_WITHOUT_ANIM" -eq "0" ]; then
  echo -e "  ${GREEN}✓ All pages have animations${NC}"
else
  echo -e "  ${YELLOW}⚠ $PAGES_WITHOUT_ANIM page(s) missing animations${NC}"
  grep -rL "animate-\|stagger-\|transition-" src/app/*/page.tsx src/app/page.tsx 2>/dev/null
fi
echo ""

# 6. API route check
echo "▶ [6/6] API routes health..."
ROUTE_COUNT=$(find src/app/api -name "route.ts" 2>/dev/null | wc -l | tr -d ' ')
echo -e "  ${GREEN}ℹ${NC} $ROUTE_COUNT API routes found"
echo ""

# Summary
echo "═══════════════════════════════════════"
if [ "$ISSUES" -eq "0" ]; then
  echo -e "  ${GREEN}All checks passed! ✓${NC}"
else
  echo -e "  ${RED}$ISSUES issue(s) found${NC}"
fi
echo "═══════════════════════════════════════"
exit $ISSUES
