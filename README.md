\# 🖐️ Finger Portal



A real-time browser-based computer vision experiment that transforms the space between your hands into an interactive visual portal.



Built using \*\*MediaPipe Hands, JavaScript, HTML5 Canvas, and WebRTC\*\*, Finger Portal detects the thumb and index fingertips of both hands and uses them to construct a dynamic four-point portal.



\## ✨ Features



\* Real-time webcam processing

\* Two-hand tracking with MediaPipe Hands

\* Thumb + index fingertip tracking

\* Dynamic four-point portal geometry

\* Real-time visual filters

\* Animated glowing portal border

\* Finger tracking markers and crosshairs

\* Moving energy particles around the portal

\* Futuristic HUD interface

\* Smooth portal-point interpolation

\* Browser-based — no build tools required

\* One-click Windows launcher



\## 🎨 Visual Filters



Press `F` to cycle through the available portal effects:



\* Grid

\* Pixelated

\* Halftone

\* Pink Duotone

\* Frosted



\## 🕹️ Controls



| Key | Action               |

| --- | -------------------- |

| `F` | Change portal filter |

| `Q` | Stop camera          |



\## 🛠️ Tech Stack



\* \*\*HTML5\*\*

\* \*\*CSS3\*\*

\* \*\*JavaScript\*\*

\* \*\*MediaPipe Hands\*\*

\* \*\*HTML5 Canvas\*\*

\* \*\*WebRTC / getUserMedia\*\*

\* \*\*OpenCV\*\* for the original computer-vision prototype



\## 🚀 Running the Project



\### Option 1 — Windows



Double-click:



```text

start.bat

```



The local server will start and the project will open automatically in your browser.



\### Option 2 — Manual



Open a terminal in the project folder:



```bash

cd C:\\Users\\sonuj\\Desktop\\finger\_portal

```



Start the local server:



```bash

python -m http.server 8000

```



Then open:



```text

http://127.0.0.1:8000

```



Allow camera access when the browser asks.



\## 📁 Project Structure



```text

Finger-Portal/

│

├── index.html

├── script.js

├── style.css

├── main.py

├── start.bat

├── .gitignore

└── README.md

```



\## 🧠 How It Works



Finger Portal uses MediaPipe Hands to detect up to two hands from the webcam.



For each detected hand, the application extracts:



\* Thumb tip — landmark `4`

\* Index fingertip — landmark `8`



With both hands detected, these four points become the corners of the portal.



The application then:



1\. Detects the hands.

2\. Extracts the four fingertip points.

3\. Sorts the points into a consistent polygon.

4\. Smooths the point positions.

5\. Creates a clipped portal region.

6\. Applies the selected visual filter.

7\. Draws the animated portal border.

8\. Adds fingertip markers and moving particles.

9\. Updates the futuristic HUD in real time.



\## 🎯 Project Goal



This project explores how browser-based computer vision can be combined with creative visual effects to create an interactive augmented-reality-style experience without requiring a traditional application build system.



\## 📌 Status



\*\*Complete — ready for demonstration and further experimentation.\*\*



\## 👤 Author



\*\*Arnav Jain\*\*



GitHub:

https://github.com/arnavjain0901



\---



⭐ If you find the project interesting, feel free to explore the code and experiment with the effects.



