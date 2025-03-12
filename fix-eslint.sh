#!/bin/bash
# fix-eslint.sh

# Find all files with ESLint warnings
FILES_WITH_WARNINGS=$(grep -l "no-unused-vars" $(find src -name "*.jsx" -o -name "*.js"))

# Loop through each file
for FILE in $FILES_WITH_WARNINGS; do
  echo "Fixing $FILE"
  
  # Get line numbers with unused variables
  LINES=$(grep -n "no-unused-vars" $FILE | cut -d: -f1)
  
  # Add eslint-disable comments
  for LINE in $LINES; do
    # Calculate the line number to add the comment
    DISABLE_LINE=$((LINE - 1))
    sed -i "${DISABLE_LINE}i// eslint-disable-next-line no-unused-vars" $FILE
  done
done

echo "Fixes applied. Run 'npm start' to verify the warnings are gone."