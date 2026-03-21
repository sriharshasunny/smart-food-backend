const fs = require('fs');
const files = ['src/components/ChatWidget.jsx', 'src/pages/Recommendations.jsx'];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  // Replacing cyan with orange for the new brand identity
  content = content.replace(/cyan/g, 'orange');
  
  // Specific UFO behavior fix inside Recommendations.jsx
  if (file.includes('Recommendations.jsx')) {
    content = content.replace(`window.dispatchEvent(new CustomEvent('open-chat'));`, `// window.dispatchEvent(new CustomEvent('open-chat')); // Disabled per user request`);
  }
  
  fs.writeFileSync(file, content, 'utf8');
  console.log('Updated ' + file);
});
