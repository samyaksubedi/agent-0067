export function drawPlayer(ctx, x, canvasHeight) {
  const y = canvasHeight - 80;

  // body
  ctx.fillStyle = '#00ff66';
  ctx.fillRect(x - 12, y - 20, 24, 40);

  // head
  ctx.fillStyle = '#00cc55';
  ctx.fillRect(x - 8, y - 35, 16, 15);

  // eye
  ctx.fillStyle = '#000000';
  ctx.fillRect(x - 5, y - 30, 3, 3);
  ctx.fillRect(x + 2, y - 30, 3, 3);

  // gun
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x - 2, y - 10, 4, 15);

  // later a pixel art + sound
}
