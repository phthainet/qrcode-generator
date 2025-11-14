// ====== Loading overlay ======
function showLoading() {
    document.getElementById("loadingOverlay").classList.remove("d-none");
}
function hideLoading() {
    document.getElementById("loadingOverlay").classList.add("d-none");
}

// ====== Chuẩn hoá URL ======
function normalizeUrl(input) {
    let url = input.trim();
    if (!url) throw new Error("empty");

    try {
        new URL(url);
    } catch {
        url = "https://" + url;
        new URL(url);
    }
    return url;
}

// ====== Biến dùng chung ======
let qr;
let lastUrl = "";
let logoImage = null;   // ảnh logo nếu có
let logoDataUrl = "";   // dataURL logo cho overlay

// ====== DOM shortcuts ======
const logoInput      = document.getElementById("logoInput");
const logoOverlay    = document.getElementById("logoOverlay");
const qrColorInput   = document.getElementById("qrColor");
const qrBgColorInput = document.getElementById("qrBgColor");

// ====== Tạo QR ======
function generateQr() {
    const urlInput      = document.getElementById("urlInput");
    const urlDisplay    = document.getElementById("urlDisplay");
    const outputSection = document.getElementById("outputSection");

    let finalUrl;
    try {
        finalUrl = normalizeUrl(urlInput.value);
    } catch {
        alert("URL không hợp lệ!");
        return;
    }

    showLoading();

    setTimeout(() => {
        lastUrl = finalUrl;

        urlDisplay.textContent = finalUrl;
        urlDisplay.href = finalUrl;

        // MÀU QR
        const qrColor = qrColorInput.value;
        const qrBg    = qrBgColorInput.value;

        const qrContainer = document.getElementById("qrcode");

        if (!qr) {
            qr = new QRCode(qrContainer, {
                width: 500,
                height: 500,
                colorDark:  qrColor,
                colorLight: qrBg
            });
        }

        qr.clear();
        qr._htOption.colorDark  = qrColor;
        qr._htOption.colorLight = qrBg;
        qr.makeCode(finalUrl);

        // Nếu đã chọn logo thì hiện overlay, chưa chọn thì ẩn
        if (logoDataUrl) {
            logoOverlay.src = logoDataUrl;
            logoOverlay.style.display = "block";
        } else {
            logoOverlay.style.display = "none";
        }

        outputSection.classList.remove("d-none");
        hideLoading();
    }, 200);
}

document.getElementById("generateBtn").addEventListener("click", generateQr);

// ====== Enter để tạo QR ======
document.getElementById("urlInput").addEventListener("keydown", e => {
    if (e.key === "Enter") {
        e.preventDefault();
        generateQr();
    }
});

// ====== Chọn logo (tùy chọn) ======
logoInput.addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) {
        // Không chọn logo nữa -> QR sẽ không có logo
        logoDataUrl = "";
        logoImage = null;
        logoOverlay.style.display = "none";
        return;
    }

    const reader = new FileReader();
    reader.onload = ev => {
        logoDataUrl = ev.target.result;

        const img = new Image();
        img.onload = () => {
            logoImage = img;

            // Nếu đã tạo QR trước đó thì hiển thị logo luôn
            if (lastUrl) {
                logoOverlay.src = logoDataUrl;
                logoOverlay.style.display = "block";
            }
        };
        img.src = logoDataUrl;
    };

    reader.readAsDataURL(file);
});

// ====== Tải QR PNG (solid color + logo nếu có + nền trắng) ======
document.getElementById("downloadQrBtn").addEventListener("click", () => {
    const srcCanvas = document.querySelector("#qrcode canvas");
    if (!srcCanvas) {
        alert("Chưa có QR!");
        return;
    }

    const border = 24;
    const outCanvas = document.createElement("canvas");

    outCanvas.width  = srcCanvas.width  + border * 2;
    outCanvas.height = srcCanvas.height + border * 2;

    const ctx = outCanvas.getContext("2d");

    // nền trắng ngoài
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, outCanvas.width, outCanvas.height);

    // QR
    ctx.drawImage(srcCanvas, border, border);

    // Logo giữa QR (chỉ khi đã chọn logo)
    if (logoImage) {
        const maxRatio = 0.3; // logo = 30% QR
        const maxW = srcCanvas.width  * maxRatio;
        const maxH = srcCanvas.height * maxRatio;

        const iw = logoImage.width;
        const ih = logoImage.height;

        // giữ tỉ lệ logo
        let drawW = maxW;
        let drawH = ih * (drawW / iw);

        if (drawH > maxH) {
            drawH = maxH;
            drawW = iw * (drawH / ih);
        }

        const x = (outCanvas.width  - drawW) / 2;
        const y = (outCanvas.height - drawH) / 2;

        const padding = 6;

        // nền trắng vuông phía sau logo
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(
            x - padding,
            y - padding,
            drawW + padding * 2,
            drawH + padding * 2
        );

        // vẽ logo
        ctx.drawImage(logoImage, x, y, drawW, drawH);
    }

    const link = document.createElement("a");
    link.href = outCanvas.toDataURL("image/png");
    link.download = "qrcode.png";
    link.click();
});
