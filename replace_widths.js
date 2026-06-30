const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('./src/app', function(filePath) {
  if (filePath.endsWith('.tsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // We only want to replace max-w-2xl when it's part of a layout container.
    // However, looking at the grep, EVERY max-w-2xl in src/app is a layout wrapper.
    content = content.replace(/\bmax-w-2xl\b/g, 'max-w-4xl');
    
    // For max-w-[430px], let's do targeted replacements based on grep:
    if (filePath.includes('user/profile/page.tsx')) {
      content = content.replace('w-full max-w-[430px] md:max-w-4xl mx-auto', 'w-full max-w-4xl mx-auto');
    }
    if (filePath.includes('krafter/kyc-welcome/page.tsx')) {
      content = content.replace('max-w-[430px] flex-col', 'max-w-4xl flex-col');
    }
    if (filePath.includes('verification/didit-return/page.tsx')) {
      content = content.replace('mx-auto max-w-[430px]"', 'mx-auto max-w-4xl"');
    }

    // For tasker/page.tsx
    if (filePath.includes('tasker/page.tsx')) {
      content = content.replace('max-w-md lg:max-w-4xl', 'max-w-4xl');
    }

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated ${filePath}`);
    }
  }
});
