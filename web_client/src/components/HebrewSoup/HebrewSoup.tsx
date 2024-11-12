import { useEffect, useRef } from "react";

import { EnvConfig } from "@/env/config";

class HebrewFloatingLetters {
  private container: HTMLElement;
  private svg!: SVGSVGElement;
  private letters: SVGTextElement[] = [];
  private letterData: {
    idx: number;
    element: SVGTextElement;
    baseFontSize: number;
    currentIndex: number;
    current: {
      x: number;
      y: number;
    };
  }[] = [];
  private currents: { xOffset: number; yOffset: number }[] = [];
  private width: number;
  private height: number;
  private animationId: number | null = null;
  private startTime: number;
  private permutation: number[] = [];
  private p: number[] = [];

  constructor(container: HTMLElement) {
    this.container = container;
    this.width = container.clientWidth;
    this.height = container.clientHeight;
    this.startTime = Date.now();
    this.createSVG();
    this.initNoise(); // Initialize the permutation arrays for noise
    this.generateCurrents();
    this.generateLetters();
    this.animate();
  }

  private createSVG() {
    this.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    this.svg.setAttribute("width", this.width.toString());
    this.svg.setAttribute("height", this.height.toString());
    this.container.appendChild(this.svg);
  }

  // Initialize permutation arrays for Perlin noise
  private initNoise() {
    this.permutation = [
      151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225,
      140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23, 190, 6, 148, 247,
      120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32, 57, 177,
      33, 88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175, 74, 165,
      71, 134, 139, 48, 27, 166, 77, 146, 158, 231, 83, 111, 229, 122, 60, 211,
      133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244, 102, 143, 54, 65, 25,
      63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169, 200, 196,
      135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64, 52, 217,
      226, 250, 124, 123, 5, 202, 38, 147, 118, 126, 255, 82, 85, 212, 207, 206,
      59, 227, 47, 16, 58, 17, 182, 189, 28, 42, 223, 183, 170, 213, 119, 248,
      152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9, 129, 22,
      39, 253, 19, 98, 108, 110, 79, 113, 224, 232, 178, 185, 112, 104, 218,
      246, 97, 228, 251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162, 241,
      81, 51, 145, 235, 249, 14, 239, 107, 49, 192, 214, 31, 181, 199, 106, 157,
      184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254, 138, 236, 205, 93,
      222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180,
    ];
    this.p = new Array(512);
    for (let i = 0; i < 256; i++) {
      this.p[256 + i] = this.p[i] = this.permutation[i];
    }
  }

  private generateCurrents() {
    const numCurrents = 5; // Adjust as needed
    for (let i = 0; i < numCurrents; i++) {
      this.currents.push({
        xOffset: Math.random() * 1000,
        yOffset: Math.random() * 1000,
      });
    }
  }

  private generateLetters() {
    const numLetters = 40; // Adjust the number of letters as needed
    const hebrewLetters = [];
    for (let code = 0x05d0; code <= 0x05ea; code++) {
      hebrewLetters.push(String.fromCharCode(code));
    }
    for (let code = 0x0591; code <= 0x05c7; code++) {
      hebrewLetters.push(String.fromCharCode(code)); // Nikud
    }
    for (let code = 0x0591; code <= 0x05af; code++) {
      hebrewLetters.push(String.fromCharCode(code)); // Cantillation
    }

    for (let i = 0; i < numLetters; i++) {
      const letter =
        hebrewLetters[Math.floor(Math.random() * hebrewLetters.length)];
      const text = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text",
      );
      text.textContent = letter;
      const x = Math.random() * this.width;
      const y = Math.random() * this.height;
      text.setAttribute("x", x.toString());
      text.setAttribute("y", y.toString());
      text.setAttribute("opacity", "0.5");
      const fontSize = 20 + Math.random() * 80;
      text.setAttribute("font-size", fontSize.toString());
      text.setAttribute("font-family", "Arial, sans-serif");
      // Apply blur filter for ghost-like effect
      text.style.filter = "blur(2px)";
      this.svg.appendChild(text);
      this.letters.push(text);

      // Assign each letter to a current and store additional data
      const currentIndex = Math.floor(Math.random() * this.currents.length);
      this.letterData.push({
        idx: i,
        element: text,
        baseFontSize: fontSize,
        currentIndex,
        current: { x, y },
      });
    }
  }

  private animate = () => {
    const time = (Date.now() - this.startTime) * 0.0001; // Scale time for smoother animation

    for (const data of this.letterData) {
      const { element } = data;
      let { currentIndex } = data;
      const current = this.currents[currentIndex];

      // Add 2% chance to hop onto a different current
      if (Math.random() < 0.001) {
        currentIndex = Math.floor(Math.random() * this.currents.length);
        data.currentIndex = currentIndex;
      }

      // Use Perlin noise to generate smooth velocities
      const xNoise = this.noise3D(
        data.current.x * 0.005 + current.xOffset,
        data.current.y * 0.005 + current.yOffset,
        time,
      );
      const yNoise = this.noise3D(
        data.current.x * 0.005 + current.xOffset + 1000,
        data.current.y * 0.005 + current.yOffset + 1000,
        time,
      );

      const dx = xNoise * 0.5; // Adjust the multiplier to change speed
      const dy = yNoise * 0.5;

      data.current.x += dx;
      data.current.y += dy;

      // Wrap around edges
      if (data.current.x > this.width) data.current.x = 0;
      if (data.current.x < 0) data.current.x = this.width;
      if (data.current.y > this.height) data.current.y = 0;
      if (data.current.y < 0) data.current.y = this.height;

      element.setAttribute("x", data.current.x.toString());
      element.setAttribute("y", data.current.y.toString());

      // Adjust opacity smoothly
      const opacityNoise = this.noise3D(currentIndex, time, 0);
      const opacity = 0.5 + opacityNoise * 0.2; // Range between 0.3 and 0.7
      element.setAttribute("opacity", opacity.toString());

      // Adjust font size smoothly
      // const fontSizeNoise = this.noise3D(currentIndex + 1000, time, 0);
      // const fontSize = baseFontSize + fontSizeNoise * 5; // Adjust as needed
      // element.setAttribute("font-size", fontSize.toString());

      const x = parseFloat(element.getAttribute("x") || "0") || 0;
      const y = parseFloat(element.getAttribute("y") || "0") || 0;

      // Adjust scale smoothly
      // const scaleNoise = this.noise3D(currentIndex + 1, time, 0);
      const scaleNoise = this.noise3D(data.idx, time, 0);
      const scale = 1.2 + scaleNoise * 0.6; // Adjust as needed

      // Apply transform with translation to center the scaling
      element.setAttribute(
        "transform",
        `translate(${x}, ${y}) scale(${scale}) translate(${-x}, ${-y})`,
      );
    }

    this.animationId = requestAnimationFrame(this.animate);
  };

  // Implementation of Perlin noise functions

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private lerp(t: number, a: number, b: number): number {
    return a + t * (b - a);
  }

  private grad(hash: number, x: number, y: number, z: number): number {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  private noise3D(x: number, y: number, z: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const Z = Math.floor(z) & 255;

    x -= Math.floor(x);
    y -= Math.floor(y);
    z -= Math.floor(z);

    const u = this.fade(x);
    const v = this.fade(y);
    const w = this.fade(z);

    const A = this.p[X] + Y;
    const AA = this.p[A] + Z;
    const AB = this.p[A + 1] + Z;
    const B = this.p[X + 1] + Y;
    const BA = this.p[B] + Z;
    const BB = this.p[B + 1] + Z;

    const res = this.lerp(
      w,
      this.lerp(
        v,
        this.lerp(
          u,
          this.grad(this.p[AA], x, y, z),
          this.grad(this.p[BA], x - 1, y, z),
        ),
        this.lerp(
          u,
          this.grad(this.p[AB], x, y - 1, z),
          this.grad(this.p[BB], x - 1, y - 1, z),
        ),
      ),
      this.lerp(
        v,
        this.lerp(
          u,
          this.grad(this.p[AA + 1], x, y, z - 1),
          this.grad(this.p[BA + 1], x - 1, y, z - 1),
        ),
        this.lerp(
          u,
          this.grad(this.p[AB + 1], x, y - 1, z - 1),
          this.grad(this.p[BB + 1], x - 1, y - 1, z - 1),
        ),
      ),
    );

    // Normalize the result to be between -1 and 1
    return res;
  }

  // Call this method to stop the animation and clean up
  public destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    this.container.removeChild(this.svg);
  }
}

const HebrewSoup = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current && !EnvConfig.getBoolean("disable_soup")) {
      const hebrewSoup = new HebrewFloatingLetters(containerRef.current);
      return () => {
        hebrewSoup.destroy(); // Clean up when the component unmounts.
      };
    }
  }, []);

  if (EnvConfig.getBoolean("disable_soup")) return null;

  return (
    <div
      className="fixed left-0 top-0 h-full w-full fill-primary"
      ref={containerRef}
    ></div>
  );
};

export default HebrewSoup;
