const fs = require('fs');

let html = fs.readFileSync('stitch-scan.html', 'utf8');

const replacementScript = `
    let mediaStream = null;
    let videoTrack = null;

    // Request camera access and get the track on load if possible, 
    // or we can do it when the user clicks the torch.
    async function initCamera() {
      if (videoTrack) return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" }
        });
        mediaStream = stream;
        videoTrack = stream.getVideoTracks()[0];
      } catch (err) {
        console.warn("Kamera erişimi sağlanamadı veya cihazda kamera yok.", err);
      }
    }

    // Torch on/off visual state
    async function toggleTorch(btn) {
      var label = document.getElementById('torch-label');
      var isOn = label.innerHTML.indexOf('Açık') !== -1;
      
      if (!videoTrack) {
        await initCamera();
      }

      if (videoTrack) {
        try {
          const capabilities = videoTrack.getCapabilities();
          if (capabilities.torch) {
            await videoTrack.applyConstraints({
              advanced: [{ torch: !isOn }]
            });
          } else {
            console.warn("Cihazın kamerası el feneri (torch) özelliğini desteklemiyor.");
          }
        } catch (err) {
          console.warn("Fener açılırken hata oluştu.", err);
        }
      }

      // Update UI
      label.innerHTML = !isOn ? 'El Feneri<br/>Açık' : 'El Feneri<br/>Kapalı';
      btn.classList.toggle('text-[#22D3EE]', isOn); // Turn off cyan if it was on (wait, !isOn means turning it on)
      btn.classList.toggle('text-white/90', !isOn);
      
      if (!isOn) {
        btn.classList.add('text-[#22D3EE]');
        btn.classList.remove('text-white/90');
      } else {
        btn.classList.remove('text-[#22D3EE]');
        btn.classList.add('text-white/90');
      }
    }
`;

html = html.replace(/\/\/ Torch on\/off visual state[\s\S]*?function toggleTorch\(btn\) \{[\s\S]*?\}/, replacementScript);

fs.writeFileSync('stitch-scan.html', html, 'utf8');
console.log('Added real flashlight logic to stitch-scan.html');
