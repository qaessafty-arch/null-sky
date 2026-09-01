import { JSDOM } from 'jsdom';
import fs from 'fs';

(async () => {
  const dom = await JSDOM.fromURL('http://localhost:3000', {
    runScripts: "dangerously",
    resources: "usable",
    pretendToBeVisual: true
  });
  
  dom.window.addEventListener("error", (event) => {
    console.error("DOM ERROR:", event.error?.message || event.message);
  });
  
  dom.window.addEventListener("unhandledrejection", (event) => {
    console.error("UNHANDLED REJECTION:", event.reason);
  });
  
  setTimeout(() => {
    console.log("BODY HTML:", dom.window.document.body.innerHTML);
    process.exit(0);
  }, 5000);
})();
