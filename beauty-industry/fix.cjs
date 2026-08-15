const fs = require('fs');
let content = fs.readFileSync('src/components/BusinessOnboardingModal.tsx', 'utf8');

// Fix Malformed button className
content = content.replace(/cursor-pointer"};/g, 'cursor-pointer"');

fs.writeFileSync('src/components/BusinessOnboardingModal.tsx', content);
