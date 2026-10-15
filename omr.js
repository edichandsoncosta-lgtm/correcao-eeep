(() => {
  const OPTIONS = ['', 'A', 'B', 'C', 'D', 'E'];
  const CARD_WIDTH_MM = 94.5;
  const CARD_HEIGHT_MM = 137;
  const MARKER_OFFSET_MM = 2.3;

  function findCardMarkers(imageData) {
    const { width, height, data } = imageData;
    const visited = new Uint8Array(width * height);
    const candidates = [];
    const minimumSize = Math.max(6, Math.min(width, height) * 0.012);
    const maximumSize = Math.min(width, height) * 0.07;
    const stack = [];

    for (let startY = 0; startY < height; startY += 1) {
      for (let startX = 0; startX < width; startX += 1) {
        const start = startY * width + startX;
        if (visited[start] || luminanceAt(data, start) > 75) continue;
        visited[start] = 1;
        stack.push(start);
        let minX = startX;
        let maxX = startX;
        let minY = startY;
        let maxY = startY;
        let area = 0;

        while (stack.length) {
          const pixel = stack.pop();
          const x = pixel % width;
          const y = Math.floor(pixel / width);
          area += 1;
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
          const neighbors = [
            x > 0 ? pixel - 1 : -1,
            x + 1 < width ? pixel + 1 : -1,
            y > 0 ? pixel - width : -1,
            y + 1 < height ? pixel + width : -1
          ];
          neighbors.forEach((neighbor) => {
            if (neighbor < 0 || visited[neighbor] || luminanceAt(data, neighbor) > 75) return;
            visited[neighbor] = 1;
            stack.push(neighbor);
          });
        }

        const boxWidth = maxX - minX + 1;
        const boxHeight = maxY - minY + 1;
        const fillRatio = area / (boxWidth * boxHeight);
        if (boxWidth < minimumSize || boxHeight < minimumSize ||
            boxWidth > maximumSize || boxHeight > maximumSize ||
            boxWidth / boxHeight < 0.78 || boxWidth / boxHeight > 1.28 ||
            fillRatio < 0.72) continue;
        candidates.push({
          x: (minX + maxX) / 2,
          y: (minY + maxY) / 2,
          size: (boxWidth + boxHeight) / 2,
          fillRatio
        });
      }
    }

    if (candidates.length < 4) return null;
    candidates.sort((first, second) => second.size - first.size);
    const selected = candidates.slice(0, 24);
    let best = null;
    let bestScore = Infinity;
    for (let first = 0; first < selected.length - 3; first += 1) {
      for (let second = first + 1; second < selected.length - 2; second += 1) {
        for (let third = second + 1; third < selected.length - 1; third += 1) {
          for (let fourth = third + 1; fourth < selected.length; fourth += 1) {
            const points = orderCorners([
              selected[first],
              selected[second],
              selected[third],
              selected[fourth]
            ]);
            const score = scoreCornerSet(points);
            if (score < bestScore) {
              best = points;
              bestScore = score;
            }
          }
        }
      }
    }
    return bestScore < 1.3 ? best : null;
  }

  function readMarkedAnswers(imageData, markers, questionCount) {
    if (!markers || markers.length !== 4) {
      throw new Error('Enquadre os quatro quadrados pretos nos cantos do cartão.');
    }
    const transform = createCardTransform(markers);
    const columnCount = questionCount > 30 ? 3 : 2;
    const rowCount = Math.ceil(questionCount / columnCount);
    const borderMm = 25.4 / 96;
    const paddingMm = 4;
    const headerHeightMm = 39;
    const gridContentHeightMm = CARD_HEIGHT_MM - 2 * borderMm - 2 * paddingMm -
      headerHeightMm - 6 - 4;
    const contentWidthMm = CARD_WIDTH_MM - 2 * borderMm - 2 * paddingMm;
    const columnGapMm = columnCount === 3 ? 1.5 : 3;
    const rowGapMm = columnCount === 3 ? 0.7 : 1.2;
    const cellWidthMm = (contentWidthMm - columnGapMm * (columnCount - 1)) / columnCount;
    const numberWidthMm = columnCount === 3 ? 4.5 : 6;
    const answerGapMm = columnCount === 3 ? 0.25 : 0.6;
    const bubbleDiameterMm = columnCount === 3 ? 2.8 : 4;
    const optionWidthMm = (cellWidthMm - numberWidthMm - answerGapMm * 5) / 5;
    const trackHeightMm = (gridContentHeightMm - rowGapMm * (rowCount - 1)) / rowCount;
    const gridContentTopMm = borderMm + paddingMm + headerHeightMm + 2;
    const answers = [];

    for (let questionIndex = 0; questionIndex < questionCount; questionIndex += 1) {
      const row = Math.floor(questionIndex / columnCount);
      const column = questionIndex % columnCount;
      const rowOffsetMm = trackHeightMm * (row + 0.5) + rowGapMm * row;
      const scores = [];
      for (let optionIndex = 0; optionIndex < 5; optionIndex += 1) {
        const optionOffsetMm = numberWidthMm + answerGapMm +
          optionWidthMm * optionIndex + answerGapMm * optionIndex + bubbleDiameterMm / 2;
        const xMm = borderMm + paddingMm + column * (cellWidthMm + columnGapMm) + optionOffsetMm;
        const yMm = gridContentTopMm + rowOffsetMm;
        const point = projectCardPoint(transform, xMm, yMm);
        const nextPoint = projectCardPoint(transform, xMm + 0.5, yMm);
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

  function orderCorners(points) {
    return [
      points.reduce((best, point) => point.x + point.y < best.x + best.y ? point : best),
      points.reduce((best, point) => point.x - point.y > best.x - best.y ? point : best),
      points.reduce((best, point) => point.x + point.y > best.x + best.y ? point : best),
      points.reduce((best, point) => point.x - point.y < best.x - best.y ? point : best)
    ];
  }

  function scoreCornerSet(points) {
    if (new Set(points).size !== 4) return Infinity;
    const [topLeft, topRight, bottomRight, bottomLeft] = points;
    const horizontal = (distance(topLeft, topRight) + distance(bottomLeft, bottomRight)) / 2;
    const vertical = (distance(topLeft, bottomLeft) + distance(topRight, bottomRight)) / 2;
    const ratio = horizontal / vertical;
    if (ratio < 0.42 || ratio > 1.15) return Infinity;
    const sizes = points.map((point) => point.size);
    const meanSize = sizes.reduce((total, size) => total + size, 0) / sizes.length;
    const sizeVariation = Math.max(...sizes) / Math.min(...sizes) - 1;
    const area = Math.abs(
      topLeft.x * topRight.y + topRight.x * bottomRight.y +
      bottomRight.x * bottomLeft.y + bottomLeft.x * topLeft.y -
      topLeft.y * topRight.x - topRight.y * bottomRight.x -
      bottomRight.y * bottomLeft.x - bottomLeft.y * topLeft.x
    ) / 2;
    if (area < meanSize * meanSize * 100) return Infinity;
    return Math.abs(Math.log(ratio / (CARD_WIDTH_MM / CARD_HEIGHT_MM))) +
      sizeVariation * 0.8 - Math.min(0.2, area / 1000000);
  }

  function createCardTransform(markers) {
    const source = [
      { x: MARKER_OFFSET_MM, y: MARKER_OFFSET_MM },
      { x: CARD_WIDTH_MM - MARKER_OFFSET_MM, y: MARKER_OFFSET_MM },
      { x: CARD_WIDTH_MM - MARKER_OFFSET_MM, y: CARD_HEIGHT_MM - MARKER_OFFSET_MM },
      { x: MARKER_OFFSET_MM, y: CARD_HEIGHT_MM - MARKER_OFFSET_MM }
    ];
    const equations = [];
    source.forEach((point, index) => {
      const { x, y } = point;
      const { x: imageX, y: imageY } = markers[index];
      equations.push([x, y, 1, 0, 0, 0, -imageX * x, -imageX * y, imageX]);
      equations.push([0, 0, 0, x, y, 1, -imageY * x, -imageY * y, imageY]);
    });
    const coefficients = solveLinearSystem(equations);
    return coefficients;
  }

  function solveLinearSystem(matrix) {
    const size = matrix.length;
    for (let column = 0; column < size; column += 1) {
      let pivot = column;
      for (let row = column + 1; row < size; row += 1) {
        if (Math.abs(matrix[row][column]) > Math.abs(matrix[pivot][column])) pivot = row;
      }
      if (Math.abs(matrix[pivot][column]) < 1e-8) {
        throw new Error('As marcas de alinhamento do cartão não foram reconhecidas.');
      }
      [matrix[column], matrix[pivot]] = [matrix[pivot], matrix[column]];
      const divisor = matrix[column][column];
      for (let entry = column; entry <= size; entry += 1) matrix[column][entry] /= divisor;
      for (let row = 0; row < size; row += 1) {
        if (row === column) continue;
        const factor = matrix[row][column];
        for (let entry = column; entry <= size; entry += 1) {
          matrix[row][entry] -= factor * matrix[column][entry];
        }
      }
    }
    return matrix.map((row) => row[size]);
  }

  function projectCardPoint(transform, x, y) {
    const divisor = transform[6] * x + transform[7] * y + 1;
    return {
      x: (transform[0] * x + transform[1] * y + transform[2]) / divisor,
      y: (transform[3] * x + transform[4] * y + transform[5]) / divisor
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

  function luminanceAt(data, pixel) {
    const offset = pixel * 4;
    return 0.299 * data[offset] + 0.587 * data[offset + 1] + 0.114 * data[offset + 2];
  }

  function distance(first, second) {
    return Math.hypot(second.x - first.x, second.y - first.y);
  }

  window.CardOMR = Object.freeze({ findCardMarkers, readMarkedAnswers });
})();
