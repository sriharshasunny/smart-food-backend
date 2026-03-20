const fs = require('fs');
let c = fs.readFileSync('src/components/ChatWidget.jsx', 'utf8');

c = c.replace(/orange/g, 'cyan');
c = c.replace(/Orange/g, 'Cyan');

c = c.replace(
  "const [isOpen, setIsOpen] = useState(false);",
  "const [isOpen, setIsOpen] = useState(false);\n" +
  "    useEffect(() => {\n" +
  "        const handleOpen = () => { setIsOpen(true); setUnread(0); };\n" +
  "        window.addEventListener('open-chat', handleOpen);\n" +
  "        return () => window.removeEventListener('open-chat', handleOpen);\n" +
  "    }, []);"
);

fs.writeFileSync('src/components/ChatWidget.jsx', c);
console.log('Successfully updated theme.');
