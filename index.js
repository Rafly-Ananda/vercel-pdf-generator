const app = require("express")();
const axios = require("axios");
// require('dotenv').config()

let chrome = {};
let puppeteer;

if (process.env.AWS_LAMBDA_FUNCTION_VERSION) {
  chrome = require("chrome-aws-lambda");
  puppeteer = require("puppeteer-core");
} else {
  puppeteer = require("puppeteer");
}

app.get("/api", async (req, res) => {
  console.log("IN");
  let options = {};

  if (process.env.AWS_LAMBDA_FUNCTION_VERSION) {
    options = {
      args: [...chrome.args, "--hide-scrollbars", "--disable-web-security"],
      defaultViewport: chrome.defaultViewport,
      executablePath: await chrome.executablePath,
      headless: true,
      ignoreHTTPSErrors: true,
    };
  }

  try {
    let browser = await puppeteer.launch(options);
    let page = await browser.newPage();
    await page.goto(req.query.url, {
      waitUntil: "networkidle0",
    });
    const buffer = await page.pdf({ format: "a4" });

    await axios.post(`${process.env.S3_UPLOADER_SERVER}/api`, {
      bookingId: req.query.bookingId,
      buffer,
    });

    res
      .send({
        message: "PDF Generated",
        s3Url: `https://gadjah-ticketing-platform.s3.ap-southeast-1.amazonaws.com/${req.query.bookingId}.pdf`,
      })
      .status(200);
  } catch (err) {
    res.send({ message: "Request Failed", error: err.message });
    return null;
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server started");
});

module.exports = app;

// TODO: TEST LG DI YG VERSI 16
// TODO: Benerin logic tambah axios di project in kalo yg atas bener ga jalan
// TODO: deploy yg s3 uploader
