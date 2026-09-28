# 活动奖励奖杯素材

输出素材：`static/ui/reward-trophy-clean.png`。

使用内置 imagegen 编辑原始 `static/ui/reward-trophy.png`。原始图片包含截断的橙色按钮与“明 ›”文字，保留原文件便于追溯。最终素材使用完整金色奖杯与浅金色纯底，不包含文字、按钮或箭头。首页与奖励详情页统一使用 `aspectFit` 完整显示；首页按钮独立排布。

第一版透明底输出实际带有棋盘格，未用于页面；第二版改为与奖励卡片相配的浅金纯底。

## 初始编辑提示词

```text
Use case: background-extraction / precise-object-edit.
Asset type: clean reusable trophy illustration for a Chinese mobile quiz activity reward card and reward detail page.
Edit target: the provided reward-trophy.png.
Primary request: Preserve the existing golden three-dimensional trophy with its embossed star, two curved handles, stem and tiered base. Extract the trophy alone as a high-quality isolated full-object cutout on an ACTUAL TRANSPARENT background, with natural warm gold shading matching the original. Remove the cream background, all laurel leaves, the clipped orange button at lower left, every text fragment, all arrows and all interface elements. Reconstruct any necessary clean edge.
Composition: centered single upright trophy, square 1024x1024 canvas, whole trophy including both handles and entire base visible, about 84% of canvas height, at least 8% clear transparent margin around all sides, no cropping. Match the original trophy appearance and viewpoint. Sharp, smooth clean silhouette, appropriate at small mobile UI sizes.
Text: none. No button, no label, no border, no additional objects, no watermark. Genuine alpha transparency, not a checkerboard drawn into the image.
```

## 最终修正提示词

```text
Use case: precise-object-edit.
Edit the provided trophy image for a mobile activity-rewards UI.
Keep the golden trophy, its star, both handles, stem and entire base, with the same upright viewpoint and gold 3D shading.
CHANGE ONLY THE BACKGROUND: Completely remove ALL gray-and-white checkerboard squares, including the background visible inside the handles. Replace them with a perfectly uniform opaque warm ivory background, exact hex #FFF7E5. No checkerboard anywhere, no transparency simulation, no pattern, no leaves, no buttons, no text, no arrows, no watermark.
Composition: one complete centered trophy with at least 8% clean ivory margin on all four sides, square canvas. Do not crop any part of the trophy. The result must be an ordinary image with a clean solid cream background. No UI screenshot framing.
```
