(() => {
  const OPTIONS = ['', 'A', 'B', 'C', 'D', 'E'];

  function readMarkedAnswers(imageData, location, questionCount) {
    const points = [
      location.topLeftCorner,
      location.topRightCorner,
      location.bottomRightCorner,
      location.bottomLeftCorner
    ];
    const qrWidth = (distance(points[0], points[1]) + distance(points[3], points[2])) / 2;
    const qrHeight = (distance(points[0], points[3]) + distance(points[1], points[2])) / 2;
    if (Math.min(qrWidth, qrHeight) < 70) {
      throw new Error('O QR Code ficou pequeno na foto. Aproxime o celular e fotografe novamente o cartão inteiro.');
    }

    const pageWidthMm = 194;
    const cardWidthMm = (pageWidthMm - 5) / 2;
    const cardHeightMm = 137;
    const borderMm = 25.4 / 96;
    const paddingMm = 4;
    const qrSizeMm = 32;
    const qrLeftMm = cardWidthMm - borderMm - paddingMm - 35 + (35 - qrSizeMm) / 2;
    const qrTopMm = borderMm + paddingMm + (39 - borderMm - 35) / 2;
    const columnCount = questionCount > 30 ? 3 : 2;
    const rowCount = Math.ceil(questionCount / columnCount);
    const contentWidthMm = cardWidthMm - 2 * borderMm - 2 * paddingMm;
    const gridContentHeightMm = cardHeightMm - 2 * borderMm - 2 * paddingMm - 39 - 6 - 4;
    const columnGapMm = columnCount === 3 ? 1.5 : 3;
    const rowGapMm = columnCount === 3 ? 0.7 : 1.2;
    const cellWidthMm = (contentWidthMm - columnGapMm * (columnCount - 1)) / columnCount;
    const numberWidthMm = columnCount === 3 ? 4.5 : 6;
    const answerGapMm = columnCount === 3 ? 0.25 : 0.6;
    const bubbleDiameterMm = columnCount === 3 ? 2.8 : 4;
    const optionWidthMm = (cellWidthMm - numberWidthMm - answerGapMm * 5) / 5;
    const trackHeightMm = (gridContentHeightMm - rowGapMm * (rowCount - 1)) / rowCount;
    const gridContentTopMm = borderMm + paddingMm + 39 + 2;
    const transform = createQrTransform(points);
    const answers = [];

    for (let questionIndex = 0; questionIndex < questionCount; questionIndex += 1) {
      const row = Math.floor(questionIndex / columnCount);
      const column = questionIndex % columnCount;
      const rowOffsetMm = trackHeightMm * (row + 0.5) + rowGapMm * row;
      const scores = [];
      for (let optionIndex = 0; optionIndex < 5; optionIndex += 1) {
        const optionOffsetMm = numberWidthMm + answerGapMm +
          optionWidthMm * optionIndex + answerGapMm * optionIndex + bubbleDiameterMm / 2;
        const xMm = borderMm + paddingMm + column * (cellWidthMm + columnGapMm) +
          optionOffsetMm - qrLeftMm;
        const yMm = gridContentTopMm - qrTopMm + rowOffsetMm;
        const point = projectQrPoint(transform, xMm / qrSizeMm, yMm / qrSizeMm);
        const nextPoint = projectQrPoint(transform, (xMm + 0.5) / qrSizeMm, yMm / qrSizeMm);
        const localScale = distance(point, nextPoint) / 0.5;
        scores.push(getInkScore(imageData, point.x, point.y, localScale, bubbleDiameterMm));
      }
      const markedOptions = scores
        .map((score, index) => ({ score, index }))
        .filter((entry) => entry.score >= 0.24)
        .sort((left, right) => right.score - left.score);
      answers.push(markedOptions.length === 1 ? OPTIONS[markedOptions[0].index + 1] : '');
    }
    return answers;
  }

  function createQrTransform(points) {
    const [topLeft, topRight, bottomRight, bottomLeft] = points;
    const center = {
      x: (topLeft.x + topRight.x + bottomRight.x + bottomLeft.x) / 4,
      y: (topLeft.y + topRight.y + bottomRight.y + bottomLeft.y) / 4
    };
    return {
      center,
      horizontal: {
        x: ((topRight.x - topLeft.x) + (bottomRight.x - bottomLeft.x)) / 2,
        y: ((topRight.y - topLeft.y) + (bottomRight.y - bottomLeft.y)) / 2
      },
      vertical: {
        x: ((bottomLeft.x - topLeft.x) + (bottomRight.x - topRight.x)) / 2,
        y: ((bottomLeft.y - topLeft.y) + (bottomRight.y - topRight.y)) / 2
      }
    };
  }

  function projectQrPoint(transform, x, y) {
    return {
      x: transform.center.x + transform.horizontal.x * (x - 0.5) +
        transform.vertical.x * (y - 0.5),
      y: transform.center.y + transform.horizontal.y * (x - 0.5) +
        transform.vertical.y * (y - 0.5)
    };
  }

  function getInkScore(imageData, centerX, centerY, pixelsPerMm, bubbleDiameterMm) {
    const radius = Math.max(1, pixelsPerMm * Math.min(0.95, bubbleDiameterMm * 0.27));
    let darkPixels = 0;
    let samples = 0;
    for (let y = Math.floor(centerY - radius); y <= Math.ceil(centerY + radius); y += 1) {
      for (let x = Math.floor(centerX - radius); x <= Math.ceil(centerX + radius); x += 1) {
        if ((x - centerX) ** 2 + (y - centerY) ** 2 > radius ** 2 ||
            x < 0 || y < 0 || x >= imageData.width || y >= imageData.height) continue;
        const pixel = (y * imageData.width + x) * 4;
        const luminance = 0.299 * imageData.data[pixel] +
          0.587 * imageData.data[pixel + 1] + 0.114 * imageData.data[pixel + 2];
        if (luminance < 185) darkPixels += 1;
        samples += 1;
      }
    }
    return samples ? darkPixels / samples : 0;
  }

  function distance(first, second) {
    return Math.hypot(second.x - first.x, second.y - first.y);
  }

  window.CardOMR = Object.freeze({ readMarkedAnswers });
})();
