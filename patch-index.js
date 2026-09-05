const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');
html = html.replace('</body>', `
<script>
  window.addEventListener('error', function(e) {
    if (e.message && e.message.includes('ResizeObserver')) return;
    const div = document.createElement('div');
    div.style.position = 'fixed';
    div.style.top = '0'; div.style.left = '0'; div.style.width = '100vw'; div.style.height = '100vh';
    div.style.backgroundColor = 'red'; div.style.color = 'white'; div.style.zIndex = '999999';
    div.style.padding = '20px'; div.style.fontSize = '20px'; div.style.whiteSpace = 'pre-wrap';
    div.innerText = 'Global Error: ' + e.message + '\\n' + (e.error ? e.error.stack : '');
    document.body.appendChild(div);
  });
</script>
</body>`);
fs.writeFileSync('index.html', html);
