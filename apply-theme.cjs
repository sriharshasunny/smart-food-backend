const fs = require('fs');
const files = ['src/components/ChatWidget.jsx', 'src/pages/Recommendations.jsx'];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace all text-orange-*, bg-orange-*, border-orange-*, etc.
  content = content.replace(/orange-([4569]00)/g, 'themeAccent-$1');
  
  // In ChatWidget, we need to inject the wrapper and useLocation logic
  if (file.includes('ChatWidget.jsx')) {
      if (!content.includes('useLocation')) {
          content = content.replace(`import {`, `import { useLocation, `);
      }
      
      // Inject location hook
      if (!content.includes('const location = useLocation()')) {
          content = content.replace(`const ChatWidget = () => {`, `const ChatWidget = () => {\n    const location = useLocation();\n    const isOceanTheme = location.pathname === '/recommendations';\n`);
      }
      
      // Wrap the main return container
      if (!content.includes('className={isOceanTheme ?')) {
          content = content.replace(`return (\n        <>`, `return (\n        <div className={isOceanTheme ? 'theme-ocean' : ''}>\n        <>`);
          content = content.replace(`        </>\n    );\n};`, `        </>\n        </div>\n    );\n};`);
      }
  }
  
  // In Recommendations, force the page to be theme-ocean if we want the top level to match,
  // Actually, the easiest is just let ChatWidget be ocean context, and Recommendations can just explicitly HAVE the class.
  if (file.includes('Recommendations.jsx')) {
      if (!content.includes('className="theme-ocean')) {
           content = content.replace(`className="min-h-screen bg-[#030303] flex flex-col pt-20 relative overflow-hidden"`, `className="theme-ocean min-h-screen bg-[#030303] flex flex-col pt-20 relative overflow-hidden"`);
      }
  }

  fs.writeFileSync(file, content, 'utf8');
  console.log('Updated ' + file + ' to use dynamic theme variables');
});
