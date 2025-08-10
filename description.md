# Project: ChatPic – English Learning App (React MVP)

**Goal:** Build a minimal but functional React application with three main screens and Kimi API integration for conversational English practice. Use **TailwindCSS** for styling.


## 1. Home Screen

### UI

- Large, centered **"Start Dialogue"** button.

### Behavior

- Clicking the button navigates to **Dialogue Mode**.


## 2. Dialogue Mode

### Layout

- **Left:** An image (PNG) from the `img` folder.
  - Images are loaded via `import` or `require` in React.
- **Right:** Conversation area between User and AI.
  - User can reply via **text input** or **voice input**.

### Functionality

- Integrate with **Kimi API** for:
  - Real-time conversation
  - Grammar correction
  - Natural feedback
- Smooth, natural conversation flow.

### Special Requirements

- Images have a matching description in `data/descriptions.json`.
  - **Key format:** filename without extension.
    Example: `img_01.png` → `"img_01"`.
- **On dialogue start:**
  1. Load the description from JSON based on `imageId`.
  2. Build the **Kimi prompt** (see below).
  3. Call **Kimi API** and display the first AI question.


### Kimi Prompt Format

```vbnet
You are a friendly and encouraging English tutor. 
Your goal is to help the learner practice descriptive speaking in English based on the given image description.

Image description:
"{description from JSON}"
```

Instructions:

1. Ask the learner exactly 4 questions in total.
2. Start with simple observation, then go into details, feelings, and creativity.
3. Keep questions short and friendly.
4. Output one question at a time, based on conversation flow.

### API Details

* Kimi API Key: 从配置文件env中获取 KIMI_API_KEY
* Helper Function:
  * startDialogue(imageId)
    1. Fetch matching description from descriptions.json.
    2. Construct prompt.
    3. Send to Kimi API with call Kimi helper.
    4. Display first AI question in UI.

## 3.Review Postcard Screen

* Layout:
  * Horizontal postcard style:
    * Left: Conversation image.
    * Right: AI feedback.
      * Highlight errors in red and corrections in green.
      * Show AI-generated:
        * Encouraging remarks.
        * Error summary.
        * Improvement suggestions.
  * Top-right corner: Postage stamp icon.
  * Bottom: Two buttons:
    * "Save Post”card
    * “Practice Another Image” → loads a new image from the image library.
* Behavior:
  * AI feedback is generated after user completes the task.

## Deliverables

* 3 screens as separate React components.
* TailwindCSS minimal styling for clean, readable UI.
* Placeholder images (img folder) and sample descriptions.json.
* Fully working Kimi API integration in Dialogue Mode.
* Navigation between screens.
* Functional "Practice Another Image" feature to fetch a different image.
