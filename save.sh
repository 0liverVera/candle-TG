#!/bin/bash
echo ""
echo "What changed? (commit message):"
read -r msg

if [ -z "$msg" ]; then
  echo "Cancelled — no message entered."
  exit 1
fi

git add .
git commit -m "$msg"
git push
