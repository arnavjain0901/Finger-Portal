import cv2
import mediapipe as mp
import numpy as np


# ============================================================
# FILTER FUNCTIONS
# Each filter receives:
#   frame -> complete webcam frame
#   mask  -> white inside portal, black outside
#
# Each function returns a filtered version of the frame.
# ============================================================

def grid_filter(frame, mask):
    """Draw a simple white grid."""

    result = frame.copy()

    h, w = frame.shape[:2]

    spacing = 40

    # Vertical lines
    for x in range(0, w, spacing):
        cv2.line(result, (x, 0), (x, h), (255, 255, 255), 1)

    # Horizontal lines
    for y in range(0, h, spacing):
        cv2.line(result, (0, y), (w, y), (255, 255, 255), 1)

    return result


def pixelated_filter(frame, mask):
    """Create a pixelated / mosaic effect."""

    h, w = frame.shape[:2]

    # Make the image very small
    small = cv2.resize(
        frame,
        (max(1, w // 20), max(1, h // 20)),
        interpolation=cv2.INTER_LINEAR
    )

    # Scale it back up using nearest-neighbor
    result = cv2.resize(
        small,
        (w, h),
        interpolation=cv2.INTER_NEAREST
    )

    return result


def halftone_filter(frame, mask):
    """Create a simple halftone-dot effect."""

    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

    # Blur slightly so the dots look smoother
    gray = cv2.GaussianBlur(gray, (9, 9), 0)

    result = np.zeros_like(frame)

    spacing = 10

    for y in range(0, frame.shape[0], spacing):
        for x in range(0, frame.shape[1], spacing):

            brightness = gray[y, x]

            # Dark pixels -> larger dots
            radius = int((255 - brightness) / 255 * 5)

            if radius > 0:
                cv2.circle(
                    result,
                    (x, y),
                    radius,
                    (255, 255, 255),
                    -1
                )

    return result


def duotone_filter(frame, mask):
    """Pink/red duotone effect."""

    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

    # Normalize brightness
    gray = cv2.normalize(
        gray,
        None,
        0,
        255,
        cv2.NORM_MINMAX
    )

    result = np.zeros_like(frame)

    # Dark color
    dark = np.array([40, 0, 50], dtype=np.uint8)

    # Bright pink color
    bright = np.array([255, 80, 180], dtype=np.uint8)

    # Convert grayscale into 0-1
    t = gray.astype(np.float32) / 255.0

    for channel in range(3):
        result[:, :, channel] = (
            dark[channel] * (1 - t) +
            bright[channel] * t
        ).astype(np.uint8)

    return result


def thermal_filter(frame, mask):
    """Apply OpenCV's JET thermal color map."""

    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

    result = cv2.applyColorMap(
        gray,
        cv2.COLORMAP_JET
    )

    return result


def frosted_filter(frame, mask):
    """Frosted-glass / blurred effect."""

    # Strong Gaussian blur
    blurred = cv2.GaussianBlur(
        frame,
        (31, 31),
        0
    )

    # Add a little brightness
    result = cv2.convertScaleAbs(
        blurred,
        alpha=1.1,
        beta=25
    )

    return result


# ============================================================
# FILTER LIST
#
# Press F to cycle through these filters.
# ============================================================

FILTROS = [
    grid_filter,
    pixelated_filter,
    halftone_filter,
    duotone_filter,
    thermal_filter,
    frosted_filter
]


# ============================================================
# POINT SORTING
#
# Takes 4 points and puts them in:
#
# 0 = top-left
# 1 = top-right
# 2 = bottom-right
# 3 = bottom-left
#
# This prevents the portal from randomly flipping.
# ============================================================

def sort_points(points):

    points = np.array(points, dtype=np.float32)

    # Sum of x + y
    # Smallest = top-left
    # Largest = bottom-right
    sums = points.sum(axis=1)

    top_left = points[np.argmin(sums)]
    bottom_right = points[np.argmax(sums)]

    # Difference x - y
    diffs = points[:, 0] - points[:, 1]

    # Largest difference = top-right
    top_right = points[np.argmax(diffs)]

    # Smallest difference = bottom-left
    bottom_left = points[np.argmin(diffs)]

    return np.array([
        top_left,
        top_right,
        bottom_right,
        bottom_left
    ], dtype=np.float32)


# ============================================================
# PORTAL RENDERING
# ============================================================

def render_portal(frame, p1, p2, p3, p4, filtro):

    h, w = frame.shape[:2]

    # --------------------------------------------------------
    # Arrange the four points consistently
    # --------------------------------------------------------

    points = sort_points([
        p1,
        p2,
        p3,
        p4
    ])

    # Convert to integer coordinates
    polygon = points.astype(np.int32)

    # --------------------------------------------------------
    # Create a mask
    #
    # White = inside portal
    # Black = outside portal
    # --------------------------------------------------------

    mask = np.zeros(
        (h, w),
        dtype=np.uint8
    )

    cv2.fillConvexPoly(
        mask,
        polygon,
        255
    )

    # --------------------------------------------------------
    # Perspective warp
    #
    # We create a rectangular version of the portal,
    # apply the filter there, then warp it back.
    # --------------------------------------------------------

    width_top = np.linalg.norm(points[1] - points[0])
    width_bottom = np.linalg.norm(points[2] - points[3])

    height_left = np.linalg.norm(points[3] - points[0])
    height_right = np.linalg.norm(points[2] - points[1])

    portal_width = max(
        int(max(width_top, width_bottom)),
        1
    )

    portal_height = max(
        int(max(height_left, height_right)),
        1
    )

    # Destination rectangle
    destination = np.array([
        [0, 0],
        [portal_width - 1, 0],
        [portal_width - 1, portal_height - 1],
        [0, portal_height - 1]
    ], dtype=np.float32)

    # Perspective transformation
    matrix = cv2.getPerspectiveTransform(
        points,
        destination
    )

    # Warp the original frame into a rectangle
    warped = cv2.warpPerspective(
        frame,
        matrix,
        (portal_width, portal_height)
    )

    # --------------------------------------------------------
    # Apply the selected filter to the rectangular portal
    # --------------------------------------------------------

    filtered = filtro(
        warped,
        np.ones(
            (portal_height, portal_width),
            dtype=np.uint8
        ) * 255
    )

    # --------------------------------------------------------
    # Warp the filtered rectangle back into the hand shape
    # --------------------------------------------------------

    inverse_matrix = cv2.getPerspectiveTransform(
        destination,
        points
    )

    filtered_back = cv2.warpPerspective(
        filtered,
        inverse_matrix,
        (w, h)
    )

    # Create a clean mask for the warped result
    warped_mask = cv2.warpPerspective(
        np.ones(
            (portal_height, portal_width),
            dtype=np.uint8
        ) * 255,
        inverse_matrix,
        (w, h)
    )

    # Make sure the result only exists inside the portal
    warped_mask = cv2.bitwise_and(
        warped_mask,
        mask
    )

    # --------------------------------------------------------
    # Put filtered image onto original frame
    # --------------------------------------------------------

    result = frame.copy()

    filtered_area = cv2.bitwise_and(
        filtered_back,
        filtered_back,
        mask=warped_mask
    )

    original_area = cv2.bitwise_and(
        result,
        result,
        mask=cv2.bitwise_not(warped_mask)
    )

    result = cv2.add(
        original_area,
        filtered_area
    )

    # --------------------------------------------------------
    # Draw thin white portal outline
    # --------------------------------------------------------

    cv2.polylines(
        result,
        [polygon],
        True,
        (255, 255, 255),
        2,
        cv2.LINE_AA
    )

    return result


# ============================================================
# MAIN
# ============================================================

def main():

    # --------------------------------------------------------
    # Start webcam
    # --------------------------------------------------------

    cap = cv2.VideoCapture(0)

    if not cap.isOpened():
        print("Could not open webcam.")
        return

    # --------------------------------------------------------
    # MediaPipe Hands setup
    # --------------------------------------------------------

    mp_hands = mp.solutions.hands

    hands = mp_hands.Hands(
        static_image_mode=False,
        max_num_hands=2,
        min_detection_confidence=0.6,
        min_tracking_confidence=0.6
    )

    mp_draw = mp.solutions.drawing_utils

    # Current filter
    filtro_index = 0

    # Smoothed points
    smooth_points = None

    # Smoothing strength
    # Smaller = smoother but more lag
    # Larger = faster but more jitter
    alpha = 0.25

    print("================================")
    print("Finger Portal started!")
    print("Press F -> Change filter")
    print("Press Q -> Quit")
    print("================================")

    # --------------------------------------------------------
    # Webcam loop
    # --------------------------------------------------------

    while True:

        success, frame = cap.read()

        if not success:
            print("Could not read webcam frame.")
            break

        # Mirror webcam so movement feels natural
        frame = cv2.flip(frame, 1)

        # Get frame dimensions
        h, w = frame.shape[:2]

        # Convert BGR -> RGB for MediaPipe
        rgb = cv2.cvtColor(
            frame,
            cv2.COLOR_BGR2RGB
        )

        # Detect hands
        results = hands.process(rgb)

        # ----------------------------------------------------
        # We need TWO hands
        # ----------------------------------------------------

        if results.multi_hand_landmarks and len(
            results.multi_hand_landmarks
        ) >= 2:

            hand_landmarks = results.multi_hand_landmarks

            points = []

            # -----------------------------------------------
            # Get thumb tip + index tip from each hand
            #
            # MediaPipe landmark IDs:
            #
            # 4  = thumb tip
            # 8  = index fingertip
            # -----------------------------------------------

            for hand in hand_landmarks[:2]:

                thumb = hand.landmark[
                    mp_hands.HandLandmark.THUMB_TIP
                ]

                index = hand.landmark[
                    mp_hands.HandLandmark.INDEX_FINGER_TIP
                ]

                thumb_point = (
                    int(thumb.x * w),
                    int(thumb.y * h)
                )

                index_point = (
                    int(index.x * w),
                    int(index.y * h)
                )

                points.append(thumb_point)
                points.append(index_point)

            # ------------------------------------------------
            # Sort the four corners
            # ------------------------------------------------

            sorted_points = sort_points(points)

            # ------------------------------------------------
            # Smooth points using exponential moving average
            # ------------------------------------------------

            current_points = sorted_points.astype(
                np.float32
            )

            if smooth_points is None:

                smooth_points = current_points.copy()

            else:

                smooth_points = (
                    alpha * current_points +
                    (1 - alpha) * smooth_points
                )

            # ------------------------------------------------
            # Render selected filter inside portal
            # ------------------------------------------------

            frame = render_portal(
                frame,
                smooth_points[0],
                smooth_points[1],
                smooth_points[2],
                smooth_points[3],
                FILTROS[filtro_index]
            )

            # ------------------------------------------------
            # Draw MediaPipe hand landmarks
            # ------------------------------------------------

            for hand in hand_landmarks[:2]:

                mp_draw.draw_landmarks(
                    frame,
                    hand,
                    mp_hands.HAND_CONNECTIONS
                )

        else:

            # If two hands aren't visible,
            # show the normal webcam feed.

            smooth_points = None

        # ----------------------------------------------------
        # Display current filter
        # ----------------------------------------------------

        filter_name = FILTROS[
            filtro_index
        ].__name__.replace(
            "_filter",
            ""
        )

        cv2.putText(
            frame,
            f"Filter: {filter_name}",
            (20, 40),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.8,
            (255, 255, 255),
            2
        )

        cv2.putText(
            frame,
            "F = change filter | Q = quit",
            (20, h - 20),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.6,
            (255, 255, 255),
            2
        )

        # Show webcam
        cv2.imshow(
            "Finger Portal",
            frame
        )

        # ----------------------------------------------------
        # Keyboard controls
        # ----------------------------------------------------

        key = cv2.waitKey(1) & 0xFF

        # Q -> quit
        if key == ord("q"):
            break

        # F -> next filter
        elif key == ord("f"):

            filtro_index = (
                filtro_index + 1
            ) % len(FILTROS)

            print(
                "Filter:",
                FILTROS[filtro_index].__name__
            )

    # --------------------------------------------------------
    # Cleanup
    # --------------------------------------------------------

    cap.release()
    cv2.destroyAllWindows()
    hands.close()


# ============================================================
# PROGRAM ENTRY POINT
# ============================================================

if __name__ == "__main__":
    main()