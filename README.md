# 🖐️ FINGER PORTAL

### ✨ Turn your hands into a portal.

A real-time browser-based computer vision experiment that transforms the space between your hands into an interactive visual portal.

Built with **MediaPipe Hands + JavaScript + HTML5 Canvas**, Finger Portal tracks your fingertips, constructs a dynamic portal between your hands, and fills it with real-time visual effects.

> **No app. No build system. Just open the camera and create a portal.**

---

## 🎬 What is Finger Portal?

Finger Portal is an interactive computer-vision experiment designed around a simple idea:

**What if your hands could open a portal?**

The webcam tracks both hands in real time. Your thumb and index fingertips become four control points, which are used to construct the portal.

Move your hands → the portal moves.

Change your fingers → the portal changes shape.

Press `F` → the portal transforms.

---

## ⚡ Features

| Feature                   | Description                                    |
| ------------------------- | ---------------------------------------------- |
| 🖐️ **Two-Hand Tracking** | Real-time tracking of up to two hands          |
| 🎯 **4-Point Portal**     | Thumb + index fingertips define the portal     |
| 🌀 **Dynamic Geometry**   | Portal shape changes naturally with your hands |
| ✨ **Animated Glow**       | Pulsing portal border with dynamic lighting    |
| 🎯 **Finger Markers**     | Crosshair-style fingertip tracking indicators  |
| ⚡ **Energy Particles**    | Moving particles travel around the portal      |
| 🎨 **Live Filters**       | Multiple visual effects inside the portal      |
| 🖥️ **Futuristic HUD**    | Live system, hand and portal status            |
| 🚀 **One-Click Launch**   | Start the entire project with `start.bat`      |

---

## 🎨 Portal Modes

Press **`F`** to cycle through the visual effects.

### ▦ GRID

A digital grid transforms the portal into a futuristic scanning window.

### ▪ PIXELATED

A low-resolution pixel effect creates a digital distortion inside the portal.

### ⠿ HALFTONE

A dot-based halftone effect gives the portal a stylized graphic appearance.

### 💗 PINK DUOTONE

A strong duotone treatment transforms the camera feed into a vibrant visual effect.

### ❄️ FROSTED

A blurred, glass-like effect creates a frosted portal window.

---

## 🧠 Computer Vision Pipeline

```text
             WEBCAM
                │
                ▼
       ┌─────────────────┐
       │  MediaPipe Hands │
       └────────┬────────┘
                │
                ▼
        Detect Both Hands
                │
                ▼
     ┌─────────────────────┐
     │ Thumb + Index Tips  │
     │      4 Points       │
     └──────────┬──────────┘
                │
                ▼
        Point Sorting
                │
                ▼
       Position Smoothing
                │
                ▼
      Portal Quadrilateral
                │
          ┌─────┴─────┐
          ▼           ▼
       Filter      Particles
          │           │
          └─────┬─────┘
                ▼
         Animated Portal
                │
                ▼
          FUTURISTIC HUD
```

---

## 🔬 How It Works

Finger Portal uses **MediaPipe Hands** to detect hand landmarks from the webcam.

For each hand, two landmarks are extracted:

```text
Thumb Tip   → Landmark 4
Index Tip   → Landmark 8
```

With two hands detected, the application gets four points:

```text
Hand 1 → Thumb + Index
Hand 2 → Thumb + Index
```

These four points form the corners of the portal.

The points are then:

1. Sorted into a consistent order
2. Smoothed to reduce jitter
3. Used to create a clipped polygon
4. Filled with the selected visual filter
5. Surrounded by an animated glowing border
6. Enhanced with fingertip markers
7. Decorated with moving energy particles

All of this happens in real time inside the browser.

---

## 🛠️ Built With

**Core**

* HTML5
* CSS3
* JavaScript

**Computer Vision**

* MediaPipe Hands

**Graphics**

* HTML5 Canvas
* Canvas 2D API

**Camera**

* WebRTC
* `getUserMedia()`

**Prototype**

* Python
* OpenCV

---

## 🚀 Run It

### Windows — One Click

The easiest way to start:

```text
Double-click → start.bat
```

The script starts the local server and opens:

```text
http://127.0.0.1:8000
```

Allow camera access when prompted.

### Manual Launch

Open a terminal inside the project folder:

```bash
python -m http.server 8000
```

Then visit:

```text
http://127.0.0.1:8000
```

---

## 🎮 Controls

```text
┌─────────┬──────────────────────┐
│    F    │   Change Filter      │
├─────────┼──────────────────────┤
│    Q    │   Stop Camera        │
└─────────┴──────────────────────┘
```

---

## 📁 Project Structure

```text
Finger-Portal/
│
├── 📄 index.html
├── 📜 script.js
├── 🎨 style.css
├── 🐍 main.py
├── ▶️ start.bat
├── 🚫 .gitignore
└── 📖 README.md
```

---

## 💡 Why I Built This

This project started as an experiment with **computer vision and interactive visual effects**.

Instead of simply detecting hands and displaying landmarks, I wanted to turn hand tracking into something that actually feels interactive.

The result is a browser-based experience where your hands become the interface.

**Computer vision doesn't have to be just detection. It can be interaction.**

---

## 🔮 Possible Future Experiments

* More portal effects
* Custom hand gestures for interaction
* Portal distortion and shader effects
* Sound-reactive visuals
* Gesture-controlled UI
* Multiple portal modes
* WebGL-based effects
* AR-style environment interaction

---

## 📌 Project Status

**🟢 Complete — Ready for Demonstration**

The current version includes real-time hand tracking, dynamic portal geometry, multiple filters, animated effects, particles, and a futuristic HUD.

---

## 👤 Author

### Arnav Jain

Computer Vision • AI • Creative Coding

GitHub:
**https://github.com/arnavjain0901**

---

### ⭐ If you like the project

Give the repository a ⭐ and experiment with the portal yourself.

**Open your hands. Create something.**
