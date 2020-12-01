const spawn = require('child_process').spawn;
const path = require('path');
const puppeteer = require('puppeteer');

let videoPath;
let ffmpeg;
if (process.env.CI) {
  videoPath = path.join('.', `test.mp4`);
  ffmpeg = spawn('ffmpeg', [
    '-draw_mouse',
    '0',
    '-framerate',
    '30',
    '-f',
    //  grab the X11 display
    'x11grab',
    '-video_size',
    // video size
    '1024x768',
    // x11grab options - https://ffmpeg.org/ffmpeg-devices.html#x11grab
    '-i',
    // input file url
    ':99',
    '-y',
    '-pix_fmt',
    'rgb565le',
    // QuickTime Player support, "Use -pix_fmt yuv420p for compatibility with outdated media players"
    // 'yuv420p',
    // output file
    videoPath,
  ]);
} else {
  videoPath = path.join('.', `test.mkv`);
  ffmpeg = spawn('ffmpeg', [
    '-framerate', '30', '-f', 'avfoundation', '-video_size', '1024x768', '-i',  '1', '-y', '-pix_fmt', 'rgb565le', videoPath
  ]);
}

ffmpeg.stdout.on('data', (data) => {
  console.log('ffmpeg stdout: ', data.toString());
});

ffmpeg.stderr.on('data', (data) => {
  console.log('ffmpeg stderr: ', data.toString());
});

(async function () {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      '--display=99',
    ],
  });

  const page = await browser.newPage();
  await page.goto('https://google.ca');
  await page.goto('https://yahoo.com');

  await page.close();
  await browser.close();

  console.log('@@stop recording to', videoPath);
  console.log('\n\tVideo location:', videoPath, '\n');
  ffmpeg.kill('SIGINT');
})();
