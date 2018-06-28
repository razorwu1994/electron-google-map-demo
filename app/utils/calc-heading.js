export const calcHeading = heading => {
  const counts = [0, 45, 90, 135, 180, 225, 270, 315];
  return counts.reduce(function(prev, curr) {
    return Math.abs(curr - heading) < Math.abs(prev - heading) ? curr : prev;
  });
};
