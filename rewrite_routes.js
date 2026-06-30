const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('./src', function(filePath) {
  if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Replace specific nested routes first
    content = content.replace(/\/user\/home\/custom-kraft/g, '/user/custom-kraft');
    content = content.replace(/\/user\/home\/categories/g, '/user/categories');
    
    // Replace remaining references to /user/home
    content = content.replace(/\/user\/home/g, '/');

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated routes in ${filePath}`);
    }
  }
});
