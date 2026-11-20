# SCW1 Speaking Studio

西交利物浦大学大一 EAP SCW1 口语练习站。提供双语题库、限时练习、口语模拟、词卡和两周练习计划。

A bilingual speaking practice studio for XJTLU Year 1 EAP SCW1, with a question bank, timed practice, mock interviews, vocabulary cards, and a two-week study plan.

[Open the hosted site](https://xjtlu-scw1-speaking-studio.eager-bloom-6519.chatgpt.site)

## 本地运行 / Run locally

Clone the repository, then serve the `dist` directory with Python 3. No package installation or build is required.

```sh
python -m http.server 8000 --bind 127.0.0.1 --directory dist
```

Open [http://127.0.0.1:8000](http://127.0.0.1:8000). Progress is stored in the browser. Speech and recording features depend on browser support and microphone permission.

## 许可证 / License

The project code is licensed under the [MIT License](LICENSE). Linked third-party resources and attributed source material retain their original terms. The Sources view in the app lists credits and references.
